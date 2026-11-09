"""Owner-selected, reversible structural changes within the existing action transaction."""
import copy,time,uuid
from collections import Counter
from datetime import timedelta
from django.core.cache import cache
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from .models import HouseVisitor
from .presets import PRESETS,plan
from .geometry import validate_layout

def change_layout(player,house,body):
    from .service import fail
    if house.owner_id!=player.id or house.owner_id.startswith('system:hub'):raise PermissionDenied('Only the owner can choose a house layout.')
    if body.get('revision')!=house.revision or body.get('upstairsRevision')!=house.upstairs_revision:fail('Your house changed. Reload Settings before choosing a layout.')
    if HouseVisitor.objects.filter(house=house,zone__in=['interior','upstairs'],updated__gt=timezone.now()-timedelta(seconds=35)).exclude(player=player).exists():fail('Ask your indoor visitors to leave before changing the house layout.')
    current=dict(id=str(uuid.uuid4()),at=time.time(),preset=house.interior_preset,layout=copy.deepcopy(house.layout),upstairs=copy.deepcopy(house.upstairs_layout),floor=house.floor,wallpaper=house.wallpaper)
    skipped=0
    if body['type']=='restore-layout':
        saved=next((b for b in house.layout_backups if b['id']==body.get('backup')),None)
        if not saved:fail('That saved arrangement is no longer in your recent history.')
        preset=saved['preset'];ground=copy.deepcopy(saved['layout']);upper=copy.deepcopy(saved['upstairs']);floor=saved['floor'];wallpaper=saved['wallpaper']
    else:
        preset=body.get('preset')
        if preset not in PRESETS:fail('Choose an available house layout.')
        selected=plan(preset);floor=selected['floor'];wallpaper=selected['wallpaper']
        ground=copy.deepcopy(selected['floors']['interior']['items']) if body.get('furnish') is True else []
        upper=copy.deepcopy(selected['floors'].get('upstairs',{}).get('items',[])) if body.get('furnish') is True else []
        pack=selected.get('furniturePack',preset)
        if body.get('furnish') is True and pack not in house.unlocked_presets:
            required=Counter(p['item'] for p in [*house.yard_layout,*ground,*upper]);stock=dict(player.inventory)
            for item,count in required.items():stock[item]=max(stock.get(item,0),count)
            player.inventory=stock;player.save(update_fields=['inventory']);house.unlocked_presets=list(dict.fromkeys([*house.unlocked_presets,preset,pack]))
        # Repeated switches use owned stock; gifts/consumption cannot regenerate a pack.
        available=Counter(player.inventory)-Counter(p['item'] for p in house.yard_layout)
        staged=[]
        for entries in [ground,upper]:
            owned=[]
            for piece in entries:
                if available[piece['item']]>0:owned.append(piece);available[piece['item']]-=1
                else:skipped+=1
            staged.append(owned)
        ground,upper=staged
    validate_layout(ground,player.inventory,'interior',[*house.yard_layout,*upper],preset)
    if 'upstairs' in plan(preset)['floors']:validate_layout(upper,player.inventory,'upstairs',[*house.yard_layout,*ground],preset)
    elif upper:fail('This layout has no upper floor.')
    # Yard stock remains accounted for, even when restoring an older interior.
    house.layout_backups=[current,*house.layout_backups][:5]
    house.interior_preset=preset;house.layout=ground;house.upstairs_layout=upper;house.floor=floor;house.wallpaper=wallpaper
    house.revision+=1;house.upstairs_revision+=1;house.save()
    for room in [house.owner_id,house.owner_id+'|upstairs']:
        cache.delete('layout:'+room);cache.delete('last-position:'+room+':'+player.id)
    return dict(visit=house.owner_id,entry='reset',notice='House layout saved.'+(f' {skipped} unavailable furniture pieces were left out; add them from storage or the shop.' if skipped else ' Your previous arrangement is in Layout history.'))
