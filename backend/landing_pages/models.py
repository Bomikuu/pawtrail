import uuid
from django.db import models
class LandingPage(models.Model):
    shelter = models.OneToOneField('social.Shelter', on_delete=models.CASCADE, related_name='landing_page')
    website = models.OneToOneField('website_builder.Website', on_delete=models.PROTECT)
    template = models.CharField(max_length=40)
class LandingMedia(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page = models.ForeignKey(LandingPage, on_delete=models.CASCADE, related_name='media')
    name = models.CharField(max_length=500)
    alt = models.CharField(max_length=300)
    metadata = models.JSONField(default=dict)
