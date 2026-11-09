import uuid
from datetime import timedelta
from PIL import Image
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from observations.models import Capture
from media.models import Asset
from .models import AnalysisRun
from .providers import detect, embed, ProviderUnavailable
from .features import crop_image, describe, overlap
from .retrieval import retrieve_candidates, gallery_fingerprint
from .locking import lock_gallery

def finish(run, lease, status, **fields):
    return AnalysisRun.objects.filter(pk=run.pk, lease=lease, status="running").update(
        status=status, completed_at=timezone.now(), **fields)

def evidence_flags(capture):
    flags = []
    if capture.source != "browser_camera":
        flags.append("capture_not_attested")
    if not capture.captured_at:
        flags.append("capture_time_unknown")
    if capture.latitude is None:
        flags.append("capture_location_unknown")
    elif capture.location_source != "device" or capture.accuracy_meters is None or capture.accuracy_meters > 100:
        flags.append("location_needs_review")
    elif not capture.measured_at or not capture.captured_at or abs((capture.measured_at - capture.captured_at).total_seconds()) > 120:
        flags.append("location_fix_stale")
    if capture.captured_at and abs((capture.received_at - capture.captured_at).total_seconds()) > 600:
        flags.append("capture_time_needs_review")
    prior = Asset.objects.filter(capture__observations__submitted_at__isnull=False, created_at__lt=capture.media.created_at).exclude(pk=capture.media_id).distinct()
    if prior.filter(pixel_digest=capture.media.pixel_digest).exists():
        flags.append("duplicate_photo")
    else:
        value = int(capture.media.perceptual_hash, 16)
        if any((value ^ int(other, 16)).bit_count() <= 4 for other in prior.values_list("perceptual_hash", flat=True).iterator()):
            flags.append("similar_previous_photo")
    exif_location = capture.media.exif_evidence.get("location")
    if exif_location and capture.latitude is not None:
        from .features import distance_meters
        if distance_meters(capture.latitude, capture.longitude, exif_location["latitude"], exif_location["longitude"]) > max(500, capture.accuracy_meters or 0):
            flags.append("location_metadata_conflict")
    return flags

def process_analysis(run_id):
    lease = uuid.uuid4()
    claimed = AnalysisRun.objects.filter(pk=run_id, status="queued", attempts__lt=3).update(
        status="running", lease=lease, stage="checking_photo", started_at=timezone.now(), attempts=F("attempts") + 1)
    if not claimed:
        return
    run = AnalysisRun.objects.select_related("observation__capture__media").get(pk=run_id)
    observation = run.observation
    try:
        with observation.capture.media.normalized.open("rb") as stream:
            image = Image.open(stream).convert("RGB")
        detections, detector_revision = detect(image)
        AnalysisRun.objects.filter(pk=run.pk, lease=lease).update(detections=detections)
        if not detections:
            finish(run, lease, "needs_retake", stage="complete", reasons=["no_usable_cat_or_dog"])
            return
        if len(detections) > 1 and not observation.crop:
            finish(run, lease, "selection_required", stage="select_animal", detections=detections, reasons=["multiple_animals"])
            return
        selected = max(detections, key=lambda item: overlap(item["crop"], observation.crop)) if observation.crop else detections[0]
        if observation.crop and overlap(selected["crop"], observation.crop) < 0.5:
            finish(run, lease, "needs_retake", stage="complete", reasons=["selected_crop_not_animal"])
            return
        crop = selected["crop"]
        cropped = crop_image(image, crop)
        if min(cropped.size) < 12:
            finish(run, lease, "needs_retake", stage="complete", reasons=["animal_too_small"])
            return
        features = describe(cropped)
        features.update({"crop": crop, "species": selected["species"]})
        if features["qualityReasons"]:
            finish(run, lease, "needs_retake", stage="complete", features=features, reasons=features["qualityReasons"])
            return
        AnalysisRun.objects.filter(pk=run.pk, lease=lease).update(stage="finding_matches")
        vector, version = embed(cropped)
        model_version = version + "-detr-" + detector_revision[:8]
        features["embedding"] = vector
        flags = evidence_flags(observation.capture)
        with transaction.atomic():
            lock_gallery()
            candidates = retrieve_candidates(observation, features, model_version)
            fingerprint = gallery_fingerprint()
        cloud_result = None
        other_cloud_run = observation.analyses.exclude(pk=run.pk).filter(cloud_result__isnull=False).exists()
        uncertain_candidates = len(candidates) >= 2 and candidates[0]["similarity"] - candidates[1]["similarity"] < 0.1
        if observation.capture.cloud_consent and uncertain_candidates and not other_cloud_run and type(observation).objects.filter(pk=observation.pk, version=run.observation_version).exists():
            from .cloud import compare
            cloud_result = compare(cropped, candidates)
        finish(run, lease, "complete", stage="complete", detections=detections, features=features, model_version=model_version,
               evidence_flags=flags, candidates=candidates, gallery_fingerprint=fingerprint, reasons=[], cloud_result=cloud_result)
    except ProviderUnavailable:
        finish(run, lease, "unavailable", stage="complete", reasons=["recognition_models_unavailable"])
    except Exception:
        import logging
        logging.getLogger(__name__).exception("Analysis failed: %s", run.pk)
        finish(run, lease, "failed", stage="complete", reasons=["analysis_failed_retry_available"])

def recover_expired():
    expired = AnalysisRun.objects.filter(status="running", started_at__lt=timezone.now() - timedelta(minutes=5))
    expired.filter(attempts__lt=3).update(status="queued", stage="queued", lease=None)
    expired.filter(attempts__gte=3).update(status="failed", stage="complete", lease=None, reasons=["worker_retry_limit"])
