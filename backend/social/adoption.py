from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import AdoptionPreferences,AdoptionInterest,AdoptionApplication,AnimalInfo
from .animals import animal_dto,public_animals
from .common import *

class Preferences(serializers.Serializer):
    species=serializers.ChoiceField(choices=['cat','dog','other'],required=False)
    homeType=serializers.ChoiceField(choices=['apartment','house','farm'],required=False)
    activity=serializers.ChoiceField(choices=['low','medium','high'],required=False)
    experience=serializers.ChoiceField(choices=['novice','experienced'],required=False)
    otherPets=serializers.ListField(child=serializers.ChoiceField(choices=['cat','dog','other']),required=False)
    originAreaId=serializers.CharField(max_length=120,required=False)
    maxDistanceKm=serializers.FloatField(min_value=.01,max_value=20000,required=False)
    minAgeMonths=serializers.IntegerField(min_value=0,max_value=600,required=False)
    maxAgeMonths=serializers.IntegerField(min_value=0,max_value=600,required=False)
    size=serializers.ChoiceField(choices=['small','medium','large'],required=False)
    personality=serializers.ListField(child=serializers.CharField(max_length=100),max_length=12,required=False)
    def validate(self,v):
        if v.get('minAgeMonths',0)>v.get('maxAgeMonths',600):raise serializers.ValidationError('Minimum age must not exceed maximum age.')
        return v

class Answers(serializers.Serializer):
    fullName=serializers.CharField(max_length=150)
    email=serializers.EmailField()
    phone=serializers.CharField(max_length=50)
    livingSituation=serializers.CharField(max_length=3000)
    careExperience=serializers.CharField(max_length=3000)
    motivation=serializers.CharField(max_length=3000)
    agreement=serializers.BooleanField()
    def validate_agreement(self,value):
        if value is not True:raise serializers.ValidationError('Confirm the adoption agreement.')
        return value
class Apply(serializers.Serializer):
    animalId=serializers.UUIDField()
    draftId=serializers.UUIDField(required=False)
    expectedVersion=serializers.IntegerField(min_value=1,required=False)
    answers=Answers()
class ApplicationReview(Version):
    decision=serializers.ChoiceField(choices=['needs_information','approved','rejected'])
    message=serializers.CharField(max_length=3000)

def candidate(info,request,prefs):
    components=[];needs=info.needs
    def add(name,weight,score,explanation):components.append({'dimension':name,'weight':weight,'score':score,'evidence':[],'explanation':explanation})
    if prefs.get('species'):add('species',3,1 if prefs['species']==info.animal.species else 0,'Compared with your preferred species.')
    if prefs.get('homeType') and needs.get('suitableHomeTypes'):add('home',2,1 if prefs['homeType'] in needs['suitableHomeTypes'] else 0,'Compared with the shelter’s listed home requirements.')
    if prefs.get('activity') and needs.get('energy'):add('lifestyle',2,1 if prefs['activity']==needs['energy'] else .5,'Compared with the recorded energy level.')
    if prefs.get('experience') and 'requiresExperiencedHandler' in needs:add('experience',2,0 if needs['requiresExperiencedHandler'] and prefs['experience']=='novice' else 1,'Compared with recorded handling requirements.')
    if 'otherPets' in prefs and (needs.get('compatiblePetTypes') or needs.get('incompatiblePetTypes')):add('otherPets',2,0 if set(prefs['otherPets'])&set(needs.get('incompatiblePetTypes',[])) else 1,'Compared with recorded pet compatibility; an introduction is still needed.')
    weight=sum(c['weight'] for c in components)
    score=round(100*sum(c['weight']*c['score'] for c in components)/weight) if weight else None
    return {'animal':animal_dto(info,request,True),'compatibility':{'score':score,'answeredWeight':weight,'components':components,'advisories':['Profile suggestions are not an adoption decision. Shelter staff confirm the fit and arrange an introduction.']}}

def candidates_rows(p):
    rows=public_animals().filter(adoptable=True,status__in=['community','sheltered'],shelter__published=True)
    if p.get('shelterId'):rows=rows.filter(shelter_id=identifier(p['shelterId']))
    if p.get('q'):rows=rows.filter(animal__name__icontains=p['q'])
    return rows

@api_view(['GET','PUT'])
def preferences(request):
    user=auth(request)
    if request.method=='GET':return Response(AdoptionPreferences.objects.get_or_create(user=user)[0].values)
    def run():
        value=data(request,Preferences);row,_=AdoptionPreferences.objects.get_or_create(user=user);row.values=value;row.save();return value
    return mutation(request,run)

@api_view(['GET'])
@permission_classes([AllowAny])
def candidates(request):
    p=params(request);validator=Preferences(data=p.get('preferences',{}));validator.is_valid(raise_exception=True);prefs=validator.validated_data
    rows=candidates_rows(p)
    if prefs.get('species'):rows=rows.filter(animal__species=prefs['species'])
    if prefs.get('size'):rows=rows.filter(size=prefs['size'])
    if 'minAgeMonths' in prefs:rows=rows.filter(age_months__gte=prefs['minAgeMonths'])
    if 'maxAgeMonths' in prefs:rows=rows.filter(age_months__lte=prefs['maxAgeMonths'])
    if prefs.get('originAreaId') and prefs.get('maxDistanceKm'):
        from .models import Area
        area=Area.objects.filter(slug=prefs['originAreaId']).first()
        if area:rows=[r for r in rows if distance({'latitude':area.latitude,'longitude':area.longitude},r.location)<=prefs['maxDistanceKm']*1000]
    return Response(paginate(rows,request,lambda r:candidate(r,request,prefs)))

@api_view(['GET','PUT'])
def interested(request,key=None):
    user=auth(request)
    if request.method=='GET':
        rows=public_animals().filter(animal_id__in=AdoptionInterest.objects.filter(user=user).values_list('animal_id',flat=True))
        return Response(paginate(rows,request,lambda r:candidate(r,request,AdoptionPreferences.objects.get_or_create(user=user)[0].values)))
    def run():
        info=get_object_or_404(candidates_rows({}),animal_id=identifier(key));value=request.data.get('interested')
        if type(value)!=bool:raise DomainError('Choose an interest state.')
        if value:AdoptionInterest.objects.get_or_create(user=user,animal=info.animal)
        else:AdoptionInterest.objects.filter(user=user,animal=info.animal).delete()
        return None
    return mutation(request,run,204)

def application_dto(row,detail=True):
    result={**base(row),'animalId':str(row.animal_id),'shelterId':str(row.shelter_id),'applicantId':str(row.applicant_id),'status':row.status,'version':row.version}
    if detail:result.update(answers=row.answers,reviewMessage=row.review_message or None,history=row.history)
    return result

def app_access(user,row):
    if row.applicant_id!=user.pk and not manages(user,row.shelter):raise DomainError('Application not found.','NOT_FOUND',404)

def history(row,user,status,message):
    row.history=[*row.history,{'status':status,'message':message,'actorId':str(user.pk),'createdAt':timezone.now().isoformat(),'version':row.version+1}];row.status=status;touch(row)

@api_view(['PUT'])
def draft(request,key):
    def run():
        user=auth(request);v=normalize(request.data);info=get_object_or_404(candidates_rows({}).select_for_update(),animal_id=identifier(key))
        if str(v.get('animalId'))!=str(info.animal_id):raise DomainError('The draft animal does not match.')
        if user.pk==info.caretaker_id or manages(user,info.shelter):raise DomainError('An independent adopter account must apply.','FORBIDDEN',403)
        if v.get('id'):
            row=get_object_or_404(AdoptionApplication.objects.select_for_update(),pk=identifier(v['id']),applicant=user,animal=info.animal,status='draft');version(row,v.get('expectedVersion'))
        else:
            row=AdoptionApplication.objects.filter(applicant=user,animal=info.animal,status__in=['draft','submitted','needs_information','approved']).first()
            if row and row.status!='draft':raise DomainError('An active application already exists.','CONFLICT',409)
            if row:version(row,v.get('expectedVersion'))
            else:row=AdoptionApplication.objects.create(applicant=user,animal=info.animal,shelter=info.shelter,is_fixture=info.is_fixture or info.shelter.is_fixture)
        validator=Answers(data=v.get('answers',{}),partial=True);validator.is_valid(raise_exception=True);row.answers=validator.validated_data;touch(row)
        return {'id':str(row.pk),'animalId':str(row.animal_id),'answers':row.answers,'expectedVersion':row.version}
    return mutation(request,run)

@api_view(['GET','POST'])
def applications(request,key=None):
    user=auth(request)
    if request.method=='GET':
        rows=AdoptionApplication.objects.select_related('shelter').order_by('-created_at','-id');p=params(request)
        if key:
            row=lookup(rows,key);app_access(user,row);return Response(application_dto(row))
        if p.get('scope')=='shelter':
            if not user.is_staff:rows=rows.filter(Q(shelter__staff=user)|Q(shelter__owner=user)).distinct()
        else:rows=rows.filter(applicant=user)
        if p.get('shelterId'):rows=rows.filter(shelter_id=identifier(p['shelterId']))
        if p.get('status'):rows=rows.filter(status=p['status'])
        return Response(paginate(rows,request,lambda r:application_dto(r,False)))
    def run():
        v=data(request,Apply);info=get_object_or_404(candidates_rows({}).select_for_update(),animal_id=v['animalId'])
        if user.pk==info.caretaker_id or manages(user,info.shelter):raise DomainError('An independent adopter account must apply.','FORBIDDEN',403)
        if v.get('draftId'):
            row=get_object_or_404(AdoptionApplication.objects.select_for_update(),pk=v['draftId'],applicant=user,animal=info.animal,status='draft');version(row,v.get('expectedVersion'))
        else:
            if AdoptionApplication.objects.filter(animal=info.animal,applicant=user,status__in=['draft','submitted','needs_information','approved']).exists():raise DomainError('You already have an active application.','CONFLICT',409)
            row=AdoptionApplication.objects.create(applicant=user,animal=info.animal,shelter=info.shelter,is_fixture=info.is_fixture or info.shelter.is_fixture)
        row.answers=v['answers'];history(row,user,'submitted','Application submitted for shelter review.');notify_team(info.shelter.owner,info.shelter,'application','A new adoption application is ready.',{'kind':'animal','id':str(info.animal_id)})
        return application_dto(row)
    return mutation(request,run,201)

@api_view(['POST'])
def application_action(request,key,action):
    def run():
        user=auth(request);original=lookup(AdoptionApplication,key)
        info=get_object_or_404(AnimalInfo.objects.select_for_update(),animal=original.animal)
        row=lookup(AdoptionApplication.objects.select_for_update().select_related('shelter'),key);app_access(user,row)
        if action=='withdraw':
            if row.applicant_id!=user.pk:raise DomainError('Only the applicant can withdraw.','FORBIDDEN',403)
            if row.status not in ['draft','submitted','needs_information','approved']:raise DomainError('This application cannot be withdrawn.','CONFLICT',409)
            if info.status=='adopted':raise DomainError('The handover is already recorded; contact the shelter for follow-up.','CONFLICT',409)
            was_approved=row.status=='approved';history(row,user,'withdrawn','Withdrawn by the applicant.')
            if was_approved and info.status!='adopted':info.adoptable=True;touch(info)
        elif action=='resubmit':
            if row.applicant_id!=user.pk:raise DomainError('Only the applicant can resubmit.','FORBIDDEN',403)
            v=data(request,Apply);version(row,v.get('expectedVersion'))
            if str(v['animalId'])!=str(row.animal_id) or row.status!='needs_information':raise DomainError('This application cannot be resubmitted.','CONFLICT',409)
            row.answers=v['answers'];history(row,user,'submitted','Additional information submitted.')
        elif action=='review':
            manager(request,row.shelter);v=data(request,ApplicationReview);version(row,v['expectedVersion'])
            if row.applicant_id==user.pk:raise DomainError('An independent staff member must review your application.','FORBIDDEN',403)
            if row.status not in ['submitted','needs_information']:raise DomainError('This application is no longer under review.','CONFLICT',409)
            if v['decision']=='approved':
                if not info.adoptable or info.status not in ['community','sheltered'] or AdoptionApplication.objects.filter(animal=row.animal,status='approved').exists():raise DomainError('The animal is no longer available for approval.','CONFLICT',409)
                info.adoptable=False;touch(info)
            row.review_message=v['message'];history(row,user,v['decision'],v['message']);audit(user,row,'adoption_'+v['decision'],v['message']);notify(row.applicant,'application','Your adoption application was updated.',{'kind':'animal','id':str(row.animal_id)})
        elif action=='handover':
            manager(request,row.shelter)
            if row.status!='approved' or info.status=='adopted':raise DomainError('An approved application is required for handover.','CONFLICT',409)
            info.status='adopted';info.caretaker=row.applicant;info.adoptable=False;touch(info);history(row,user,'approved','Shelter recorded the completed handover.');audit(user,row,'handover','Shelter recorded completed handover.')
        else:raise DomainError('Action not found.','NOT_FOUND',404)
        return application_dto(row)
    return mutation(request,run)
