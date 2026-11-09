from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Area,AnimalInfo,Mission,Campaign,Shelter,Horde,Event,Post
from .animals import public_animals
from .common import *

@api_view(['GET'])
@permission_classes([AllowAny])
def areas(request):
    from .people import area_dto
    q=params(request).get('q','');return Response([area_dto(a) for a in Area.objects.filter(name__icontains=q).order_by('name')[:50]])

def features():
    result=[]
    for info in public_animals():result.append({'ref':{'kind':'animal','id':str(info.animal_id)},'href':'/pets/'+info.animal.slug,'title':info.animal.name,'location':info.location})
    for model,kind,prefix in [(Shelter,'shelter','shelters'),(Horde,'horde','hordes'),(Mission,'mission','missions'),(Campaign,'fundraiser','fundraisers')]:
        rows=model.objects.filter(published=True) if model in [Shelter,Horde] else model.objects.filter(state='active') if model is Campaign else model.objects.filter(state='open',deadline__gt=timezone.now())
        for row in rows:result.append({'ref':{'kind':kind,'id':str(row.pk)},'href':'/'+prefix+'/'+row.slug,'title':getattr(row,'name',getattr(row,'title','')),'location':row.location,**({'urgency':row.urgency} if hasattr(row,'urgency') else {})})
    for row in Event.objects.filter(state='scheduled',ends_at__gt=timezone.now()):result.append({'ref':{'kind':'event','id':str(row.pk)},'href':'/events/'+row.slug,'title':row.title,'location':{'areaId':'event-venue','neighborhood':row.venue['name'],'latitude':row.venue['latitude'],'longitude':row.venue['longitude'],'approximateRadiusMeters':500}})
    return result

@api_view(['GET'])
@permission_classes([AllowAny])
def nearby(request):
    p=params(request)
    try:center={'latitude':float(p['latitude']),'longitude':float(p['longitude'])};radius=float(p.get('radiusMeters',5000))
    except (ValueError,KeyError,TypeError):raise DomainError('Choose a map center and radius.')
    if not -90<=center['latitude']<=90 or not -180<=center['longitude']<=180 or not 0<radius<=1000000:raise DomainError('Invalid map center or radius.')
    rows=[r for r in features() if distance(center,r['location'])<=radius]
    if p.get('kinds'):rows=[r for r in rows if r['ref']['kind'] in p['kinds']]
    b=p.get('bounds')
    if b:
        try:rows=[r for r in rows if b['south']<=r['location']['latitude']<=b['north'] and (b['west']<=r['location']['longitude']<=b['east'] if b['west']<=b['east'] else r['location']['longitude']>=b['west'] or r['location']['longitude']<=b['east'])]
        except (TypeError,KeyError):raise DomainError('Invalid map bounds.')
    return Response({'features':rows[:1000],'count':len(rows)})

@api_view(['GET'])
@permission_classes([AllowAny])
def search(request):
    p=params(request);q=p.get('q','').lower();rows=[{'ref':r['ref'],'title':r['title'],'path':r['href'],'excerpt':r['location']['neighborhood']} for r in features() if q in (r['title']+' '+r['location']['neighborhood']).lower() and (not p.get('kinds') or r['ref']['kind'] in p['kinds'])]
    from django.contrib.auth import get_user_model
    if not p.get('kinds') or 'user' in p['kinds']:
        for user in community_users().filter(social_profile__discoverable=True).filter(Q(username__icontains=q)|Q(display_name__icontains=q)).order_by('username'):
            rows.append({'ref':{'kind':'user','id':str(user.pk)},'title':user.display_name or user.username,'path':'/users/'+user.username,'excerpt':user.social_profile.bio[:160]})
    return Response(paginate(rows,request,lambda x:x))

@api_view(['GET'])
@permission_classes([AllowAny])
def sightings(request):
    from observations.models import Sighting
    rows=Sighting.objects.filter(active=True,observation__publication_state='published').select_related('animal','observation__capture__media','observation__capture__owner').order_by('-approved_at','-id');p=params(request)
    if p.get('scope')=='mine':rows=rows.filter(observation__capture__owner=auth(request))
    if p.get('animalId'):rows=rows.filter(animal_id=identifier(p['animalId']))
    if p.get('hordeId'):rows=rows.filter(animal__social_info__horde_id=identifier(p['hordeId']))
    if p.get('since'):
        from django.utils.dateparse import parse_datetime
        value=parse_datetime(p['since'])
        if not value or timezone.is_naive(value):raise DomainError('Choose a date including its timezone.')
        rows=rows.filter(approved_at__gte=value)
    output=[]
    for row in rows:
        c=row.observation.capture
        if c.latitude is None or c.longitude is None or not c.captured_at:continue
        location={'areaId':'reported-area','neighborhood':c.area_label or 'Approximate reported area','latitude':round(c.latitude,2),'longitude':round(c.longitude,2),'approximateRadiusMeters':max(1500,c.accuracy_meters or 0)}
        output.append({'id':str(row.pk),'createdAt':row.approved_at.isoformat(),'provenance':PROVENANCE,'animalId':str(row.animal_id),'hordeId':None,'reporterId':str(c.owner_id),'observedAt':c.captured_at.isoformat(),'location':location,'observation':row.observation.notes,'media':[i for i in [image(c.media)] if i],'moderation':'published'})
    return Response(paginate(output,request,lambda x:x))
