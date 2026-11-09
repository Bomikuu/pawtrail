import uuid
from django.conf import settings
from django.db import models

class Capture(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    media = models.ForeignKey("media.Asset", on_delete=models.PROTECT)
    source = models.CharField(max_length=24)
    captured_at = models.DateTimeField(null=True)
    received_at = models.DateTimeField(auto_now_add=True)
    latitude = models.FloatField(null=True)
    longitude = models.FloatField(null=True)
    accuracy_meters = models.FloatField(null=True)
    measured_at = models.DateTimeField(null=True)
    location_source = models.CharField(max_length=16, blank=True)
    area_label = models.CharField(max_length=120, blank=True)
    cloud_consent = models.BooleanField(default=False)
    request_key = models.CharField(max_length=120)
    request_fingerprint = models.CharField(max_length=64)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["owner", "request_key"], name="capture_idempotent")]

class Observation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    capture = models.ForeignKey(Capture, on_delete=models.PROTECT, related_name="observations")
    crop = models.JSONField(null=True)
    version = models.PositiveIntegerField(default=1)
    animal = models.ForeignKey("animals.Animal", null=True, on_delete=models.PROTECT)
    proposed_animal = models.ForeignKey("animals.Animal", null=True, on_delete=models.PROTECT, related_name="proposals")
    identity_state = models.CharField(max_length=20, default="unassigned")
    evidence_state = models.CharField(max_length=20, default="pending")
    publication_state = models.CharField(max_length=20, default="pending")
    notes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Sighting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    observation = models.OneToOneField(Observation, on_delete=models.PROTECT)
    animal = models.ForeignKey("animals.Animal", on_delete=models.PROTECT, related_name="sightings")
    active = models.BooleanField(default=True)
    content_digest = models.CharField(max_length=64, default="")
    approved_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["animal", "content_digest"], condition=models.Q(active=True) & ~models.Q(content_digest=""), name="one_photo_one_animal_encounter")]

class Operation(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    key = models.CharField(max_length=120)
    kind = models.CharField(max_length=60)
    fingerprint = models.CharField(max_length=64)
    result = models.JSONField()
    class Meta:
        constraints = [models.UniqueConstraint(fields=["owner", "kind", "key"], name="operation_idempotent")]
