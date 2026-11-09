"""Upgrade untouched presets; retain original geometry for custom saves and history."""
import copy
import json
import time
import uuid
from collections import Counter
from pathlib import Path
from django.db import migrations


def signature(layout):
    return sorted((p['item'], p['x'], p['y'], p.get('rotation', 0)) for p in layout)


def compact_homes(apps, schema_editor):
    House = apps.get_model('housing', 'PlayerHouse')
    Player = apps.get_model('housing', 'PlayerGameProfile')
    data = json.loads((Path(__file__).parent / 'data/house-plans-v2.json').read_text())
    previous = {p['id']: p for p in data['previous']}
    compact = {p['id']: p for p in data['compact']}
    original_starter = [('sofa',5,6),('table',8,7),('decorative-rug',5,8),('television',5,3),('bookshelf',3,4),('small-indoor-plant',10,4),('single-bed',18,5),('wardrobe',21,5),('desk',18,8),('chair',18,10),('small-cat-bed',4,13),('food-bowl-full',8,13),('water-bowl-full',10,13),('cat-tree',6,11),('scratching-post',13,13)]
    starter_signature = sorted((item, x, y, 0) for item, x, y in original_starter)
    database = schema_editor.connection.alias
    for house in House.objects.using(database).exclude(owner__id__startswith='system:hub').iterator():
        identifier = house.interior_preset
        if identifier not in previous:
            continue
        for backup in house.layout_backups:
            if backup['preset'] in previous:
                backup['preset'] += '-legacy'
        house.unlocked_presets = [p + '-legacy' if p in previous else p for p in house.unlocked_presets]
        old_floors = previous[identifier]['floors']
        canonical = signature(house.layout) == signature(old_floors['interior']['items']) and signature(house.upstairs_layout) == signature(old_floors.get('upstairs', {}).get('items', []))
        starter = identifier == 'studio' and not house.upstairs_layout and signature(house.layout) == starter_signature
        empty = not house.layout and not house.upstairs_layout
        if canonical or starter or empty:
            backup = dict(id=str(uuid.uuid4()), at=time.time(), preset=identifier+'-legacy',
                          layout=copy.deepcopy(house.layout), upstairs=copy.deepcopy(house.upstairs_layout),
                          floor=house.floor, wallpaper=house.wallpaper, upgrade='compact-v2')
            house.layout_backups = [backup, *house.layout_backups][:5]
            selected = compact[identifier]
            house.layout = copy.deepcopy(selected['floors']['interior']['items']) if not empty else []
            house.upstairs_layout = copy.deepcopy(selected['floors'].get('upstairs', {}).get('items', [])) if not empty else []
            house.floor = selected['floor']
            house.wallpaper = selected['wallpaper']
            if not empty:
                player = Player.objects.using(database).get(pk=house.owner_id)
                required = Counter(p['item'] for p in [*house.layout, *house.upstairs_layout, *house.yard_layout])
                stock = dict(player.inventory)
                for item, count in required.items():
                    stock[item] = max(stock.get(item, 0), count)
                player.inventory = stock
                player.save(using=database, update_fields=['inventory'])
                house.unlocked_presets.append(identifier)
        else:
            # Do not squeeze hand-arranged pieces into different walls or lose them.
            house.interior_preset = identifier + '-legacy'
        house.revision += 1
        house.upstairs_revision += 1
        house.save(using=database)
    # Position and room-layout caches belong to the former geometry.
    from django.core.cache import cache
    for house in House.objects.using(database).exclude(owner__id__startswith='system:hub').iterator():
        for suffix in ['', '|upstairs']:
            room = house.owner_id + suffix
            cache.delete('layout:' + room)
            cache.delete('last-position:' + room + ':' + house.owner_id)


class Migration(migrations.Migration):
    dependencies = [('housing', '0005_house_layout_presets')]
    operations = [migrations.RunPython(compact_homes, migrations.RunPython.noop)]
