from django.db.models import Q
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response
from media.service import publish
from .models import Campaign,Post,Comment,AnimalInfo,ContentReport,Shelter
from .common import *

class Decision(Version):
    id=serializers.UUIDField()
    action=serializers.ChoiceField(choices=['publish','reject','remove','verify','revoke_verification'])
    reason=serializers.CharField(min_length=1,max_length=2000)
    evidenceRefs=serializers.ListField(child=serializers.UUIDField(),max_length=6,required=False,default=list)


def subject(row,request):
    if isinstance(row,Campaign):
        kind='fundraiser';creator=row.organizer;state='pending' if row.state=='pending_review' else 'rejected' if row.state=='rejected' else 'published';title=row.title;text=row.story;photos=list(row.photos.all());evidence=list(row.private_evidence.all());ref_id=row.pk
    elif isinstance(row,Post):kind='post';creator=row.author;state=row.moderation;title=row.text[:100];text=row.text;photos=list(row.photos.all());evidence=[];ref_id=row.pk
    elif isinstance(row,Comment):kind=row.ref_kind;creator=row.author;state=row.moderation;title='Discussion comment';text=row.text;photos=[];evidence=[];ref_id=row.ref_id
    elif isinstance(row,AnimalInfo):kind='animal';creator=row.caretaker;state='published' if row.published else 'pending';title=row.animal.name;text=row.animal.description;photos=[row.animal.photo] if row.animal.photo else [];evidence=list(row.private_evidence.all());ref_id=row.animal_id
    else:kind='shelter';creator=row.owner;state='published' if row.published else 'pending';title=row.name;text=row.description;photos=[row.photo] if row.photo else [];evidence=[];ref_id=row.pk
    reports=ContentReport.objects.filter(ref_kind=kind,ref_id=ref_id)
    verification={'status':'verified' if row.verified else 'unverified','label':'Independently reviewed' if row.verified else 'Not independently verified','evidenceRefs':[]} if isinstance(row,(Campaign,Shelter)) else None
    return {**base(row),'ref':{'kind':kind,'id':str(ref_id)},**({'commentId':str(row.pk)} if isinstance(row,Comment) else {}),'creatorId':str(creator.pk),'kind':'publication','state':state,'version':row.version,'reportCount':0 if isinstance(row,Comment) else reports.count(),'reports':[] if isinstance(row,Comment) else [{'reason':r.reason,'details':r.details} for r in reports],'title':title,'text':text,'publicImages':[i for i in (image(a) for a in photos) if i],'media':[{'id':str(a.pk),'url':'/api/v1/media/'+str(a.pk)+'/content','alt':a.alt,'visibility':'private','mimeType':a.mime_type,'bytes':a.byte_count,'sensitive':a.sensitive} for a in photos+evidence],'evidenceIds':[str(a.pk) for a in evidence],'canVerify':isinstance(row,(Campaign,Shelter)) and not row.is_fixture and request.user.pk!=creator.pk,'verification':verification}

@api_view(['GET'])
def queue(request):
    user=auth(request)
    if not user.is_staff:raise DomainError('Moderator permission is required.','FORBIDDEN',403)
    p=params(request);rows=[]
    for model in [Campaign,Post,Comment,AnimalInfo,Shelter]:
        if p.get('kind')=='verification' and model not in [Campaign,Shelter]:continue
        for row in model.objects.all().order_by('-created_at'):
            if isinstance(row,Comment):
                from .community import resource
                from django.http import Http404
                try:resource(row.ref_kind,str(row.ref_id))
                except (Http404,DomainError):continue
            value=subject(row,request)
            if p.get('kind')=='verification':value['kind']='verification'
            if p.get('state') and value['state']!=p['state']:continue
            if p.get('kind') and value['kind']!=p['kind']:continue
            if not p.get('state') and value['state']!='pending' and not value['reportCount']:continue
            rows.append(value)
    rows.sort(key=lambda r:r['createdAt'],reverse=True)
    return Response(paginate(rows,request,lambda r:r))

@api_view(['POST'])
def review(request,key):
    def run():
        user=auth(request)
        if not user.is_staff:raise DomainError('Moderator permission is required.','FORBIDDEN',403)
        v=data(request,Decision);row=None
        if str(v['id'])!=str(key):raise DomainError('The review record does not match the URL.')
        for model in [Campaign,Post,Comment,AnimalInfo,Shelter]:
            row=model.objects.select_for_update().filter(pk=v['id']).first()
            if row:break
        if not row:raise DomainError('Review record not found.','NOT_FOUND',404)
        before=subject(row,request);version(row,v['expectedVersion'])
        if before['creatorId']==str(user.pk):raise DomainError('An independent moderator must review your own record.','FORBIDDEN',403)
        action=v['action']
        if action in ['verify','revoke_verification']:
            if not isinstance(row,(Campaign,Shelter)):raise DomainError('This record cannot be verified through organization review.')
            if row.is_fixture:raise DomainError('Fixture records cannot become independently verified evidence.')
            if action=='verify':
                keys={str(x) for x in v['evidenceRefs']}
                available=set(str(x.pk) for x in row.private_evidence.all()) if isinstance(row,Campaign) else set()
                if not keys or not keys.issubset(available):raise DomainError('Verification requires the organization’s submitted private evidence.')
            row.verified=action=='verify'
        else:
            published=action=='publish'
            if isinstance(row,Campaign):row.state='active' if published else 'rejected'
            elif isinstance(row,(Post,Comment)):row.moderation='published' if published else 'rejected' if action=='reject' else 'removed'
            else:row.published=published
            if published:
                if isinstance(row,Comment):
                    from .community import resource
                    title,href,parent=resource(row.ref_kind,str(row.ref_id))
                    recipient=getattr(parent,'organizer',getattr(parent,'author',None))
                    if before['state']!='published' and recipient and recipient.pk!=row.author_id:
                        notify(recipient,'comment','A new comment on '+title,{'kind':row.ref_kind,'id':str(row.ref_id)})
                photos=list(row.photos.all()) if isinstance(row,(Campaign,Post)) else [row.animal.photo] if isinstance(row,AnimalInfo) and row.animal.photo else [row.photo] if isinstance(row,Shelter) and row.photo else []
                for asset in photos:
                    if asset.purpose=='private_evidence' or asset.sensitive:raise DomainError('Private or sensitive evidence cannot be made public.')
                    publish(asset)
        touch(row)
        if action in ['reject','remove']:
            from .media_access import withdraw_unused_photos
            photos=list(row.photos.all()) if isinstance(row,(Campaign,Post)) else [row.animal.photo] if isinstance(row,AnimalInfo) else [row.photo] if isinstance(row,Shelter) else []
            withdraw_unused_photos(photos)
        audit(user,row,action,v['reason'],before['version']);creator=getattr(row,'organizer',getattr(row,'author',getattr(row,'caretaker',getattr(row,'owner',None))))
        notify(creator,'moderation','Your '+before['ref']['kind']+' review was updated.',before['ref'])
        return subject(row,request)
    return mutation(request,run)

@api_view(['POST'])
def report(request):
    from .community import Ref,resource
    class ReportInput(serializers.Serializer):
        target=Ref()
        reason=serializers.ChoiceField(choices=['animal_welfare','harassment','misinformation','spam','privacy','other'])
        details=serializers.CharField(max_length=2000,required=False,allow_blank=True,default='')
    def run():
        user=auth(request);v=data(request,ReportInput);resource(v['target']['kind'],v['target']['id'])
        row=ContentReport.objects.create(reporter=user,ref_kind=v['target']['kind'],ref_id=v['target']['id'],reason=v['reason'],details=v['details'])
        return {**base(row),'target':{'kind':row.ref_kind,'id':str(row.ref_id)},'reason':row.reason,'details':row.details}
    return mutation(request,run,201)
