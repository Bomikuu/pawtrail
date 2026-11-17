import copy,json,math,re
from pathlib import Path
from collections import deque
from .community import fixed_cells,reserved_cells
from .presets import floor_spec,plan
CATALOG=json.loads((Path(__file__).parent/'catalog.json').read_text())
ITEMS={i['id']:i for i in CATALOG['items']}
def definition(piece):
    base=ITEMS[piece['item']]
    return {**base,**base.get('renderedViews',{}).get(str(piece.get('rotation',0)),{})}
WIDTH,HEIGHT=24,18
DOOR=(12,16)
def bounds(item):
    from .spatial import rect
    return rect(item,definition(item)['footprint'])
def cells(item):
    if not ITEMS[item['item']]['blocking']:return set()
    x,y,w,h=bounds(item)
    return {(a,b) for a in range(math.floor(x/32),math.ceil((x+w)/32)) for b in range(math.floor(y/32),math.ceil((y+h)/32))}
def blocked(layout,hub=False,zone='interior',preset='studio'):
    f=floor_spec(preset,zone)
    width,height=(80,56) if hub else (14,14) if zone=='yard' else (f['width'],f['height']) if f else (WIDTH,HEIGHT)
    result={(x,y) for x in range(width) for y in range(height) if x in [0,width-1] or y in [0,height-1]}
    result|=fixed_cells(zone,hub,preset)
    for item in layout:result|=cells(item)
    return result
def reachable(layout,start=None,zone='interior',preset='studio'):
    f=floor_spec(preset,zone)
    width,height=(14,14) if zone=='yard' else (f['width'],f['height']) if f else (WIDTH,HEIGHT)
    start=tuple(start or ((6,12) if zone=='yard' else f['spawn'] if f else DOOR))
    solid=blocked(layout,zone=zone,preset=preset);visited={start};queue=deque([start])
    while queue:
        x,y=queue.popleft()
        for p in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
            if p not in solid and p not in visited and 0<p[0]<width-1 and 0<p[1]<height-1:visited.add(p);queue.append(p)
    return visited
def validate_layout(layout,inventory,zone='interior',other_layout=None,preset='studio'):
    from rest_framework.exceptions import ValidationError
    f=floor_spec(preset,zone)
    width,height=(14,14) if zone=='yard' else (f['width'],f['height']) if f else (WIDTH,HEIGHT)
    if not isinstance(layout,list) or len(layout)>80:raise ValidationError('A space can contain up to 80 pieces.')
    from .spatial import rect,overlaps,Navigation
    ids=set();counts={};occupied=[[x*32,y*32,32,32] for x,y in fixed_cells(zone,preset=preset)|reserved_cells(zone,preset)]
    for p in other_layout or []:counts[p['item']]=counts.get(p['item'],0)+1
    for p in layout:
        if not isinstance(p,dict) or not {'id','item','x','y','rotation'}<=set(p) or set(p)-{'id','item','x','y','rotation','style','upholsteryColor'}:raise ValidationError('Invalid furniture placement.')
        if not isinstance(p['id'],str) or len(p['id'])>80 or p['id'] in ids or p['item'] not in ITEMS:raise ValidationError('Unknown or duplicate furniture.')
        ids.add(p['id']);d=definition(p)
        if 'upholsteryColor' in p:
            color=p['upholsteryColor']
            if p['item']!='sofa' or not isinstance(color,str) or not re.fullmatch(r'#[0-9a-fA-F]{6}',color):raise ValidationError('Choose a six-digit upholstery color for a supported sofa.')
            p['upholsteryColor']=color.lower()
        if 'style' in p and p['style'] not in [style['id'] for style in d.get('styles',[])]:raise ValidationError('Choose an available furniture style.')
        if ('interior' if zone=='upstairs' else zone) not in d.get('zones',['interior']):raise ValidationError('This piece is not suitable for this space.')
        counts[p['item']]=counts.get(p['item'],0)+1
        if counts[p['item']]>inventory.get(p['item'],0):raise ValidationError('This piece is already placed in your other space, or is not owned.')
        if type(p['x']) is not int or type(p['y']) is not int or not 1<=p['x']<width-1 or not 2<=p['y']<height-1:raise ValidationError('Keep pieces within the editable space.')
        if type(p['rotation']) is not int or p['rotation'] not in d.get('supportedRotations',([0,90,180,270] if d['rotatable'] else [0])):raise ValidationError('This piece cannot rotate.')
        # All art stays inside the plot; upper pixels may rise above the tile anchor.
        left,top,rw,rh=rect(p,d.get('visibleBounds',[0,0,d['width'],d['height']]))
        if left<0 or top<0 or left+rw>width*32 or top+rh>height*32:raise ValidationError('The complete piece must fit inside this space.')
        shapes=[rect(p,r) for r in d['geometry']['placement']]
        if any(overlaps(a,b) for a in shapes for b in occupied):raise ValidationError('Keep the entrance route, house and other pieces clear.')
        occupied+=shapes
    nav=Navigation(layout,zone=zone,preset=preset)
    start=(6,12) if zone=='yard' else f['spawn'] if f else DOOR
    spawn=nav.nearest([start[0]*32+16,start[1]*32+16],24)
    if not spawn:raise ValidationError('Keep the entrance clear.')
    first=(int(spawn[0]//8),int(spawn[1]//8));walk={first};queue=deque([first])
    while queue:
        x,y=queue.popleft()
        for n in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
            if 4<=n[0]<width*4-4 and 4<=n[1]<height*4-4 and n not in nav.blocked and n not in walk:walk.add(n);queue.append(n)
    if len(walk)<(65 if zone=='yard' else 90)*16:raise ValidationError('Leave enough connected walking space.')
    if any((x*4+2,y*4+2) not in walk for x,y in reserved_cells(zone,preset)):raise ValidationError('Keep a continuous entrance route.')
    for p in layout:
        a=nav.approach(p,spawn)
        # approach() verifies a continuous path and safely joins nearby grid nodes.
        # An exact visual approach may share a blocked grid cell while the foot
        # position and its short connection to the adjacent node remain clear.
        if not a:raise ValidationError('An item has no reachable interaction point.')
    return layout
def default_layout():
    return copy.deepcopy(plan('studio')['floors']['interior']['items'])
def route(layout,start,goal,preset='studio'):
    from .spatial import Navigation
    return Navigation(layout,preset=preset).path(start,goal)
