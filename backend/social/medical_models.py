"""Care-team records; no automatic veterinary verification or clinical inference."""
from django.conf import settings
from django.db import models
from .models import Record

class AnimalMedicalRecord(Record):
    animal_info = models.ForeignKey('social.AnimalInfo', on_delete=models.PROTECT, related_name='medical_records')
    kind = models.CharField(max_length=20, choices=[(value,value) for value in ['vaccination','vet_visit','treatment','test','other']])
    status = models.CharField(max_length=12, choices=[('planned','Planned'),('performed','Performed')], default='planned')
    title = models.CharField(max_length=160)
    event_date = models.DateField(null=True, blank=True)
    follow_up_date = models.DateField(null=True, blank=True)
    vaccine_product = models.CharField(max_length=160, blank=True)
    dose_label = models.CharField(max_length=80, blank=True)
    batch_reference = models.CharField(max_length=100, blank=True)
    provider_name = models.CharField(max_length=160, blank=True)
    clinic_name = models.CharField(max_length=160, blank=True)
    notes = models.TextField(blank=True)
    visibility = models.CharField(max_length=8, choices=[('private','Private'),('public','Shared summary')], default='private')
    public_summary = models.CharField(max_length=500, blank=True)
    attachments = models.ManyToManyField('media.Asset', blank=True, related_name='animal_medical_records')
    archived = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='+')
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='+')
    class Meta:
        indexes = [models.Index(fields=['animal_info','archived','visibility'], name='animal_medical_visibility')]

class AnimalMedicalRevision(models.Model):
    record = models.ForeignKey(AnimalMedicalRecord, on_delete=models.PROTECT, related_name='revisions')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    version = models.PositiveIntegerField()
    action = models.CharField(max_length=20)
    reason = models.CharField(max_length=300)
    snapshot = models.JSONField()
    documents = models.ManyToManyField('media.Asset', blank=True, related_name='animal_medical_revisions')
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-version']
        constraints = [models.UniqueConstraint(fields=['record','version'], name='unique_animal_medical_revision')]
