from zoneinfo import ZoneInfo
from django.db import transaction
from django.db.models import Count, Min, Q
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from animals.models import Animal
from media.models import Asset
from .models import AnimalInfo, AnimalMedicalRecord, AnimalMedicalRevision
from .common import auth, manages, lookup, data, params, paginate, mutation, version, touch, audit
from config.errors import DomainError

KINDS={'vaccination':'Vaccination','vet_visit':'Veterinary visit','treatment':'Treatment','test':'Test or screening','other':'Care record'}

class MedicalInput(serializers.Serializer):
    kind=serializers.ChoiceField(choices=list(KINDS), required=False)
    status=serializers.ChoiceField(choices=['planned','performed'], required=False)
    title=serializers.CharField(max_length=160, required=False)
    eventDate=serializers.DateField(required=False, allow_null=True)
    followUpDate=serializers.DateField(required=False, allow_null=True)
    vaccineProduct=serializers.CharField(max_length=160, required=False, allow_blank=True)
    doseLabel=serializers.CharField(max_length=80, required=False, allow_blank=True)
    batchReference=serializers.CharField(max_length=100, required=False, allow_blank=True)
    providerName=serializers.CharField(max_length=160, required=False, allow_blank=True)
    clinicName=serializers.CharField(max_length=160, required=False, allow_blank=True)
    notes=serializers.CharField(max_length=5000, required=False, allow_blank=True)
    visibility=serializers.ChoiceField(choices=['private','public'], required=False)
    publicSummary=serializers.CharField(max_length=500, required=False, allow_blank=True)
    mediaIds=serializers.ListField(child=serializers.UUIDField(), max_length=6, required=False)
    expectedVersion=serializers.IntegerField(min_value=1, required=False)
    changeReason=serializers.CharField(max_length=300, required=False)
    archived=serializers.BooleanField(required=False)

FIELDS={'kind':'kind','status':'status','title':'title','eventDate':'event_date','followUpDate':'follow_up_date',
    'vaccineProduct':'vaccine_product','doseLabel':'dose_label','batchReference':'batch_reference','providerName':'provider_name',
    'clinicName':'clinic_name','notes':'notes','visibility':'visibility','publicSummary':'public_summary','archived':'archived'}

def can_manage(user,info):
    return bool(user.is_authenticated and (info.caretaker_id==user.pk or manages(user,info.shelter)))

def get_info(request,key,manage=False,lock=False):
    animal=lookup(Animal,key)
    rows=AnimalInfo.objects.select_related('animal','shelter')
    if lock:rows=rows.select_for_update(of=('self',))
    info=rows.filter(animal=animal).first()
    if not info or (not info.published and not can_manage(request.user,info)):
        raise DomainError('Animal profile not found.','NOT_FOUND',404)
    if manage:
        user=auth(request)
        if not can_manage(user,info):raise DomainError('Only this animal’s caretaker or responsible shelter staff can manage medical records.','FORBIDDEN',403)
    return info

def private_details(row):
    return dict(title=row.title, vaccineProduct=row.vaccine_product,doseLabel=row.dose_label,batchReference=row.batch_reference,
        providerName=row.provider_name,clinicName=row.clinic_name,notes=row.notes,
        attachments=[dict(id=str(asset.pk),url=f'/api/v1/media/{asset.pk}/content',alt=asset.alt,mimeType=asset.mime_type,bytes=asset.byte_count,visibility='private') for asset in row.attachments.all()],
        history=[dict(version=revision.version,action=revision.action,reason=revision.reason,at=revision.created_at.isoformat()) for revision in list(row.revisions.all())[:10]])

def dto(row,manage=False):
    return dict(id=str(row.pk),animalId=str(row.animal_info.animal_id),kind=row.kind,status=row.status,
        title=row.title if manage else KINDS[row.kind],eventDate=row.event_date.isoformat() if row.event_date else None,
        followUpDate=row.follow_up_date.isoformat() if row.follow_up_date else None,publicSummary=row.public_summary,
        visibility=row.visibility,archived=row.archived,version=row.version,createdAt=row.created_at.isoformat(),updatedAt=row.updated_at.isoformat(),
        privateDetails=private_details(row) if manage else None,sourceLabel='Care-team reported')

def snapshot(row):
    value={key:getattr(row,field) for key,field in FIELDS.items()}
    for key in ['eventDate','followUpDate']:
        value[key]=value[key].isoformat() if value[key] else None
    value['mediaIds']=[str(asset.pk) for asset in row.attachments.all()]
    return value

@api_view(['GET','POST','PATCH'])
@permission_classes([AllowAny])
def records(request,key,record_id=None):
    if request.method=='GET':
        if record_id:raise DomainError('Use the medical collection to read records.','METHOD_NOT_ALLOWED',405)
        query=params(request);manage=query.get('scope','public')=='manage'
        if query.get('scope','public') not in ['public','manage']:raise DomainError('Choose public or management medical records.')
        info=get_info(request,key,manage=manage)
        rows=AnimalMedicalRecord.objects.filter(animal_info=info)
        if not manage:rows=rows.filter(visibility='public',archived=False)
        active=rows.filter(archived=False)
        summary=active.aggregate(recordsCount=Count('id'),performedCount=Count('id',filter=Q(status='performed')),
            plannedCount=Count('id',filter=Q(status='planned')),nextFollowUp=Min('follow_up_date',filter=Q(follow_up_date__gte=timezone.localdate(timezone.now(),ZoneInfo('Asia/Manila')))))
        summary['nextFollowUp']=summary['nextFollowUp'].isoformat() if summary['nextFollowUp'] else None
        archive=query.get('archive','active')
        if archive not in ['active','archived','all']:raise DomainError('Choose active, archived or all records.')
        if not manage and archive!='active':raise DomainError('Archived medical records are private.','FORBIDDEN',403)
        if archive!='all':rows=rows.filter(archived=archive=='archived')
        rows=rows.select_related('animal_info').order_by('-event_date','-created_at','-id')
        if manage:rows=rows.prefetch_related('attachments','revisions')
        return Response(dict(paginate(rows,request,lambda row:dto(row,manage)),
            animalId=str(info.animal_id),viewerCanManage=can_manage(request.user,info),summary=summary))
    def run():
        user=auth(request)
        # Coordinate attachment writes with existing owner-scoped upload deletion.
        type(user).objects.select_for_update().get(pk=user.pk)
        info=get_info(request,key,manage=True,lock=True)
        values=data(request,MedicalInput)
        creating=request.method=='POST'
        if creating:
            if record_id:raise DomainError('Choose the animal medical collection.')
            if not all(values.get(field) for field in ['kind','status','title']):raise DomainError('Choose a record type, explicit care status and name.')
            if values.get('archived'):raise DomainError('New records start in active history.')
            row=AnimalMedicalRecord(animal_info=info,created_by=user,updated_by=user,is_fixture=info.is_fixture)
        else:
            if not record_id:raise DomainError('Choose a medical record.')
            row=lookup(AnimalMedicalRecord.objects.select_for_update().filter(animal_info=info),record_id)
            version(row,values.get('expectedVersion'))
            if not values.get('changeReason'):raise DomainError('Explain this correction or archive action.')
        for key2,field in FIELDS.items():
            if key2 in values:setattr(row,field,values[key2])
        today=timezone.localdate(timezone.now(),ZoneInfo('Asia/Manila'))
        if row.status=='performed' and (not row.event_date or row.event_date>today):
            raise DomainError('Performed care requires its actual date, today or earlier.')
        if row.event_date and row.follow_up_date and row.follow_up_date<row.event_date:
            raise DomainError('The recorded follow-up date cannot precede the care date.')
        if row.visibility=='public' and not row.public_summary.strip():
            raise DomainError('Write the separate summary and dates you intend to share publicly.')
        if row.kind!='vaccination':row.vaccine_product=row.dose_label=row.batch_reference=''
        retained=set() if creating else set(row.attachments.values_list('pk',flat=True))
        attachments=None
        if 'mediaIds' in values:
            ids=values['mediaIds']
            if len(ids)!=len(set(ids)):raise DomainError('Choose distinct private attachments.')
            attachments=list(Asset.objects.select_for_update().filter(pk__in=ids).order_by('pk'))
            if len(attachments)!=len(ids) or any(asset.owner_id!=user.pk and asset.pk not in retained for asset in attachments):
                raise DomainError('An attachment is missing or belongs to another account.','FORBIDDEN',403)
            if any(asset.public or asset.purpose!='private_evidence' for asset in attachments):
                raise DomainError('Medical documents must be private evidence uploads.')
        previous_archived=False if creating else AnimalMedicalRecord.objects.get(pk=row.pk).archived
        row.updated_by=user
        if creating:row.save()
        else:touch(row)
        if attachments is not None:row.attachments.set(attachments)
        action='create' if creating else 'archive' if row.archived and not previous_archived else 'restore' if previous_archived and not row.archived else 'correct'
        revision=AnimalMedicalRevision.objects.create(record=row,actor=user,version=row.version,action=action,
            reason=values.get('changeReason','Initial care-team entry'),snapshot=snapshot(row))
        revision.documents.set(row.attachments.all())
        audit(user,row,action,values.get('changeReason','Initial care-team entry'))
        return dto(row,True)
    # Recheck the current care relationship even when an idempotent request replays.
    # Keep the existing user -> animal-info lock order used by the write itself.
    with transaction.atomic():
        user=auth(request)
        type(user).objects.select_for_update(no_key=True).get(pk=user.pk)
        get_info(request,key,manage=True,lock=True)
        return mutation(request,run,201 if request.method=='POST' else 200)
