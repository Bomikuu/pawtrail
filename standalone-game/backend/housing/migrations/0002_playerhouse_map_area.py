from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [('housing', '0001_initial')]
    operations = [migrations.AddField(model_name='playerhouse', name='map_area',
        field=models.CharField(max_length=30, blank=True, default=''))]
