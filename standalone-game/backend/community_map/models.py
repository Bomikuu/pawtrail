import uuid
from django.db import models
from django.utils import timezone

class MapSubject(models.Model):
    """Typed pointers to existing records; never a second user/animal/shelter table."""
    kind=models.CharField(max_length=16,choices=[(k,k) for k in ['home','shelter','hub','animal','horde']])
    external_id=models.CharField(max_length=180)
    sample=models.BooleanField(default=False)
    class Meta:
        constraints=[models.UniqueConstraint(fields=['kind','external_id','sample'],name='unique_map_subject')]

class CommunitySpace(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    creator=models.ForeignKey('housing.PlayerGameProfile',on_delete=models.PROTECT)
    name=models.CharField(max_length=100)
    description=models.TextField(blank=True)
    latitude=models.FloatField(db_index=True)
    longitude=models.FloatField(db_index=True)
    published=models.BooleanField(default=False)
    created_at=models.DateTimeField(auto_now_add=True)

class ReputationEvent(models.Model):
    public_latitude=models.FloatField(null=True,blank=True,db_index=True)
    public_longitude=models.FloatField(null=True,blank=True,db_index=True)
    created_at=models.DateTimeField(default=timezone.now,editable=False)
    subject=models.ForeignKey(MapSubject,on_delete=models.CASCADE,related_name='contributions')
    kind=models.CharField(max_length=30)
    source_reference=models.CharField(max_length=200)
    verified_by=models.ForeignKey('housing.PlayerGameProfile',on_delete=models.PROTECT)
    verified=models.BooleanField(default=True)
    occurred_at=models.DateTimeField()
    class Meta:
        constraints=[models.UniqueConstraint(fields=['subject','source_reference'],name='unique_map_contribution_source')]

class IncidentReport(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    reporter=models.ForeignKey('housing.PlayerGameProfile',on_delete=models.PROTECT)
    subject=models.ForeignKey(MapSubject,null=True,blank=True,on_delete=models.PROTECT)
    category=models.CharField(max_length=30)
    description=models.TextField()
    latitude=models.FloatField()
    longitude=models.FloatField()
    public_latitude=models.FloatField(null=True,blank=True,db_index=True)
    public_longitude=models.FloatField(null=True,blank=True,db_index=True)
    area_label=models.CharField(max_length=120)
    occurred_at=models.DateTimeField()
    witnessed=models.BooleanField()
    urgent=models.BooleanField(default=False)
    status=models.CharField(max_length=24,default='submitted')
    severity=models.CharField(max_length=16,default='unknown')
    public_summary=models.TextField(blank=True)
    published=models.BooleanField(default=False)
    version=models.PositiveIntegerField(default=1)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

class IncidentEvidence(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    incident=models.ForeignKey(IncidentReport,on_delete=models.CASCADE,related_name='evidence')
    uploaded_by=models.ForeignKey('housing.PlayerGameProfile',on_delete=models.PROTECT)
    file=models.FileField(upload_to='community-evidence/%Y/%m/')
    original_name=models.CharField(max_length=160)
    content_type=models.CharField(max_length=80)
    created_at=models.DateTimeField(auto_now_add=True)

class IncidentCorrection(models.Model):
    incident=models.ForeignKey(IncidentReport,on_delete=models.CASCADE,related_name='corrections')
    author=models.ForeignKey('housing.PlayerGameProfile',on_delete=models.PROTECT)
    kind=models.CharField(max_length=16,default='information')
    description=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)

class IncidentReview(models.Model):
    incident=models.ForeignKey(IncidentReport,on_delete=models.CASCADE,related_name='reviews')
    reviewer=models.ForeignKey('housing.PlayerGameProfile',on_delete=models.PROTECT)
    status=models.CharField(max_length=24)
    notes=models.TextField(blank=True)
    version=models.PositiveIntegerField()
    created_at=models.DateTimeField(auto_now_add=True)

class HelpRequest(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    creator=models.ForeignKey('housing.PlayerGameProfile',on_delete=models.PROTECT)
    subject=models.ForeignKey(MapSubject,null=True,blank=True,on_delete=models.PROTECT)
    title=models.CharField(max_length=120)
    description=models.TextField()
    category=models.CharField(max_length=24)
    priority=models.CharField(max_length=16)
    latitude=models.FloatField()
    longitude=models.FloatField()
    public_latitude=models.FloatField(null=True,blank=True,db_index=True)
    public_longitude=models.FloatField(null=True,blank=True,db_index=True)
    area_label=models.CharField(max_length=120)
    status=models.CharField(max_length=20,default='under_review')
    expires_at=models.DateTimeField(db_index=True)
    public_summary=models.TextField(blank=True)
    published=models.BooleanField(default=False)
    version=models.PositiveIntegerField(default=1)
    created_at=models.DateTimeField(auto_now_add=True)

class HelpOffer(models.Model):
    request=models.ForeignKey(HelpRequest,on_delete=models.CASCADE,related_name='offers')
    volunteer=models.ForeignKey('housing.PlayerGameProfile',on_delete=models.PROTECT)
    description=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints=[models.UniqueConstraint(fields=['request','volunteer'],name='unique_help_offer')]

class HomePetMembership(models.Model):
    """An explicit association to the platform animal ID, not another Pet entity."""
    home=models.ForeignKey('housing.PlayerHouse',on_delete=models.CASCADE,related_name='public_pet_memberships')
    animal_id=models.CharField(max_length=160)
    public_snapshot=models.JSONField(default=dict)
    is_visible=models.BooleanField(default=False)
    joined_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints=[models.UniqueConstraint(fields=['home','animal_id'],name='unique_public_home_pet')]

from .areas_models import CommunityArea, GeographicCommunity
