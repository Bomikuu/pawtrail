"""Keep hand-arranged homes intact while upgrading the matching reference presets."""
import copy,json,time,uuid
from collections import Counter
from pathlib import Path
from django.db import migrations

def signature(layout):
    return sorted((p['item'],p['x'],p['y'],p.get('rotation',0)) for p in layout)

def reference_homes(apps,schema_editor):
    House=apps.get_model('housing','PlayerHouse');Player=apps.get_model('housing','PlayerGameProfile')
    data=json.loads((Path(__file__).parent/'data/house-plans-v3.json').read_text())
    previous={p['id']:p for p in data['previous']};reference={p['id']:p for p in data['reference']}
    database=schema_editor.connection.alias
    for house in House.objects.using(database).exclude(owner__id__startswith='system:hub').iterator():
        for saved in house.layout_backups:
            if saved['preset'] in previous:saved['preset']+='-v2'
        identifier=house.interior_preset
        if identifier in previous:
            old=previous[identifier]['floors']
            unchanged=signature(house.layout)==signature(old['interior']['items']) and signature(house.upstairs_layout)==signature(old.get('upstairs',{}).get('items',[]))
            empty=not house.layout and not house.upstairs_layout
            if unchanged or empty:
                backup=dict(id=str(uuid.uuid4()),at=time.time(),preset=identifier+'-v2',layout=copy.deepcopy(house.layout),upstairs=copy.deepcopy(house.upstairs_layout),floor=house.floor,wallpaper=house.wallpaper)
                house.layout_backups=[backup,*house.layout_backups][:5]
                selected=reference[identifier]
                house.layout=copy.deepcopy(selected['floors']['interior']['items']) if not empty else []
                house.upstairs_layout=copy.deepcopy(selected['floors'].get('upstairs',{}).get('items',[])) if not empty else []
                if not empty:
                    player=Player.objects.using(database).get(pk=house.owner_id);stock=dict(player.inventory)
                    for item,count in Counter(p['item'] for p in [*house.layout,*house.upstairs_layout,*house.yard_layout]).items():stock[item]=max(stock.get(item,0),count)
                    player.inventory=stock;player.save(using=database,update_fields=['inventory'])
                    house.unlocked_presets=list(dict.fromkeys([*house.unlocked_presets,selected.get('furniturePack',identifier)]))
            else:house.interior_preset=identifier+'-v2'
            house.revision+=1;house.upstairs_revision+=1
        house.save(using=database)

class Migration(migrations.Migration):
    dependencies=[('housing','0006_compact_house_plans')]
    operations=[migrations.RunPython(reference_homes,migrations.RunPython.noop)]
