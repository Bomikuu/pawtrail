import json
import hashlib
import uuid
from django.conf import settings
from django.db import connection, transaction
from django.db.models import Q
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from accounts.views import is_reviewer
from animals.models import Animal
from media.models import Asset
from media.service import upload, asset_dto, public_image
from identity.models import AnalysisRun, Decision, Policy, Reference
from identity.decision import assess_identity
from config.errors import DomainError
from .models import Observation, Sighting, Operation
from .pagination import page
from identity.locking import lock_gallery
from .serializers import CaptureInput, SelectionInput, SubmissionInput, ReviewInput, ReferenceInput
from . import service

class CaptureThrottle(UserRateThrottle):
    scope = "capture"

def validated(schema, value):
    serializer = schema(data=value)
    serializer.is_valid(raise_exception=True)
    return serializer.validated_data

def limited(request, maximum=50):
    try:
        return max(1, min(maximum, int(request.query_params.get("limit", 20))))
    except ValueError:
        raise DomainError("Choose a valid page size.")

def safe_candidates(run):
    result = []
    visible = {str(row.pk): row for row in Animal.objects.filter(pk__in=[c["animalId"] for c in run.candidates], state="confirmed").select_related("photo")}
    for candidate in run.candidates:
        animal = visible.get(candidate["animalId"])
        if not animal:
            continue
        result.append({"animalId": candidate["animalId"], "name": animal.name, "species": animal.species,
                       "photo": public_image(animal.photo), "areaLabel": animal.area_label, "reasons": candidate["reasons"]})
    return result

def analysis_dto(run):
    match, _ = assess_identity(run)
    from identity.retrieval import gallery_fingerprint
    if run.status == "complete" and run.gallery_fingerprint != gallery_fingerprint():
        match = None
    return {"analysisId": str(run.pk), "observationId": str(run.observation_id), "version": run.observation_version,
            "status": run.status, "stage": run.stage, "detections": run.detections,
            "candidates": safe_candidates(run), "reasons": run.reasons,
            "evidenceFlags": run.evidence_flags, "automaticAnimalId": match["animalId"] if match else None,
            "species": run.features.get("species"), "cloudResult": run.cloud_result}

@api_view(["GET"])
@permission_classes([AllowAny])
def status(request):
    from identity.calibration import policy_blockers
    return Response({"mode": "real", "modelsInstalled": all((settings.MODEL_DIR / name / "manifest.json").exists() for name in ["detector", "embedding"]),
                     "automaticMatchingEnabled": any(not policy_blockers(policy) for policy in Policy.objects.filter(enabled=True).select_related("calibration")),
                     "externalComparisonAvailable": __import__("os").environ.get("PAWTRAIL_EXTERNAL_VISION_ENABLED") == "true",
                     "queue": settings.ANALYSIS_QUEUE})

@api_view(["POST"])
@throttle_classes([CaptureThrottle])
def media_upload(request):
    file = request.FILES.get("file")
    if not file or not file.size or file.size > 10 * 1024 * 1024:
        raise DomainError("Choose a photo up to 10 MiB.")
    alt = str(request.data.get("alt", "Animal encounter photo"))[:500]
    purpose = request.data.get("purpose", "capture")
    if purpose not in ["capture", "public_image", "private_evidence"]:
        raise DomainError("Choose a valid image purpose.")
    def stored_upload():
        if file.content_type == "application/pdf":
            if purpose != "private_evidence":
                raise DomainError("PDF documents must remain private evidence.")
            from django.core.files.base import ContentFile
            raw = file.read(10 * 1024 * 1024 + 1)
            if len(raw) > 10 * 1024 * 1024 or not raw.startswith(b"%PDF-") or b"%%EOF" not in raw[-4096:]:
                raise DomainError("Choose a valid PDF up to 10 MiB.")
            asset = Asset(owner=request.user, alt=alt, sha256=hashlib.sha256(raw).hexdigest(), perceptual_hash="", width=0, height=0, byte_count=len(raw), mime_type="application/pdf")
            asset.original.save(str(asset.pk)+".pdf",ContentFile(raw),save=False)
            asset.normalized.save(str(asset.pk)+".pdf",ContentFile(raw),save=False)
            asset.save()
        else:
            asset = upload(request.user, file, alt)
        asset.purpose = purpose
        asset.sensitive = request.data.get("sensitive") in [True, "true"]
        asset.save(update_fields=["purpose", "sensitive"])
        return asset
    key = request.headers.get("Idempotency-Key")
    if not key:
        return Response(asset_dto(stored_upload()), status=201)
    service.key_required(key)
    digest = hashlib.sha256(file.read(10 * 1024 * 1024 + 1) + alt.encode() + purpose.encode() + str(request.data.get("sensitive",False)).encode()).hexdigest()
    file.seek(0)
    with transaction.atomic():
        type(request.user).objects.select_for_update(no_key=True).get(pk=request.user.pk)
        prior = Operation.objects.filter(owner=request.user, kind="upload", key=key).first()
        if prior:
            if prior.fingerprint != digest:
                raise DomainError("This upload request changed.", "IDEMPOTENCY_CONFLICT", 409)
            return Response(prior.result)
        result = asset_dto(stored_upload())
        Operation.objects.create(owner=request.user, kind="upload", key=key, fingerprint=digest, result=result)
        return Response(result, status=201)

@api_view(["GET"])
@permission_classes([AllowAny])
def media_content(request, asset_id, kind):
    from social.media_access import can_read
    asset = get_object_or_404(Asset, pk=asset_id)
    if kind == "public":
        if not asset.public or not asset.derivative:
            raise DomainError("Photo not found.", "NOT_FOUND", 404)
        file = asset.derivative
    elif request.user.is_authenticated and (asset.owner_id == request.user.pk or request.user.is_staff or (asset.purpose == "capture" and is_reviewer(request.user)) or can_read(request.user,asset)):
        file = asset.normalized
    else:
        raise DomainError("Photo not found.", "NOT_FOUND", 404)
    response = FileResponse(file.open("rb"), content_type="image/jpeg" if kind == "public" else asset.mime_type)
    if asset.mime_type == "application/pdf":
        response["Content-Disposition"] = 'attachment; filename="private-evidence.pdf"'
    response["Cache-Control"] = "private, no-store"
    response["X-Content-Type-Options"] = "nosniff"
    response["X-Robots-Tag"] = "noindex, nofollow"
    response["Content-Security-Policy"] = "default-src 'none'; sandbox"
    return response

@api_view(["POST"])
@throttle_classes([CaptureThrottle])
def captures(request):
    capture = service.create_capture(request.user, validated(CaptureInput, request.data), request.headers.get("Idempotency-Key"))
    return Response({"captureId": str(capture.pk), "version": 1}, status=201)

@api_view(["POST"])
def capture_observations(request, capture_id):
    observation = service.create_observation(request.user, capture_id)
    return Response(service.receipt(observation), status=201)

@api_view(["GET"])
def observation_detail(request, observation_id):
    observation = service.own_observation(request.user, observation_id)
    run = observation.analyses.order_by("-created_at").first()
    decisions = observation.decisions.order_by("-created_at")[:20]
    return Response({**service.receipt(observation), "photoUrl": asset_dto(observation.capture.media)["url"],
                     "source": observation.capture.source, "areaLabel": observation.capture.area_label,
                     "capturedAt": observation.capture.captured_at, "analysis": analysis_dto(run) if run else None,
                     "privateEvidence": {"latitude": observation.capture.latitude, "longitude": observation.capture.longitude,
                                         "accuracyMeters": observation.capture.accuracy_meters, "locationSource": observation.capture.location_source,
                                         "measuredAt": observation.capture.measured_at, "receivedAt": observation.capture.received_at,
                                         "metadataLocationPresent": bool(observation.capture.media.exif_evidence.get("location"))},
                     "history": [{"method": row.method, "action": row.action, "reason": row.reason, "createdAt": row.created_at} for row in decisions]})

@api_view(["POST"])
def selection(request, observation_id):
    observation = service.select_crop(request.user, observation_id, validated(SelectionInput, request.data))
    return Response(service.receipt(observation))

@api_view(["GET", "POST"])
def analysis(request, observation_id):
    if request.method == "POST":
        field = serializers.IntegerField(min_value=1)
        version = field.run_validation(request.data.get("version"))
        run = service.start_analysis(request.user, observation_id, version)
        return Response(analysis_dto(run), status=202)
    observation = service.own_observation(request.user, observation_id)
    run = get_object_or_404(AnalysisRun, observation=observation, observation_version=observation.version)
    return Response(analysis_dto(run))

@api_view(["POST"])
def submit(request, observation_id):
    result = service.submit_observation(request.user, observation_id, validated(SubmissionInput, request.data), request.headers.get("Idempotency-Key"))
    return Response(result)

@api_view(["GET"])
def my_observations(request):
    rows = Observation.objects.filter(capture__owner=request.user).select_related("capture__media", "animal", "proposed_animal").order_by("-created_at")
    def render(row):
        return {**service.receipt(row), "photoUrl": asset_dto(row.capture.media)["url"],
              "name": row.animal.name if row.animal_id else row.proposed_animal.name if row.proposed_animal_id else "Animal not identified",
              "createdAt": row.created_at}
    return Response(page(rows, request, render, limited(request)))

@api_view(["GET"])
def review_queue(request):
    if not is_reviewer(request.user):
        raise DomainError("An identity reviewer account is required.", "FORBIDDEN", 403)
    query = Observation.objects.filter(submitted_at__isnull=False).exclude(capture__owner=request.user).select_related("capture__media", "animal", "proposed_animal").order_by("-submitted_at")
    if request.query_params.get("scope") != "all":
        query = query.exclude(publication_state="published").exclude(evidence_state="rejected")
    def render(row):
        return {**service.receipt(row), "photoUrl": asset_dto(row.capture.media)["url"], "areaLabel": row.capture.area_label,
              "name": row.animal.name if row.animal_id else row.proposed_animal.name if row.proposed_animal_id else "Unidentified animal",
              "createdAt": row.created_at}
    return Response(page(query, request, render, limited(request)))

@api_view(["POST"])
def review(request, observation_id):
    return Response(service.review_observation(request.user, observation_id, validated(ReviewInput, request.data), request.headers.get("Idempotency-Key")))

def animal_dto(animal, actor):
    private = actor.is_authenticated and (animal.owner_id == actor.pk or is_reviewer(actor))
    sightings = animal.sightings.filter(active=True).select_related("observation__capture").order_by("-approved_at")
    latest = sightings.first()
    location = None
    if latest and latest.observation.capture.latitude is not None:
        capture = latest.observation.capture
        location = {"areaId": "reported-area", "neighborhood": capture.area_label or "Approximate reported area", "latitude": round(capture.latitude, 2),
                    "longitude": round(capture.longitude, 2), "approximateRadiusMeters": max(1500, capture.accuracy_meters or 0)}
    return {"id": str(animal.pk), "slug": animal.slug, "name": animal.name, "species": animal.species, "description": animal.description,
            "appearance": animal.appearance, "state": animal.state, "areaLabel": animal.area_label, "photo": public_image(animal.photo),
            "privatePhotoUrl": asset_dto(animal.photo)["url"] if private and animal.photo and not animal.photo.public else None,
            "location": location, "version": animal.version, "referenceCount": animal.references.filter(active=True).count(),
            "sightingCount": sightings.count(), "lastReportedAt": latest.observation.capture.captured_at if latest else None,
            "canManage": private, "provenance": {"kind": "real", "label": "Community animal record"}}

@api_view(["GET"])
@permission_classes([AllowAny])
def animals(request):
    query = Animal.objects.exclude(social_info__is_fixture=True)
    if request.query_params.get("scope") == "mine" and request.user.is_authenticated:
        query = query.filter(owner=request.user)
    else:
        query = query.filter(state="confirmed")
    if request.query_params.get("q"):
        query = query.filter(name__icontains=request.query_params["q"][:100])
    query = query.select_related("photo").order_by("-created_at")
    return Response(page(query, request, lambda row: animal_dto(row, request.user), limited(request)))

@api_view(["GET"])
@permission_classes([AllowAny])
def animal_detail(request, animal_id):
    animal = get_object_or_404(Animal.objects.exclude(social_info__is_fixture=True).select_related("photo"), pk=animal_id)
    if animal.state != "confirmed" and not (request.user.is_authenticated and (animal.owner_id == request.user.pk or is_reviewer(request.user))):
        raise DomainError("Animal not found.", "NOT_FOUND", 404)
    data = animal_dto(animal, request.user)
    data["sightings"] = [{"id": str(row.pk), "observedAt": row.observation.capture.captured_at,
                          "areaLabel": row.observation.capture.area_label, "photo": public_image(row.observation.capture.media),
                          "notes": row.observation.notes} for row in animal.sightings.filter(active=True).select_related("observation__capture__media").order_by("-approved_at")[:20]]
    return Response(data)

@api_view(["GET", "POST", "DELETE"])
def references(request, animal_id, reference_id=None):
    if not is_reviewer(request.user):
        raise DomainError("Independent reference curation requires an identity reviewer.", "FORBIDDEN", 403)
    with transaction.atomic():
        lock_gallery()
        animal = get_object_or_404(Animal.objects.select_for_update(), pk=animal_id)
        from social.models import AnimalInfo
        if AnimalInfo.all_objects.filter(animal=animal,is_fixture=True).exists():
            raise DomainError("Display profiles cannot enter the identification reference gallery.")
        if request.method == "GET":
            return Response({"items": [{"id": str(row.pk), "observationId": str(row.observation_id), "viewpoint": row.viewpoint,
                              "provenance": row.provenance, "active": row.active} for row in animal.references.order_by("-created_at")[:100]]})
        if request.method == "DELETE":
            reference = get_object_or_404(Reference, pk=reference_id, animal=animal)
            reference.active = False
            reference.save(update_fields=["active"])
            animal.version += 1
            animal.save(update_fields=["version"])
            return Response(status=204)
        data = validated(ReferenceInput, request.data)
        observation = get_object_or_404(Observation.objects.select_for_update().select_related("capture"), pk=data["observationId"], animal=animal,
                                         identity_state="confirmed", evidence_state="plausible", publication_state="published")
        if observation.capture.owner_id == request.user.pk or not observation.decisions.filter(method="reviewer", action__in=["confirm", "reassign"]).exists():
            raise DomainError("Use an independently reviewed encounter, not an automatic match or your own report.", "INDEPENDENT_REFERENCE_REQUIRED", 403)
        run = observation.analyses.filter(status="complete").order_by("-created_at").first()
        if not run or not run.features.get("embedding"):
            raise DomainError("A usable local visual analysis is required for reference enrollment.")
        reference, created = Reference.objects.get_or_create(animal=animal, observation=observation, defaults={"reviewer": request.user,
            "viewpoint": data["viewpoint"], "provenance": data["provenance"], "traits": data["traits"], "features": run.features, "model_version": run.model_version})
        if created:
            animal.version += 1
            animal.save(update_fields=["version"])
            if connection.vendor == "postgresql":
                with connection.cursor() as cursor:
                    cursor.execute("UPDATE identity_reference SET embedding_vector=%s::vector WHERE id=%s", [json.dumps(run.features["embedding"]), reference.pk])
        elif not reference.active:
            raise DomainError("This reference was withdrawn. Use a newly reviewed encounter instead.", "WITHDRAWN_REFERENCE", 409)
        return Response({"id": str(reference.pk), "active": reference.active}, status=201 if created else 200)

@api_view(["POST"])
def legacy_sighting(request):
    raise DomainError("Photograph the animal and submit its analyzed observation through /spot. Unvalidated named sightings cannot be published.", "CAPTURE_REQUIRED", 409)

@api_view(["GET", "POST", "PUT", "PATCH", "DELETE"])
@permission_classes([AllowAny])
def unsupported_domain(request, resource):
    raise DomainError("This platform service currently implements real capture, animal identity, and sighting review. This social domain is not connected yet.", "DOMAIN_NOT_CONNECTED", 501)


@api_view(["GET"])
@permission_classes([AllowAny])
def public_animal_profile(request, slug):
    animal = get_object_or_404(Animal.objects.exclude(social_info__is_fixture=True).select_related("photo"), slug=slug, state="confirmed")
    data = animal_dto(animal, request.user)
    data["sightings"] = [{"id": str(row.pk), "observedAt": row.observation.capture.captured_at,
        "areaLabel": row.observation.capture.area_label, "photo": public_image(row.observation.capture.media),
        "notes": row.observation.notes} for row in animal.sightings.filter(active=True,
        observation__publication_state="published").select_related("observation__capture__media").order_by("-approved_at")[:20]]
    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def public_community(request):
    # Community activity comes from accepted, published sightings, never fixtures.
    rows = Sighting.objects.filter(active=True, animal__state="confirmed",
        observation__publication_state="published").select_related(
        "animal__photo", "observation__capture__media", "observation__capture__owner").order_by("-approved_at")
    def render(row):
        capture = row.observation.capture
        return {"id": str(row.pk), "animal": animal_dto(row.animal, request.user),
            "author": {"displayName": capture.owner.display_name or capture.owner.username, "username": capture.owner.username},
            "notes": row.observation.notes, "observedAt": capture.captured_at,
            "areaLabel": capture.area_label, "photo": public_image(capture.media)}
    return Response(page(rows, request, render, limited(request), time_field="approved_at"))

@api_view(['DELETE'])
@transaction.atomic
def media_remove(request, asset_id):
    type(request.user).objects.select_for_update(no_key=True).get(pk=request.user.pk)
    asset=get_object_or_404(Asset.objects.select_for_update(),pk=asset_id,owner=request.user)
    from .models import Capture
    from social.models import Campaign,CampaignDraft,CampaignExpense,MissionParticipation,Post,CampaignUpdate
    from social.models import AchievementProof, FundReceipt, AnimalInfo, AnimalMedicalRecord, AnimalMedicalRevision
    attached=AnimalMedicalRecord.all_objects.filter(attachments=asset).exists() or AnimalMedicalRevision.objects.filter(documents=asset).exists() or AchievementProof.all_objects.filter(media=asset).exists() or FundReceipt.all_objects.filter(evidence=asset).exists() or asset.public or Capture.objects.filter(media=asset).exists() or Animal.objects.filter(photo=asset).exists() or Campaign.objects.filter(Q(photos=asset)|Q(private_evidence=asset)).exists() or CampaignExpense.objects.filter(receipts=asset).exists() or MissionParticipation.objects.filter(evidence_media=asset).exists() or Post.objects.filter(photos=asset).exists() or CampaignUpdate.objects.filter(photos=asset).exists()
    attached=attached or AnimalInfo.all_objects.filter(private_evidence=asset).exists()
    # Draft JSON also holds private attachment identifiers.
    attached=attached or any(str(asset.pk) in str(row.values) for row in CampaignDraft.objects.filter(owner=request.user))
    if attached:raise DomainError('This evidence is attached to a record and must be retained.','CONFLICT',409)
    with transaction.atomic():
        files=[asset.original,asset.normalized,asset.derivative];asset.delete()
        transaction.on_commit(lambda:[f.delete(save=False) for f in files if f])
    return Response(status=204)
