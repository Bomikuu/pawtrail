import math,uuid
from datetime import timedelta
from pathlib import Path
from django.db import transaction
from django.http import FileResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError,PermissionDenied,NotFound
from rest_framework.response import Response
from housing.models import PlayerHouse
from housing.service import check_rate,can_enter
from .models import MapSubject,ReputationEvent,IncidentReport,IncidentEvidence,IncidentCorrection,IncidentReview,HelpRequest,HelpOffer,CommunitySpace
from .domain import CATEGORIES,STATUSES,POSITIVE_WEIGHTS,point,generalized,spatial,index_public,contribution,welfare,summaries_for

def text(value,limit=2000,minimum=1):
    if not isinstance(value,str) or not minimum<=len(value.strip())<=limit or any(ord(c)<32 and c not in '\n\t' for c in value):raise ValidationError('Enter a valid description of the requested length.')
    return value.strip()

def when(value):
    result=parse_datetime(value) if isinstance(value,str) else None
    if not result or timezone.is_naive(result) or result>timezone.now()+timedelta(minutes=5):raise ValidationError('Enter the observed date and time, including its timezone.')
    return result

def reviewer(user):
    if not getattr(user,'can_review_map',False):raise PermissionDenied('A PawTrail moderator account is required.')

def subject(value,user):
    if value is None:return None
    if not isinstance(value,dict) or value.get('kind') not in ['home','shelter','hub','animal','horde']:raise ValidationError('Choose a supported related entity.')
    identifier=text(value.get('id'),180)
    if 'sample' in value and value['sample'] is not user.sample:raise ValidationError('Use a record in your current sample or real community session.')
    if value['kind']=='home':
        house=PlayerHouse.objects.select_related('owner').filter(owner_id=identifier.removeprefix('home:')).first()
        if not house or not can_enter(user,house):raise ValidationError('That home is not available to this account.')
    return MapSubject.objects.get_or_create(kind=value['kind'],external_id=identifier,sample=user.sample)[0]

def visible_subject(value,user=None):
    if not value:return False
    if value.kind!='home':return True
    house=PlayerHouse.objects.select_related('owner').filter(owner_id=value.external_id.removeprefix('home:')).first()
    if not house or not house.opened or not house.map_area:return False
    return can_enter(user,house) if getattr(user,'is_authenticated',False) else house.visibility=='public'

def related(record,user=None):
    s=record.subject
    return {'id':s.external_id,'kind':s.kind} if visible_subject(s,user) else None

def public_incident(row):
    return dict(id='incident:'+str(row.pk),kind='incident',name=row.category.replace('_',' ').capitalize(),description=row.public_summary,
        area=row.area_label,coordinates=[row.public_longitude,row.public_latitude],sample=row.reporter.sample,locationLabel='Generalized report location · about 500 m',
        subject=related(row),incident=dict(id=str(row.pk),category=row.category,status=row.status,severity=row.severity,occurredAt=row.occurred_at.isoformat(),summary=row.public_summary,version=row.version),
        profileHref=None)

def public_help(row):
    return dict(id='help:'+str(row.pk),kind='urgent' if row.priority=='critical' else 'help',name=row.title,description=row.public_summary,
        area=row.area_label,coordinates=[row.public_longitude,row.public_latitude],sample=row.creator.sample,locationLabel='Generalized help location · about 500 m',subject=related(row),
        help=dict(id=str(row.pk),category=row.category,priority=row.priority,status=row.status,expiresAt=row.expires_at.isoformat(),href=None))

def private_incident(row,user):
    if row.reporter.sample!=user.sample or (row.reporter_id!=user.id and not user.can_review_map):raise NotFound('Report not available.')
    return dict(id=str(row.pk),recordType='incident',category=row.category,description=row.description,coordinates=[row.longitude,row.latitude],area=row.area_label,
        status=row.status,severity=row.severity,version=row.version,occurredAt=row.occurred_at.isoformat(),witnessed=row.witnessed,urgent=row.urgent,published=row.published,publicSummary=row.public_summary,
        subject={'id':row.subject.external_id,'kind':row.subject.kind} if row.subject else None,
        evidence=[dict(id=str(e.pk),name=e.original_name,contentType=e.content_type) for e in row.evidence.all()],
        corrections=[dict(kind=c.kind,description=c.description,createdAt=c.created_at.isoformat()) for c in row.corrections.all()])

def private_help(row):
    return dict(id=str(row.pk),recordType='help',title=row.title,description=row.description,category=row.category,priority=row.priority,status=row.status,version=row.version,
        coordinates=[row.longitude,row.latitude],area=row.area_label,expiresAt=row.expires_at.isoformat(),published=row.published,publicSummary=row.public_summary,offers=[dict(name=o.volunteer.name,description=o.description) for o in row.offers.select_related('volunteer').all()[:30]])

@api_view(['GET'])
@permission_classes([AllowAny])
def entities(request):
    sample=request.GET.get('sample')=='true'
    incidents,truncated=spatial(IncidentReport.objects.select_related('reporter','subject').filter(published=True,reporter__sample=sample,occurred_at__gte=timezone.now()-timedelta(days=90)).exclude(status__in=['rejected','archived']),request.GET,'incident')
    helps,more=spatial(HelpRequest.objects.select_related('creator','subject').filter(published=True,creator__sample=sample,status='active',expires_at__gt=timezone.now()),request.GET,'help')
    # Contribution evidence and welfare are separate records even for the same subject.
    subjects=list(MapSubject.objects.filter(sample=sample).order_by('pk')[:501])
    subject_more=len(subjects)>500
    subjects=subjects[:500]
    home_ids=[s.external_id.removeprefix('home:') for s in subjects if s.kind=='home']
    public_homes=set(PlayerHouse.objects.filter(owner_id__in=home_ids,opened=True,visibility='public').exclude(map_area='').values_list('owner_id',flat=True))
    visible=[s for s in subjects if s.kind!='home' or s.external_id.removeprefix('home:') in public_homes]
    summaries=summaries_for(visible)
    events,events_more=spatial(ReputationEvent.objects.filter(subject__sample=sample,verified=True,occurred_at__gte=timezone.now()-timedelta(days=365),subject_id__in=[s.pk for s in visible]),request.GET,'contribution')
    area=dict(verifiedContributionCount=len({e.source_reference for e in events}),openConfirmed=sum(r.status=='corroborated' for r in incidents),underReview=sum(r.status=='under_review' for r in incidents),resolved=sum(r.status=='resolved' for r in incidents))
    return Response(dict(entities=[*[public_incident(r) for r in incidents],*[public_help(r) for r in helps]],summaries=summaries,areaSummary=area,truncated=truncated or more or events_more or subject_more))

@api_view(['GET'])
def mine(request):
    return Response(dict(canReview=request.user.can_review_map,incidents=[private_incident(r,request.user) for r in IncidentReport.objects.select_related('subject').filter(reporter=request.user).order_by('-created_at')[:50]],help=[private_help(r) for r in HelpRequest.objects.filter(creator=request.user).order_by('-created_at')[:50]]))

@api_view(['POST'])
def create_incident(request):
    p=request.user;check_rate('map-incident:'+p.id,8,3600);v=request.data
    if v.get('category') not in CATEGORIES or type(v.get('witnessed')) is not bool:raise ValidationError('Choose a category and whether you witnessed the incident.')
    lng,lat=point(v.get('coordinates'))
    row=IncidentReport.objects.create(reporter=p,subject=subject(v.get('subject'),p),category=v['category'],description=text(v.get('description'),4000,20),
        longitude=lng,latitude=lat,area_label=text(v.get('area'),120),occurred_at=when(v.get('occurredAt')),witnessed=v['witnessed'],urgent=v.get('urgent') is True)
    return Response(dict(id=str(row.pk),status=row.status,version=row.version,notice='Saved privately for review. This is not a confirmed public finding.'),status=201)

@api_view(['POST'])
def create_help(request):
    p=request.user;check_rate('map-help:'+p.id,12,3600);v=request.data
    if v.get('category') not in ['food','water','transport','vet','supplies','rescue','other'] or v.get('priority') not in ['low','medium','high','critical']:raise ValidationError('Choose a help category and priority.')
    lng,lat=point(v.get('coordinates'));hours=4 if v['priority']=='critical' else 168
    row=HelpRequest.objects.create(creator=p,subject=subject(v.get('subject'),p),title=text(v.get('title'),120,5),description=text(v.get('description'),2000,20),
        category=v['category'],priority=v['priority'],latitude=lat,longitude=lng,area_label=text(v.get('area'),120),expires_at=timezone.now()+timedelta(hours=hours))
    return Response(dict(id=str(row.pk),status=row.status,version=row.version,notice='Help request saved for review. Critical requests expire after four hours; seek appropriate local veterinary or rescue help directly.'),status=201)

@api_view(['GET','POST'])
def evidence(request,identifier):
    row=IncidentReport.objects.filter(pk=identifier,reporter__sample=request.user.sample).first()
    if not row or (row.reporter_id!=request.user.id and not request.user.can_review_map):raise NotFound('Report not available.')
    if request.method=='GET':return Response({'items':private_incident(row,request.user)['evidence']})
    check_rate('map-evidence:'+request.user.id,30,3600)
    upload=request.FILES.get('file')
    if not upload or not 0<upload.size<=10*1024*1024:raise ValidationError('Choose a supported file up to 10 MB.')
    head=upload.read(64);upload.seek(0)
    mime='image/jpeg' if head.startswith(b'\xff\xd8\xff') else 'image/png' if head.startswith(b'\x89PNG\r\n') else 'image/webp' if head.startswith(b'RIFF') and head[8:12]==b'WEBP' else 'application/pdf' if head.startswith(b'%PDF-') else 'video/mp4' if head[4:8]==b'ftyp' else 'video/webm' if head.startswith(b'\x1aE\xdf\xa3') else None
    if not mime:raise ValidationError('Use JPEG, PNG, WebP, PDF, MP4 or WebM evidence.')
    original=Path(upload.name).name[:160];upload.name=str(uuid.uuid4())+'.'+{'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf','video/mp4':'mp4','video/webm':'webm'}[mime]
    with transaction.atomic():
        IncidentReport.objects.select_for_update().get(pk=row.pk)
        if row.evidence.count()>=6:raise ValidationError('A report can have up to six evidence files.')
        item=IncidentEvidence.objects.create(incident=row,uploaded_by=request.user,file=upload,original_name=original,content_type=mime)
    return Response(dict(id=str(item.pk),visibility='private'),status=201)

@api_view(['GET'])
def evidence_file(request,identifier):
    row=IncidentEvidence.objects.select_related('incident').filter(pk=identifier,incident__reporter__sample=request.user.sample).first()
    if not row or (row.incident.reporter_id!=request.user.id and not request.user.can_review_map):raise NotFound('Evidence not available.')
    response=FileResponse(row.file.open('rb'),as_attachment=True,filename=row.original_name,content_type=row.content_type)
    response['X-Content-Type-Options']='nosniff';response['Cache-Control']='private, no-store'
    return response

@api_view(['POST'])
def correction(request,identifier):
    row=IncidentReport.objects.filter(pk=identifier,reporter__sample=request.user.sample).first()
    if not row or (not row.published and row.reporter_id!=request.user.id and not request.user.can_review_map):raise NotFound('Report not available.')
    check_rate('map-correction:'+request.user.id,10,3600)
    kind=request.data.get('kind','information')
    if kind not in ['information','appeal']:raise ValidationError('Choose additional information or a correction.')
    IncidentCorrection.objects.create(incident=row,author=request.user,kind=kind,description=text(request.data.get('description'),4000,10))
    return Response({'notice':'Your information was saved privately for the reviewer.'},status=201)

@api_view(['GET'])
def queue(request):
    reviewer(request.user)
    return Response(dict(incidents=[private_incident(r,request.user) for r in IncidentReport.objects.select_related('subject').filter(reporter__sample=request.user.sample).exclude(status__in=['rejected','archived']).order_by('-updated_at')[:50]],help=[private_help(r) for r in HelpRequest.objects.filter(creator__sample=request.user.sample).exclude(status__in=['rejected','resolved']).order_by('-created_at')[:50]]))

@api_view(['POST'])
@transaction.atomic
def review(request,kind,identifier):
    reviewer(request.user);v=request.data
    if kind not in ['incident','help']:raise NotFound('Unknown review type.')
    model=IncidentReport if kind=='incident' else HelpRequest
    realm={'reporter__sample':request.user.sample} if kind=='incident' else {'creator__sample':request.user.sample}
    row=model.objects.select_for_update().filter(pk=identifier,**realm).first()
    if not row:raise NotFound('Report not available.')
    if type(v.get('version')) is not int or row.version!=v['version']:raise ValidationError('This report changed. Refresh before reviewing it.')
    status=v.get('status');allowed=STATUSES if kind=='incident' else ['under_review','active','resolved','rejected']
    if status not in allowed:raise ValidationError('Choose a valid review status.')
    publish=v.get('published') is True
    if publish and status not in (['under_review','corroborated','resolved'] if kind=='incident' else ['active','resolved']):raise ValidationError('This status cannot have a public summary.')
    if publish:row.public_summary=text(v.get('publicSummary'),1500,20)
    row.status=status;row.published=publish;row.version+=1
    if publish:row.public_longitude,row.public_latitude=generalized(row.longitude,row.latitude)
    if kind=='incident':
        if v.get('severity') not in ['unknown','low','medium','high','critical']:raise ValidationError('Choose a supported severity.')
        row.severity=v['severity'];IncidentReview.objects.create(incident=row,reviewer=request.user,status=status,version=row.version,notes=text(v.get('notes','Reviewed'),2000))
    elif publish and row.expires_at<=timezone.now():raise ValidationError('This help request has expired. Ask for a fresh update before publishing.')
    row.save();index_public(row,kind if kind=='incident' else 'help')
    return Response({'notice':'Review saved. Only the approved generalized summary is public.','version':row.version})

@api_view(['POST'])
def record_contribution(request):
    reviewer(request.user);v=request.data
    if v.get('kind') not in POSITIVE_WEIGHTS:raise ValidationError('Choose a recognized contribution type.')
    reference=text(v.get('sourceReference'),200)
    if not reference.startswith(('platform:','review:')):raise ValidationError('Use verified platform evidence or a documented moderation reference. Game rewards are not accepted.')
    s=subject(v.get('subject'),request.user)
    if not s:raise ValidationError('Choose a contribution subject.')
    coordinates=point(v.get('coordinates'))
    lng,lat=generalized(*coordinates)
    event,_=ReputationEvent.objects.update_or_create(subject=s,source_reference=reference,defaults={'kind':v['kind'],'verified_by':request.user,'verified':True,'occurred_at':when(v.get('occurredAt')),'public_longitude':lng,'public_latitude':lat})
    index_public(event,'contribution')
    return Response({'contribution':contribution(s),'welfare':welfare(s)})

@api_view(['POST'])
def offer(request,identifier):
    row=HelpRequest.objects.filter(pk=identifier,published=True,status='active',expires_at__gt=timezone.now(),creator__sample=request.user.sample).first()
    if not row:raise NotFound('This request is no longer active.')
    check_rate('map-offer:'+request.user.id,20,3600)
    HelpOffer.objects.update_or_create(request=row,volunteer=request.user,defaults={'description':text(request.data.get('description'),1000,10)})
    return Response({'notice':'Your offer was saved privately for the request organizer.'},status=201)

@api_view(['GET'])
@permission_classes([AllowAny])
def incident_detail(request,identifier):
    row=IncidentReport.objects.select_related('reporter','subject').filter(pk=identifier).first()
    if not row:raise NotFound('Report not available.')
    user=request.user
    if getattr(user,'is_authenticated',False) and row.reporter.sample==user.sample and (row.reporter_id==user.id or user.can_review_map):return Response(private_incident(row,user))
    if not row.published or row.status in ['rejected','archived']:raise NotFound('Report not available.')
    return Response(public_incident(row))
