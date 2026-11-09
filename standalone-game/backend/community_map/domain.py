import math
from collections import Counter
from datetime import timedelta
from django.conf import settings
from django.db.models import Case,When,Value,IntegerField,BigIntegerField,UUIDField,Sum,Count,Q
from django.db.models.functions import Cast
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import ReputationEvent,IncidentReport

CATEGORIES=['poisoning','abuse','violence','dangerous_conditions','animal_conflict','other']
STATUSES=['submitted','under_review','needs_info','corroborated','resolved','rejected','archived']
POSITIVE_WEIGHTS={'feeding':1,'approved_mission':3,'care':2,'volunteering':3,'rescue':5,'shelter_support':3,'incident_response':4}

def point(value):
    if not isinstance(value,list) or len(value)!=2 or any(type(n) not in [float,int] or not math.isfinite(n) for n in value) or not -180<=value[0]<=180 or not -85<=value[1]<=85:
        raise ValidationError('Choose a valid map location.')
    return value

def generalized(lng,lat):
    # A public grid, never the reporter's exact submitted coordinate.
    return round(round(lng/.005)*.005,5),round(round(lat/.005)*.005,5)

def distance(a,b):
    lng1,lat1,lng2,lat2=map(math.radians,[*a,*b]);dlat=lat2-lat1;dlng=lng2-lng1
    h=math.sin(dlat/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin(dlng/2)**2
    return 6371008.8*2*math.atan2(math.sqrt(h),math.sqrt(max(0,1-h)))

def spatial(rows,params,kind):
    """PostGIS uses an indexed geography query; local SQLite keeps a bounded fallback."""
    bbox=params.get('bbox');center=None;radius=None
    if bbox:
        try:b=[float(v) for v in bbox.split(',')]
        except (TypeError,ValueError):raise ValidationError('Invalid map bounds.')
        if len(b)!=4 or not all(math.isfinite(v) for v in b) or not -180<=b[0]<=b[2]<=180 or not -85<=b[1]<=b[3]<=85:raise ValidationError('Invalid map bounds.')
        rows=rows.filter(public_longitude__gte=b[0],public_longitude__lte=b[2],public_latitude__gte=b[1],public_latitude__lte=b[3])
        if settings.MAP_USE_POSTGIS:
            from community_geo.models import MapPoint
            from django.contrib.gis.geos import Polygon
            box=Polygon.from_bbox(b);box.srid=4326
            ids=MapPoint.objects.filter(kind=kind,location__intersects=box).annotate(record_id=Cast('external_id',BigIntegerField() if kind=='contribution' else UUIDField())).values('record_id')
            rows=rows.filter(pk__in=ids)
    if params.get('latitude') is not None or params.get('longitude') is not None:
        try:center=point([float(params['longitude']),float(params['latitude'])]);radius=float(params.get('radius',500))
        except (KeyError,TypeError,ValueError):raise ValidationError('Choose a valid proximity center and radius.')
        if not math.isfinite(radius) or not 100<=radius<=5000:raise ValidationError('Choose a radius from 100 to 5,000 meters.')
        if settings.MAP_USE_POSTGIS:
            from community_geo.models import MapPoint
            from django.contrib.gis.geos import Point
            from django.contrib.gis.measure import D
            ids=MapPoint.objects.filter(kind=kind,location__distance_lte=(Point(*center,srid=4326),D(m=radius))).annotate(record_id=Cast('external_id',BigIntegerField() if kind=='contribution' else UUIDField())).values('record_id')
            rows=rows.filter(pk__in=ids)
        else:
            dy=radius/110574;dx=radius/(111320*max(.08,math.cos(math.radians(center[1]))))
            rows=rows.filter(public_longitude__gte=center[0]-dx,public_longitude__lte=center[0]+dx,public_latitude__gte=center[1]-dy,public_latitude__lte=center[1]+dy)
    result=list(rows.order_by('-created_at')[:501]);truncated=len(result)>500;result=result[:500]
    if center and not settings.MAP_USE_POSTGIS:result=[r for r in result if distance(center,[r.public_longitude,r.public_latitude])<=radius]
    return result,truncated

def index_public(record,kind):
    if not settings.MAP_USE_POSTGIS:return
    from community_geo.models import MapPoint
    from django.contrib.gis.geos import Point
    if not getattr(record,'published',getattr(record,'verified',False)) or record.public_longitude is None or record.public_latitude is None:
        MapPoint.objects.filter(kind=kind,external_id=str(record.pk)).delete();return
    MapPoint.objects.update_or_create(kind=kind,external_id=str(record.pk),defaults={'location':Point(record.public_longitude,record.public_latitude,srid=4326)})

def contribution(subject):
    events=list(ReputationEvent.objects.filter(subject=subject,verified=True,occurred_at__gte=timezone.now()-timedelta(days=365)))
    # Deduplicate source evidence. Virtual game activity is never an input here.
    sources={e.source_reference:e for e in events};score=sum(POSITIVE_WEIGHTS.get(e.kind,0) for e in sources.values())
    return dict(level='unrated' if not sources else 'established' if score>=15 else 'growing',verifiedCount=len(sources),score=score,confidence='documented' if sources else 'insufficient',explanation='Verified contribution evidence from the last year. Welfare concerns are shown separately.' if sources else 'No verified contribution evidence recorded on PawTrail.')

def welfare(subject):
    rows=IncidentReport.objects.filter(subject=subject,published=True,occurred_at__gte=timezone.now()-timedelta(days=90))
    counts=Counter(rows.values_list('status',flat=True))
    return dict(openConfirmed=counts['corroborated'],underReview=counts['under_review'],resolved=counts['resolved'],explanation='Published PawTrail reports only; this is not a claim that an area is free of incidents.')

def summaries_for(subjects):
    """Two grouped queries, regardless of how many map subjects are visible."""
    ids=[s.pk for s in subjects]
    weights=Case(*[When(kind=kind,then=Value(weight)) for kind,weight in POSITIVE_WEIGHTS.items()],default=Value(0),output_field=IntegerField())
    events={r['subject_id']:r for r in ReputationEvent.objects.filter(subject_id__in=ids,verified=True,occurred_at__gte=timezone.now()-timedelta(days=365)).values('subject_id').annotate(count=Count('source_reference',distinct=True),score=Sum(weights))}
    concerns={r['subject_id']:r for r in IncidentReport.objects.filter(subject_id__in=ids,published=True,occurred_at__gte=timezone.now()-timedelta(days=90)).values('subject_id').annotate(open=Count('pk',filter=Q(status='corroborated')),review=Count('pk',filter=Q(status='under_review')),resolved=Count('pk',filter=Q(status='resolved')))}
    result={}
    for s in subjects:
        e=events.get(s.pk,{});w=concerns.get(s.pk,{});count=e.get('count',0);score=e.get('score',0) or 0
        result[s.external_id]={
            'contribution':dict(level='unrated' if not count else 'established' if score>=15 else 'growing',verifiedCount=count,score=score,confidence='documented' if count else 'insufficient',explanation='Verified contribution evidence from the last year. Welfare concerns are shown separately.' if count else 'No verified contribution evidence recorded on PawTrail.'),
            'welfare':dict(openConfirmed=w.get('open',0),underReview=w.get('review',0),resolved=w.get('resolved',0),explanation='Published PawTrail reports only; this is not a claim that an area is free of incidents.')}
    return result
