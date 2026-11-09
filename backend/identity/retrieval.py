import hashlib
import json
from collections import defaultdict
import numpy as np
from django.db import connection
from django.utils import timezone
from observations.models import Sighting
from media.service import public_image
from .models import Reference
from .features import distance_meters

def gallery_fingerprint(species=None, cohort_ids=None):
    query = Reference.objects.filter(active=True, animal__state="confirmed")
    if species:
        query = query.filter(animal__species=species)
    if cohort_ids is not None:
        query = query.filter(animal_id__in=cohort_ids)
    rows = list(query.order_by("pk").values_list("pk", "model_version", "animal__version"))
    return hashlib.sha256(json.dumps(rows, default=str).encode()).hexdigest()

def geographic_context(capture, animal):
    if capture.latitude is None or capture.longitude is None or not capture.captured_at:
        return "unavailable"
    previous = Sighting.objects.filter(animal=animal, active=True, observation__capture__captured_at__lte=capture.captured_at,
                                       observation__capture__latitude__isnull=False).exclude(observation__capture=capture).select_related("observation__capture").order_by("-observation__capture__captured_at").first()
    if not previous:
        return "unavailable"
    before = previous.observation.capture
    age_hours = (capture.captured_at - before.captured_at).total_seconds() / 3600
    # Ranking heuristic, not a biological movement limit or public radius.
    radius = min(10000, 500 + age_hours * 100) + (capture.accuracy_meters or 0) + (before.accuracy_meters or 0)
    if connection.vendor == "postgresql":
        with connection.cursor() as cursor:
            cursor.execute("SELECT ST_DWithin(location_geog, ST_SetSRID(ST_MakePoint(%s,%s),4326)::geography,%s) FROM observations_capture WHERE id=%s", [capture.longitude, capture.latitude, radius, before.pk])
            nearby = cursor.fetchone()[0]
        return "near_recent_reports" if nearby else "relocation_check"
    distance = distance_meters(capture.latitude, capture.longitude, before.latitude, before.longitude)
    return "near_recent_reports" if distance <= radius else "relocation_check"

def retrieve_candidates(observation, features, model_version):
    references = Reference.objects.filter(active=True, animal__state="confirmed", animal__species=features["species"],
                                           model_version=model_version).select_related("animal__photo")
    if connection.vendor == "postgresql":
        # Exact pgvector retrieval. Geography is supporting context, never a hard exclusion.
        with connection.cursor() as cursor:
            cursor.execute("SELECT r.id FROM identity_reference r JOIN animals_animal a ON a.id=r.animal_id WHERE r.active AND a.state='confirmed' AND a.species=%s AND r.model_version=%s AND r.embedding_vector IS NOT NULL ORDER BY r.embedding_vector <=> %s::vector",
                           [features["species"], model_version, json.dumps(features["embedding"])])
            ranked = [str(row[0]) for row in cursor.fetchall()]
        if ranked:
            references = references.filter(pk__in=ranked)
    grouped = defaultdict(list)
    query = np.asarray(features["embedding"])
    for reference in references.iterator():
        vector = reference.features.get("embedding", [])
        if len(vector) != len(query):
            continue
        similarity = float(np.dot(query, np.asarray(vector)))
        hist = np.asarray(reference.features.get("histogram", []))
        color = float(np.minimum(hist, np.asarray(features["histogram"])).sum()) if len(hist) == len(features["histogram"]) else None
        grouped[str(reference.animal_id)].append((similarity, color, reference))
    candidates = []
    for animal_id, matches in grouped.items():
        matches.sort(key=lambda item: item[0], reverse=True)
        best = matches[0]
        animal = best[2].animal
        geography = geographic_context(observation.capture, animal)
        similarity = float(np.mean([row[0] for row in matches[:3]]))
        reasons = ["visual_reference_similarity"]
        if best[1] is not None and best[1] >= 0.6:
            reasons.append("similar_coat_colors")
        if geography != "unavailable":
            reasons.append(geography)
        candidates.append({"animalId": animal_id, "name": animal.name, "species": animal.species, "photo": public_image(animal.photo),
                           "areaLabel": animal.area_label, "similarity": similarity, "reasons": reasons,
                           "referenceCount": len(matches), "viewpoints": sorted(set(row[2].viewpoint for row in matches)),
                           "context": geography})
    # Visual evidence dominates; geography breaks only close ties for the suggestions.
    candidates.sort(key=lambda item: (item["similarity"], item["referenceCount"]), reverse=True)
    return candidates[:5]
