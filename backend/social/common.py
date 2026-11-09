import hashlib, json, math, re, uuid
from django.core import signing
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.response import Response
from config.errors import DomainError
from media.models import Asset
from .models import Mutation, Shelter, UserProfile, Notification, Audit

PROVENANCE = {"kind": "real", "label": "PawTrail community record"}

def community_users():
    rows = get_user_model().objects.filter(is_active=True)
    return rows if settings.COMMUNITY_FIXTURES_VISIBLE else rows.exclude(social_profile__is_fixture=True)

def camel(key):
    return re.sub(r"_([a-z])", lambda m:m[1].upper(), key)

def normalize(value):
    if isinstance(value, dict): return {camel(k):normalize(v) for k,v in value.items()}
    if isinstance(value, list): return [normalize(v) for v in value]
    return value

def data(request, schema):
    incoming = normalize(request.data)
    validator = schema(data=incoming)
    validator.is_valid(raise_exception=True)
    return validator.validated_data

def params(request):
    result = {}
    for k,v in request.query_params.items():
        try: value=json.loads(v) if v[:1] in ['[','{'] or v in ['true','false'] else v
        except ValueError: raise DomainError('Invalid query filter.')
        result[camel(k)] = normalize(value)
    return result

def auth(request):
    if not request.user.is_authenticated:raise DomainError('Sign in to continue.', 'UNAUTHENTICATED', 401)
    if profile(request.user).is_fixture:raise DomainError('This account is unavailable.', 'FORBIDDEN', 403)
    return request.user

def profile(user):
    if not hasattr(user,'_social_profile_cache'):
        try:user._social_profile_cache=user.social_profile
        except UserProfile.DoesNotExist:user._social_profile_cache=UserProfile.objects.get_or_create(user=user)[0]
    return user._social_profile_cache

def manages(user, shelter):
    return bool(user.is_authenticated and (user.is_staff or (shelter and (shelter.owner_id==user.pk or shelter.staff.filter(pk=user.pk).exists()))))

def manager(request, shelter):
    user=auth(request)
    if not manages(user,shelter):raise DomainError('Shelter staff permission is required.', 'FORBIDDEN',403)
    return user

def own(user, row):
    return user.is_authenticated and (user.is_staff or getattr(row,'organizer_id',None)==user.pk or getattr(row,'owner_id',None)==user.pk or manages(user,getattr(row,'shelter',None)))

def owner(request,row):
    user=auth(request)
    if not own(user,row):raise DomainError('You cannot manage this record.', 'FORBIDDEN',403)
    return user

def version(row, expected):
    if expected is None or row.version != expected:raise DomainError('This record changed. Reload it before saving.', 'CONFLICT',409)

def touch(row):
    row.version+=1
    row.save()

def audit(user,row,action,reason='',before=None):
    Audit.objects.create(actor=user,kind=row._meta.model_name,target_id=row.pk,action=action,reason=reason,before_version=before or row.version,after_version=row.version)

def notify(user,kind,message,ref=None):
    Notification.objects.create(recipient=user,kind=kind,message=message[:500],ref=ref)

def identifier(value):
    try:return uuid.UUID(str(value))
    except (ValueError,TypeError,AttributeError):raise DomainError('Choose a valid record identifier.')

def lookup(query,key):
    if isinstance(query,type):query=query.objects.all()
    try: uid=uuid.UUID(str(key))
    except ValueError:
        if 'slug' not in [f.name for f in query.model._meta.fields]:raise DomainError('Record not found.','NOT_FOUND',404)
        return get_object_or_404(query,slug=key)
    return get_object_or_404(query,pk=uid)

def slug(title):return (slugify(title)[:120] or 'record')+'-'+uuid.uuid4().hex[:8]

def media_owned(user,ids):
    if len(ids)>6 or len(set(ids))!=len(ids):raise DomainError('Choose up to six distinct attachments.')
    keys=[identifier(i) for i in ids]
    rows=list(Asset.objects.filter(pk__in=keys,owner=user))
    if len(rows)!=len(keys):raise DomainError('An attachment is missing or belongs to another account.','FORBIDDEN',403)
    return rows

def image(asset):
    if not asset or not asset.public or not asset.derivative:return None
    return {'id':str(asset.pk),'url':'/api/v1/media/'+str(asset.pk)+'/public','alt':asset.alt,'provenance':PROVENANCE}

def base(row):
    return {'id':str(row.pk),'createdAt':row.created_at.isoformat(),'provenance':PROVENANCE}

def paginate(rows,request,render):
    p=params(request)
    try:limit=max(1,min(50,int(p.get('limit',12))))
    except (TypeError,ValueError):raise DomainError('Choose a valid page size.')
    scope=hashlib.sha256(json.dumps([request.path,str(request.user.pk),{k:v for k,v in sorted(p.items()) if k not in ['cursor','offset']}],sort_keys=True).encode()).hexdigest()
    offset=0
    if p.get('cursor'):
        try:
            cursor=signing.loads(p['cursor'],salt='social-page',max_age=86400)
            if cursor['scope']!=scope or type(cursor['offset'])!=int or cursor['offset']<0:raise ValueError()
            offset=cursor['offset']
        except (signing.BadSignature,KeyError,TypeError,ValueError):raise DomainError('This page cursor does not belong to this search.','INVALID_CURSOR')
    count=len(rows) if isinstance(rows,list) else rows.count()
    current=rows[offset:offset+limit]
    def link(value):
        query=request.query_params.copy();query['cursor']=signing.dumps({'offset':value,'scope':scope},salt='social-page')
        return request.build_absolute_uri(request.path)+'?'+query.urlencode()
    return {'results':[render(r) for r in current],'count':count,'next':link(offset+limit) if offset+limit<count else None,'previous':link(max(0,offset-limit)) if offset else None}

def mutation(request,operation,status=200):
    user=auth(request)
    key=request.headers.get('Idempotency-Key')
    if key and (len(key)>120 or any(ord(c)<33 for c in key)):raise DomainError('Invalid idempotency key.')
    with transaction.atomic():
        # Same-user serialization also prevents concurrent retry races on SQLite/PostgreSQL.
        type(user).objects.select_for_update(no_key=True).get(pk=user.pk)
        row=None
        if key:
            digest=hashlib.sha256(json.dumps(normalize(request.data),sort_keys=True,cls=DjangoJSONEncoder).encode()).hexdigest()
            row,created=Mutation.objects.get_or_create(owner=user,key=key,scope=request.method+':'+request.path,defaults={'fingerprint':digest})
            if not created:
                if row.fingerprint!=digest:raise DomainError('That retry key has different input.','IDEMPOTENCY_CONFLICT',409)
                if row.result is not None:return Response(row.result,status=row.status)
        from .achievements.changes import achievement_changes
        with achievement_changes():
            result=operation()
        if row:
            row.result=json.loads(json.dumps(result,cls=DjangoJSONEncoder));row.status=status;row.save()
        return Response(result,status=status)

class Location(serializers.Serializer):
    areaId=serializers.CharField(max_length=120)
    neighborhood=serializers.CharField(max_length=150)
    latitude=serializers.FloatField(min_value=-90,max_value=90)
    longitude=serializers.FloatField(min_value=-180,max_value=180)
    approximateRadiusMeters=serializers.IntegerField(min_value=500,max_value=100000)

class Version(serializers.Serializer):expectedVersion=serializers.IntegerField(min_value=1)
class Toggle(serializers.Serializer):active=serializers.BooleanField()
class Text(serializers.Serializer):text=serializers.CharField(min_length=1,max_length=2000)

def distance(a,b):
    lat1,lat2=map(math.radians,[a['latitude'],b['latitude']]);dlat=lat2-lat1;dlon=math.radians(b['longitude']-a['longitude'])
    return 6371000*2*math.asin(min(1,math.sqrt(math.sin(dlat/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2)))

def notify_team(organizer,shelter,kind,message,ref=None):
    recipients={organizer.pk:organizer}
    if shelter:
        recipients[shelter.owner_id]=shelter.owner
        for member in shelter.staff.filter(is_active=True):recipients[member.pk]=member
    for member in recipients.values():notify(member,kind,message,ref)
