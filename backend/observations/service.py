import hashlib
import json
import uuid
from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify
from accounts.views import is_reviewer
from animals.models import Animal
from media.models import Asset
from media.service import publish
from identity.models import AnalysisRun, Decision, Reference
from identity.decision import assess_identity
from identity.retrieval import gallery_fingerprint
from identity.locking import lock_gallery
from config.errors import DomainError
from .models import Capture, Observation, Operation, Sighting

def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, default=str).encode()).hexdigest()

def key_required(key):
    if not key or len(key) > 120:
        raise DomainError("An idempotency key is required.", "IDEMPOTENCY_KEY_REQUIRED")

def own_observation(actor, observation_id, lock=False):
    query = Observation.objects.select_related("capture__media", "animal", "proposed_animal")
    if lock:
        query = query.select_for_update(of=("self",))
    if not is_reviewer(actor):
        query = query.filter(capture__owner=actor)
    return get_object_or_404(query, pk=observation_id)

@transaction.atomic
def create_capture(actor, data, key):
    key_required(key)
    digest = fingerprint(data)
    # Locking the actor also serializes different records competing for the same idempotency key.
    type(actor).objects.select_for_update(no_key=True).get(pk=actor.pk)
    existing = Capture.objects.filter(owner=actor, request_key=key).first()
    if existing:
        if existing.request_fingerprint != digest:
            raise DomainError("This request key belongs to a different photo.", "IDEMPOTENCY_CONFLICT", 409)
        return existing
    media = get_object_or_404(Asset, pk=data["mediaId"], owner=actor)
    if media.mime_type != "image/jpeg" or media.purpose == "private_evidence":
        raise DomainError("Choose an animal encounter photograph; private documents cannot enter identification.")
    location = data.get("location") or {}
    return Capture.objects.create(owner=actor, media=media, source=data["source"], captured_at=data.get("capturedAt"),
                                  latitude=location.get("latitude"), longitude=location.get("longitude"), accuracy_meters=location.get("accuracyMeters"),
                                  measured_at=location.get("measuredAt"), location_source=location.get("source", ""),
                                  area_label=data.get("areaLabel", ""), cloud_consent=data.get("cloudConsent", False), request_key=key, request_fingerprint=digest)

@transaction.atomic
def create_observation(actor, capture_id):
    capture = get_object_or_404(Capture.objects.select_for_update(), pk=capture_id, owner=actor)
    existing = capture.observations.filter(submitted_at__isnull=True).order_by("created_at").first()
    return existing or Observation.objects.create(capture=capture)

@transaction.atomic
def select_crop(actor, observation_id, data):
    observation = own_observation(actor, observation_id, lock=True)
    if observation.capture.owner_id != actor.pk or observation.submitted_at:
        raise DomainError("Submitted observations keep their original evidence. Start another capture to add a photo.", "CONFLICT", 409)
    if observation.version != data["version"]:
        raise DomainError("This photo selection changed. Reload its current state.", "VERSION_CONFLICT", 409)
    observation.crop = data["crop"]
    observation.analyses.filter(status__in=["queued", "running"]).update(status="failed", stage="complete", lease=None, reasons=["photo_selection_changed"])
    observation.version += 1
    observation.save(update_fields=["crop", "version"])
    return observation

@transaction.atomic
def start_analysis(actor, observation_id, version):
    observation = own_observation(actor, observation_id, lock=True)
    if observation.capture.owner_id != actor.pk or observation.version != version or observation.submitted_at:
        raise DomainError("This observation changed or was already submitted.", "VERSION_CONFLICT", 409)
    run, created = AnalysisRun.objects.get_or_create(observation=observation, observation_version=version)
    if run.status in {"failed", "unavailable"} and run.attempts < 3:
        run.status, run.stage = "queued", "queued"
        run.save(update_fields=["status", "stage"])
    if settings.ANALYSIS_QUEUE == "celery" and run.status == "queued":
        from identity.tasks import analyze
        def enqueue():
            try:
                analyze.delay(str(run.pk))
            except Exception:
                import logging
                logging.getLogger(__name__).exception("Analysis remains in persistent queue; broker unavailable")
        transaction.on_commit(enqueue)
    return run

def receipt(observation):
    sighting = Sighting.objects.filter(observation=observation, active=True).first()
    decision = observation.decisions.order_by("-created_at").first()
    from rewards.service import reward_receipt
    return {"observationId": str(observation.pk), "version": observation.version, "animalId": str(observation.animal_id) if observation.animal_id else None,
            "proposedAnimalId": str(observation.proposed_animal_id) if observation.proposed_animal_id else None,
            "identityState": observation.identity_state, "evidenceState": observation.evidence_state, "publicationState": observation.publication_state,
            "sightingId": str(sighting.pk) if sighting else None, "method": decision.method if decision else None,
            "submittedAt": observation.submitted_at.isoformat() if observation.submitted_at else None,
            **reward_receipt(observation), "notes": observation.notes}

def record_decision(observation, actor, method, action, reason, policy=""):
    Decision.objects.create(observation=observation, actor=actor, method=method, action=action,
                            animal=observation.animal, reason=reason, policy_version=policy, observation_version=observation.version)

from social.achievements.changes import achievement_changes, defer_encounter_rewards, flush_changes

@achievement_changes()
def apply_publication(observation):
    previous_animals = list(Sighting.objects.filter(observation=observation).values_list("animal_id", flat=True))
    accepted = observation.identity_state == "confirmed" and observation.evidence_state == "plausible"
    digest = observation.capture.media.pixel_digest
    duplicate = accepted and Sighting.objects.filter(animal=observation.animal, content_digest=digest, active=True).exclude(observation=observation).exists()
    if duplicate:
        accepted = False
        observation.evidence_state = "needs_review"
    if accepted:
        observation.publication_state = "published"
        Sighting.objects.update_or_create(observation=observation, defaults={"animal": observation.animal, "active": True, "content_digest": digest})
        publish(observation.capture.media)
    else:
        observation.publication_state = "rejected" if observation.evidence_state == "rejected" else "pending"
        Sighting.objects.filter(observation=observation).update(active=False)
        asset = observation.capture.media
        if not Sighting.objects.filter(active=True, observation__capture__media=asset).exists() and not Reference.objects.filter(active=True, observation__capture__media=asset).exists():
            Asset.objects.filter(pk=asset.pk).update(public=False)
    observation.save()
    defer_encounter_rewards(observation.capture.owner_id)
    from social.capture_sync import sync_animal
    sync_animal(observation.animal)
    for previous in previous_animals:
        if previous != observation.animal_id:
            sync_animal(Animal.objects.get(pk=previous))
    flush_changes()

@transaction.atomic
@achievement_changes()
def submit_observation(actor, observation_id, data, key):
    key_required(key)
    lock_gallery()
    type(actor).objects.select_for_update(no_key=True).get(pk=actor.pk)
    digest = fingerprint({"observationId": str(observation_id), **data})
    prior = Operation.objects.filter(owner=actor, kind="submit", key=key).first()
    if prior:
        if prior.fingerprint != digest:
            raise DomainError("This request key belongs to another submission.", "IDEMPOTENCY_CONFLICT", 409)
        return receipt(own_observation(actor, observation_id))
    observation = own_observation(actor, observation_id, lock=True)
    if observation.capture.owner_id != actor.pk or observation.submitted_at or observation.version != data["observationVersion"]:
        raise DomainError("This observation changed or was already submitted.", "VERSION_CONFLICT", 409)
    run = get_object_or_404(AnalysisRun, observation=observation, observation_version=observation.version)
    if run.status != "complete":
        raise DomainError("Finish checking the selected animal before submitting.", "ANALYSIS_INCOMPLETE", 409)
    if run.gallery_fingerprint != gallery_fingerprint():
        raise DomainError("The reference gallery changed. Refresh the analysis before submitting.", "STALE_ANALYSIS", 409)
    proposed = data.get("proposedAnimalId")
    if proposed:
        observation.proposed_animal = get_object_or_404(Animal, pk=proposed, state="confirmed", species=run.features["species"])
    elif data.get("registerNew"):
        animal_id = uuid.uuid4()
        name = data.get("name") or "Unnamed " + run.features["species"]
        observation.animal = Animal.objects.create(id=animal_id, owner=actor, name=name, species=run.features["species"],
            slug=(slugify(name)[:90] or "animal") + "-" + str(animal_id)[:8], description=data.get("description", ""),
            area_label=observation.capture.area_label, photo=observation.capture.media)
    match, _ = assess_identity(run)
    if match and data.get("allowAutomaticMatch") and not data.get("registerNew") and (not proposed or str(proposed) == match["animalId"]):
        observation.animal = get_object_or_404(Animal, pk=match["animalId"], state="confirmed")
        observation.identity_state, observation.evidence_state = "confirmed", "plausible"
        record_decision(observation, None, "automatic", "confirm", "Calibrated visual identity and encounter-evidence policy passed.", match["policyVersion"])
    else:
        observation.identity_state = "suggested" if proposed else "unassigned"
        observation.evidence_state = "needs_review"
        record_decision(observation, actor, "reporter", "propose", "Submitted for independent identification and evidence review.")
    observation.notes = data.get("notes", "")
    observation.submitted_at = timezone.now()
    observation.version += 1
    apply_publication(observation)
    result = receipt(observation)
    Operation.objects.create(owner=actor, key=key, kind="submit", fingerprint=digest, result=result)
    return result

@transaction.atomic
@achievement_changes()
def review_observation(actor, observation_id, data, key):
    if not is_reviewer(actor):
        raise DomainError("An authorized identity reviewer is required.", "FORBIDDEN", 403)
    key_required(key)
    lock_gallery()
    type(actor).objects.select_for_update(no_key=True).get(pk=actor.pk)
    digest = fingerprint({"observationId": str(observation_id), **data})
    prior = Operation.objects.filter(owner=actor, kind="review", key=key).first()
    if prior:
        if prior.fingerprint != digest:
            raise DomainError("This review request changed.", "IDEMPOTENCY_CONFLICT", 409)
        return receipt(own_observation(actor, observation_id))
    observation = own_observation(actor, observation_id, lock=True)
    if observation.capture.owner_id == actor.pk:
        raise DomainError("Another reviewer must assess your own observation.", "INDEPENDENT_REVIEW_REQUIRED", 403)
    if not observation.submitted_at or observation.version != data["version"]:
        raise DomainError("This observation changed. Reload before reviewing.", "VERSION_CONFLICT", 409)
    previous_animal_id = observation.animal_id
    if data["action"] in {"confirm", "reassign"}:
        animal_id = data.get("animalId") or observation.proposed_animal_id or observation.animal_id
        animal = get_object_or_404(Animal.objects.select_for_update(), pk=animal_id)
        from social.models import AnimalInfo
        if AnimalInfo.all_objects.filter(animal=animal,is_fixture=True).exists():
            raise DomainError("This display profile is not an enrolled identity. Register the real animal from an independently reviewed photograph.")
        run = observation.analyses.filter(status="complete").order_by("-created_at").first()
        if not run or run.features.get("species") != animal.species:
            raise DomainError("This animal does not match the analyzed species.")
        observation.animal = animal
        observation.identity_state = "confirmed"
        observation.evidence_state = "plausible" if data["evidenceAccepted"] else "needs_review"
        if previous_animal_id != animal.pk or not data["evidenceAccepted"]:
            Reference.objects.filter(observation=observation).update(active=False)
        if animal.state != "confirmed":
            animal.state = "confirmed"
            animal.version += 1
            animal.save(update_fields=["state", "version"])
        if data["evidenceAccepted"] and animal.photo_id:
            publish(animal.photo)
    else:
        observation.identity_state = "disputed"
        observation.evidence_state = "rejected" if data["action"] == "reject" else "needs_review"
        Reference.objects.filter(observation=observation).update(active=False)
    observation.version += 1
    record_decision(observation, actor, "reviewer", data["action"], data["reason"])
    apply_publication(observation)
    if previous_animal_id and (previous_animal_id != observation.animal_id or data["action"] in {"reject", "dispute"}):
        previous = Animal.objects.select_for_update().get(pk=previous_animal_id)
        if previous.photo_id == observation.capture.media_id:
            previous.photo = None
        if not previous.sightings.filter(active=True).exists() and not previous.references.filter(active=True).exists():
            previous.state = "provisional"
        previous.version += 1
        previous.save(update_fields=["photo", "state", "version"])
    result = receipt(observation)
    Operation.objects.create(owner=actor, kind="review", key=key, fingerprint=digest, result=result)
    return result
