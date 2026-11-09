import base64,hashlib,math,time,uuid
from datetime import timedelta
from django.db import transaction
from django.db.models import Q,F
from django.utils import timezone
from django.core.cache import cache
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.exceptions import ValidationError,PermissionDenied,NotFound
from .models import *
from .geometry import ITEMS,CATALOG,WIDTH,HEIGHT,DOOR,blocked,reachable,validate_layout,default_layout
from .presets import PRESETS,plan,floor_spec,active_revision,entry_tile
from .community import DATA,EXTERIORS,is_hub,zone_spec,active_layout,room_key,hub_id,block_number,starter_yard,SAMPLE_HOME_IDS

PERMISSIONS=dict(pets=True,help=True,furniture=True,guestbook=True,chat=True,decorators=[],invitations=True)
QUESTS=[dict(id='curious-neighbor',title='A Curious Neighbor',facts=['world-find:care-cache','world-find:community-letter','world-find:hidden-token'],reward=50),dict(id='welcome-home',title='Welcome Home',facts=['enter','meet-pet','place','feed','friends-panel'],reward=100),dict(id='first-visitor',title='First Visitor',facts=['friend','invite','greet','show-pet'],reward=150),dict(id='helping-paws',title='Helping Paws',facts=['visit','water-friend'],reward=100),dict(id='cozy-corner',title='Cozy Corner',facts=['buy-bed','decorate','place-bed','pet-bed'],reward=0,item='decorative-rug'),dict(id='housewarming',title='Housewarming',facts=['invite-two','gather','group-photo'],reward=0,badge='Housewarming')]
def fail(message):raise ValidationError(message)
def text(value,limit=280):
    if not isinstance(value,str) or not value.strip() or len(value)>limit or any(ord(c)<32 and c not in '\n\t' for c in value):fail(f'Enter between 1 and {limit} characters.')
    return value.strip()
def broadcast(group,event):
    transaction.on_commit(lambda:async_to_sync(get_channel_layer().group_send)(group,{'type':'game.event','event':event}))
def group(id):return 'home.'+hashlib.sha256(id.encode()).hexdigest()[:40]
def user_group(id):return 'player.'+hashlib.sha256(id.encode()).hexdigest()[:40]
def notify(p,message):
    p.notifications=([{'id':str(uuid.uuid4()),'text':message,'at':time.time()}]+p.notifications)[:40];p.save(update_fields=['notifications'])
    broadcast(user_group(p.id),{'type':'notification','text':message})
def fact(p,value):
    if value not in p.facts:p.facts=[*p.facts,value];p.save(update_fields=['facts'])
def friend(a,b):
    x,y=sorted([a,b]);return Friendship.objects.filter(a_id=x,b_id=y).exists()
def blocked_users(a,b):return UserBlock.objects.filter(Q(owner_id=a,target_id=b)|Q(owner_id=b,target_id=a)).exists()
def can_enter(p,h):
    if h.owner_id.startswith('system:hub:geo:'):
        from community_map.areas_models import GeographicCommunity
        if p.sample or not GeographicCommunity.objects.filter(house=h,enabled=True,area__published=True,area__kind='city').exists():return False
    if p.id==h.owner_id:return True
    if p.sample!=h.owner.sample or blocked_users(p.id,h.owner_id) or not h.opened:return False
    if h.visibility=='public':return True
    if h.visibility=='friends':return friend(p.id,h.owner_id)
    if h.visibility=='invite':return Invitation.objects.filter(house=h,recipient=p,state__in=['pending','accepted'],expires__gt=timezone.now()).exists()
    return False
def require_house(p,id):
    base,sep,zone=str(id).partition('|')
    if sep and zone not in ['yard','upstairs']:raise PermissionDenied('Unknown property space.')
    zone=zone or 'interior'
    if base=='me':base=p.id
    if base=='system:hub':
        own=PlayerHouse.objects.filter(owner=p).first();base=hub_id(p.sample,(own.community_slot or 0)//4 if own else 0)
    if base.startswith('system:hub:geo:'):
        from community_map.areas_models import GeographicCommunity
        if p.sample or not GeographicCommunity.objects.filter(house_id=base,enabled=True,area__published=True,area__kind='city').exists():raise PermissionDenied('This community area is not open.')
    elif base.startswith('system:hub:'):
        expected=hub_id(p.sample,block_number(base))
        if base!=expected:raise PermissionDenied('This community is in a different realm.')
        block=block_number(base)
        if block and not PlayerHouse.objects.filter(owner__sample=p.sample,community_slot__gte=block*4,community_slot__lt=(block+1)*4).exists():raise PermissionDenied('This home block has not opened yet.')
        host,_=PlayerGameProfile.objects.get_or_create(id=base,defaults={'username':'neighborhood','name':'Sampaguita neighborhood','wallet':0,'sample':p.sample})
        PlayerHouse.objects.get_or_create(owner=host,defaults={'name':'Sampaguita neighborhood','visibility':'public','layout':[],'permissions':PERMISSIONS.copy()})
    h=PlayerHouse.objects.select_related('owner').filter(owner_id=base).first()
    if not h or not can_enter(p,h):raise PermissionDenied('This home is closed or its access settings do not permit this visit.')
    if sep and is_hub(h):raise PermissionDenied('The shared community has no private yard.')
    if zone=='upstairs' and not floor_spec(h.interior_preset,zone):raise PermissionDenied('This house has no upper floor.')
    h._zone=zone
    return h
def permitted(p,h,capability):return p.id==h.owner_id or bool(h.permissions.get(capability,False))
def person(p,viewer=None):
    seen=HouseVisitor.objects.filter(player=p,updated__gt=timezone.now()-timedelta(seconds=35)).first()
    visible=bool(seen and p.visible and (not viewer or not blocked_users(viewer.id,p.id)))
    room=room_key(seen.house_id,seen.zone) if visible and viewer and can_enter(viewer,seen.house) else None
    return dict(location=('Neighborhood' if room and room.startswith('system:hub') else 'At home' if room and room.split('|')[0]==p.id else 'Visiting a home') if room else None,roomId=room,id=p.id,username=p.username,name=p.name,avatar=p.avatar,appearance=p.appearance,sample=p.sample,online=bool(seen and p.visible and (not viewer or not blocked_users(viewer.id,p.id))))
@transaction.atomic
def provision(ticket):
    if ticket.get('demoVisitor') or ticket.get('sample'):
        raise PermissionDenied('Sample accounts are no longer available. Sign in with a real platform account.')
    p,created=PlayerGameProfile.objects.get_or_create(id=ticket['id'],defaults={'username':ticket['username'],'name':ticket['name'],'avatar':ticket.get('avatar',''),'sample':ticket.get('sample',False)})
    p.username=ticket['username'][:100];p.name=ticket['name'][:120];p.avatar=ticket.get('avatar','');p.can_review_map=ticket.get('mapReviewer') is True;p.save(update_fields=['username','name','avatar','can_review_map'])
    if created:
        layout=default_layout();inventory={}
        for piece in layout:inventory[piece['item']]=inventory.get(piece['item'],0)+1
        inventory['small-cat-bed']=inventory.get('small-cat-bed',0)+1;inventory['flower-pot']=2;inventory['toy-mouse']=1
        p.inventory=inventory;p.save(update_fields=['inventory'])
        h=PlayerHouse.objects.create(owner=p,name=(p.name+'’s Home')[:100],layout=layout,floor=plan()['floor'],wallpaper=plan()['wallpaper'],unlocked_presets=['studio',plan().get('furniturePack','studio')],permissions=PERMISSIONS.copy());HouseRoom.objects.create(house=h,key='home')
    # The ticket is the owner-authoritative bridge. It never comes from client-submitted pet data.
    hub,_=PlayerGameProfile.objects.get_or_create(id='system:hub:'+('demo' if p.sample else 'real'),defaults={'username':'neighborhood','name':'Sampaguita neighborhood','wallet':0,'sample':p.sample})
    PlayerHouse.objects.get_or_create(owner=hub,defaults={'name':'Sampaguita neighborhood','visibility':'public','layout':[],'permissions':PERMISSIONS.copy()})
    PlayerHouse.objects.select_for_update().get(owner=hub)
    used=set(PlayerHouse.objects.filter(owner__sample=p.sample,community_slot__isnull=False).values_list('community_slot',flat=True))
    for unassigned in PlayerHouse.objects.filter(owner__sample=p.sample,community_slot__isnull=True).filter(Q(owner_id__in=SAMPLE_HOME_IDS)|~Q(owner__id__startswith='system:')).order_by('owner_id'):
        slot=0
        while slot in used:slot+=1
        unassigned.community_slot=slot
        if unassigned.owner_id in SAMPLE_HOME_IDS:
            unassigned.yard_public=True;unassigned.exterior=EXTERIORS[slot%len(EXTERIORS)]
        if not unassigned.yard_layout and unassigned.yard_revision==1:
            unassigned.yard_layout=starter_yard();stock=dict(unassigned.owner.inventory)
            for piece in unassigned.yard_layout:stock[piece['item']]=stock.get(piece['item'],0)+1
            unassigned.owner.inventory=stock;unassigned.owner.save(update_fields=['inventory'])
        unassigned.save(update_fields=['community_slot','yard_layout','yard_public','exterior']);used.add(slot)
    ids=[]
    for pet in ticket.get('pets',[])[:12]:
        id=('demo:' if p.sample else 'real:')+pet['id'];ids.append(id)
        existing=PetGameProfile.objects.filter(id=id).first()
        if existing and existing.owner_id!=p.id:existing.delete()
        PetGameProfile.objects.update_or_create(id=id,defaults={'owner':p,'snapshot':pet,'map_visible':pet.get('mapVisible') is True,**({'sprite':pet.get('sprite','orange-tabby')} if not existing else {})})
    PetGameProfile.objects.filter(owner=p).exclude(id__in=ids).delete()
    from community_map.models import HomePetMembership
    shared=[]
    for pet in ticket.get('mapPets',[])[:50]:
        if not isinstance(pet,dict) or not isinstance(pet.get('id'),str) or pet.get('species') not in ['cat','dog'] or pet.get('mapVisible') is not True:continue
        shared.append(pet['id'])
        HomePetMembership.objects.update_or_create(home_id=p.id,animal_id=pet['id'],defaults={'is_visible':True,'public_snapshot':pet})
    HomePetMembership.objects.filter(home_id=p.id).exclude(animal_id__in=shared).delete()
    return p

def pet_state(pet,house,now=None):
    from .pet_behavior import snapshot
    with transaction.atomic():
        locked=PlayerHouse.objects.select_for_update().get(pk=house.pk)
        pet=PetGameProfile.objects.select_for_update().get(pk=pet.pk)
        value=snapshot(pet,locked,now)
        house.object_states=locked.object_states
        return value

def community_plots(p,h):
    if h.owner_id.startswith('system:hub:geo:'):return [dict(slot=index,name='Unassigned community plot',available=False) for index in range(4)]
    block=block_number(h);result=[]
    for index in range(4):
        home=PlayerHouse.objects.select_related('owner').filter(owner__sample=p.sample,community_slot=block*4+index).first()
        visible=home and ((home.visibility=='public' and home.opened and (home.owner.visible or home.owner_id in SAMPLE_HOME_IDS) and can_enter(p,home)) or home.owner_id==p.id)
        if not visible:
            result.append(dict(slot=index,name='Private property' if home else 'Unassigned plot',available=False));continue
        result.append(dict(slot=index,name=('Sample · ' if home.owner_id in SAMPLE_HOME_IDS else '')+home.name,owner=person(home.owner,p),available=True,exterior=home.exterior,yardLayout=home.yard_layout if home.yard_public or home.owner_id==p.id else [],yardPublic=home.yard_public))
    return result

def house_data(p,h):
    zone=getattr(h,'_zone','interior');width,height,door=zone_spec(h,zone)
    if not is_hub(h):door=entry_tile(h,zone,getattr(h,'_entry','door'))
    editor=not is_hub(h) and (p.id==h.owner_id or p.id in h.permissions.get('decorators',[]))
    from .interactions import states as object_states
    return dict(objectStates=object_states(h,zone),id=h.owner_id,roomId=room_key(h.owner_id,zone),zone=zone,interiorPreset=h.interior_preset,upstairsLayout=h.upstairs_layout if not is_hub(h) else [],upstairsRevision=h.upstairs_revision,activeRevision=active_revision(h,zone),floors=[dict(id=key,label=f['label'],rooms=f['rooms']) for key,f in plan(h.interior_preset)['floors'].items()] if not is_hub(h) else [],layoutBackups=[dict(id=b['id'],at=b['at'],preset=b['preset'],name=plan(b['preset'])['name']) for b in h.layout_backups] if p.id==h.owner_id else [],unlockedPresets=h.unlocked_presets if p.id==h.owner_id else [],name=h.name,mapArea=h.map_area,owner=person(h.owner,p),visibility=h.visibility,opened=h.opened,permissions=h.permissions,layout=h.layout if not is_hub(h) else [],yardLayout=h.yard_layout if not is_hub(h) else [],activeLayout=active_layout(h,zone),floor=h.floor,wallpaper=h.wallpaper,revision=h.revision,yardRevision=h.yard_revision,exterior=h.exterior,yardPublic=h.yard_public,communityBlock=(h.community_slot or 0)//4,plots=community_plots(p,h) if is_hub(h) else [],blockCount=(1 if h.owner_id.startswith('system:hub:geo:') else ((PlayerHouse.objects.filter(owner__sample=p.sample,community_slot__isnull=False).order_by('-community_slot').values_list('community_slot',flat=True).first() or 0)//4+1)),block=block_number(h) if is_hub(h) else 0,upgrades=h.upgrades,width=width,height=height,spawn=[door[0]*32+16,door[1]*32+16],canDecorate=editor,inventory=h.owner.inventory if editor else {},neighbors=[],pets=[pet_state(a,h) for a in PetGameProfile.objects.filter(owner=h.owner,following__isnull=True).filter(Q(current_room='')|Q(current_room=h.owner_id))] if zone=='interior' and not is_hub(h) else [],guestbook=[dict(id=str(e.id),author=person(e.author,p),text=e.text,at=e.created.timestamp()) for e in GuestbookEntry.objects.filter(house=h).select_related('author').order_by('-created')[:30]])
def state(p,home=None,entry='door'):
    p.refresh_from_db();h=require_house(p,home or p.id);h._entry=entry if entry in ['stairs','reset'] else 'door'
    requests=FriendRequest.objects.filter(Q(sender=p)|Q(recipient=p),state='pending').select_related('sender','recipient')
    friends=Friendship.objects.filter(Q(a=p)|Q(b=p)).select_related('a','b')
    messages=SocialMessage.objects.filter(Q(sender=p,recipient__isnull=False)|Q(recipient=p)).select_related('sender','recipient').order_by('-created')[:60]
    invitations=Invitation.objects.filter(Q(recipient=p)|Q(sender=p),expires__gt=timezone.now()).select_related('sender','recipient','house').order_by('-expires')[:30]
    from .immersion import conditions
    from .construction import jobs as furniture_jobs
    from .environment import status as environment_status
    return dict(environment=environment_status(p,h), builds=furniture_jobs(p), world=conditions(), player={**person(p,p), 'wallet':p.wallet,'supplies':p.supplies,'inventory':p.inventory,'facts':p.facts,'claimed':p.claimed,'favorites':p.favorites,'notifications':p.notifications,'visible':p.visible,'quiet':p.quiet,'availableInventory':{item:max(0,count-sum(1 for a in [*p.playerhouse.layout,*p.playerhouse.yard_layout,*p.playerhouse.upstairs_layout] if a['item']==item)) for item,count in p.inventory.items()}},house=house_data(p,h),friends=[person(e.b if e.a_id==p.id else e.a,p) for e in friends],requests=[dict(id=e.id,sender=person(e.sender,p),recipient=person(e.recipient,p)) for e in requests],invitations=[dict(id=str(e.id),house=e.house_id,sender=person(e.sender,p),recipient=person(e.recipient,p),state=e.state) for e in invitations],messages=[dict(id=m.id,sender=person(m.sender,p),recipient=person(m.recipient,p),text=m.text,at=m.created.timestamp()) for m in reversed(messages)],quests=QUESTS,photos=[dict(id=str(a.id),image=a.image,caption=a.caption) for a in GamePhoto.objects.filter(owner=p).order_by('-created')[:12]],blocks=[person(b.target,p) for b in UserBlock.objects.filter(owner=p).select_related('target')],catalog=list(ITEMS.values()),serverTime=time.time())
def check_rate(key,count,window):
    value=cache.get(key,0)
    if value>=count:fail('Please wait a moment before trying again.')
    cache.set(key,value+1,window)
def mutation(p,body,key):
    if not isinstance(body,dict):fail('Invalid action body.')
    if not isinstance(key,str) or not 8<=len(key)<=80:fail('A unique action key is required.')
    with transaction.atomic():
        p=PlayerGameProfile.objects.select_for_update().get(pk=p.id)
        previous=ActionReceipt.objects.filter(owner=p,key=key).first()
        if previous:return previous.result
        check_rate('action:'+p.id,90,60)
        kind=body.get('type');target=body.get('target');h=PlayerHouse.objects.select_for_update().filter(owner_id=body.get('house') or p.id).first()
        if not h:raise NotFound('This home does not exist.')
        result={'ok':True};changed=False
        if kind in ['house-preset','restore-layout']:
            from .house_layouts import change_layout
            result.update(change_layout(p,h,body));changed=True
        elif kind in ['layout','yard-layout','exterior','settings','upgrade']:
            owner=p.id==h.owner_id;decorator=p.id in h.permissions.get('decorators',[])
            if not owner and not (kind in ['layout','yard-layout'] and decorator and can_enter(p,h)):raise PermissionDenied('Only the owner or an invited decorator can change this home.')
            yard=kind in ['yard-layout','exterior']
            zone='yard' if yard else body.get('zone','interior') if kind=='layout' else 'interior'
            if zone not in ['interior','yard','upstairs'] or (zone=='upstairs' and not floor_spec(h.interior_preset,zone)):fail('This floor is unavailable.')
            if kind=='layout' and zone=='yard':fail('Use the yard editor for outdoor pieces.')
            expected=active_revision(h,zone)
            if body.get('revision')!=expected:fail('This space changed. Reload the latest version or reapply your draft before saving.')
            if kind in ['layout','yard-layout']:
                h.owner=PlayerGameProfile.objects.select_for_update().get(pk=h.owner_id)
                other=[*h.layout,*h.upstairs_layout] if yard else [*h.yard_layout,*(h.layout if zone=='upstairs' else h.upstairs_layout)]
                layout=validate_layout(body.get('layout'),h.owner.inventory,zone,other,h.interior_preset)
                previous_pieces={piece['id']:piece for piece in active_layout(h,zone)}
                next_pieces={piece['id']:piece for piece in layout}
                for lease in WorldInteraction.objects.filter(house=h,zone=zone,phase__in=['perform','held'],expires__gt=timezone.now()):
                    if previous_pieces.get(lease.target)!=next_pieces.get(lease.target):fail('This furniture is in use. Stand up or finish its action before changing it.')
                if len(layout)>(80 if 'decoration-slots' in h.upgrades else 40):fail('Unlock more decoration slots to place over 40 pieces.')
                solid=blocked(layout,zone=zone,preset=h.interior_preset)
                if any((int(v['x']//32),int(v['y']//32)) in solid for v in cache.get('positions:'+room_key(h.owner_id,zone),{}).values()):fail('A player is standing in the placement area. Ask them to move before saving.')
                if yard:h.yard_layout=layout
                elif zone=='upstairs':h.upstairs_layout=layout
                else:h.layout=layout
                fact(p,'place');fact(p,'decorate');fact(p,'place-bed') if any('bed' in a['item'] for a in layout) else None
            elif kind=='exterior':
                if body.get('preset') not in EXTERIORS:fail('Choose an available house exterior.')
                h.exterior=body['preset']
            elif kind=='settings':
                if body.get('visibility') not in ['public','friends','invite','private']:fail('Choose a house access setting.')
                h.name=text(body.get('name'),100);h.visibility=body['visibility'];h.opened=body.get('opened') is True
                if 'yardPublic' in body:h.yard_public=body['yardPublic'] is True
                settings=body.get('permissions',{});h.permissions={k:settings.get(k) is True for k in PERMISSIONS if k!='decorators'}
                decorators=settings.get('decorators',[])
                if not isinstance(decorators,list) or len(decorators)>8 or any(not friend(p.id,id) for id in decorators):fail('Decorators must be accepted friends.')
                h.permissions['decorators']=decorators
                if body.get('floor') not in ['oak-light-a','wood-dark-a','carpet-a','ceramic-a','stone','patterned']:fail('Choose an available floor.')
                if body.get('wallpaper') not in ['cream','sage','beige','blue','wood','wallpaper']:fail('Choose an available wallpaper.')
                h.floor=body['floor'];h.wallpaper=body['wallpaper']
            else:
                if target not in ['decoration-slots'] or target in h.upgrades:fail('This upgrade is unavailable or already unlocked.')
                if p.wallet<200:fail('A house upgrade costs 200 game Kibble.')
                p.wallet-=200;p.save(update_fields=['wallet']);h.upgrades=[*h.upgrades,target];HouseRoom.objects.get_or_create(house=h,key=target)
            if yard:h.yard_revision+=1
            elif zone=='upstairs':h.upstairs_revision+=1
            else:h.revision+=1
            h.save();changed=True
        elif kind=='map-listing':
            from .discovery import AREAS
            if h.owner_id != p.id:raise PermissionDenied('Only the owner can list this home.')
            area = body.get('area', '')
            if not isinstance(area, str) or (area and area not in AREAS):fail('Choose an available neighborhood or keep your home unlisted.')
            if body.get('revision') != h.revision:fail('The home changed. Reload before updating its map listing.')
            h.map_area = area;h.revision += 1;h.save(update_fields=['map_area', 'revision']);changed=True
        elif kind=='world-pickup':
            from .immersion import collect
            result['discovery'] = collect(p, h, target)
        elif kind=='mission-pin':
            if target and not any(q['id']==target for q in QUESTS):fail('Unknown mission.')
            p.facts=[f for f in p.facts if not f.startswith('mission-pin:')]+(['mission-pin:'+target] if target else []);p.save(update_fields=['facts'])
        elif kind=='mission-accept':
            if not any(q['id']==target for q in QUESTS):fail('This mission is unavailable.')
            fact(p, 'mission-accepted:' + target)
        elif kind=='equip-tool':
            from .environment import equip
            equip(p,target)
        elif kind=='buy-supply':
            prices={'cat-food':8,'dog-food':8,'fish-treats':5,'water-bottle':3,'first-aid':20,'toy-mouse':10}
            from .construction import material_prices
            prices.update(material_prices())
            from .environment import TOOLS
            prices.update({key:value['price'] for key,value in TOOLS.items()})
            if target not in prices:fail('Choose an available care supply or building material.')
            quantity=body.get('quantity',1)
            if type(quantity) is not int or not 1<=quantity<=100:fail('Choose between 1 and 100 supplies.')
            if p.wallet<prices[target]*quantity:fail('You need more game Kibble for these supplies.')
            if p.supplies.get(target,0)+quantity>10000:fail('Your supply storage is full.')
            p.wallet-=prices[target]*quantity;p.supplies={**p.supplies,target:p.supplies.get(target,0)+quantity};p.save(update_fields=['wallet','supplies'])
        elif kind in ['furniture-build','furniture-claim']:
            from .construction import start,claim
            if kind=='furniture-build':start(p,target,body.get('mode'))
            else:claim(p,target)
        elif kind=='buy':
            if target not in ITEMS:fail('Unknown furniture item.')
            d=ITEMS[target]
            if target=='community-bench':fail('Community furniture stays in the commons.')
            if p.wallet<d['price']:fail('You need more game Kibble for this piece.')
            p.wallet-=d['price'];p.inventory[target]=p.inventory.get(target,0)+1;p.save(update_fields=['wallet','inventory'])
            if 'bed' in target:fact(p,'buy-bed')
        elif kind in ['request','accept','decline','remove-friend','block','unblock','dm','gift','invite','report']:
            other=PlayerGameProfile.objects.filter(id=target).first()
            if not other or other.id==p.id or other.id.startswith('system:') or p.sample!=other.sample:fail('Choose another registered player.')
            if kind not in ['block','unblock','report'] and blocked_users(p.id,other.id):raise PermissionDenied('This interaction is unavailable.')
            if kind=='request':
                if friend(p.id,other.id):fail('You are already friends.')
                incoming=FriendRequest.objects.filter(sender=other,recipient=p,state='pending').exists()
                if incoming:
                    a,b=sorted([p.id,other.id]);Friendship.objects.get_or_create(a_id=a,b_id=b);FriendRequest.objects.filter(Q(sender=p,recipient=other)|Q(sender=other,recipient=p)).update(state='accepted');fact(p,'friend');fact(other,'friend')
                else:FriendRequest.objects.update_or_create(sender=p,recipient=other,defaults={'state':'pending'})
                notify(other,p.name+' sent a friend request.')
            elif kind in ['accept','decline']:
                request=FriendRequest.objects.filter(sender=other,recipient=p,state='pending').first()
                if not request:fail('This friend request is no longer pending.')
                request.state='accepted' if kind=='accept' else 'declined';request.save()
                if kind=='accept':
                    a,b=sorted([p.id,other.id]);Friendship.objects.get_or_create(a_id=a,b_id=b);fact(p,'friend');fact(other,'friend');notify(other,p.name+' accepted your friend request.')
            elif kind in ['remove-friend','block']:
                Friendship.objects.filter(Q(a=p,b=other)|Q(a=other,b=p)).delete();FriendRequest.objects.filter(Q(sender=p,recipient=other)|Q(sender=other,recipient=p)).delete()
                if kind=='block':
                    UserBlock.objects.get_or_create(owner=p,target=other);Invitation.objects.filter(Q(sender=p,recipient=other)|Q(sender=other,recipient=p)).delete();broadcast(user_group(other.id),{'type':'access-changed','owner':p.id})
            elif kind=='unblock':UserBlock.objects.filter(owner=p,target=other).delete()
            elif kind=='report':AbuseReport.objects.create(author=p,target=other,reason=text(body.get('text'),500))
            elif not friend(p.id,other.id):raise PermissionDenied('This action is available between accepted friends.')
            elif kind=='dm':
                check_rate('dm:'+p.id,12,30);m=SocialMessage.objects.create(sender=p,recipient=other,text=text(body.get('text')));broadcast(user_group(other.id),{'type':'private-message','sender':person(p,other),'text':m.text,'id':m.id,'at':m.created.timestamp()})
            elif kind=='gift':
                item=body.get('item');placed=sum(1 for a in [*p.playerhouse.layout,*p.playerhouse.yard_layout,*p.playerhouse.upstairs_layout] if a['item']==item)
                if item not in ITEMS or p.inventory.get(item,0)<=placed:fail('Only an unplaced item from your inventory can be given.')
                other=PlayerGameProfile.objects.select_for_update().get(pk=other.id);p.inventory[item]-=1;other.inventory[item]=other.inventory.get(item,0)+1;p.save(update_fields=['inventory']);other.save(update_fields=['inventory']);PlayerGift.objects.create(sender=p,recipient=other,item=item);notify(other,p.name+' sent you '+ITEMS[item]['label']+'.')
            elif kind=='invite':
                own=p.playerhouse
                if not own.permissions.get('invitations',True) or own.visibility=='private' or not own.opened:fail('Open your home to invited visitors before inviting.')
                if not Invitation.objects.filter(sender=p,recipient=other,house=own,state='pending',expires__gt=timezone.now()).exists():Invitation.objects.create(sender=p,recipient=other,house=own,expires=timezone.now()+timedelta(hours=24))
                fact(p,'invite');
                if Invitation.objects.filter(sender=p).values('recipient').distinct().count()>=2:fact(p,'invite-two')
                notify(other,p.name+' invited you home.')
        elif kind=='accept-invite':
            invite=Invitation.objects.filter(id=target,recipient=p,expires__gt=timezone.now()).first()
            if not invite:fail('This invitation expired.')
            require_house(p,invite.house_id);invite.state='accepted';invite.save();result['visit']=invite.house_id
        elif kind=='guestbook':
            require_house(p,h.owner_id)
            if not permitted(p,h,'guestbook'):raise PermissionDenied('The guestbook is closed.')
            check_rate('guestbook:'+p.id,3,60);GuestbookEntry.objects.create(house=h,author=p,text=text(body.get('text')));notify(h.owner,p.name+' left a guestbook message.');changed=True
        elif kind=='delete-guestbook':
            entry=GuestbookEntry.objects.filter(id=target,house=h).first()
            if not entry or (p.id!=h.owner_id and p.id!=entry.author_id):raise PermissionDenied('This entry cannot be removed by you.')
            entry.delete();changed=True
        elif kind=='favorite':
            require_house(p,h.owner_id);p.favorites=[x for x in p.favorites if x!=h.owner_id] if h.owner_id in p.favorites else [*p.favorites,h.owner_id];p.save(update_fields=['favorites'])
        elif kind=='pet-settings':
            pet=PetGameProfile.objects.filter(id=target,owner=p).first()
            if not pet:raise PermissionDenied('Only the pet’s owner can change virtual preferences.')
            sprite=body.get('sprite')
            if sprite not in CATALOG['cats']:fail('Choose an available cat appearance.')
            pet.sprite=sprite;pet.favorite_food=str(body.get('food',''))[:80];pet.favorite_toy=str(body.get('toy',''))[:80];pet.save();changed=True
        elif kind=='claim':
            q=next((q for q in QUESTS if q['id']==target),None)
            if not q or target in p.claimed or not all(f in p.facts for f in q['facts']):fail('This reward is unavailable or already claimed.')
            p.wallet+=q['reward'];p.claimed=[*p.claimed,target]
            if q.get('item'):p.inventory[q['item']]=p.inventory.get(q['item'],0)+1
            p.save(update_fields=['wallet','claimed','inventory'])
        elif kind=='profile':
            if body.get('appearance') not in CATALOG['players']:
                from .models import PlayerCharacter
                if not PlayerCharacter.objects.filter(pk=body.get('appearance'),owner=p).exists():fail('Choose an available appearance.')
            from .abilities import cancel as cancel_ability
            if p.appearance!=body['appearance']:cancel_ability(p)
            p.appearance=body['appearance'];p.visible=body.get('visible') is True;p.quiet=body.get('quiet') is True;p.save(update_fields=['appearance','visible','quiet']);broadcast(user_group(p.id),{'type':'identity-changed'})
            for visit in HouseVisitor.objects.filter(player=p):broadcast(group(room_key(visit.house_id,visit.zone)),{'type':'player.identity','person':person(p,p)})
            own=p.playerhouse;broadcast(group(hub_id(p.sample,(own.community_slot or 0)//4)),{'type':'house.changed'})
        elif kind=='fact':
            if target not in ['friends-panel','decorate']:fail('Unknown interface event.')
            fact(p,target)
        elif kind=='photo':
            require_house(p,h.owner_id);image=body.get('image','')
            if not isinstance(image,str) or len(image)>1500000 or not image.startswith('data:image/png;base64,'):fail('Provide a PNG game photograph under 1 MB.')
            try:raw=base64.b64decode(image.split(',',1)[1],validate=True)
            except Exception:fail('Invalid PNG image.')
            if not raw.startswith(b'\x89PNG\r\n\x1a\n'):fail('Invalid PNG image.')
            GamePhoto.objects.create(owner=p,image=image,caption=text(body.get('caption','A moment at home'),100))
            old=list(GamePhoto.objects.filter(owner=p).order_by('-created').values_list('id',flat=True)[12:]);GamePhoto.objects.filter(id__in=old).delete()
            present=HouseVisitor.objects.filter(house=h,updated__gt=timezone.now()-timedelta(seconds=35)).values('player_id').distinct().count()
            if present>=3 and p.id==h.owner_id:fact(p,'group-photo')
        elif kind=='clear-notifications':p.notifications=[];p.save(update_fields=['notifications'])
        elif kind=='kick':
            if h.owner_id!=p.id:raise PermissionDenied('Only the owner can remove a visitor.')
            if not isinstance(target,str) or target==p.id or not PlayerGameProfile.objects.filter(id=target).exists():fail('Choose a visiting player.')
            cache.set('kick:'+p.id+':'+str(target),True,3600);broadcast(user_group(target),{'type':'kicked','owner':p.id})
        else:fail('Unknown game action.')
        if changed:
            rooms=[h.owner_id,room_key(h.owner_id,'yard'),room_key(h.owner_id,'upstairs')]
            if not is_hub(h):rooms.append(hub_id(h.owner.sample,(h.community_slot or 0)//4))
            for room in rooms:
                cache.delete('layout:'+room)
                broadcast(group(room),{'type':'house.changed','revision':h.revision,'yardRevision':h.yard_revision})
        ActionReceipt.objects.create(owner=p,key=key,result=result)
        return result
