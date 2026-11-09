"""Native-tile community contract; no geographic coordinates or private interiors."""
import json
from pathlib import Path
from .presets import floor_spec,structure,protected
DATA=json.loads((Path(__file__).parent/'community-layout.json').read_text())
SAMPLE_HOME_IDS=[]
YARD_WIDTH=YARD_HEIGHT=14
EXTERIORS=['starter-house','garden-house','pastel-house']
def is_hub(h):return h.owner_id.startswith('system:hub')
def room_key(owner,zone='interior'):return owner if zone=='interior' else owner+'|'+zone
def zone_spec(h,zone='interior'):
    if is_hub(h):return (80,56,(12,50))
    if zone=='yard':return (14,14,(6,12))
    f=floor_spec(h.interior_preset,zone)
    return (f['width'],f['height'],f['spawn']) if f else (24,18,(12,16))
def fixed_cells(zone='interior',hub=False,preset='studio'):
    if hub:
        solid=set()
        for o in DATA['objects']:
            if o['asset']=='bench':continue
            x,y,w,h=o['solid'];solid|={(a,b) for a in range(x,x+w) for b in range(y,y+h)}
        for x,y,w,h in DATA['water']:solid|={(a,b) for a in range(x,x+w) for b in range(y,y+h)}
        for x,y in DATA['trees']:solid|={(x-1,y-1),(x,y-1)}
        x,y,w,h=DATA['courtyard']
        solid|={(a,y) for a in range(x,x+w)}|{(x,b) for b in range(y,y+h)}|{(x+w-1,b) for b in range(y,y+h)}|{(a,y+h-1) for a in range(x,x+w) if a not in [x+2,x+3]}
        for x,y,w,h in DATA['picnic']['solids']:solid|={(a,b) for a in range(x,x+w) for b in range(y,y+h)}
        for x,y,w,h in DATA['plots']:
            # Four private plots are entered through their gate into a permissioned yard room.
            solid|={(a,b) for a in range(x,x+w) for b in range(y,y+h)}
        return solid
    if zone=='yard':return {(x,y) for x in range(5,9) for y in range(2,6)}
    return structure(preset,zone)
def reserved_cells(zone='interior',preset='studio'):
    return {(x,y) for x in [6,7] for y in range(6,13)} if zone=='yard' else protected(preset,zone)
def active_layout(h,zone='interior'):
    if is_hub(h):return [dict(id='commons-'+a['id'],item='community-bench',x=a['x']-.5,y=a['y']-1,rotation=0) for a in DATA['objects'] if a['asset']=='bench']
    return h.yard_layout if zone=='yard' else h.upstairs_layout if zone=='upstairs' else h.layout
def hub_id(sample,block=0):return 'system:hub:'+('demo' if sample else 'real')+((':block:'+str(block)) if block else '')
def block_number(h):
    identifier=h if isinstance(h,str) else h.owner_id
    try:return int(identifier.rsplit(':block:',1)[1]) if ':block:' in identifier else 0
    except ValueError:return 0

def starter_yard():
    return [dict(id='yard-starter-'+str(i),item=item,x=x,y=y,rotation=0) for i,(item,x,y) in enumerate([('garden-bench',2,10),('garden-banana',10,5),('garden-pot',3,6),('garden-pot',10,10)])]
