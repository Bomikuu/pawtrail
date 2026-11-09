from django.db import migrations,models
class Migration(migrations.Migration):
    dependencies=[('housing','0004_spacious_yards')]
    operations=[
        migrations.AddField('playerhouse','interior_preset',models.CharField(max_length=40,default='studio')),
        migrations.AddField('playerhouse','upstairs_layout',models.JSONField(default=list)),
        migrations.AddField('playerhouse','upstairs_revision',models.PositiveIntegerField(default=1)),
        migrations.AddField('playerhouse','layout_backups',models.JSONField(default=list)),
        migrations.AddField('playerhouse','unlocked_presets',models.JSONField(default=list)),
    ]
