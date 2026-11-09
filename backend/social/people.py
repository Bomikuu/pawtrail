from django.contrib.auth import get_user_model
from django.db.models import Q,Sum
from django.utils import timezone
from django.http import Http404
from rest_framework import serializers
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rewards.models import LedgerEntry
from .models import UserProfile,Area,MissionParticipation,AdoptionApplication,AnimalInfo,EventRsvp,Notification,Follow,Shelter
from .common import *

def avatar(user):
    p=profile(user)
    if not p.avatar_id:return None
    number=p.avatar_id.removeprefix('pawtrail-avatar-').removeprefix('avatar-')
    try:n=int(number)
    except ValueError:return None
    if not 1<=n<=30:return None
    return {'id':p.avatar_id,'url':'/images/avatars/avatar-'+str(n).zfill(2)+'.webp','alt':user.display_name or user.username,'provenance':PROVENANCE}

def area_dto(area):return {'id':area.slug,'name':area.name,'latitude':area.latitude,'longitude':area.longitude,'approximateRadiusMeters':area.radius}
def location(area):return {'areaId':area.slug,'neighborhood':area.name,'latitude':area.latitude,'longitude':area.longitude,'approximateRadiusMeters':area.radius}
def author_dto(user,request=None):
    from .leaderboard import rank_for
    if not profile(user).discoverable and (request is None or not request.user.is_authenticated or request.user.pk!=user.pk):return {'displayName':'A community member','username':None,'avatar':None,'badges':[],'leaderboardRank':None}
    from .achievements.engine import public_showcase
    return {'displayName':user.display_name or user.username,'username':user.username,'avatar':avatar(user),'badges':public_showcase(user,request)['badges'],'leaderboardRank':rank_for(user,request)}

def roles(user):
    return ['member']+(['shelter_staff'] if user.shelters.exists() or user.managed_shelters.exists() else [])+(['moderator'] if user.is_staff else [])

def user_dto(user,request,private=False):
    from .leaderboard import rank_for
    from .animals import animal_dto
    from .community import post_dto
    from .models import Post,FundReceipt
    from observations.models import Sighting
    p=profile(user);balance=LedgerEntry.objects.filter(owner=user).aggregate(value=Sum('amount'))['value'] or 0
    sightings=Sighting.objects.filter(active=True,observation__capture__owner=user,observation__publication_state='published')
    missions=MissionParticipation.objects.filter(volunteer=user,state='approved',is_fixture=False,mission__is_fixture=False)
    posts=Post.objects.filter(author=user,moderation='published')
    support=FundReceipt.objects.filter(pledge__supporter=user,pledge__anonymous=False,is_fixture=False,campaign__is_fixture=False,campaign__state__in=['active','completed','closed'])
    count=sightings.count()+missions.count()+support.count()
    result={'id':str(user.pk),'createdAt':user.date_joined.isoformat(),'provenance':PROVENANCE,'username':user.username,'displayName':user.display_name or user.username,'bio':p.bio,'bannerId':p.banner_id,'avatar':avatar(user),'location':location(p.area) if p.show_location and p.area_id else None,'contributionCount':count if p.show_contributions else None}
    if private:
        result.update(email=user.email,settings={'showLocation':p.show_location,'showContributions':p.show_contributions,'discoverable':p.discoverable,'publicAttendance':p.public_attendance},roles=roles(user),shelterIds=[str(x) for x in user.shelters.values_list('pk',flat=True)]+[str(x) for x in user.managed_shelters.values_list('pk',flat=True)])
    else:
        helped=set(sightings.values_list('animal_id',flat=True));helped.update(missions.filter(mission__animal__isnull=False).values_list('mission__animal_id',flat=True))
        activities=[]
        if p.show_contributions:
            for entry in missions.select_related('mission').order_by('-reviewed_at')[:20]:
                activities.append({'id':str(entry.pk),'kind':'mission','title':entry.mission.title,'description':'An independently approved contribution.','href':'/missions/'+entry.mission.slug,'createdAt':entry.reviewed_at.isoformat()})
            for entry in sightings.select_related('animal','observation__capture').order_by('-approved_at')[:20]:
                activities.append({'id':str(entry.pk),'kind':'sighting','title':'Sighting of '+entry.animal.name,'description':entry.observation.capture.area_label or 'Accepted animal encounter','href':'/pets/'+entry.animal.slug if AnimalInfo.objects.filter(animal=entry.animal,published=True).exists() else '/spot/animals/'+str(entry.animal_id),'createdAt':entry.approved_at.isoformat()})
            for entry in support.select_related('campaign').order_by('-created_at')[:20]:
                activities.append({'id':str(entry.pk),'kind':'fundraiser','title':entry.campaign.title,'description':'Support recorded after independent evidence review.','href':'/fundraisers/'+entry.campaign.slug,'createdAt':entry.created_at.isoformat()})
            activities.sort(key=lambda r:r['createdAt'],reverse=True)
        from .achievements.engine import public_showcase
        achievement_display=public_showcase(user,request)
        result.update(activities=activities[:20] if p.show_contributions else None,impact={'kibbleEarned':max(0,balance),'eventsJoined':EventRsvp.objects.filter(attendee=user,public=True).count(),'membershipDays':max(0,(timezone.now()-user.date_joined).days),'levelProgress':max(0,balance)%250*100//250} if p.show_contributions else None,leaderboardRank=rank_for(user,request),mastery=achievement_display['mastery'],level=1+max(0,balance)//250 if p.show_contributions else None,badges=achievement_display['badges'],summary={'stories':posts.count(),'sightings':sightings.count(),'missions':missions.count(),'donations':support.count()} if p.show_contributions else None,animalsHelped=[animal_dto(a,request) for a in AnimalInfo.objects.select_related('animal','animal__photo').filter(animal_id__in=helped,published=True)[:20]] if p.show_contributions else [],stories=[post_dto(post,request) for post in posts.order_by('-created_at')[:5]])
    return result

class ProfileInput(serializers.Serializer):
    displayName=serializers.CharField(max_length=100)
    bio=serializers.CharField(max_length=1000,allow_blank=True)
    avatarId=serializers.CharField(allow_null=True,max_length=40)
    areaId=serializers.CharField(allow_null=True,max_length=120)
    bannerId=serializers.ChoiceField(choices=['meadow','sunset','explorer','home','starlight','champion','garden','coast'],required=False)
class Privacy(serializers.Serializer):
    publicAttendance=serializers.BooleanField(required=False)
    showLocation=serializers.BooleanField()
    showContributions=serializers.BooleanField()
    discoverable=serializers.BooleanField()

@api_view(['GET','PATCH'])
def me(request,section='profile'):
    user=auth(request);p=profile(user)
    if request.method=='GET':
        if section=='settings':return Response({'showLocation':p.show_location,'showContributions':p.show_contributions,'discoverable':p.discoverable,'publicAttendance':p.public_attendance})
        if section=='summary':
            from observations.models import Sighting
            from .animals import managed_animals
            return Response({'animals':managed_animals(user).count(),'sightings':Sighting.objects.filter(observation__capture__owner=user,active=True).count(),'applications':AdoptionApplication.objects.filter(applicant=user).count(),'unreadNotifications':Notification.objects.filter(recipient=user,read_at__isnull=True).count(),'kibbleBalance':LedgerEntry.objects.filter(owner=user).aggregate(value=Sum('amount'))['value'] or 0})
        return Response(user_dto(user,request,True))
    def run():
        if section=='settings':
            v=data(request,Privacy);p.show_location=v['showLocation'];p.show_contributions=v['showContributions'];p.discoverable=v['discoverable'];p.public_attendance=v.get('publicAttendance',p.public_attendance);p.save();v['publicAttendance']=p.public_attendance
            if not p.public_attendance:EventRsvp.objects.filter(attendee=user,public=True).update(public=False)
            return v
        v=data(request,ProfileInput)
        if v['avatarId'] and not re.fullmatch(r'pawtrail-avatar-(?:0[1-9]|[12][0-9]|30)',v['avatarId']):raise DomainError('Choose an available avatar.')
        area=get_object_or_404(Area,slug=v['areaId']) if v['areaId'] else None
        user.display_name=v['displayName'];user.save(update_fields=['display_name']);p.bio=v['bio'];p.avatar_id=v['avatarId'] or '';p.area=area;p.banner_id=v.get('bannerId',p.banner_id);p.save();return user_dto(user,request,True)
    return mutation(request,run)

@api_view(['GET'])
@permission_classes([AllowAny])
def users(request,username,preview=False):
    user=get_object_or_404(community_users(),username=username)
    if not profile(user).discoverable and (not request.user.is_authenticated or request.user.pk!=user.pk):raise DomainError('Profile not found.','NOT_FOUND',404)
    return Response(user_dto(user,request))

@api_view(['GET'])
@permission_classes([AllowAny])
def identities(request):
    ids=params(request).get('ids',[])
    if not isinstance(ids,list) or len(ids)>50:raise DomainError('Choose up to 50 people.')
    rows=community_users().filter(pk__in=[identifier(x) for x in ids],social_profile__discoverable=True)
    return Response({'items':[{'id':str(u.pk),**author_dto(u,request)} for u in rows]})

@api_view(['GET','PATCH','POST'])
def notifications(request,action=None):
    user=auth(request);rows=Notification.objects.filter(recipient=user).order_by('-created_at','-id')
    if action=='unread-count':return Response(rows.filter(read_at__isnull=True).count())
    if request.method=='GET':return Response(paginate(rows,request,lambda r:{**base(r),'recipientId':str(r.recipient_id),'kind':r.kind,'message':r.message,'ref':r.ref,'destinationHref':notification_destination(r,user),'readAt':r.read_at.isoformat() if r.read_at else None}))
    def run():
        ids=request.data.get('ids',[])
        if not isinstance(ids,list) or len(ids)>100:raise DomainError('Choose up to 100 notifications.')
        rows.filter(pk__in=[identifier(i) for i in ids],read_at__isnull=True).update(read_at=timezone.now());return None
    return mutation(request,run,204)

def notification_destination(row,user):
    if row.kind=='achievement':return '/dashboard/achievements'
    if row.kind=='application':
        if user.is_staff:return '/dashboard/shelter/applications'
        if row.ref:
            try:
                kind,key=row.ref['kind'],identifier(row.ref['id'])
                shelter=Shelter.objects.filter(pk=key).first() if kind=='shelter' else None
                if kind=='animal':
                    info=AnimalInfo.objects.select_related('shelter').filter(animal_id=key).first()
                    shelter=info.shelter if info else None
                if shelter and manages(user,shelter):return '/dashboard/shelter/applications'
            except (KeyError,DomainError):pass
        return '/dashboard/adoptions'
    if not row.ref:return None
    try:
        from .community import resource
        return resource(row.ref['kind'],row.ref['id'])[1]
    except (Http404,DomainError,KeyError):
        # Authors can still open their own pending/rejected story; removed and
        # inaccessible references must not turn into broken or private links.
        if row.ref.get('kind')=='post':
            from .models import Post
            try:key=identifier(row.ref.get('id'))
            except DomainError:return None
            if Post.objects.filter(pk=key,author=user).exclude(moderation='removed').exists():
                return '/community/'+str(key)
        return None

@api_view(['GET','PUT'])
def follows(request,kind=None,key=None):
    user=auth(request)
    if request.method=='GET':
        rows=Follow.objects.filter(user=user).order_by('-created_at','-id');p=params(request)
        if p.get('kind'):rows=rows.filter(kind=p['kind'])
        return Response(paginate(rows,request,lambda r:{**base(r),'followerId':str(user.pk),'target':{'kind':r.kind,'id':str(r.target_id)}}))
    def run():
        if kind not in ['animal','user']:raise DomainError('Choose a person or animal.')
        target=identifier(key)
        if kind=='user':get_object_or_404(community_users(),pk=target,social_profile__discoverable=True)
        else:get_object_or_404(AnimalInfo,animal_id=target,published=True)
        if data(request,Toggle)['active']:Follow.objects.get_or_create(user=user,kind=kind,target_id=target)
        else:Follow.objects.filter(user=user,kind=kind,target_id=target).delete()
        return None
    return mutation(request,run,204)
