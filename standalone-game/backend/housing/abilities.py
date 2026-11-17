"""Transient gameplay abilities with durable per-account cooldowns and server speed budgets."""
import json,time,math
from pathlib import Path
from .models import PlayerGameProfile,PlayerCharacter
from django.core.cache import cache
RULES_PATH=Path(__file__).resolve().parents[2]/'src/game/abilities/definitions.json'
RULES=json.loads(RULES_PATH.read_text())
DEFINITIONS=RULES['abilities']
def _read(player,now):
    value=player.ability_state if isinstance(player.ability_state,dict) else {}
    active=value.get('active')
    recent=[row for row in value.get('recent',[]) if isinstance(row,dict) and row.get('end',0)>now-2][-8:]
    if active and active.get('end',0)<=now:recent.append(active);active=None
    return {'active':active,'recent':recent,'cooldowns':{k:v for k,v in value.get('cooldowns',{}).items() if k in DEFINITIONS and isinstance(v,(int,float)) and v>now}}
def _save(player,value):
    player.ability_state=value;player.save(update_fields=['ability_state'])
    cache.set('game-abilities:'+player.pk,{'state':value,'appearance':player.appearance},60)
def _status(value,now):
    active=value['active']
    return {'active':{'id':active['id'],'remainingMs':max(0,math.ceil((active['end']-now)*1000)),'boosted':active.get('boosted',False)} if active else None,'cooldownsMs':{key:max(0,math.ceil((value['cooldowns'].get(key,0)-now)*1000)) for key in DEFINITIONS}}
def status(player):return _status(_read(player,time.time()),time.time())
def cancel(player):
    now=time.time();value=_read(player,now)
    if value['active']:
        value['recent'].append({**value['active'],'end':now});value['active']=None
    _save(player,value);return _status(value,now)
def activate(player,identity):
    now=time.time();value=_read(player,now);definition=DEFINITIONS[identity]
    if value['cooldowns'].get(identity,0)>now:return False,_status(value,now)
    boosted=True
    if identity=='power_up':
        character=PlayerCharacter.objects.filter(pk=player.appearance,owner=player).first()
        parts=(character.appearance.get('parts') or {}) if character else {}
        boosted=parts.get('outfit')=='gi' and parts.get('hair')=='hero-spikes' and parts.get('headwear') in (None,'none','halo')
    if value['active']:value['recent'].append({**value['active'],'end':now})
    value['active']={'id':identity,'start':now,'end':now+definition['durationMs']/1000,'boosted':boosted,'appearance':player.appearance}
    value['cooldowns'][identity]=now+definition['cooldownMs']/1000
    _save(player,value);return True,_status(value,now)
def movement_budget(player_id,seconds):
    saved=cache.get('game-abilities:'+player_id)
    if saved is None:
        player=PlayerGameProfile.objects.only('ability_state','appearance').get(pk=player_id)
        saved={'state':player.ability_state or {},'appearance':player.appearance};cache.set('game-abilities:'+player_id,saved,60)
    now=time.time();seconds=max(0,min(seconds,1));start=now-seconds;base=RULES['runSpeed'];budget=base*seconds
    value=saved['state'];records=[*value.get('recent',[]),*([value['active']] if value.get('active') else [])]
    for row in records:
        if row.get('id') not in DEFINITIONS:continue
        overlap=max(0,min(now,row['end'])-max(start,row['start']))
        speed=DEFINITIONS[row['id']]['speed'] if row.get('boosted') else base
        if row.get('appearance')!=saved['appearance']:speed=base
        budget+=(speed-base)*overlap
    return max(0,budget)+20
