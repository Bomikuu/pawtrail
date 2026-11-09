import uuid
from django.conf import settings
from django.db import models

class Asset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    original = models.FileField(upload_to="originals/%Y/%m")
    normalized = models.FileField(upload_to="normalized/%Y/%m")
    derivative = models.FileField(upload_to="public/%Y/%m", blank=True)
    alt = models.CharField(max_length=500)
    sha256 = models.CharField(max_length=64, db_index=True)
    pixel_digest = models.CharField(max_length=64, db_index=True, default="")
    perceptual_hash = models.CharField(max_length=32, db_index=True)
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField()
    byte_count = models.PositiveIntegerField()
    exif_evidence = models.JSONField(default=dict)
    public = models.BooleanField(default=False)
    mime_type = models.CharField(max_length=50, default="image/jpeg")
    purpose = models.CharField(max_length=30, default="capture")
    sensitive = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
