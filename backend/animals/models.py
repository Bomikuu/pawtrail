import uuid
from django.conf import settings
from django.db import models

class Animal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=150, unique=True)
    species = models.CharField(max_length=10, choices=[("cat", "Cat"), ("dog", "Dog")])
    description = models.TextField(blank=True)
    appearance = models.TextField(blank=True)
    area_label = models.CharField(max_length=120, blank=True)
    state = models.CharField(max_length=20, default="provisional")
    photo = models.ForeignKey("media.Asset", null=True, blank=True, on_delete=models.PROTECT)
    version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
