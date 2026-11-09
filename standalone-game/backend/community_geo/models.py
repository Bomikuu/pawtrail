from django.contrib.gis.db import models

class MapPoint(models.Model):
    kind=models.CharField(max_length=16)
    external_id=models.CharField(max_length=180)
    location=models.PointField(srid=4326,geography=True,spatial_index=True)
    class Meta:
        constraints=[models.UniqueConstraint(fields=['kind','external_id'],name='unique_discovery_geography')]
