"""Prepare a report from independently reviewed real encounters when an operator requests it.

This is product calibration tooling, not a software test suite. It is never invoked on startup.
"""
import hashlib
import json
from django.utils import timezone
from observations.models import Observation
from .models import Reference
from .providers import installed_model_version
from .retrieval import gallery_fingerprint, retrieve_candidates
from .calibration import RULE_VERSION, wrong_match_upper_bound
from config.errors import DomainError

def candidate_prediction(sample, threshold, margin):
    top = sample["top"]
    if not sample["eligible"] or not top or top["similarity"] < threshold or sample["margin"] < margin:
        return None
    return top["animalId"]

def metrics(samples, threshold, margin):
    accepted = wrong = unknown_errors = 0
    unknown = set()
    unknown_queries = 0
    for sample in samples:
        prediction = candidate_prediction(sample, threshold, margin)
        if sample["unknown"]:
            unknown.add(sample["truth"])
            unknown_queries += 1
        if prediction:
            accepted += 1
            if prediction != sample["truth"]:
                wrong += 1
                if sample["unknown"]:
                    unknown_errors += 1
    return {"queries": len(samples), "accepted": accepted, "wrongIdentities": wrong,
            "unknownQueries": unknown_queries, "unknownFalseAccepts": unknown_errors, "unknownIndividuals": len(unknown)}

def prepare_report(manifest):
    if not isinstance(manifest, dict) or not isinstance(manifest.get("species"), str) or manifest["species"] not in {"cat", "dog"}:
        raise DomainError("The manifest must identify cat or dog observations.")
    known = manifest.get("knownAnimalIds")
    rows = manifest.get("observations")
    if not isinstance(known, list) or not known or not isinstance(rows, list) or not rows or len(rows) > 10000:
        raise DomainError("Provide a knownAnimalIds cohort and up to 10,000 labeled observation/split records.")
    import uuid
    try:
        known = [str(uuid.UUID(value)) for value in known]
        ids = [str(uuid.UUID(row["observationId"])) for row in rows]
    except (KeyError, TypeError, ValueError, AttributeError):
        raise DomainError("Each dataset record needs a valid observationId and tuning/validation split.")
    if len(set(ids)) != len(ids) or len(set(known)) != len(known):
        raise DomainError("The dataset contains repeated observation or animal IDs.")
    model = installed_model_version()
    references = list(Reference.objects.filter(active=True, animal__species=manifest["species"]).select_related("observation__capture"))
    if not references or not model:
        raise DomainError("Installed models and an independently curated reference gallery are required.")
    before = gallery_fingerprint(manifest["species"], known)
    ref_observations = {row.observation_id for row in references}
    ref_pixels = set(Reference.objects.filter(pk__in=[row.pk for row in references]).values_list("observation__capture__media__pixel_digest", flat=True))
    all_known = {str(row.animal_id) for row in references}
    ref_sessions = {(str(row.animal_id), int(row.observation.capture.captured_at.timestamp()) // 1800)
                    for row in references if row.observation.capture.captured_at}
    sources = {str(row.pk): row for row in Observation.objects.filter(pk__in=ids)
               .select_related("animal", "capture__media").prefetch_related("analyses", "decisions")}
    split_sessions, pixels, samples = {}, set(), {"tuning": [], "validation": []}
    digest_rows = []
    for record, identity in zip(rows, ids):
        split = record.get("split")
        observation = sources.get(identity)
        if split not in samples or not observation or observation.pk in ref_observations:
            raise DomainError("Every query must be a real non-reference observation with tuning or validation split.")
        decisions = sorted(observation.decisions.all(), key=lambda item: item.created_at, reverse=True)
        if not decisions or decisions[0].method != "reviewer" or decisions[0].action not in {"confirm", "reassign"} or observation.publication_state != "published":
            raise DomainError("Ground truth must come from the latest independent accepted identity review.")
        if not observation.animal_id or observation.animal.species != manifest["species"] or not observation.capture.captured_at:
            raise DomainError("Queries need a confirmed animal of the selected species and a known capture time.")
        truth = str(observation.animal_id)
        session = (truth, int(observation.capture.captured_at.timestamp()) // 1800)
        if session in ref_sessions or session in split_sessions:
            raise DomainError("Use one query per animal per 30-minute capture session, with sessions separate from reference photos and other splits.")
        split_sessions[session] = split
        digest = observation.capture.media.pixel_digest
        if not digest or digest in pixels or digest in ref_pixels:
            raise DomainError("Duplicate exact photo content cannot inflate the calibration dataset.")
        pixels.add(digest)
        runs = sorted(observation.analyses.all(), key=lambda item: item.created_at, reverse=True)
        run = next((item for item in runs if item.status == "complete" and item.model_version == model), None)
        if not run:
            raise DomainError("Every query needs a completed analysis using the installed model version.")
        if truth not in known and truth in all_known:
            raise DomainError("Unknown validation animals must be outside the entire reference gallery.")
        candidates = retrieve_candidates(observation, run.features, model)
        top = candidates[0] if candidates else None
        second = candidates[1]["similarity"] if len(candidates) > 1 else -1
        eligible = bool(top and top["animalId"] in known and not run.evidence_flags and not run.features.get("qualityReasons")
                        and top["referenceCount"] >= 3 and len(top["viewpoints"]) >= 2 and top["context"] == "near_recent_reports")
        samples[split].append({"truth": truth, "unknown": truth not in known, "top": top,
                               "margin": top["similarity"] - second if top else -1, "eligible": eligible})
        digest_rows.append({"observation": identity, "split": split, "truth": truth, "pixelDigest": digest, "model": model})
    if not samples["tuning"] or not samples["validation"]:
        raise DomainError("Use separate nonempty tuning and validation splits.")
    best = None
    for threshold in [value / 100 for value in range(50, 100)] + [0.995, 0.999]:
        for margin in [value / 100 for value in range(1, 31)]:
            result = metrics(samples["tuning"], threshold, margin)
            if result["accepted"] and not result["wrongIdentities"]:
                ranking = (result["accepted"], threshold, margin)
                if best is None or ranking > best[0]:
                    best = (ranking, threshold, margin)
    if best is None:
        raise DomainError("Tuning found no useful zero-error operating point. Keep manual review and improve references/model/data.")
    if before != gallery_fingerprint(manifest["species"], known):
        raise DomainError("The reference gallery changed during calibration. Prepare the report again.", "STALE_CALIBRATION", 409)
    _, threshold, margin = best
    validation = metrics(samples["validation"], threshold, margin)
    return {"format": "pawtrail-calibration-v1", "species": manifest["species"], "modelVersion": model, "ruleVersion": RULE_VERSION,
            "knownAnimalIds": known, "galleryFingerprint": before, "generatedAt": timezone.now().isoformat(),
            "datasetDigest": hashlib.sha256(json.dumps(digest_rows, sort_keys=True).encode()).hexdigest(),
            "thresholds": {"minimumSimilarity": threshold, "minimumMargin": margin}, "referenceMinimum": 3, "viewpointMinimum": 2,
            "sessionSeparated": True, "unknownIndividualsExcludedFromGallery": True,
            "tuning": metrics(samples["tuning"], threshold, margin), "validation": validation,
            "validationWrongMatchUpperBound": wrong_match_upper_bound(validation["wrongIdentities"], validation["accepted"])}
