"""Public, database-derived city counts. No private notes, venues or home locations."""
import json, math, uuid
from functools import lru_cache
from pathlib import Path
from django.core.cache import cache
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .animals import public_animals
from .common import image
from .models import Shelter, Horde, Mission, Event

NAMESPACE=uuid.UUID('b35f7759-73c1-44e4-9c18-5a2582836df7')
@lru_cache(maxsize=2)
def geography(filename='community-cities-2023.geojson'):
    source=json.loads((Path(__file__).parent/'data'/filename).read_text())
    result=[]
    for f in source['features']:
        p=f['properties'];polygons=[f['geometry']['coordinates']] if f['geometry']['type']=='Polygon' else f['geometry']['coordinates']
        points=[v for rings in polygons for ring in rings for v in ring]
        bounds=[min(v[0] for v in points),min(v[1] for v in points),max(v[0] for v in points),max(v[1] for v in points)]
        result.append(dict(id=str(uuid.uuid5(NAMESPACE,p['key'])),name=p['name'],province=p.get('province',p['name']),bounds=bounds,
            center=[(bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2],polygons=polygons))
    return result

def in_ring(x,y,ring):
    inside=False
    for a,b in zip(ring,ring[1:]+ring[:1]):
        cross=(y-a[1])*(b[0]-a[0])-(x-a[0])*(b[1]-a[1])
        if abs(cross)<1e-12 and min(a[0],b[0])<=x<=max(a[0],b[0]) and min(a[1],b[1])<=y<=max(a[1],b[1]):return True
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:inside=not inside
    return inside

def area_at(location,areas):
    try:x=float(location['longitude']);y=float(location['latitude'])
    except (TypeError,ValueError,KeyError):return None
    if not math.isfinite(x) or not math.isfinite(y):return None
    for city in areas:
        w,s,e,n=city['bounds']
        if w<=x<=e and s<=y<=n and any(in_ring(x,y,rings[0]) and not any(in_ring(x,y,hole) for hole in rings[1:]) for rings in city['polygons']):return city['id']
    return None

@api_view(['GET'])
@permission_classes([AllowAny])
def summary(request):
    from django.conf import settings
    key='public-city-statistics:v2:'+str(settings.COMMUNITY_FIXTURES_VISIBLE)
    cached=cache.get(key)
    if cached is not None:return Response(cached)
    cities=geography()
    provinces=list(geography('community-provinces-2023.geojson'))
    province_names={p['name'].lower():p for p in provinces}
    city_province={}
    for city in cities:
        name='Metro Manila' if 'Metropolitan Manila' in city['province'] or city['province'].startswith('NCR') else city['province']
        parent=province_names.get(name.lower())
        if not parent:
            parent=next((p for p in provinces if p['id']==area_at({'longitude':city['center'][0],'latitude':city['center'][1]},provinces)),None)
        if not parent:
            parent={**city,'id':str(uuid.uuid5(NAMESPACE,'metro-city:'+city['id']))}
            provinces.append(parent)
        city_province[city['id']]=parent['id']
    def empty(area):
        return {**{k:area[k] for k in ['id','name','province','bounds','center']},'provinceId':city_province.get(area['id'],area['id']),'animals':0,'events':0,'shelters':0,'hordes':0,'help':0,'images':{'animals':None,'shelters':None}}
    rows={c['id']:empty(c) for c in cities}
    province_rows={p['id']:empty(p) for p in provinces}
    def add(location,kind,asset=None):
        city=area_at(location,cities)
        province=city_province[city] if city else area_at(location,provinces)
        targets=([rows[city]] if city else [])+([province_rows[province]] if province else [])
        for row in targets:
            row[kind]+=1
            if kind in row['images'] and not row['images'][kind] and asset and not getattr(asset,'sensitive',False):
                photo=image(asset)
                if photo:row['images'][kind]=photo['url']
    # One AnimalInfo per animal; membership at a shelter/home never adds a second animal.
    for info in public_animals().iterator():add(info.location,'animals',info.animal.photo)
    for row in Shelter.objects.filter(published=True).select_related('photo').iterator():add(row.location,'shelters',row.photo)
    for row in Horde.objects.filter(published=True).iterator():add(row.location,'hordes')
    now=timezone.now()
    for row in Mission.objects.filter(state='open',deadline__gt=now).iterator():add(row.location,'help')
    for row in Event.objects.filter(state='scheduled',ends_at__gt=now).iterator():
        if row.venue.get('intentionallyPublic') is True:add(row.venue,'events')
    result={'cities':list(rows.values()),'provinces':list(province_rows.values()),'generatedAt':now.isoformat()}
    cache.set(key,result,30)
    return Response(result)
