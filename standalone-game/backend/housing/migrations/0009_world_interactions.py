import django.db.models.deletion
from django.db import migrations,models
class Migration(migrations.Migration):
    dependencies=[('housing','0008_petgameprofile_map_visible_and_more')]
    operations=[
      migrations.AddField(model_name='playerhouse',name='object_states',field=models.JSONField(default=dict)),
      migrations.CreateModel(name='WorldInteraction',fields=[
        ('id',models.BigAutoField(auto_created=True,primary_key=True,serialize=False,verbose_name='ID')),
        ('action_id',models.CharField(max_length=80)),('zone',models.CharField(max_length=12)),('target',models.CharField(max_length=80)),('slot',models.CharField(blank=True,max_length=80)),('action',models.CharField(max_length=32)),('phase',models.CharField(default='perform',max_length=16)),('expires',models.DateTimeField()),('payload',models.JSONField(default=dict)),
        ('house',models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,to='housing.playerhouse')),
        ('player',models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,to='housing.playergameprofile')),
      ],options={'constraints':[models.UniqueConstraint(fields=('player','action_id'),name='unique_world_action')],'indexes':[models.Index(fields=['house','zone','target','expires'],name='world_action_lease')]}),
    ]
