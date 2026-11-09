from django.db import migrations,models

def assign_plots(apps,schema_editor):
    House=apps.get_model('housing','PlayerHouse')
    Player=apps.get_model('housing','PlayerGameProfile')
    for sample in [False,True]:
        for slot,house in enumerate(House.objects.filter(owner__sample=sample).exclude(owner__id__startswith='system:').order_by('owner_id')):
            house.community_slot=slot
            house.yard_public=sample
            house.exterior=['starter-house','garden-house','pastel-house'][slot%3]
            house.yard_layout=[dict(id='yard-starter-'+str(i),item=item,x=x,y=y,rotation=0) for i,(item,x,y) in enumerate([('garden-bench',2,10),('garden-banana',10,5),('garden-pot',3,6),('garden-pot',10,10)])]
            owner=Player.objects.get(pk=house.owner_id);stock=dict(owner.inventory)
            for piece in house.yard_layout:stock[piece['item']]=stock.get(piece['item'],0)+1
            owner.inventory=stock;owner.save(update_fields=['inventory'])
            house.save(update_fields=['community_slot','exterior','yard_layout','yard_public'])

class Migration(migrations.Migration):
    dependencies=[('housing','0003_playergameprofile_supplies')]
    operations=[
        migrations.AddField('playerhouse','yard_layout',models.JSONField(default=list)),
        migrations.AddField('playerhouse','yard_revision',models.PositiveIntegerField(default=1)),
        migrations.AddField('playerhouse','exterior',models.CharField(max_length=40,default='starter-house')),
        migrations.AddField('playerhouse','yard_public',models.BooleanField(default=False)),
        migrations.AddField('playerhouse','community_slot',models.PositiveIntegerField(null=True,blank=True)),
        migrations.AddField('housevisitor','zone',models.CharField(max_length=12,default='interior')),
        migrations.AddField('socialmessage','zone',models.CharField(max_length=12,default='interior')),
        migrations.RunPython(assign_plots,migrations.RunPython.noop),
    ]
