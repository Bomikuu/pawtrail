"""Normalize source-dated NAMRIA/PSGC city outlines without splitting them."""
import argparse, collections, hashlib, json
from pathlib import Path
from shapely.geometry import shape
from shapely.strtree import STRtree

parser=argparse.ArgumentParser()
parser.add_argument('--source-dir',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
base='https://raw.githubusercontent.com/bendlikeabamboo/barangay-boundaries-repository/main/2023-10-24/hierarchical_t0p005/'
files=['highly_urbanized_cities.geojson','component_cities.geojson','independent_component_cities.geojson']
pins=json.loads((args.output.parent/'davao-region-cities-2023.geojson').read_text())['features']
pinned={f['properties']['key']:f['properties']['color'] for f in pins}
features=[];upstream=[];notes=[]
for filename in files:
    raw=(args.source_dir/('pawtrail-'+filename)).read_bytes()
    upstream.append(dict(url=base+filename,sha256=hashlib.sha256(raw).hexdigest()))
    for feature in json.loads(raw)['features']:
        p=feature['properties']
        # Isabela has both a provincial-level container and its actual ADM3 city polygon.
        if not p.get('ADM3_EN'):
            notes.append('Omitted duplicate ADM2 container: '+str(p.get('ADM2_EN')))
            continue
        name=p['ADM3_EN'];code=p.get('psgc_code')
        if not code:
            if name!='City of Isabela':raise ValueError('Unresolved city identity: '+name)
            code='0990101000' # The missing component-city code in the upstream PSGC coverage report.
            notes.append('City of Isabela uses its ADM3 geometry and PSGC reference code 0990101000, rather than the duplicate province container.')
        name=p.get('psgc_name') or name
        if name.startswith('City of '):name=name.removeprefix('City of ')+' City'
        key='psgc-namria-2023-city:'+code
        if code=='1130700000':key='psgc-namria-2023-davao:city'
        features.append(dict(type='Feature',properties=dict(key=key,name=name,kind='city',
            psgcCode=code,
            namriaCode=p['ADM3_PCODE'],province=p.get('ADM2_EN',''),region=p.get('ADM1_EN',''),
            sourceMatch=p.get('match_method')),geometry=feature['geometry']))
features.sort(key=lambda f:f['properties']['key'])
geometries=[shape(f['geometry']) for f in features]
tree=STRtree(geometries)
# Nearby shared borders may have small gaps from upstream simplification; color them as neighbors too.
neighbors={i:{int(j) for j in tree.query(g,predicate='dwithin',distance=0.001) if int(j)!=i} for i,g in enumerate(geometries)}
palette=['#0f766e','#2563eb','#7c3aed','#c2410c','#be185d','#4d7c0f','#a16207','#0369a1','#9f1239','#4338ca','#047857','#9333ea']
assigned={i:pinned[f['properties']['key']] for i,f in enumerate(features) if f['properties']['key'] in pinned}
usage=collections.Counter(assigned.values())
remaining=set(range(len(features)))-set(assigned)
while remaining:
    index=max(remaining,key=lambda i:(len({assigned[j] for j in neighbors[i] if j in assigned}),len(neighbors[i]),features[i]['properties']['key']))
    used={assigned[j] for j in neighbors[index] if j in assigned}
    choices=[color for color in palette if color not in used]
    if not choices:raise ValueError('Extend the palette to separate the neighbors of '+features[index]['properties']['name'])
    color=min(choices,key=lambda c:(usage[c],palette.index(c)))
    assigned[index]=color;usage[color]+=1;remaining.remove(index)
for i,f in enumerate(features):f['properties']['color']=assigned[i]
source=dict(name='PSA / NAMRIA city boundaries',url='https://github.com/bendlikeabamboo/barangay-boundaries-repository/tree/main/2023-10-24/hierarchical_t0p005',
    version='PSGC 2023-10-24 · NAMRIA 2023-11-06 · simplified 0.005°',
    metadata=dict(attribution='Philippine Statistics Authority; NAMRIA; bendlikeabamboo',sourceToleranceDegrees=0.005,
        downloaded='2026-11-09',coverage='Philippines',upstream=upstream,normalization=notes,
coloring='Neighbor-aware DSATUR; existing six city colors preserved'))
args.output.write_text(json.dumps(dict(type='FeatureCollection',source=source,features=features),separators=(',',':'))+'\n')
print('Prepared',dict(collections.Counter(f['properties']['kind'] for f in features)),'whole areas; normalized bytes',args.output.stat().st_size)
for tolerance in [0,0.005,0.01,0.02]:
    print('Display tolerance',tolerance,'vertices',sum(len(r.coords) for g in geometries for poly in ([g.simplify(tolerance,preserve_topology=True)] if g.simplify(tolerance,preserve_topology=True).geom_type=='Polygon' else g.simplify(tolerance,preserve_topology=True).geoms) for r in [poly.exterior,*poly.interiors]))
