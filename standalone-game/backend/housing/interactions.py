"""Transactional, idempotent world actions. No platform rewards are granted here."""
import math,time
from datetime import timedelta
from django.utils import timezone
from rest_framework.exceptions import ValidationError,PermissionDenied
from .models import WorldInteraction,PlayerHouse,PlayerGameProfile
from .geometry import ITEMS,definition as furniture_definition
from .spatial import get_navigation as Navigation,point,rect
from .community import active_layout,is_hub
def supply_for(action,p):
    keys=['cat-food','dog-food','fish-treats','pet-snack'] if action=='fill_food' else ['water-bottle'] if action in ['fill_water','water_plant','care_aquarium'] else []
    return next((k for k in keys if p.supplies.get(k,0)>0),keys[0] if keys else None)

DURATIONS={'inspect':.7,'sit':.4,'rest':.5,'fill_food':1.4,'fill_water':1.4,'water_plant':1.5,'care_aquarium':2.,'toggle_light':.35,'toggle_door':.35,'encourage_climb':1.}

def states(h,zone):return {key.split(':',1)[1]:value for key,value in h.object_states.items() if key.startswith(zone+':')}

def event(row,kind):return dict(type=kind,id=row.player_id,actionId=row.action_id,target=row.target,action=row.action,**row.payload)

def release(player,room,action_id=None):
    base,_,zone=room.partition('|');zone=zone or 'interior'
    rows=WorldInteraction.objects.filter(player_id=player,house_id=base,zone=zone,phase__in=['perform','held'])
    if action_id:rows=rows.filter(action_id=action_id)
    result=[]
    for row in rows:
        row.phase='cancelled';row.expires=timezone.now();row.save(update_fields=['phase','expires']);result.append(event(row,'interaction.released'))
    return result

def handle(p,h,zone,request,position):
    from .service import permitted
    # The caller holds a transaction; this house lock serializes seat and bowl claims.
    h=PlayerHouse.objects.select_for_update().get(pk=h.pk)
    now=timezone.now();kind=request['type'];aid=request.get('actionId')
    if not isinstance(aid,str) or not 8<=len(aid)<=80:raise ValidationError('This action needs a valid identifier. Try again.')
    row=WorldInteraction.objects.filter(player=p,action_id=aid).first()
    if kind=='interaction.cancel':
        rows=release(p.id,h.owner_id+('' if zone=='interior' else '|'+zone),aid)
        return rows[0] if rows else dict(type='interaction.released',id=p.id,actionId=aid)
    if row:
        if row.house_id!=h.pk or row.zone!=zone:raise ValidationError('This action belongs to another room.')
        if row.phase in ['cancelled','expired']:raise ValidationError('That interaction ended. Choose the object again.')
        if row.phase=='complete':return event(row,'interaction.completed')
        if row.phase=='held' and row.expires>now:return event(row,'interaction.completed')
        if row.expires<now:raise ValidationError('That interaction expired. Choose the object again.')
    if not permitted(p,h,'furniture'):raise PermissionDenied('The owner disabled furniture interactions.')
    layout=active_layout(h,zone);piece=next((a for a in layout if a['id']==(row.target if row else request.get('target'))),None)
    if not piece:raise ValidationError('This object moved or was removed. Choose another object.')
    definition=furniture_definition(piece);geometry=definition['geometry'];action=row.action if row else request.get('action')
    if action not in geometry['actions']:raise ValidationError('Choose an available action for this object.')
    if action=='toggle_door' and p.id!=h.owner_id:raise PermissionDenied('Only the owner can change this door.')
    nav=Navigation(layout,is_hub(h),zone,h.interior_preset,states(h,zone))
    if kind=='interaction.begin':
        if row:return event(row,'interaction.started')
        if WorldInteraction.objects.filter(player=p,phase__in=['perform','held'],expires__gt=now).exists():raise ValidationError('Finish or leave your current action first.')
        anchors=[point(piece,a) for a in geometry['approaches']]
        if not any(math.dist([position['x'],position['y']],a)<34 and nav.segment([position['x'],position['y']],nav.nearest(a,16) or a) for a in anchors):raise ValidationError('Walk to an open side of the object first.')
        slot='';pose=dict(animation={'fill_food':'feed','fill_water':'refill_water','water_plant':'refill_water','care_aquarium':'clean'}.get(action,'inspect_furniture'),x=position['x'],y=position['y'],groundY=position['y'],facing=position['direction'],item=piece['id'],actionId=aid)
        exit=nav.nearest([position['x'],position['y']],32)
        if action in ['sit','rest']:
            from django.core.cache import cache
            if any(cache.get('perch:'+h.owner_id+':'+piece['id']+'/'+a['id']) for a in geometry['surfaces']):raise ValidationError('An animal is resting here. Choose another seat.')
            taken=set(WorldInteraction.objects.filter(house=h,zone=zone,target=piece['id'],phase__in=['perform','held'],expires__gt=now).values_list('slot',flat=True))
            seat=next((a for a in geometry['seats'] if a['id'] not in taken),None)
            if not seat:raise ValidationError('This seat is occupied. Try another one.')
            slot=seat['id'];q=point(piece,seat['point']);facing=['down','left','up','right'][(['down','left','up','right'].index(seat['facing'])+piece.get('rotation',0)//90)%4]
            pose=dict(animation='sleep' if action=='rest' else 'sit',x=q[0],y=q[1]-seat['elevation'],groundY=max((r[1]+r[3] for r in [rect(piece,r) for r in geometry['ground']]),default=piece['y']*32+32)+1,facing=facing,item=piece['id'],actionId=aid)
        supply=supply_for(action,p)
        # Supplies are virtual housing inventory, never the verified reward ledger.
        if supply and p.supplies.get(supply,0)<1:raise ValidationError('Get '+supply+' from the care supplies shop first.')
        if WorldInteraction.objects.filter(house=h,zone=zone,target=piece['id'],phase='perform',expires__gt=now).exists() and action not in ['sit','rest','inspect']:raise ValidationError('Someone is using this object. Try again shortly.')
        payload=dict(duration=DURATIONS[action],started=time.time(),exit=exit,pose=pose,revision=piece,objectState=states(h,zone).get(piece['id'],{}))
        row=WorldInteraction.objects.create(player=p,house=h,zone=zone,target=piece['id'],action_id=aid,slot=slot,action=action,expires=now+timedelta(seconds=30),payload=payload)
        return event(row,'interaction.started')
    if kind!='interaction.complete' or not row:raise ValidationError('Start the action before completing it.')
    if piece!=row.payload['revision']:raise ValidationError('This object moved. Please approach it again.')
    if time.time()<row.payload['started']+row.payload['duration']-.1:raise ValidationError('Give this action a moment to finish.')
    key=zone+':'+piece['id'];state=dict(h.object_states.get(key,{}));action=row.action
    supply=supply_for(action,p)
    if supply:
        if p.supplies.get(supply,0)<1:raise ValidationError('Your '+supply+' supply is empty.')
        last=state.get({'fill_food':'filledFoodAt','fill_water':'filledWaterAt','water_plant':'wateredAt','care_aquarium':'cleanedAt'}[action],0)
        if time.time()-last<30:raise ValidationError('This object was just cared for. Give it a moment.')
        if action=='fill_food' and state.get('food',0)>=3 or action=='fill_water' and state.get('water',0)>=3:raise ValidationError('This bowl is already full.')
        p.supplies={**p.supplies,supply:p.supplies[supply]-1};p.save(update_fields=['supplies'])
    if action=='fill_food':state.update(food=3,filledFoodAt=time.time())
    elif action=='fill_water':state.update(water=3,filledWaterAt=time.time())
    elif action=='water_plant':state.update(wateredAt=time.time())
    elif action=='care_aquarium':state.update(cleanedAt=time.time())
    elif action=='toggle_light':state['lit']=not state.get('lit',True)
    elif action=='toggle_door':
        opening=not state.get('open',False)
        if not opening:
            from django.core.cache import cache
            from .spatial import overlaps
            people=cache.get('positions:'+h.owner_id+('' if zone=='interior' else '|'+zone),{})
            from .models import PetGameProfile
            for pet in PetGameProfile.objects.filter(owner_id=h.pk):
                memory=cache.get('pet:'+h.owner_id+':'+pet.id)
                if memory:people['pet:'+pet.id]=memory
            if any(overlaps([v['x']-5,v['y']-6,10,6],rect(piece,r)) for v in people.values() for r in geometry['ground']):raise ValidationError('Wait until the doorway is clear before closing it.')
        state['open']=opening
    if state:
        state['revision']=state.get('revision',0)+1;h.object_states={**h.object_states,key:state};h.save(update_fields=['object_states'])
        from django.core.cache import cache
        cache.delete('layout:'+h.owner_id+('' if zone=='interior' else '|'+zone))
    if action=='encourage_climb':
        from django.core.cache import cache
        from .models import PetGameProfile
        pet=PetGameProfile.objects.filter(owner_id=h.pk).first()
        if pet:
            memory=cache.get('pet:'+h.owner_id+':'+pet.id)
            if memory and not memory.get('surface'):
                for surface in geometry['surfaces']:
                    sid=piece['id']+'/'+surface['id'];q=nav.nearest(point(piece,surface['approach']),16)
                    if q and cache.add('perch:'+h.owner_id+':'+sid,pet.id,60):
                        memory.update(state='climb',support=piece['id'],supportPiece=piece,pendingSurface=surface,surface=sid,descent=q,route=nav.path([memory['x'],memory['y']],q),until=time.time()+20)
                        cache.set('pet:'+h.owner_id+':'+pet.id,memory,3600);break
    row.phase='held' if action in ['sit','rest'] else 'complete';row.payload={**row.payload,'pose':row.payload.get('pose') if row.phase=='held' else None,'objectState':state,'supplies':p.supplies};row.save(update_fields=['phase','payload'])
    return event(row,'interaction.completed')
