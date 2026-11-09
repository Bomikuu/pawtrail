"""Low-frequency authoritative animal state machine; elevation is not a floor tile."""
import hashlib,math,time
from django.core.cache import cache
from django.utils import timezone
from .geometry import ITEMS
from .spatial import point,overlaps,rect,get_navigation
from .models import WorldInteraction
from .interactions import states

def release_surface(h,m):
    if m.get('surface'):
        key='perch:'+h.owner_id+':'+m['surface']
        if cache.get(key)==m.get('pet'):cache.delete(key)
    m['surface']=None;m['elevation']=0

def snapshot(pet,house,now=None):
    from . import needs
    needs.advance(pet)
    if pet.following_id:
        pos=pet.game_position
        return dict(id=pet.id,profile=pet.snapshot,sprite=pet.sprite,state=pet.activity if time.time()-max(pet.last_care.values(),default=0)<3 else 'watch' if pet.command.get('mode')=='stay' else 'follow',x=pos.get('x',80),y=pos.get('y',80),following=pet.following_id,owner=pet.owner_id,needs=needs.values(pet),next=None,friendship=pet.friendship,memories=pet.memories[:12],lastCare=pet.last_care,favoriteFood=pet.favorite_food,favoriteToy=pet.favorite_toy)
    now=now or time.time();seed=int(hashlib.sha256(pet.id.encode()).hexdigest()[:8],16);key='pet:'+house.owner_id+':'+pet.id
    nav=get_navigation(house.layout,preset=house.interior_preset,states=states(house,'interior'));m=cache.get(key)
    if not m:
        p=nav.nearest([house.layout[0]['x']*32+64,house.layout[0]['y']*32+80]) if house.layout else nav.nearest([128,128])
        p=p or [80,80];m=dict(pet=pet.id,x=p[0],y=p[1],state='watch',until=now+3,last=now,route=[],elevation=0,surface=None,revision=house.revision)
    m.setdefault('pet',pet.id);m.setdefault('elevation',0);m.setdefault('surface',None)
    if m.get('revision')!=house.revision:
        support=next((a for a in house.layout if a['id']==m.get('support')),None)
        if m.get('support') and support!=m.get('supportPiece'):
            release_surface(house,m);p=nav.nearest([m['x'],m['y']],128) or nav.nearest([80,80]);m.update(x=p[0],y=p[1],transition=None,state='watch',until=now+4)
        m.update(revision=house.revision,route=[])
        if not m.get('surface'):
            p=nav.nearest([m['x'],m['y']],128)
            if p:m.update(x=p[0],y=p[1])
    if m.get('route') and not nav.segment([m['x'],m['y']],m['route'][0]):m.update(route=[],until=now+1)
    command=pet.command
    if command.get('at',0)>m.get('commandAt',0):
        m['commandAt']=command['at'];m['route']=[];m['until']=now+60
        if command.get('mode')=='move':m.update(route=nav.path([m['x'],m['y']],command['point']),state='wander')
        elif command.get('mode')=='stay':m['state']='watch'
    dt=max(0,min(1.2,now-m['last']));m['last']=now
    transition=m.get('transition')
    if transition and now>=transition['started']+transition['duration']:
        m.update(x=transition['to'][0],y=transition['to'][1],elevation=transition['to'][2],transition=None,route=[])
        if transition['kind']=='descend':release_surface(house,m);m.update(state='watch',until=now+5,support=None)
        else:m.update(state='sleep' if seed%3==0 else 'groom' if seed%3==1 else 'sit',until=now+12+seed%15)
    last=max(pet.last_care.values(),default=0)
    if now-last<4 and not m.get('surface') and not m.get('transition'):m.update(state=pet.activity,until=last+4,route=[])
    if now>=m['until'] and command.get('mode')!='stay' and not m.get('transition'):
        if m.get('surface'):
            piece=next((p for p in house.layout if p['id']==m.get('support')),None)
            surfaces=ITEMS[piece['item']]['geometry']['surfaces'] if piece else []
            current=next((s for s in surfaces if m['surface'].endswith('/'+s['id'])),None)
            # High perches descend through linked lower platforms. Ground hops are capped at 24px.
            lower=[s for s in surfaces if current and s['id'] in current['links'] and 0<m['elevation']-s['elevation']<=24]
            upper=[s for s in surfaces if current and current['id'] in s['links'] and 0<s['elevation']-m['elevation']<=24]
            choices=lower if m['elevation']>24 else upper if (seed+int(now//11))%3==0 else []
            destination=None
            for s in choices:
                sid=piece['id']+'/'+s['id']
                if cache.add('perch:'+house.owner_id+':'+sid,pet.id,60):destination=(s,sid);break
            if destination:
                s,sid=destination;q=point(piece,s['point']);cache.delete('perch:'+house.owner_id+':'+m['surface'])
                m.update(surface=sid,state='climb',transition=dict(id=str(now),kind='climb',started=now,duration=.7,**{'from':[m['x'],m['y'],m['elevation']],'to':[q[0],q[1],s['elevation']]}),until=now+1)
            elif m['elevation']>24:m['until']=now+4
            else:
                p=nav.nearest(m.get('descent',[m['x'],m['y']]),96)
                if p:m.update(state='descend',transition=dict(id=str(now),kind='descend',started=now,duration=.7,**{'from':[m['x'],m['y'],m['elevation']],'to':[p[0],p[1],0]}),until=now+1)
                else:m['until']=now+4
        else:
            from .immersion import conditions
            minute=conditions()['minute'];traits=' '.join(pet.snapshot.get('personality',[])).lower()
            choices=['watch','wander','groom','rest','sleep'] if minute<360 or minute>=1200 else ['watch','wander','follow','play','eat','drink','climb','groom','rest','climb']
            if 'shy' in traits:choices+=['rest','watch','sleep']
            if 'play' in traits or 'friendly' in traits:choices+=['follow','play','climb']
            state='drink' if pet.water<30 else 'eat' if pet.food<30 else choices[(seed+int(now//7))%len(choices)];origin=[m['x'],m['y']];goal=None;m.update(support=None,pendingSurface=None)
            if state=='climb' and pet.snapshot.get('species','cat')=='cat':
                candidates=[(piece,s) for piece in house.layout for s in ITEMS[piece['item']]['geometry']['surfaces'] if 'cat' in s['species'] and s['elevation']<=24]
                candidates.sort(key=lambda a:math.dist(origin,point(a[0],a[1]['approach'])))
                for piece,s in candidates:
                    sid=piece['id']+'/'+s['id'];q=nav.nearest(point(piece,s['approach']),16)
                    if not q or math.dist(q,origin)>240:continue
                    if WorldInteraction.objects.filter(house=house,target=piece['id'],phase__in=['perform','held'],expires__gt=timezone.now()).exists():continue
                    if not cache.add('perch:'+house.owner_id+':'+sid,pet.id,60):continue
                    path=nav.path(origin,q)
                    if not path and math.dist(origin,q)>4:cache.delete('perch:'+house.owner_id+':'+sid);continue
                    m.update(support=piece['id'],supportPiece=piece,pendingSurface=s,surface=sid,descent=q,route=path);goal=q;break
                if not goal:state='watch'
            if state in ['eat','drink']:
                kind='food' if state=='eat' else 'water';objects=states(house,'interior')
                piece=next((a for a in house.layout if objects.get(a['id'],{}).get(kind,0)>0 and 'fill_'+kind in ITEMS[a['item']]['geometry']['actions']),None)
                if piece:goal=nav.approach(piece,origin);m['consuming']=dict(piece=piece['id'],kind=kind)
                else:state='wander'
            if state=='follow':
                players=cache.get('positions:'+house.owner_id,{})
                if players:
                    p=next(iter(players.values()));goal=nav.nearest([p['x']+28,p['y']+28])
                else:state='watch'
            if state in ['wander','play']:
                for n in range(8):
                    angle=((seed+int(now//7)*11+n*13)%64)*math.pi/32
                    goal=nav.nearest([m['x']+math.cos(angle)*72,m['y']+math.sin(angle)*72],16)
                    if goal:break
            if state!='climb':m['route']=nav.path(origin,goal) if goal else []
            distance=sum(math.dist(a,b) for a,b in zip([origin]+m['route'],m['route']))
            m.update(state=state,until=now+distance/28+(18 if state in ['rest','sleep'] else 6)+seed%7)
    moving=False;distance=28*dt
    if not m.get('transition'):
        while m['route'] and distance>0:
            q=m['route'][0];dx=q[0]-m['x'];dy=q[1]-m['y'];length=math.hypot(dx,dy)
            if length<=distance:m.update(x=q[0],y=q[1]);m['route'].pop(0);distance-=length
            else:m['x']+=dx/length*distance;m['y']+=dy/length*distance;distance=0
            moving=True
        if not m['route'] and m.get('pendingSurface'):
            s=m.pop('pendingSurface');piece=m['supportPiece'];q=point(piece,s['point'])
            # The intentional surface hop may cross its own collider, never another object or wall.
            own=[rect(piece,r) for r in ITEMS[piece['item']]['geometry']['ground']]
            others=[r for r in nav.rects if r not in own]
            steps=max(1,math.ceil(math.dist([m['x'],m['y']],q)/4))
            safe=all(not any(overlaps([m['x']+(q[0]-m['x'])*i/steps-3,m['y']+(q[1]-m['y'])*i/steps-3,6,6],r) for r in others) for i in range(steps+1))
            if safe:m.update(state='climb',transition=dict(id=str(now),kind='climb',started=now,duration=.7,**{'from':[m['x'],m['y'],0],'to':[q[0],q[1],s['elevation']]}),until=now+1)
            else:release_surface(house,m);m.update(state='watch',until=now+6)
        if not m['route'] and m.get('consuming'):
            use=m.pop('consuming');obj=house.object_states.get('interior:'+use['piece'],{});n=obj.get(use['kind'],0)
            piece=next((p for p in house.layout if p['id']==use['piece']),None)
            close=piece and math.dist([m['x'],m['y']],[piece['x']*32+16,piece['y']*32+32])<70
            approach=nav.approach(piece,[m['x'],m['y']]) if piece else None
            if n>0 and close and approach and math.dist([m['x'],m['y']],approach)<16:
                obj={**obj,use['kind']:n-1,'revision':obj.get('revision',0)+1};house.object_states={**house.object_states,'interior:'+use['piece']:obj};house.save(update_fields=['object_states']);needs.satisfy(pet,use['kind'])
    if m.get('surface'):cache.set('perch:'+house.owner_id+':'+m['surface'],pet.id,60)
    cache.set(key,m,3600)
    return dict(needs=needs.values(pet),id=pet.id,profile=pet.snapshot,sprite=pet.sprite,state='wander' if moving else m['state'],activity=('heading-to-'+m['state']) if moving else m['state'],x=m['x'],y=m['y'],elevation=m.get('elevation',0),surface=m.get('surface'),transition=m.get('transition'),next=m['route'][0] if m['route'] else None,friendship=pet.friendship,memories=pet.memories[:12],lastCare=pet.last_care,favoriteFood=pet.favorite_food,favoriteToy=pet.favorite_toy)
