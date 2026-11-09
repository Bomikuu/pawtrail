from zoneinfo import ZoneInfo
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from animals.models import Animal
from rewards.models import Wallet,LedgerEntry
from .models import Mission,MissionParticipation,Shelter,Horde,AnimalInfo
from .common import *

class MissionInput(serializers.Serializer):
    title=serializers.CharField(max_length=200)
    description=serializers.CharField(max_length=10000)
    kind=serializers.ChoiceField(choices=['mission','quest'])
    urgency=serializers.ChoiceField(choices=['critical','high','normal'])
    deadline=serializers.DateTimeField()
    rewardKibble=serializers.IntegerField(min_value=0,max_value=1000)
    location=Location()
    animalId=serializers.UUIDField(allow_null=True)
    shelterId=serializers.UUIDField(allow_null=True)
    hordeId=serializers.UUIDField(allow_null=True,required=False,default=None)
    evidenceRequirements=serializers.ListField(child=serializers.CharField(max_length=500),max_length=12)

class Evidence(Version):
    text=serializers.CharField(max_length=10000)
    mediaIds=serializers.ListField(child=serializers.UUIDField(),max_length=6)
class Review(Version):
    decision=serializers.ChoiceField(choices=['approved','rejected'])
    reason=serializers.CharField(min_length=1,max_length=2000)

def mission_dto(row,detail=False):
    result={**base(row),'slug':row.slug,'title':row.title,'kind':row.kind,'urgency':row.urgency,'state':row.state,'deadline':row.deadline.isoformat(),'rewardKibble':row.reward_kibble,'location':row.location,'animalId':str(row.animal_id) if row.animal_id else None,'shelterId':str(row.shelter_id) if row.shelter_id else None,'hordeId':str(row.horde_id) if row.horde_id else None,'organizerId':str(row.organizer_id)}
    if detail:result.update(description=row.description,evidenceRequirements=row.evidence_requirements,version=row.version)
    return result

def participation_dto(row):
    return {**base(row),'missionId':str(row.mission_id),'volunteerId':str(row.volunteer_id),'state':row.state,'evidence':{'text':row.evidence_text,'mediaIds':[str(x.pk) for x in row.evidence_media.all()],'expectedVersion':row.version} if row.submitted_at else None,'reviewerId':str(row.reviewer_id) if row.reviewer_id else None,'reviewReason':row.review_reason or None,'reviewedAt':row.reviewed_at.isoformat() if row.reviewed_at else None,'version':row.version}

@api_view(['GET','POST','PATCH'])
@permission_classes([AllowAny])
def missions(request,key=None):
    if request.method=='GET':
        rows=Mission.objects.select_related('organizer','shelter').order_by('-created_at','-id');p=params(request)
        if key:return Response(mission_dto(lookup(rows,key),True))
        if p.get('q'):rows=rows.filter(Q(title__icontains=p['q'])|Q(description__icontains=p['q']))
        for field in ['kind','urgency']:
            if p.get(field):rows=rows.filter(**{field:p[field]})
        if p.get('areaId'):rows=rows.filter(location__areaId=p['areaId'])
        status=p.get('status','all');now=timezone.now()
        if status in ['open','urgent']:rows=rows.filter(state='open',deadline__gt=now)
        if status=='urgent':rows=rows.exclude(urgency='normal')
        if status=='closed':rows=rows.filter(state='closed')
        if status=='expired':rows=rows.filter(deadline__lte=now)
        if p.get('sort')=='deadline':rows=rows.order_by('deadline','id')
        if p.get('sort')=='priority':rows=sorted(rows,key=lambda r:({'critical':0,'high':1,'normal':2}[r.urgency],r.deadline,str(r.pk)))
        return Response(paginate(rows,request,mission_dto))
    def run():
        user=auth(request);v=data(request,MissionInput)
        if v['deadline']<=timezone.now():raise DomainError('The mission deadline must be in the future.')
        shelter=lookup(Shelter.objects.filter(published=True),v['shelterId']) if v['shelterId'] else None
        horde=lookup(Horde.objects.filter(published=True),v['hordeId']) if v['hordeId'] else None
        animal=lookup(Animal,v['animalId']) if v['animalId'] else None
        if shelter:manager(request,shelter)
        if horde and not own(user,horde):raise DomainError('You cannot organize for this Horde.','FORBIDDEN',403)
        if animal and not AnimalInfo.objects.filter(animal=animal,published=True).exists():raise DomainError('Choose a published animal.')
        if v['rewardKibble'] and animal and AnimalInfo.all_objects.filter(animal=animal,is_fixture=True).exists():raise DomainError('Verified Kibble rewards require a genuine, evidence-supported animal record.')
        if v['rewardKibble'] and not (user.is_staff or shelter and manages(user,shelter)):raise DomainError('Only authorized shelter staff can set Kibble rewards.','FORBIDDEN',403)
        if key:
            raise DomainError('Close an existing mission or create a new task; reward terms cannot be silently changed.','CONFLICT',409)
        row=Mission.objects.create(organizer=user,slug=slug(v['title']),title=v['title'],description=v['description'],kind=v['kind'],urgency=v['urgency'],deadline=v['deadline'],reward_kibble=v['rewardKibble'],location=v['location'],shelter=shelter,horde=horde,animal=animal,evidence_requirements=v['evidenceRequirements'])
        audit(user,row,'create');return mission_dto(row,True)
    return mutation(request,run,201)

@api_view(['POST'])
def accept(request,key):
    def run():
        user=auth(request);m=lookup(Mission.objects.select_for_update(),key)
        if m.state!='open' or m.deadline<=timezone.now():raise DomainError('This mission is no longer accepting helpers.','CONFLICT',409)
        row,_=MissionParticipation.objects.get_or_create(mission=m,volunteer=user,defaults={'is_fixture':m.is_fixture})
        return participation_dto(row)
    return mutation(request,run)

@api_view(['GET'])
def participations(request):
    user=auth(request);p=params(request);rows=MissionParticipation.objects.select_related('mission__shelter').order_by('-created_at','-id')
    if p.get('scope')=='organization':
        if not user.is_staff:rows=rows.filter(Q(mission__shelter__staff=user)|Q(mission__shelter__owner=user)|Q(mission__organizer=user)).distinct()
    else:rows=rows.filter(volunteer=user)
    if p.get('missionId'):rows=rows.filter(mission_id=identifier(p['missionId']))
    if p.get('state'):rows=rows.filter(state=p['state'])
    return Response(paginate(rows,request,participation_dto))

@api_view(['POST'])
def evidence(request,key):
    def run():
        user=auth(request);row=lookup(MissionParticipation.objects.select_for_update(),key);v=data(request,Evidence)
        if row.volunteer_id!=user.pk:raise DomainError('Only the volunteer can submit evidence.','FORBIDDEN',403)
        version(row,v['expectedVersion'])
        if row.state not in ['accepted','rejected']:raise DomainError('This participation is not accepting evidence.','CONFLICT',409)
        if row.mission.state!='open' or row.mission.deadline<=timezone.now():raise DomainError('This mission has closed or expired.','CONFLICT',409)
        files=media_owned(user,v['mediaIds'])
        if any(a.public or a.purpose!='private_evidence' for a in files):raise DomainError('Mission evidence must use private-evidence uploads.')
        row.evidence_text=v['text'];row.evidence_media.set(files);row.submitted_at=timezone.now();row.state='submitted';row.reviewer=None;row.reviewed_at=None;row.review_reason='';touch(row)
        notify_team(row.mission.organizer,row.mission.shelter,'mission','Evidence is ready for '+row.mission.title,{'kind':'mission','id':str(row.mission_id)})
        return participation_dto(row)
    return mutation(request,run)

def reconcile_reward(row):
    # Fixtures and fictional identities never create authoritative contribution credit.
    animal_info=AnimalInfo.all_objects.filter(animal_id=row.mission.animal_id).first() if row.mission.animal_id else None
    eligible=row.mission.organizer_id!=row.volunteer_id and row.reviewer_id is not None and row.reviewer_id!=row.volunteer_id and not row.is_fixture and not row.mission.is_fixture and not profile(row.volunteer).is_fixture and not (animal_info and animal_info.is_fixture)
    target=row.mission.reward_kibble if row.state=='approved' and eligible else 0
    amount=target-row.credited
    if not amount:return
    Wallet.objects.get_or_create(owner=row.volunteer)
    wallet=Wallet.objects.select_for_update().get(owner=row.volunteer)
    if wallet.balance+amount<0:raise DomainError('The wallet requires reconciliation before reversing this credit.','CONFLICT',409)
    wallet.balance+=amount;wallet.save(update_fields=['balance','updated_at']);row.reward_revision+=1
    LedgerEntry.objects.create(owner=row.volunteer,mission_participation=row,revision=row.reward_revision,amount=amount,balance_after=wallet.balance,reason='mission_approved' if amount>0 else 'mission_reversed',description=('Approved mission: ' if amount>0 else 'Mission reward reversed: ')+row.mission.title[:170],animal_id_snapshot=row.mission.animal_id,animal_name_snapshot=row.mission.animal.name if row.mission.animal_id else '',reward_day=timezone.now().astimezone(ZoneInfo('Asia/Manila')).date(),observation_version=row.version)
    row.credited=target;row.save(update_fields=['credited','reward_revision'])

@api_view(['POST'])
def review(request,key):
    def run():
        # Related shelter/animal rows can be NULL. Lock only the participation;
        # locking the joined volunteer would also invert the member/wallet order.
        user=auth(request);row=lookup(MissionParticipation.objects.select_for_update(of=('self',)).select_related('mission__shelter','mission__animal','volunteer'),key);v=data(request,Review)
        if not own(user,row.mission):raise DomainError('Mission staff permission is required.','FORBIDDEN',403)
        if row.volunteer_id==user.pk:raise DomainError('An independent reviewer must assess your contribution.','FORBIDDEN',403)
        version(row,v['expectedVersion'])
        if row.state not in ['submitted','approved']:raise DomainError('Only submitted evidence or an existing approval can be reviewed.','CONFLICT',409)
        if v['decision']=='approved' and (not row.submitted_at or not row.evidence_text.strip() or not row.evidence_media.filter(mime_type='image/jpeg').exists()):raise DomainError('Approval requires submitted text and at least one evidence photo.')
        before=row.version;row.state=v['decision'];row.reviewer=user;row.reviewed_at=timezone.now();row.review_reason=v['reason'];touch(row);reconcile_reward(row);audit(user,row,row.state,v['reason'],before)
        notify(row.volunteer,'mission','Your contribution to '+row.mission.title+' was '+row.state,{'kind':'mission','id':str(row.mission_id)})
        return participation_dto(row)
    return mutation(request,run)

@api_view(['POST'])
def close(request,key):
    def run():
        row=lookup(Mission.objects.select_for_update(),key);user=owner(request,row);version(row,data(request,Version)['expectedVersion']);row.state='closed';touch(row);audit(user,row,'close');return mission_dto(row,True)
    return mutation(request,run)
