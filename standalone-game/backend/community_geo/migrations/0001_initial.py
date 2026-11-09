from django.db import migrations,models
import django.contrib.gis.db.models.fields

class Migration(migrations.Migration):
    initial=True
    dependencies=[('community_map','0001_initial')]
    operations=[migrations.CreateModel(name='MapPoint',fields=[('id',models.BigAutoField(auto_created=True,primary_key=True,serialize=False,verbose_name='ID')),('kind',models.CharField(max_length=16)),('external_id',models.CharField(max_length=180)),('location',django.contrib.gis.db.models.fields.PointField(geography=True,srid=4326))],options={'constraints':[models.UniqueConstraint(fields=('kind','external_id'),name='unique_discovery_geography')]})]
