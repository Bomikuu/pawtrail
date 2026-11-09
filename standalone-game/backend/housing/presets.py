"""Shared structural plans. Presets are assembled from native assets, never a concept PNG."""
import json
from pathlib import Path
PRESETS={p['id']:p for file in ['house-presets.json','house-presets-legacy.json'] for p in json.loads((Path(__file__).parent/file).read_text())}
def plan(identifier='studio'):return PRESETS.get(identifier,PRESETS['studio'])
def floor_spec(identifier='studio',zone='interior'):
    return plan(identifier)['floors'].get(zone)
def rect_cells(rect):
    x,y,w,h=rect;return {(a,b) for a in range(x,x+w) for b in range(y,y+h)}
def structure(identifier='studio',zone='interior'):
    floor=floor_spec(identifier,zone)
    if not floor:return set()
    result=set()
    for wall in floor['walls']:
        cells=rect_cells(wall['rect'])
        for gap in wall['gaps']:cells-=rect_cells(gap)
        result|=cells
    for stair in floor['stairs']:result|=rect_cells(stair['rect'])
    return result
def protected(identifier='studio',zone='interior'):
    floor=floor_spec(identifier,zone)
    return set().union(*(rect_cells(r) for r in floor['protected'])) if floor else set()
def floor_layouts(h):return [*h.layout,*h.upstairs_layout]
def active_revision(h,zone='interior'):return h.yard_revision if zone=='yard' else h.upstairs_revision if zone=='upstairs' else h.revision
def entry_tile(h,zone='interior',entry='door'):
    if zone=='yard':return (6,12)
    f=floor_spec(h.interior_preset,zone)
    if entry=='stairs' and f and f['stairs']:return f['stairs'][0]['landing']
    return f['spawn'] if f else [12,16]
