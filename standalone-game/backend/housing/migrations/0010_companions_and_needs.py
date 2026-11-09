from django.db import migrations,models
import django.db.models.deletion
class Migration(migrations.Migration):
    dependencies=[('housing','0009_world_interactions')]
    operations=[
      migrations.AddField(model_name='petgameprofile',name='game_position',field=models.JSONField(default=dict)),
      migrations.AddField(model_name='playergameprofile',name='companion_order',field=models.JSONField(default=list)),
      migrations.AddField(model_name='petgameprofile',name='food',field=models.FloatField(default=75)),
      migrations.AddField(model_name='petgameprofile',name='water',field=models.FloatField(default=75)),
      migrations.AddField(model_name='petgameprofile',name='needs_updated',field=models.DateTimeField(null=True)),
      migrations.AddField(model_name='petgameprofile',name='need_cycles',field=models.JSONField(default=dict)),
      migrations.AddField(model_name='petgameprofile',name='following',field=models.ForeignKey(null=True,on_delete=django.db.models.deletion.SET_NULL,related_name='companions',to='housing.playergameprofile')),
      migrations.AddField(model_name='petgameprofile',name='current_room',field=models.CharField(blank=True,max_length=180)),
      migrations.AddField(model_name='petgameprofile',name='command',field=models.JSONField(default=dict)),
      migrations.CreateModel(name='AnimalCareQuest',fields=[('id',models.BigAutoField(auto_created=True,primary_key=True,serialize=False,verbose_name='ID')),('kind',models.CharField(max_length=12)),('cycle',models.PositiveIntegerField(default=1)),('state',models.CharField(default='active',max_length=12)),('reward',models.PositiveIntegerField(default=5)),('created',models.DateTimeField(auto_now_add=True)),('completed',models.DateTimeField(null=True)),('owner',models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,to='housing.playergameprofile')),('pet',models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,to='housing.petgameprofile'))],options={'constraints':[models.UniqueConstraint(fields=('pet','kind','cycle'),name='unique_pet_need_cycle')]})
    ]
