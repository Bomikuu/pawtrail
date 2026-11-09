from django.db import migrations, models
class Migration(migrations.Migration):
    dependencies = [('housing', '0002_playerhouse_map_area')]
    operations = [migrations.AddField(model_name='playergameprofile', name='supplies', field=models.JSONField(default=dict))]
