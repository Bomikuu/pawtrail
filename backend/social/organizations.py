from django.db import transaction
from django.db.models import Q
from rest_framework import serializers
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Shelter,Horde,AnimalInfo,MissionParticipation,AdoptionApplication
from .common import Location,base,image,paginate,params,lookup,owner,manager,mutation,data,auth,slug,version,touch,identifier,manages

class OrganizationInput(serializers.Serializer):
    name=serializers.CharField(max_length=150)
    description=serializers.CharField(max_length=5000)
    location=Location()
    expectedVersion=serializers.IntegerField(min_value=1,required=False)
    published=serializers.BooleanField(required=False,default=True)


def shelter_dto(row,detail=False):
    result={**base(row),'slug':row.slug,'name':row.name,'description':row.description,'location':row.location,'photo':image(row.photo),'verification':{'status':'verified' if row.verified else 'unverified','label':'Verified organization' if row.verified else 'Not independently verified','evidenceRefs':[]}}
    if detail:result.update(animalIds=[str(x) for x in row.animals.filter(published=True).values_list('animal_id',flat=True)],fundraiserIds=[str(x) for x in row.campaigns.filter(state__in=['active','completed','closed']).values_list('id',flat=True)],eventIds=[str(x) for x in row.events.values_list('id',flat=True)],missionIds=[str(x) for x in row.missions.values_list('id',flat=True)],postIds=[],staffIds=[str(row.owner_id)]+[str(x) for x in row.staff.values_list('id',flat=True)])
    result['version']=row.version
    return result

def horde_dto(row,detail=False):
    result={**base(row),'slug':row.slug,'name':row.name,'description':row.description,'location':row.location,'photo':image(row.photo),'animalIds':[str(x) for x in row.animals.filter(published=True).values_list('animal_id',flat=True)],'contributorIds':[str(x) for x in row.contributors.values_list('id',flat=True)]}
    if detail:result.update(sightingIds=[],postIds=[],fundraiserIds=[str(x) for x in row.campaigns.filter(state__in=['active','completed','closed']).values_list('id',flat=True)],missionIds=[str(x) for x in row.missions.values_list('id',flat=True)])
    result['version']=row.version
    return result

def organizations(request,kind,key=None):
    model=Shelter if kind=='shelter' else Horde;dto=shelter_dto if model is Shelter else horde_dto
    if request.method=='GET':
        rows=model.objects.filter(published=True).order_by('-created_at','-id')
        if key:return Response(dto(lookup(rows,key),True))
        p=params(request)
        if p.get('q'):rows=rows.filter(Q(name__icontains=p['q'])|Q(description__icontains=p['q']))
        return Response(paginate(rows,request,dto))
    def run():
        user=auth(request);values=data(request,OrganizationInput)
        if key:
            row=lookup(model.objects.select_for_update(),key);owner(request,row);version(row,values.pop('expectedVersion',None))
            for name in ['name','description','location','published']:setattr(row,name,values[name])
            touch(row)
        else:
            if not user.is_staff:raise serializers.ValidationError('Organization creation requires a moderator account.')
            values.pop('expectedVersion',None);row=model.objects.create(owner=user,slug=slug(values['name']),**values)
        return dto(row,True)
    return mutation(request,run,201 if request.method=='POST' else 200)

@api_view(['GET','POST','PATCH'])
@permission_classes([AllowAny])
def shelters(request,key=None):return organizations(request,'shelter',key)
@api_view(['GET','POST','PATCH'])
@permission_classes([AllowAny])
def hordes(request,key=None):return organizations(request,'horde',key)

@api_view(['GET'])
def shelter_dashboard(request,key):
    row=lookup(Shelter,key);manager(request,row)
    return Response({'shelterId':str(row.pk),'pendingApplications':row.applications.filter(status__in=['submitted','needs_information']).count(),'pendingEvidence':MissionParticipation.objects.filter(mission__shelter=row,state='submitted').count(),'animalIds':[str(x) for x in row.animals.values_list('animal_id',flat=True)],'fundraiserIds':[str(x) for x in row.campaigns.values_list('id',flat=True)],'missionIds':[str(x) for x in row.missions.values_list('id',flat=True)],'eventIds':[str(x) for x in row.events.values_list('id',flat=True)],'volunteerIds':[str(x) for x in MissionParticipation.objects.filter(mission__shelter=row).values_list('volunteer_id',flat=True).distinct()]})

@api_view(['PUT'])
def shelter_staff(request,key):
    def run():
        row=lookup(Shelter.objects.select_for_update(),key)
        user=auth(request)
        if not user.is_staff and row.owner_id!=user.pk:raise serializers.ValidationError('Only the organization owner can change staff.')
        incoming=request.data.get('userIds',request.data.get('user_ids',[]))
        if not isinstance(incoming,list) or len(incoming)>50:raise serializers.ValidationError('Choose up to 50 staff members.')
        from django.contrib.auth import get_user_model
        users=list(get_user_model().objects.filter(pk__in=[identifier(x) for x in incoming],is_active=True))
        if len(users)!=len(set(incoming)):raise serializers.ValidationError('A staff account is unavailable.')
        row.staff.set(users);return shelter_dto(row,True)
    return mutation(request,run)

@api_view(['PUT'])
def horde_members(request,key):
    def run():
        row=lookup(Horde.objects.select_for_update(),key);owner(request,row)
        incoming=request.data.get('animalIds',request.data.get('animal_ids',[]))
        if not isinstance(incoming,list) or len(incoming)>100:raise serializers.ValidationError('Choose up to 100 animals.')
        infos=list(AnimalInfo.objects.select_for_update().filter(animal_id__in=[identifier(x) for x in incoming],published=True))
        if len(infos)!=len(set(incoming)):raise serializers.ValidationError('An animal is unavailable.')
        for info in infos:
            if not request.user.is_staff and info.caretaker_id!=request.user.pk and not manages(request.user,info.shelter):raise serializers.ValidationError('You cannot assign an animal you do not manage.')
        AnimalInfo.objects.filter(horde=row).exclude(pk__in=[i.pk for i in infos]).update(horde=None)
        AnimalInfo.objects.filter(pk__in=[i.pk for i in infos]).update(horde=row)
        touch(row);return horde_dto(row,True)
    return mutation(request,run)
