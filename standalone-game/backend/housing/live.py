import asyncio,time,math
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from django.core.cache import cache
from django.db.models import Q
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework.exceptions import APIException
from .auth import decode_ticket
from .service import *
from .geometry import blocked,route
from .spatial import get_navigation as Navigation
from . import interactions,abilities,environment
from .meme_cooldowns import MEME_IDS, reserve as reserve_meme, status as meme_status

@database_sync_to_async
def join_player(ticket,owner,channel,entry='door'):
    with transaction.atomic():
        p=provision(ticket)
        h=require_house(p,owner);zone=getattr(h,'_zone','interior');room=room_key(h.owner_id,zone)
        h=PlayerHouse.objects.select_for_update().select_related('owner').get(owner_id=h.owner_id);h._zone=zone;h._entry=entry if entry in ['stairs','reset'] else 'door'
        if not can_enter(p,h) or cache.get('kick:'+h.owner_id+':'+p.id):raise PermissionDenied('You cannot enter this home.')
        HouseVisitor.objects.filter(updated__lt=timezone.now()-timedelta(seconds=35)).delete()
        previous_room=HouseVisitor.objects.filter(player=p).first()
        if previous_room:environment.expose(p.id,room_key(previous_room.house_id,previous_room.zone))
        HouseVisitor.objects.filter(player=p).delete()
        if HouseVisitor.objects.filter(house=h,zone=zone).count()>=settings.VISITOR_LIMIT:fail('This home is full. Try again shortly.')
        # Replace a stale socket for this same account in this room.
        for lease in WorldInteraction.objects.filter(player=p,phase__in=['perform','held']):
            lease.phase='cancelled';lease.expires=timezone.now();lease.save(update_fields=['phase','expires'])
            broadcast(group(room_key(lease.house_id,lease.zone)),interactions.event(lease,'interaction.released'))
        HouseVisitor.objects.filter(player=p).delete();HouseVisitor.objects.create(house=h,player=p,channel=channel,zone=zone)
        fact(p,'enter')
        if p.id!=h.owner_id:fact(p,'visit');notify(h.owner,p.name+' is visiting your home.')
        if HouseVisitor.objects.filter(house=h).values('player_id').distinct().count()>=3:fact(h.owner,'gather')
        messages=[dict(id=m.id,sender=person(m.sender,p),text=m.text,at=m.created.timestamp()) for m in SocialMessage.objects.filter(house=h,zone=zone,recipient__isnull=True).select_related('sender').order_by('-created')[:40] if not blocked_users(p.id,m.sender_id)]
        poses={r.player_id:r.payload['pose'] for r in WorldInteraction.objects.filter(house=h,zone=zone,phase='held',expires__gt=timezone.now()) if r.payload.get('pose')}
        ability_state=abilities.cancel(p)
        environment.visit(p.id,room)
        return dict(environment=environment.status(p,h),abilities=ability_state,poses=poses,id=p.id,owner=room,person=person(p,p),house=house_data(p,h),messages=list(reversed(messages)),memeCooldowns=meme_status(p.id))
@database_sync_to_async
def validate_live(player_id,owner,event,position):
    with transaction.atomic():
        p=PlayerGameProfile.objects.select_for_update().get(pk=player_id);h=require_house(p,owner);zone=getattr(h,'_zone','interior');h=PlayerHouse.objects.select_for_update().get(pk=h.pk);h._zone=zone
        if cache.get('kick:'+h.owner_id+':'+player_id):raise PermissionDenied('The owner has removed you from this home.')
        HouseVisitor.objects.filter(player=p,house=h).update(updated=timezone.now())
        kind=str(event.get('type',''))
        if kind.startswith('interaction.'):
            return interactions.handle(p,h,zone,event,position)
        if kind=='terrain.work':
            check_rate('terrain-work:'+p.id,4,2)
            result=environment.work(p,h,zone,event,position)
            return result or dict(type='terrain.unchanged',id=p.id)
        if kind=='player.chat':
            if not permitted(p,h,'chat'):raise PermissionDenied('House chat is disabled.')
            check_rate('chat:'+p.id,8,20);m=SocialMessage.objects.create(sender=p,house=h,zone=zone,text=text(event.get('text')))
            return dict(type=kind,id=m.id,player=person(p,p),text=m.text,at=m.created.timestamp())
        if kind=='player.cat-sound':
            from .immersion import CAT_EMOTES
            if event.get('emote') not in CAT_EMOTES:fail('Choose an available cat sound.')
            check_rate('cat-sound:'+p.id,1,3)
            return dict(type=kind,id=p.id,emote=event['emote'],x=position['x'],y=position['y'],at=time.time())
        if kind=='player.meme':
            if event.get('meme') not in MEME_IDS:fail('Choose an available cat meme.')
            accepted,cooldowns=reserve_meme(p.id,event['meme'])
            if not accepted:return dict(type='player.meme-cooldown',accepted=False,meme=event['meme'],cooldowns=cooldowns)
            return dict(type=kind,id=p.id,meme=event['meme'],x=position['x'],y=position['y'],at=time.time(),cooldowns=cooldowns)
        if kind=='player.ability-stop':
            return dict(type=kind,id=p.id,abilities=abilities.cancel(p),at=time.time())
        if kind=='player.emote':
            identity=event.get('emote')
            if identity not in ['wave','heart','laughing','happy','sad','surprised','confused','sleepy','dance','clap','cheer','paw','angry','float','tired','sick','car','power_up','jetpack','rescue_dash','gentle_approach']:fail('Choose an available reaction.')
            if identity in abilities.DEFINITIONS:
                if WorldInteraction.objects.filter(player=p,phase__in=['perform','held'],expires__gt=timezone.now()).exists():fail('Finish the current interaction before using an ability.')
                accepted,state=abilities.activate(p,identity)
                if not accepted:return dict(type='player.ability-state',id=p.id,abilities=state,accepted=False,text='This ability is cooling down.')
            else:
                check_rate('emote:'+p.id,1,2)
                state=abilities.cancel(p)
            if HouseVisitor.objects.filter(house=h).exclude(player=p).exists():fact(p,'greet')
            return dict(type=kind,id=p.id,emote=identity,abilities=state,durationMs=abilities.DEFINITIONS.get(identity,{}).get('durationMs'),at=time.time())
        if kind=='pet.interact':
            aid=event.get('actionId')
            if not isinstance(aid,str) or not 8<=len(aid)<=80:fail('Choose the care action again.')
            receipt=cache.get('pet-action:'+p.id+':'+aid)
            if receipt:return receipt
            if zone!='interior':fail('Resident pets are on the ground floor. Go downstairs to offer care.')
            action=event.get('action');pet=PetGameProfile.objects.select_for_update().filter(id=event.get('pet'),owner_id=h.owner_id).first()
            if not pet or action not in ['meet','pet','feed','water','play','help','show']:fail('This pet action is unavailable.')
            if not permitted(p,h,'help' if action=='help' else 'pets'):raise PermissionDenied('The owner has disabled this pet action for visitors.')
            state=pet_state(pet,h)
            if action in ['meet','show']:
                fact(p,'meet-pet')
                if action=='show' and HouseVisitor.objects.filter(house=h).exclude(player=p).exists():fact(p,'show-pet')
                return dict(type='pet.updated',pet=state)
            if math.hypot(position['x']-state['x'],position['y']-state['y'])>85:fail('Walk closer to the pet first.')
            if state.get('elevation',0)>12:fail('Let this pet come down from its perch before offering care.')
            if state['state']=='sleep':fail('Let this pet sleep. Try again when it wakes.')
            supply=event.get('supply')
            if action in ['feed','water'] and not supply:
                keys=['cat-food','dog-food','fish-treats','pet-snack'] if action=='feed' else ['water-bottle']
                supply=next((key for key in keys if p.supplies.get(key,0)>0),None)
                if not supply:fail('Get food or water from the care shop before offering it.')
            if supply:
                from .immersion import SUPPLY_ACTIONS
                if SUPPLY_ACTIONS.get(supply)!=action or p.supplies.get(supply,0)<1:fail('This item is unavailable for that care action.')
            now=time.time();key=action+':'+p.id
            cooldown=3600 if action in ['feed','water','help'] else 45
            if now-pet.last_care.get(key,0)<cooldown:fail('This care is already complete. Let the pet rest.')
            # One need per pet, regardless of how many visitors are present.
            if action in ['feed','water','help'] and now-pet.last_care.get('need:'+action,0)<3600:fail('Someone already helped with that need.')
            if action in ['water','help'] and not any('water-bowl' in a['item'] for a in h.layout):fail('Place a water bowl before refilling this need.')
            if action=='feed' and not any('food-bowl' in a['item'] for a in h.layout):fail('Place a food bowl before feeding.')
            if action in ['water','help'] and now-max(pet.last_care.get('need:water',0),pet.last_care.get('need:help',0))<3600:fail('The water need was already met.')
            if action in ['water','help']:pet.last_care['need:water']=now;pet.last_care['need:help']=now
            if supply:
                p.supplies={**p.supplies,supply:p.supplies[supply]-1};p.save(update_fields=['supplies'])
            pet.last_care[key]=now;pet.last_care['need:'+action]=now;pet.friendship=min(1000,pet.friendship+3)
            pet.activity={'pet':'petted','feed':'eat','water':'drink','play':'play','help':'happy'}[action]
            pet.memories=([dict(text=p.name+' offered virtual '+action,at=now)]+pet.memories)[:30];pet.save()
            if action in ['feed','water']:
                from .needs import satisfy
                satisfy(pet,'food' if action=='feed' else 'water')
            if action=='feed':fact(p,'feed')
            if action=='water' and p.id!=owner:fact(p,'water-friend')
            if action=='help' and p.id!=owner:fact(p,'water-friend')
            # No per-click currency. Optional social quest claims are the only rewards.
            response=dict(type='pet.updated',pet=pet_state(pet,h),actor=p.id,action=action,actionId=aid)
            cache.set('pet-action:'+p.id+':'+aid,response,3600)
            return response
        if kind=='furniture.interact':fail('Choose an action from this object to interact.')
        fail('Unknown room event.')
@database_sync_to_async
@transaction.atomic
def room_tick(owner):
    base,_,zone=owner.partition('|');h=PlayerHouse.objects.select_for_update().select_related('owner').get(owner_id=base)
    from .companions import resident_pets
    pets=[pet_state(p,h) for p in resident_pets(h,zone or 'interior')] if not is_hub(h) else [pet_state(p,h) for p in PetGameProfile.objects.filter(current_room=owner)]
    for p in pets:
        if p['state']=='sleep' and any('bed' in a['item'] for a in h.layout):transaction.on_commit(lambda:fact(h.owner,'pet-bed'))
    from .immersion import conditions
    zone=zone or 'interior';now=timezone.now()
    layout={a['id']:a for a in active_layout(h,zone)}
    for lease in WorldInteraction.objects.filter(house=h,zone=zone,phase__in=['perform','held'],expires__gt=now).select_related('player'):
        if layout.get(lease.target)!=lease.payload.get('revision') or not permitted(lease.player,h,'furniture'):
            lease.expires=now-timedelta(seconds=1);lease.save(update_fields=['expires'])
    expired=list(WorldInteraction.objects.filter(house=h,zone=zone,phase__in=['perform','held'],expires__lt=now).values('player_id','action_id'))
    WorldInteraction.objects.filter(house=h,zone=zone,phase__in=['perform','held'],expires__lt=now).update(phase='expired')
    return dict(type='pets.tick',pets=pets,world=conditions(),objectStates=interactions.states(h,zone),expired=expired,at=time.time())
@database_sync_to_async
def allowed(player,owner):
    p=PlayerGameProfile.objects.get(pk=player);h=PlayerHouse.objects.get(pk=owner.split('|')[0])
    return can_enter(p,h) and not cache.get('kick:'+h.owner_id+':'+player)

class HomeConsumer(AsyncJsonWebsocketConsumer):
    player=None;owner=None
    async def connect(self):
        headers=dict(self.scope['headers']);origin=headers.get(b'origin',b'').decode()
        if origin not in settings.GAME_ORIGINS:await self.close(code=4403);return
        await self.accept();self.auth_timer=asyncio.create_task(self.auth_timeout())
    async def auth_timeout(self):
        await asyncio.sleep(8)
        if not self.player:await self.close(code=4401)
    async def receive_json(self,content,**kwargs):
        try:
            if not isinstance(content,dict) or len(str(content))>4096:raise ValidationError('Invalid room message.')
            if not self.player:
                if content.get('type')!='auth':raise PermissionDenied('Authenticate first.')
                ticket=decode_ticket(content.get('ticket',''));joined=await join_player(ticket,str(content.get('house','me')),self.channel_name,str(content.get('entry','door')))
                self.player=joined['id'];self.owner=joined['owner'];self.identity=joined['person'];self.expires=ticket['exp']
                self.zone=joined['house']['zone'];self.width=joined['house']['width'];self.height=joined['house']['height']
                sx,sy=joined['house']['spawn'];spawn=dict(x=float(sx),y=float(sy),direction='down',walking=False)
                self.position=spawn if content.get('entry') in ['stairs','reset'] else cache.get('last-position:'+self.owner+':'+self.player,spawn)
                nav=Navigation(joined['house']['activeLayout'],self.owner.startswith('system:hub'),self.zone,joined['house']['interiorPreset'],joined['house'].get('objectStates',{}))
                if not (32<self.position['x']<(self.width-1)*32 and 32<self.position['y']<(self.height-1)*32) or not nav.clear([self.position['x'],self.position['y']]):self.position=spawn
                self.last_move=time.monotonic();self.last_guard=0
                self.room=group(self.owner);self.personal=user_group(self.player)
                await self.channel_layer.group_add(self.room,self.channel_name);await self.channel_layer.group_add(self.personal,self.channel_name)
                await self.channel_layer.group_send(self.personal,{'type':'game.event','event':{'type':'session.replaced','channel':self.channel_name}})
                previous=cache.get('positions:'+self.owner,{});previous[self.player]={**self.position,'person':self.identity};cache.set('positions:'+self.owner,previous,40)
                await self.send_json({'type':'ready',**joined,'players':previous,'position':self.position,'serverTime':time.time()})
                await self.channel_layer.group_send(self.room,{'type':'game.event','event':{'type':'player.join','player':self.identity,**self.position}})
                self.tick_task=asyncio.create_task(self.tick());return
            if time.time()>self.expires:await self.close(code=4401);return
            now=time.monotonic()
            if now-self.last_guard>5:
                self.last_guard=now
                if not await allowed(self.player,self.owner):await self.close(code=4403);return
            kind=content.get('type')
            if kind=='player.move':
                dt=now-self.last_move
                if dt<.075:return
                x=content.get('x');y=content.get('y');direction=content.get('direction')
                if type(x) not in [int,float] or type(y) not in [int,float] or not math.isfinite(x+y) or direction not in ['up','down','left','right']:raise ValidationError('Invalid movement.')
                budget=await database_sync_to_async(abilities.movement_budget)(self.player,dt)
                if not 32<x<(self.width-1)*32 or not 32<y<(self.height-1)*32 or math.hypot(x-self.position['x'],y-self.position['y'])>budget:await self.send_json({'type':'correction',**self.position});return
                # Validate the entire segment, preventing tunneling through furniture.
                layout=cache.get('layout:'+self.owner)
                if layout is None:
                    def room_geometry():
                        h=PlayerHouse.objects.get(pk=self.owner.split('|')[0]);return dict(items=active_layout(h,self.zone),preset=h.interior_preset,states=interactions.states(h,self.zone))
                    layout=await database_sync_to_async(room_geometry)();cache.set('layout:'+self.owner,layout,2)
                nav=Navigation(layout['items'],self.owner.startswith('system:hub'),self.zone,layout['preset'],layout.get('states',{}))
                if not nav.clear([self.position['x'],self.position['y']]):
                    safe=nav.nearest([self.position['x'],self.position['y']],128)
                    if safe:self.position={**self.position,'x':safe[0],'y':safe[1]}
                    await self.send_json({'type':'correction',**self.position});return
                if not nav.segment([self.position['x'],self.position['y']],[x,y]):await self.send_json({'type':'correction',**self.position});return
                moved=math.hypot(x-self.position['x'],y-self.position['y'])
                self.position=dict(x=x,y=y,direction=direction,walking=content.get('walking') is True);self.last_move=now
                contact,terrain=await database_sync_to_async(environment.motion)(self.player,self.owner,self.position,moved)
                self.position['environment']=contact
                if terrain:await self.channel_layer.group_send(self.room,{'type':'game.event','event':terrain})
                cache.set('last-position:'+self.owner+':'+self.player,self.position,3600)
                players=cache.get('positions:'+self.owner,{});players[self.player]={**self.position,'person':self.identity};cache.set('positions:'+self.owner,players,40)
                await self.channel_layer.group_send(self.room,{'type':'game.event','event':{'type':'player.move','id':self.player,**self.position,'at':time.time()}})
            elif kind=='ping':
                await database_sync_to_async(environment.visit)(self.player,self.owner)
                await database_sync_to_async(lambda:HouseVisitor.objects.filter(channel=self.channel_name).update(updated=timezone.now()))()
                await database_sync_to_async(lambda:WorldInteraction.objects.filter(player_id=self.player,house_id=self.owner.split('|')[0],phase='held',expires__gt=timezone.now()).update(expires=timezone.now()+timedelta(seconds=30)))()
            else:
                event=await validate_live(self.player,self.owner,content,self.position)
                if event['type']=='player.ability-state':
                    await self.send_json(event);return
                if event['type']=='player.meme-cooldown':
                    await self.send_json(event);return
                if event['type']=='player.meme':
                    await self.send_json(dict(type='player.meme-cooldown',accepted=True,meme=event['meme'],cooldowns=event.pop('cooldowns')))
                await self.channel_layer.group_send(self.room,{'type':'game.event','event':event})
        except (APIException,PlayerHouse.DoesNotExist,ValueError,KeyError) as error:
            await self.send_json({'type':'error','actionId':content.get('actionId'),'text':str(getattr(error,'detail','This action could not be completed.'))})
            if not self.player:await self.close(code=4403)
        except Exception:
            await self.send_json({'type':'error','actionId':content.get('actionId'),'text':'The room could not complete this action. Reconnect to refresh.'})
    async def tick(self):
        try:
            while True:
                await asyncio.sleep(1)
                if time.time()>self.expires:await self.close(code=4401);return
                if not await allowed(self.player,self.owner):await self.close(code=4403);return
                await database_sync_to_async(lambda:HouseVisitor.objects.filter(channel=self.channel_name).update(updated=timezone.now()))()
                if await database_sync_to_async(cache.add)('tick:'+self.owner,True,1):
                    await self.channel_layer.group_send(self.room,{'type':'game.event','event':await room_tick(self.owner)})
        except asyncio.CancelledError:pass
    async def game_event(self,event):
        value=event['event']
        if value['type']=='session.replaced':
            if value['channel']!=self.channel_name:await self.close(code=4410)
            return
        if value['type']=='player.identity' and value['person']['id']==self.player:self.identity=value['person']
        if value['type'] in ['player.chat','player.join','player.move','player.emote','player.ability-stop','player.cat-sound','player.meme','furniture.interact','interaction.started','interaction.completed','interaction.released']:
            other=value.get('player',{}).get('id') or value.get('id')
            if other and await database_sync_to_async(blocked_users)(self.player,other):return
        await self.send_json(value)
    async def disconnect(self,code):
        if hasattr(self,'auth_timer'):self.auth_timer.cancel()
        if hasattr(self,'tick_task'):self.tick_task.cancel()
        if self.player:
            owns_connection=await database_sync_to_async(lambda:HouseVisitor.objects.filter(channel=self.channel_name,player_id=self.player).exists())()
            await self.channel_layer.group_discard(self.room,self.channel_name);await self.channel_layer.group_discard(self.personal,self.channel_name)
            if not owns_connection:return
            def end_ability():
                with transaction.atomic():
                    p=PlayerGameProfile.objects.select_for_update().get(pk=self.player);abilities.cancel(p)
            await database_sync_to_async(end_ability)()
            for event in await database_sync_to_async(interactions.release)(self.player,self.owner):
                await self.channel_layer.group_send(self.room,{'type':'game.event','event':event})
            await database_sync_to_async(lambda:HouseVisitor.objects.filter(channel=self.channel_name).delete())()
            players=cache.get('positions:'+self.owner,{});players.pop(self.player,None);cache.set('positions:'+self.owner,players,40)
            await self.channel_layer.group_send(self.room,{'type':'game.event','event':{'type':'player.leave','id':self.player}})
