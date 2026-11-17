"""Native-pixel geometry v2; catalog is shared verbatim with the game client."""
import math
from collections import deque
from .geometry import ITEMS,definition
from .community import fixed_cells
from .presets import floor_spec
STEP=8

def point(piece,local):
    a=definition(piece)['anchor'];x,y=local[0]-a[0],local[1]-a[1]
    r=0 if ITEMS[piece['item']].get('renderedViews') or ITEMS[piece['item']].get('orientationVariants',{}).get(str(piece.get('rotation',0))) else piece.get('rotation',0)%360
    if r==90:x,y=-y,x
    elif r==180:x,y=-x,-y
    elif r==270:x,y=y,-x
    return [piece['x']*32+16+x,piece['y']*32+32+y]

def rect(piece,r):
    pts=[point(piece,p) for p in [[r[0],r[1]],[r[0]+r[2],r[1]],[r[0],r[1]+r[3]],[r[0]+r[2],r[1]+r[3]]]]
    x=min(p[0] for p in pts);y=min(p[1] for p in pts)
    return [x,y,max(p[0] for p in pts)-x,max(p[1] for p in pts)-y]

def overlaps(a,b):return a[0]<b[0]+b[2] and a[0]+a[2]>b[0] and a[1]<b[1]+b[3] and a[1]+a[3]>b[1]

class Navigation:
    def __init__(self,layout,hub=False,zone='interior',preset='studio',states=None):
        f=floor_spec(preset,zone);w,h=(80,56) if hub else (14,14) if zone=='yard' else (f['width'],f['height']) if f else (24,18)
        self.width=w*32;self.height=h*32
        fixed=fixed_cells(zone,hub,preset)|{(x,y) for x in range(w) for y in range(h) if x in [0,w-1] or y in [0,h-1]}
        self.rects=[[x*32,y*32,32,32] for x,y in fixed]
        for p in layout:
            d=definition(p);ground=d['geometry']['ground']
            if (states or {}).get(p['id'],{}).get('open'):
                ground=d.get('stateViews',{}).get('open',{}).get('ground',ground)
            self.rects += [rect(p,r) for r in ground]
        self.blocked=set()
        for x,y,rw,rh in self.rects:
            for gx in range(math.floor((x-5)/8),math.floor((x+rw+5)/8)+1):
                for gy in range(math.floor(y/8),math.floor((y+rh+6)/8)+1):
                    if overlaps([gx*8-1,gy*8-2,10,6],[x,y,rw,rh]):self.blocked.add((gx,gy))
    def clear(self,p):return 37<=p[0]<self.width-37 and 38<=p[1]<self.height-32 and not any(overlaps([p[0]-5,p[1]-6,10,6],r) for r in self.rects)
    def segment(self,a,b):
        n=max(1,math.ceil(math.dist(a,b)/3))
        return all(self.clear([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n]) for i in range(1,n+1))
    def nearest(self,p,radius=64):
        if self.clear(p):return p
        for r in range(8,radius+1,8):
            for i in range(16):
                q=[p[0]+math.cos(i*math.pi/8)*r,p[1]+math.sin(i*math.pi/8)*r]
                if self.clear(q):return q
        return None
    def path(self,a,b):
        a=self.nearest(a,32);b=self.nearest(b,40)
        if a is None or b is None:return []
        if self.segment(a,b):return [b]
        import heapq
        def node_for(p):
            x,y=int(p[0]//8),int(p[1]//8)
            for radius in [0,1,2]:
                for dy in range(-radius,radius+1):
                    for dx in range(-radius,radius+1):
                        q=(x+dx,y+dy)
                        if 4<=q[0]<self.width//8-4 and 4<=q[1]<self.height//8-4 and q not in self.blocked and self.segment(p,[q[0]*8+4,q[1]*8+4]):return q
            return None
        start=node_for(a);goal=node_for(b)
        if not start or not goal:return []
        heuristic=lambda p:abs(p[0]-goal[0])+abs(p[1]-goal[1])
        queue=[(heuristic(start),0,start)];cost={start:0};parents={start:None}
        while queue:
            _,g,p=heapq.heappop(queue)
            if g!=cost[p]:continue
            if p==goal:break
            for n in [(p[0]+1,p[1]),(p[0]-1,p[1]),(p[0],p[1]+1),(p[0],p[1]-1)]:
                if 4<=n[0]<self.width//8-4 and 4<=n[1]<self.height//8-4 and n not in self.blocked and g+1<cost.get(n,math.inf):parents[n]=p;cost[n]=g+1;heapq.heappush(queue,(g+1+heuristic(n),g+1,n))
        if goal not in parents:return []
        result=[b];p=goal
        while p!=start:result.append([p[0]*8+4,p[1]*8+4]);p=parents[p]
        result.append([start[0]*8+4,start[1]*8+4])
        return list(reversed(result))
    def approach(self,p,origin):
        for q in sorted([point(p,a) for a in definition(p)['geometry']['approaches']],key=lambda a:math.dist(a,origin)):
            q=self.nearest(q,16)
            if q and (self.path(origin,q) or math.dist(origin,q)<4):return q
        return None

# Geometry is immutable for each layout/state signature; movement never rebuilds it per packet.
import json
from functools import lru_cache
@lru_cache(maxsize=64)
def _navigation(layout,hub,zone,preset,states):
    return Navigation(json.loads(layout),hub,zone,preset,json.loads(states))
def get_navigation(layout,hub=False,zone='interior',preset='studio',states=None):
    doors={key:{'open':value.get('open',False)} for key,value in (states or {}).items() if 'open' in value}
    return _navigation(json.dumps(layout,sort_keys=True),hub,zone,preset,json.dumps(doors,sort_keys=True))
