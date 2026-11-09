"""Stored public geography and community rooms, separate from animal identities."""
import uuid
from django.db import models

class CommunityArea(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=180, unique=True)
    name = models.CharField(max_length=160)
    kind = models.CharField(max_length=16, choices=[('city', 'City'), ('municipality', 'Municipality'), ('barangay', 'Barangay'), ('zone', 'Community zone')])
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.PROTECT, related_name='children')
    source_key = models.CharField(max_length=180, unique=True)
    source_name = models.CharField(max_length=180)
    source_url = models.URLField(max_length=500)
    source_version = models.CharField(max_length=100)
    source_metadata = models.JSONField(default=dict)
    geometry = models.JSONField()
    display_geometry = models.JSONField()
    west = models.FloatField(db_index=True)
    south = models.FloatField(db_index=True)
    east = models.FloatField(db_index=True)
    north = models.FloatField(db_index=True)
    center = models.JSONField()
    area_km2 = models.FloatField()
    split_rule = models.JSONField(default=dict, blank=True)
    published = models.BooleanField(default=False, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

class GeographicCommunity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    area = models.OneToOneField(CommunityArea, on_delete=models.PROTECT, related_name='community')
    house = models.OneToOneField('housing.PlayerHouse', on_delete=models.PROTECT, related_name='geographic_community')
    enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
