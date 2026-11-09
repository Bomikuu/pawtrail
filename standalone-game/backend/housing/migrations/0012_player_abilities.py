from django.db import migrations,models
class Migration(migrations.Migration):
    dependencies=[('housing','0011_player_characters')]
    operations=[migrations.AddField(model_name='playergameprofile',name='ability_state',field=models.JSONField(default=dict))]
