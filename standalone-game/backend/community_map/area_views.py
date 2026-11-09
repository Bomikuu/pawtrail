"""Bounded public GeoJSON; room entry still uses housing authentication/permissions."""
import math
from django.conf import settings
from shapely.geometry import shape, mapping
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from .areas_models import CommunityArea

@api_view(['GET'])
@permission_classes([AllowAny])
def communities(request):
    rows = CommunityArea.objects.filter(kind='city', published=True, community__enabled=True, community__house__opened=True, community__house__visibility='public')
    identifier = request.query_params.get('id')
    if identifier:
        import uuid
        try: identifier = uuid.UUID(identifier)
        except (ValueError, TypeError): raise ValidationError('Choose a valid community area.')
        rows = rows.filter(pk=identifier)
    tolerance = 0.01
    bbox = request.query_params.get('bbox')
    if bbox:
        try: bounds = [float(v) for v in bbox.split(',')]
        except (ValueError, TypeError): raise ValidationError('Invalid community bounds.')
        if len(bounds)!=4 or not all(math.isfinite(v) for v in bounds) or not -180<=bounds[0]<=bounds[2]<=180 or not -85<=bounds[1]<=bounds[3]<=85:
            raise ValidationError('Invalid community bounds.')
        span=max(bounds[2]-bounds[0],bounds[3]-bounds[1])
        tolerance=0.02 if span>8 else 0.008 if span>3 else 0.002 if span>1 else 0
        rows = rows.filter(west__lte=bounds[2], east__gte=bounds[0], south__lte=bounds[3], north__gte=bounds[1])
    rows = rows.select_related('parent','community__house').defer('geometry','parent__geometry','parent__display_geometry').order_by('name','id')
    features=[]; vertices=0; truncated=False
    def size(node):
        return 1 if len(node)>=2 and isinstance(node[0],(int,float)) else sum(size(child) for child in node)
    for area in rows[:2001]:
        if area.community.house_id != 'system:hub:geo:' + str(area.pk):continue
        geometry=mapping(shape(area.display_geometry).simplify(tolerance,preserve_topology=True)) if tolerance else area.display_geometry
        count=size(geometry['coordinates'])
        if len(features)>=2000 or vertices+count>75_000:
            truncated=True; break
        vertices+=count
        features.append(dict(type='Feature', id=str(area.pk), geometry=geometry, properties=dict(
            id=str(area.pk), name=area.name, kind=area.kind, color=area.source_metadata.get('mapColor','#0f766e'), parentId=str(area.parent_id) if area.parent_id else None,
            parentName=area.parent.name if area.parent else None, city=area.source_metadata.get('city',''), province=area.source_metadata.get('province',''),region=area.source_metadata.get('region',''),
            center=area.center, bounds=[area.west,area.south,area.east,area.north], areaKm2=round(area.area_km2,2),
            roomId=area.community.house_id, communityId=str(area.community.pk),
            capacity=settings.VISITOR_LIMIT, sourceName=area.source_name, sourceVersion=area.source_version, sourceUrl=area.source_url,
            custom=area.kind=='zone')))
    return Response(dict(type='FeatureCollection', features=features, truncated=truncated))
