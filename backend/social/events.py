from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Event,EventRsvp,Shelter
from .common import *

class Venue(serializers.Serializer):
    name=serializers.CharField(max_length=200)
    address=serializers.CharField(max_length=500)
    latitude=serializers.FloatField(min_value=-90,max_value=90)
    longitude=serializers.FloatField(min_value=-180,max_value=180)
    intentionallyPublic=serializers.BooleanField()
    def validate_intentionallyPublic(self,v):
        if not v:raise serializers.ValidationError('Only intentionally public venues may be listed.')
        return v
class EventInput(serializers.Serializer):
    title=serializers.CharField(max_length=200)
    description=serializers.CharField(max_length=10000)
    startsAt=serializers.DateTimeField()
    endsAt=serializers.DateTimeField()
    venue=Venue()
    capacity=serializers.IntegerField(min_value=1,max_value=10000)
    shelterId=serializers.UUIDField(allow_null=True)
    state=serializers.ChoiceField(choices=['scheduled','cancelled'])
    expectedVersion=serializers.IntegerField(min_value=1,required=False)
    def validate(self,v):
        if v['endsAt']<=v['startsAt']:raise serializers.ValidationError('The end must be after the start.')
        if v['endsAt']<=timezone.now():raise serializers.ValidationError('Choose an upcoming event time.')
        return v
class RSVP(serializers.Serializer):
    attending=serializers.BooleanField()
    public=serializers.BooleanField(required=False)

def event_dto(row,request=None,detail=False):
    from .people import avatar
    uid=request.user.pk if request and request.user.is_authenticated else None
    rsvps=row.rsvps.select_related('attendee').order_by('created_at')
    public=list(rsvps.filter(public=True,attendee__social_profile__discoverable=True)[:100 if detail else 4])
    attendees=[{'id':str(r.attendee_id),'username':r.attendee.username,'displayName':r.attendee.display_name or r.attendee.username,'avatar':avatar(r.attendee)} for r in public]
    result={**base(row),'slug':row.slug,'title':row.title,'startsAt':row.starts_at.isoformat(),'endsAt':row.ends_at.isoformat(),'venue':row.venue,'capacity':row.capacity,'attendanceCount':rsvps.count(),'shelterId':str(row.shelter_id) if row.shelter_id else None,'state':row.state,'organizerId':str(row.organizer_id),'attendees':attendees,'publicAttendeeCount':rsvps.filter(public=True,attendee__social_profile__discoverable=True).count()}
    if detail:
        host={'kind':'shelter','id':str(row.shelter_id),'name':row.shelter.name,'href':'/shelters/'+row.shelter.slug,'avatar':image(row.shelter.photo)} if row.shelter_id else {'kind':'user','id':str(row.organizer_id),'name':row.organizer.display_name,'href':'/users/'+row.organizer.username,'avatar':avatar(row.organizer)}
        result.update(description=row.description,version=row.version,viewerAttending=bool(uid and rsvps.filter(attendee_id=uid).exists()),viewerCanManage=bool(uid and own(request.user,row)),rsvpOpen=row.state=='scheduled' and row.starts_at>timezone.now() and rsvps.count()<row.capacity,host=host)
    return result

@api_view(['GET','POST','PATCH'])
@permission_classes([AllowAny])
def events(request,key=None):
    if request.method=='GET':
        rows=Event.objects.select_related('shelter','organizer').order_by('-created_at','-id');p=params(request)
        if key:return Response(event_dto(lookup(rows,key),request,True))
        if p.get('scope')=='mine':
            user=auth(request);rows=rows.filter(Q(organizer=user)|Q(rsvps__attendee=user)).distinct()
        if p.get('q'):rows=rows.filter(title__icontains=p['q'])
        if p.get('shelterId'):rows=rows.filter(shelter_id=identifier(p['shelterId']))
        if p.get('state'):rows=rows.filter(state=p['state'])
        from django.utils.dateparse import parse_datetime
        for param,field in [('from','starts_at__gte'),('to','starts_at__lte')]:
            if p.get(param):
                value=parse_datetime(p[param])
                if not value or timezone.is_naive(value):raise DomainError('Choose a date including the timezone.')
                rows=rows.filter(**{field:value})
        if p.get('sort')=='soonest':rows=rows.order_by('starts_at','id')
        return Response(paginate(rows,request,lambda r:event_dto(r,request)))
    def run():
        user=auth(request);v=data(request,EventInput)
        shelter=lookup(Shelter.objects.filter(published=True),v['shelterId']) if v['shelterId'] else None
        if shelter:manager(request,shelter)
        if key:
            row=lookup(Event.objects.select_for_update(),key);owner(request,row);version(row,v.get('expectedVersion'))
            if row.rsvps.count()>v['capacity']:raise DomainError('Capacity cannot be smaller than current attendance.','CONFLICT',409)
        else:row=Event(organizer=user,slug=slug(v['title']))
        for source,dest in [('title','title'),('description','description'),('startsAt','starts_at'),('endsAt','ends_at'),('venue','venue'),('capacity','capacity'),('state','state')]:setattr(row,dest,v[source])
        row.shelter=shelter
        if key:touch(row)
        else:row.save()
        audit(user,row,'update' if key else 'create')
        if key:
            for attendee in row.rsvps.select_related('attendee'):notify(attendee.attendee,'event','Event details changed: '+row.title,{'kind':'event','id':str(row.pk)})
        return event_dto(row,request,True)
    return mutation(request,run,201 if request.method=='POST' else 200)

@api_view(['PUT'])
def rsvp(request,key):
    def run():
        user=auth(request);v=data(request,RSVP);row=lookup(Event.objects.select_for_update(),key)
        prior=EventRsvp.objects.filter(event=row,attendee=user).first()
        if v['attending']:
            if row.state!='scheduled' or row.starts_at<=timezone.now():raise DomainError('RSVP is closed for this event.','CONFLICT',409)
            if not prior and row.rsvps.count()>=row.capacity:raise DomainError('The event has reached capacity.','CAPACITY_REACHED',409)
            public=v.get('public',profile(user).public_attendance)
            if prior:prior.public=public;prior.save(update_fields=['public','updated_at'])
            else:EventRsvp.objects.create(event=row,attendee=user,public=public)
        elif prior:prior.delete()
        return event_dto(row,request,True)
    return mutation(request,run)
