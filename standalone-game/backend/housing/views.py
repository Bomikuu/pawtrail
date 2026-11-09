from django.db.models import Q
from rest_framework.decorators import api_view,permission_classes,authentication_classes
from rest_framework.permissions import AllowAny
from .auth import decode_ticket
import secrets
from rest_framework.response import Response
from .service import *
@api_view(['GET'])
def bootstrap(request):return Response(state(request.user,request.GET.get('house'),request.GET.get('entry','door')))
@api_view(['GET'])
def places(request):
    from .discovery import directory
    check_rate('places:' + request.user.id, 40, 60)
    return Response({'items': directory(request.user)})
@api_view(['GET'])
def people(request):
    q=request.GET.get('q','')[:80];p=request.user
    excluded=UserBlock.objects.filter(Q(owner=p)|Q(target=p))
    ids=[e.target_id if e.owner_id==p.id else e.owner_id for e in excluded]
    rows=PlayerGameProfile.objects.filter(Q(name__icontains=q)|Q(username__icontains=q),sample=p.sample).exclude(id__in=[p.id,*ids]).exclude(id__startswith='system:')[:40]
    return Response({'items':[{**person(a,p),'visitable':can_enter(p,a.playerhouse)} for a in rows]})
@api_view(['POST'])
def action(request):return Response(mutation(request.user,request.data,request.headers.get('Idempotency-Key','')))

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def exchange(request):
    value=request.data.get('assertion','')
    if not isinstance(value,str) or len(value)>131072:fail('Invalid game assertion.')
    data=decode_ticket(value)
    if value.startswith('session.'):fail('Use the account assertion to open a session.')
    check_rate('exchange:'+data['id'],15,60)
    provision(data)
    token='session.'+secrets.token_urlsafe(32)
    cache.set(token,data,max(1,int(data['exp']-time.time())))
    return Response({'token':token,'expires':data['exp']})

@api_view(['GET','POST'])
def companions(request):
    from .companions import roster,command
    if request.method=='GET':
        with transaction.atomic():
            p=PlayerGameProfile.objects.select_for_update().get(pk=request.user.id)
            return Response(roster(p,request.GET.get('room','me')))
    return Response(command(request.user,request.data,request.headers.get('Idempotency-Key','')))

@api_view(['GET'])
def community_counts(request):
    from .discovery import visible_houses, AREAS
    from community_map.areas_models import CommunityArea
    from shapely.geometry import shape, Point
    if request.user.sample:raise PermissionDenied('Use a real PawTrail account.')
    check_rate('city-counts:'+request.user.id,40,60)
    areas=[(str(a.pk),shape(a.geometry)) for a in CommunityArea.objects.filter(kind='city',published=True,community__enabled=True)]
    totals={key:0 for key,_ in areas}
    for house in visible_houses(request.user):
        _,lng,lat=AREAS[house.map_area]
        for key,geometry in areas:
            if geometry.covers(Point(lng,lat)):
                totals[key]+=1
                break
    return Response({'viewerId':request.user.id,'cities':totals})
