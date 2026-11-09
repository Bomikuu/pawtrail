import uuid
from django.conf import settings
from django.db import models

class GalleryState(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)

class Reference(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    animal = models.ForeignKey("animals.Animal", related_name="references", on_delete=models.PROTECT)
    observation = models.ForeignKey("observations.Observation", on_delete=models.PROTECT)
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    viewpoint = models.CharField(max_length=20)
    provenance = models.TextField()
    traits = models.JSONField(default=dict)
    features = models.JSONField(default=dict)
    model_version = models.CharField(max_length=160)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["animal", "observation"], name="reference_observation_unique")]

class AnalysisRun(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    observation = models.ForeignKey("observations.Observation", related_name="analyses", on_delete=models.PROTECT)
    observation_version = models.PositiveIntegerField()
    status = models.CharField(max_length=20, default="queued", db_index=True)
    stage = models.CharField(max_length=30, default="queued")
    detections = models.JSONField(default=list)
    features = models.JSONField(default=dict)
    candidates = models.JSONField(default=list)
    reasons = models.JSONField(default=list)
    model_version = models.CharField(max_length=160, blank=True)
    gallery_fingerprint = models.CharField(max_length=64, blank=True)
    evidence_flags = models.JSONField(default=list)
    cloud_result = models.JSONField(null=True)
    lease = models.UUIDField(null=True)
    started_at = models.DateTimeField(null=True)
    attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["observation", "observation_version"], name="analysis_observation_version_unique")]

class Decision(models.Model):
    observation = models.ForeignKey("observations.Observation", related_name="decisions", on_delete=models.PROTECT)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.PROTECT)
    method = models.CharField(max_length=20)
    action = models.CharField(max_length=20)
    animal = models.ForeignKey("animals.Animal", null=True, on_delete=models.PROTECT)
    reason = models.TextField()
    policy_version = models.CharField(max_length=100, blank=True)
    observation_version = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

class Policy(models.Model):
    version = models.CharField(max_length=100, unique=True)
    enabled = models.BooleanField(default=False)
    species = models.CharField(max_length=10)
    model_version = models.CharField(max_length=160)
    minimum_similarity = models.FloatField()
    minimum_margin = models.FloatField()
    minimum_references = models.PositiveIntegerField(default=3)
    minimum_viewpoints = models.PositiveIntegerField(default=2)
    evaluation_report = models.TextField()
    calibration = models.ForeignKey("identity.CalibrationReport", null=True, blank=True, on_delete=models.PROTECT)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

class CalibrationReport(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    species = models.CharField(max_length=10)
    model_version = models.CharField(max_length=160)
    rule_version = models.CharField(max_length=60)
    gallery_fingerprint = models.CharField(max_length=64)
    cohort_ids = models.JSONField(default=list)
    payload = models.JSONField()
    digest = models.CharField(max_length=64, unique=True)
    passed = models.BooleanField(default=False)
    wrong_match_upper_bound = models.FloatField(default=1)
    coverage = models.FloatField(default=0)
    notes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValueError("Calibration reports are immutable; import a new report.")
        return super().save(*args, **kwargs)
