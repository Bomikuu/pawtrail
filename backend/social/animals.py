from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from animals.models import Animal
from observations.models import Sighting
from .models import AnimalInfo,Shelter,Horde,Mission,Campaign,Post,Saved,Follow,MissionParticipation
from .common import *

class AnimalInput(serializers.Serializer):
    verificationEvidenceIds=serializers.ListField(child=serializers.UUIDField(),max_length=6,required=False)
    name=serializers.CharField(max_length=100,required=False)
    species=serializers.ChoiceField(choices=['cat','dog'],required=False)
    description=serializers.CharField(max_length=5000,required=False)
    appearance=serializers.CharField(max_length=1000,required=False,allow_blank=True)
    location=Location(required=False)
    mediaIds=serializers.ListField(child=serializers.UUIDField(),max_length=6,required=False,default=list)
    verificationEvidenceIds=serializers.ListField(child=serializers.UUIDField(),max_length=6,required=False)
    shelterId=serializers.UUIDField(required=False,allow_null=True)
    hordeId=serializers.UUIDField(required=False,allow_null=True)
    ageMonths=serializers.IntegerField(min_value=0,max_value=600,allow_null=True,required=False)
    gender=serializers.ChoiceField(choices=['female','male','unknown'],required=False)
    size=serializers.ChoiceField(choices=['small','medium','large','unknown'],required=False)
    status=serializers.ChoiceField(choices=['community','sheltered','owned','adopted','missing'],required=False)
    adoptable=serializers.BooleanField(required=False)
    bannerId=serializers.CharField(max_length=40,required=False)
    expectedVersion=serializers.IntegerField(min_value=1,required=False)


def public_animals():
    return AnimalInfo.objects.select_related('animal__photo','shelter','horde','caretaker').filter(published=True).order_by('-created_at','-id')

def managed_animals(user):
    return AnimalInfo.objects.select_related('animal__photo','shelter','horde','caretaker').filter(Q(caretaker=user)|Q(shelter__staff=user)|Q(shelter__owner=user)).distinct().order_by('-created_at','-id')

def animal_dto(info,request=None,detail=False):
    a=info.animal
    result={'id':str(a.pk),'createdAt':a.created_at.isoformat(),'provenance':PROVENANCE,'reviewState':'published' if info.published else 'pending',
        'slug':a.slug,'name':a.name,'species':a.species,'ageMonths':info.age_months,'gender':info.gender,'size':info.size,
        'adoptable':info.adoptable and info.status in ['community','sheltered'],'status':info.status,'location':info.location,
        'photo':image(a.photo),'appearance':a.appearance,'shelterId':str(info.shelter_id) if info.shelter_id else None,'hordeId':str(info.horde_id) if info.horde_id else None,
        'verification':{'status':'verified' if a.state=='confirmed' and not info.is_fixture else 'unverified','label':'Identity reviewed' if a.state=='confirmed' and not info.is_fixture else 'Identity not independently confirmed','evidenceRefs':[]}}
    if detail:
        from django.contrib.auth import get_user_model
        ids=set(MissionParticipation.objects.filter(mission__animal=a,mission__is_fixture=False,is_fixture=False,state='approved').values_list('volunteer_id',flat=True))
        ids.update(Sighting.objects.filter(animal=a,active=True,observation__publication_state='published').values_list('observation__capture__owner_id',flat=True))
        helpers=list(get_user_model().objects.filter(pk__in=ids,social_profile__is_fixture=False,social_profile__discoverable=True,social_profile__show_contributions=True).order_by('username'))
        uid=request.user.pk if request and request.user.is_authenticated else None
        missions=Mission.objects.filter(animal=a);campaigns=Campaign.objects.filter(animal=a,state__in=['active','completed','closed'])
        result.update(bannerId=info.banner_id,viewerCanManage=bool(uid and (info.caretaker_id==uid or manages(request.user,info.shelter))),description=a.description,
            appearance=a.appearance,observedCondition=info.observed_condition,personality=info.personality,behavior=info.behavior,characteristics=info.characteristics,badges=[],gallery=[x for x in [image(a.photo)] if x],needs=info.needs,
            postIds=[str(p.pk) for p in Post.objects.filter(moderation='published') if any(r.get('kind')=='animal' and r.get('id')==str(a.pk) for r in p.refs)],
            sightingIds=[str(x) for x in Sighting.objects.filter(animal=a,active=True,observation__publication_state='published').values_list('pk',flat=True)],fundraiserIds=[str(x) for x in campaigns.values_list('pk',flat=True)],missionIds=[str(x) for x in missions.values_list('pk',flat=True)],helperIds=[str(u.pk) for u in helpers],helpers=[{'displayName':u.display_name or u.username,'userId':str(u.pk)} for u in helpers],viewerSaved=bool(uid and Saved.objects.filter(user_id=uid,kind='animal',target_id=a.pk).exists()),version=info.version)
    return result

@api_view(['GET','POST','PATCH'])
@permission_classes([AllowAny])
def animals(request,key=None):
    if request.method=='GET':
        rows=public_animals();p=params(request)
        if p.get('scope')=='mine':
            rows=managed_animals(auth(request))
        if key:
            animal=lookup(Animal,key);info=rows.filter(animal=animal).first()
            if not info and request.user.is_authenticated:
                candidate=AnimalInfo.objects.select_related('animal__photo','shelter','horde','caretaker').filter(animal=animal).first()
                if candidate and (candidate.caretaker_id==request.user.pk or manages(request.user,candidate.shelter)):info=candidate
            if not info:raise DomainError('Animal profile not found.','NOT_FOUND',404)
            return Response(animal_dto(info,request,True))
        if p.get('q'):rows=rows.filter(Q(animal__name__icontains=p['q'])|Q(animal__appearance__icontains=p['q']))
        for param,field in [('species','animal__species'),('shelterId','shelter_id'),('hordeId','horde_id'),('adoptable','adoptable')]:
            if param in p:rows=rows.filter(**{field:p[param]})
        if p.get('areaId'):rows=rows.filter(location__areaId=p['areaId'])
        if 'ids' in p:rows=rows.filter(animal_id__in=[identifier(x) for x in p['ids']])
        if p.get('saved'):
            user=auth(request);rows=rows.filter(animal_id__in=Saved.objects.filter(user=user,kind='animal').values_list('target_id',flat=True))
        return Response(paginate(rows,request,lambda r:animal_dto(r,request)))
    def run():
        user=auth(request);v=data(request,AnimalInput)
        if key:
            a=lookup(Animal.objects.select_for_update(),key);info=get_object_or_404(AnimalInfo.objects.select_for_update(),animal=a)
            if info.caretaker_id!=user.pk and not manages(user,info.shelter):raise DomainError('Only a caretaker or shelter staff can edit this animal.','FORBIDDEN',403)
            version(info,v.pop('expectedVersion',None))
        else:
            if not all(k in v for k in ['name','species','description','location']):raise DomainError('Name, species, description and a public approximate location are required.')
            a=Animal.objects.create(owner=user,name=v['name'],slug=slug(v['name']),species=v['species'],description=v['description'],appearance=v.get('appearance',''),area_label=v['location']['neighborhood'])
            info=AnimalInfo.objects.create(animal=a,caretaker=user,location=v['location'])
        previous_photo=a.photo
        for key2 in ['shelter','horde']:
            fk=v.get(key2+'Id')
            if key2+'Id' in v:
                related=lookup(Shelter if key2=='shelter' else Horde,fk) if fk else None
                if related and not own(user,related):raise DomainError('Only staff can associate an animal with this organization.','FORBIDDEN',403)
                setattr(info,key2,related)
        for f in ['name','species','description','appearance']:
            if f in v:setattr(a,f,v[f])
        for src,dest in [('ageMonths','age_months'),('gender','gender'),('size','size'),('status','status'),('adoptable','adoptable'),('location','location'),('bannerId','banner_id')]:
            if src in v:setattr(info,dest,v[src])
        if info.adoptable and not info.shelter_id:raise DomainError('Adoption requires an accountable shelter.')
        if 'mediaIds' in v:
            assets=media_owned(user,v['mediaIds'])
            if any(asset.purpose=='private_evidence' or asset.sensitive for asset in assets):raise DomainError('Private or sensitive evidence cannot be used as a public profile photograph.')
            a.photo=assets[0] if assets else None
        if 'verificationEvidenceIds' in v:
            evidence=media_owned(user,v['verificationEvidenceIds'])
            if any(asset.purpose!='private_evidence' for asset in evidence):raise DomainError('Choose private evidence attachments for this review.')
        info.published=False
        a.version+=1;a.save();touch(info)
        if 'verificationEvidenceIds' in v:info.private_evidence.set(evidence)
        from .media_access import withdraw_unused_photos
        withdraw_unused_photos([previous_photo,a.photo])
        audit(user,info,'update')
        return animal_dto(info,request,True)
    return mutation(request,run,201 if request.method=='POST' else 200)

@api_view(['GET'])
@permission_classes([AllowAny])
def activity(request,key):
    from .people import author_dto
    from .community import post_dto
    a=lookup(Animal,key);info=get_object_or_404(public_animals(),animal=a);p=params(request)
    stories=[post for post in Post.objects.filter(moderation='published').select_related('author').order_by('-created_at') if any(r.get('kind')=='animal' and r.get('id')==str(a.pk) for r in post.refs)]
    sightings=list(Sighting.objects.filter(animal=a,active=True,observation__publication_state='published').select_related('observation__capture__owner','observation__capture__media').order_by('-observation__capture__captured_at','-approved_at','-id'))
    missions=Mission.objects.filter(animal=a,state='open',deadline__gt=timezone.now());campaigns=Campaign.objects.filter(animal=a,state='active')
    entries=[]
    for post in stories:
        entries.append({**base(post),'kind':'post','priority':1,'label':'Community story','title':'A story about '+a.name,'text':post.text,'href':'/community/'+str(post.pk),'author':{'userId':str(post.author_id),**author_dto(post.author,request)},'media':[i for i in (image(x) for x in post.photos.all()) if i],'location':info.location,'post':post_dto(post,request)})
    for sighting in sightings:
        c=sighting.observation.capture
        entries.append({'id':str(sighting.pk),'createdAt':sighting.approved_at.isoformat(),'provenance':PROVENANCE,'kind':'sighting','priority':1,'label':'Accepted sighting','title':a.name+' was seen','text':sighting.observation.notes,'href':'/pets/'+a.slug+'?tab=location','author':{'userId':str(c.owner_id),**author_dto(c.owner,request)},'media':[i for i in [image(c.media)] if i],'location':info.location,'post':None})
    from .missions import mission_dto
    for m in missions:
        entries.append({**base(m),'kind':'mission','priority':3 if m.urgency=='critical' else 2,'label':'Help needed','title':m.title,'text':m.description,'href':'/missions/'+m.slug,'author':{'userId':str(m.organizer_id),**author_dto(m.organizer,request)},'media':[],'location':m.location,'post':None})
    for c in campaigns:
        entries.append({**base(c),'kind':'fundraiser','priority':2,'label':'Fundraiser','title':c.title,'text':c.story,'href':'/fundraisers/'+c.slug,'author':{'userId':str(c.organizer_id),**author_dto(c.organizer,request)},'media':[i for i in (image(x) for x in c.photos.all()) if i],'location':c.location,'post':None})
    kind=p.get('kind','all')
    if kind=='sightings':entries=[e for e in entries if e['kind']=='sighting']
    elif kind=='help':entries=[e for e in entries if e['kind'] in ['mission','fundraiser']]
    elif kind=='tagged':entries=[e for e in entries if e['kind']=='post']
    entries.sort(key=lambda e:((e['priority'] if p.get('sort')!='newest' else 0),e['createdAt'],e['id']),reverse=True)
    latest=next((row.observation.capture for row in sightings if row.observation.capture.captured_at and row.observation.capture.latitude is not None and row.observation.capture.longitude is not None),None)
    last_seen=None
    if latest:
        # Reuse the public sighting precision; exact capture coordinates stay private.
        last_seen={'observedAt':latest.captured_at.isoformat(),'location':{'areaId':'reported-area','neighborhood':latest.area_label or info.location.get('neighborhood','Approximate reported area'),'latitude':round(latest.latitude,2),'longitude':round(latest.longitude,2),'approximateRadiusMeters':max(1500,latest.accuracy_meters or 0)}}
    result=paginate(entries,request,lambda x:x)
    result.update(summary={'taggedPosts':len(stories),'sightings':len(sightings),'helpers':len(set(MissionParticipation.objects.filter(mission__animal=a,mission__is_fixture=False,is_fixture=False,state='approved').values_list('volunteer_id',flat=True)) | set(s.observation.capture.owner_id for s in sightings)),'followers':Follow.objects.filter(kind='animal',target_id=a.pk).count(),'openMissions':missions.count(),'activeFundraisers':campaigns.count()},photos=[{'image':im,'href':e['href'],'credit':e['author']['displayName']} for e in entries for im in e['media']],latestSighting=last_seen)
    return Response(result)
