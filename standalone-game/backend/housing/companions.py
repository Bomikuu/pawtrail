"""Account-linked virtual companions. Membership and game position never alter platform ownership/GPS."""
import math,time
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.core.cache import cache
from rest_framework.exceptions import ValidationError,PermissionDenied
from .models import PetGameProfile,PlayerGameProfile,AnimalCareQuest,ActionReceipt
from . import needs
STORY={'story:neighborhood','story:shelter','story:garden','story:riverside'}

def room_for(player,value):
    from .service import require_house
    from .community import room_key
    if value in STORY:return value,None
    h=require_house(player,value or 'me');return room_key(h.owner_id,getattr(h,'_zone','interior')),h

def public_pet(pet):
    return dict(id=pet.id,profile=pet.snapshot,sprite=pet.sprite,owner=pet.owner_id,following=pet.following_id,room=pet.current_room or pet.owner_id,command=pet.command,position=pet.game_position or {**{key:cache.get('pet:'+pet.owner_id+':'+pet.id,{}).get(key,80) for key in ['x','y']},'room':pet.current_room or pet.owner_id},needs=needs.values(pet),friendship=pet.friendship)

def resident_pets(h,zone):
    room=h.owner_id+('' if zone=='interior' else '|'+zone)
    return PetGameProfile.objects.filter(Q(owner_id=h.owner_id,current_room='',following__isnull=True) if zone=='interior' else Q(pk__in=[]))|PetGameProfile.objects.filter(current_room=room)

def roster(player,value):
    room,h=room_for(player,value);owned=list(PetGameProfile.objects.filter(owner=player));visitors=list(resident_pets(h,getattr(h,'_zone','interior'))) if h else []
    all_pets={pet.id:pet for pet in [*owned,*visitors]}
    for pet in all_pets.values():needs.advance(pet)
    return dict(player=player.id,room=room,animals=[public_pet(p) for p in all_pets.values()],order=player.companion_order,quests=needs.quests(player),maximum=3,wallet=player.wallet,supplies=player.supplies)

@transaction.atomic
def command(player,body,key):
    from .service import permitted
    from .community import active_layout,is_hub
    from .spatial import get_navigation
    p=PlayerGameProfile.objects.select_for_update().get(pk=player.pk)
    if not isinstance(key,str) or not 8<=len(key)<=100:raise ValidationError('Try this command again with a valid action identifier.')
    old=ActionReceipt.objects.filter(owner=p,key=key).first()
    if old:return old.result
    room,h=room_for(p,body.get('room','me'));kind=body.get('action');pet=None
    if kind=='order':
        order=body.get('order');allowed=set(PetGameProfile.objects.filter(owner=p).values_list('id',flat=True))
        if not isinstance(order,list) or len(order)>100 or len(set(order))!=len(order) or any(i not in allowed for i in order):raise ValidationError('Choose animals in your own roster.')
        p.companion_order=order;p.save(update_fields=['companion_order'])
    elif kind=='positions':
        rows=body.get('positions',[])
        if not isinstance(rows,list) or len(rows)>3:raise ValidationError('Send up to three companion positions.')
        for row in rows:
            pet=PetGameProfile.objects.select_for_update().filter(pk=row.get('id'),following=p,current_room=room).first()
            point=row.get('point')
            if not pet or not isinstance(point,list) or len(point)!=2 or any(type(v) not in [int,float] or not math.isfinite(v) or not 32<=v<=4096 for v in point):continue
            previous=pet.game_position;dt=min(2,max(.1,time.time()-previous.get('at',0)))
            if previous.get('room')==room and math.dist([previous.get('x',point[0]),previous.get('y',point[1])],point)>180*dt+24:continue
            if h:
                from .interactions import states
                nav=get_navigation(active_layout(h,getattr(h,'_zone','interior')),is_hub(h),getattr(h,'_zone','interior'),h.interior_preset,states(h,getattr(h,'_zone','interior')))
                if not nav.clear(point):continue
                if previous.get('room')==room and not nav.segment([previous['x'],previous['y']],point):
                    path=nav.path([previous['x'],previous['y']],point)
                    if not path or sum(math.dist(a,b) for a,b in zip([[previous['x'],previous['y']]]+path,path))>180*dt+24:continue
            pet.game_position=dict(x=point[0],y=point[1],at=time.time(),room=room);pet.save(update_fields=['game_position'])
        return {'ok':True}
    elif kind=='claim':
        q=AnimalCareQuest.objects.select_for_update().filter(pk=str(body.get('quest','')).removeprefix('care:'),owner=p).first()
        if not q or q.state not in ['completed','claimed']:raise ValidationError('Complete this care need before claiming its game reward.')
        if q.state=='completed':
            from django.db.models import Sum
            earned=AnimalCareQuest.objects.filter(owner=p,state='claimed',completed__date=timezone.localdate()).aggregate(value=Sum('reward'))['value'] or 0
            award=min(q.reward,max(0,40-earned));q.reward=award;q.state='claimed';q.save(update_fields=['state','reward']);p.wallet+=award;p.save(update_fields=['wallet'])
    else:
        pet=PetGameProfile.objects.select_for_update().filter(pk=body.get('pet')).first()
        if not pet:raise ValidationError('This animal is no longer in the game roster.')
        owner=pet.owner_id==p.id
        if kind not in ['follow','stay','move','home','feed','water','travel']:raise ValidationError('Choose an available animal action.')
        if kind not in ['feed','water','pet'] and not owner:raise PermissionDenied('Only this animal’s owner can give companion commands.')
        if kind in ['feed','water','pet'] and not owner and (not h or pet.current_room not in ['',room] or not permitted(p,h,'pets')):raise PermissionDenied('Care is unavailable for this animal here.')
        needs.advance(pet)
        if kind=='follow':
            if (pet.current_room or pet.owner_id)!=room:raise ValidationError('Meet this cat in its current space before inviting it along.')
            if pet.snapshot.get('species')!='cat':raise ValidationError('Only cat companions are available in this release.')
            if PetGameProfile.objects.filter(following=p).exclude(pk=pet.pk).count()>=3:raise ValidationError('Three companions are already accompanying you. Return one home first.')
            memory=cache.get('pet:'+pet.owner_id+':'+pet.id,{})
            pet.game_position=dict(x=memory.get('x',80),y=memory.get('y',80),room=room,at=time.time());pet.following=p;pet.current_room=room;pet.command=dict(mode='follow',at=time.time())
        elif kind=='stay':pet.command=dict(mode='stay',at=time.time())
        elif kind=='home':pet.game_position={};pet.following=None;pet.current_room=pet.owner_id;pet.command=dict(mode='home',at=time.time());cache.delete('pet:'+pet.owner_id+':'+pet.id)
        elif kind in ['move','travel']:
            if pet.following_id!=p.id and not (kind=='move' and h and pet.owner_id==h.owner_id and (pet.current_room or pet.owner_id)==room):raise ValidationError('Invite this cat to follow before moving it between spaces.')
            point=body.get('point')
            if not isinstance(point,list) or len(point)!=2 or any(type(v) not in [int,float] or not math.isfinite(v) or not 32<=v<=4096 for v in point):raise ValidationError('Choose an open place in the game.')
            if h:
                from .interactions import states
                nav=get_navigation(active_layout(h,getattr(h,'_zone','interior')),is_hub(h),getattr(h,'_zone','interior'),h.interior_preset,states(h,getattr(h,'_zone','interior')))
                if not nav.clear(point):raise ValidationError('That spot is blocked. Choose an open place.')
            pet.current_room=room;pet.command=dict(mode='follow' if kind=='travel' else 'move',point=point,at=time.time())
            if kind=='travel':pet.game_position=dict(x=point[0],y=point[1],room=room,at=time.time())
        elif kind=='pet':
            if (pet.current_room or pet.owner_id)!=room:raise ValidationError('Meet this animal in its current space first.')
            if time.time()-pet.last_care.get('companion-pet',0)<30:raise ValidationError('Give this cat a little time to rest.')
            pet.last_care={**pet.last_care,'companion-pet':time.time()};pet.friendship=min(1000,pet.friendship+2);pet.activity='petted'
        elif kind in ['feed','water']:
            if (pet.current_room or pet.owner_id)!=room:raise ValidationError('Meet this animal in its current game space first.')
            origin=body.get('point')
            if h:origin=cache.get('positions:'+room,{}).get(p.id)
            if isinstance(origin,dict):origin=[origin.get('x',0),origin.get('y',0)]
            target=pet.game_position if pet.following_id else cache.get('pet:'+pet.owner_id+':'+pet.id,{})
            if not isinstance(origin,list) or len(origin)!=2 or math.dist(origin,[target.get('x',0),target.get('y',0)])>80:raise ValidationError('Walk closer to this animal before offering a serving.')
            cooldown=pet.last_care.get('need:'+kind,0)
            if time.time()-cooldown<60:raise ValidationError('This animal just had a serving. Give it a moment.')
            field='food' if kind=='feed' else 'water'
            if getattr(pet,field)>=90:raise ValidationError('This animal is comfortable. Save the serving for later.')
            keys=['cat-food','fish-treats','pet-snack'] if kind=='feed' else ['water-bottle'];supply=next((s for s in keys if p.supplies.get(s,0)>0),None)
            if not supply:raise ValidationError('Get a suitable game supply from the care shop first.')
            p.supplies={**p.supplies,supply:p.supplies[supply]-1};p.save(update_fields=['supplies']);pet.last_care={**pet.last_care,'need:'+kind:time.time()};pet.activity='eat' if kind=='feed' else 'drink';needs.satisfy(pet,field)
        pet.save()
    result=roster(p,room);ActionReceipt.objects.create(owner=p,key=key,result=result)
    return result
