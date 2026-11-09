from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import serializers
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Post,Comment,Reaction,Saved,AnimalInfo,Mission,Campaign,Event,Shelter,Horde,Follow
from .common import *

class Ref(serializers.Serializer):
    kind=serializers.ChoiceField(choices=['animal','horde','fundraiser','mission','event','user','shelter','post'])
    id=serializers.UUIDField()
class PostInput(serializers.Serializer):
    text=serializers.CharField(max_length=2000)
    type=serializers.ChoiceField(choices=['story','photo','sighting','feeding','rescue','adoption','help'])
    mediaIds=serializers.ListField(child=serializers.UUIDField(),max_length=6)
    refs=Ref(many=True)
    expectedVersion=serializers.IntegerField(min_value=1,required=False)

def resource(kind,key):
    target=identifier(key)
    if kind=='animal':
        row=get_object_or_404(AnimalInfo.objects.select_related('animal'),animal_id=target,published=True);return row.animal.name,'/pets/'+row.animal.slug,row
    config={'horde':(Horde,{'published':True},'/hordes/'),'shelter':(Shelter,{'published':True},'/shelters/'),'mission':(Mission,{},'/missions/'),'fundraiser':(Campaign,{'state__in':['active','completed','closed']},'/fundraisers/'),'event':(Event,{},'/events/'),'post':(Post,{'moderation':'published'},'/community/')}
    if kind=='user':
        row=get_object_or_404(community_users(),pk=target,social_profile__discoverable=True);return row.display_name or row.username,'/users/'+row.username,row
    if kind not in config:raise DomainError('Unsupported discussion type.')
    model,filters,prefix=config[kind];row=get_object_or_404(model,pk=target,**filters)
    return getattr(row,'name',getattr(row,'title',getattr(row,'text','Story')))[:200],prefix+str(getattr(row,'slug',row.pk)),row

def post_dto(row,request):
    from .people import author_dto,avatar
    uid=request.user.pk if request.user.is_authenticated else None
    comments=Comment.objects.filter(ref_kind='post',ref_id=row.pk,moderation='published')
    participant_ids=list(comments.values_list('author_id',flat=True).distinct())
    people=community_users().filter(pk__in=participant_ids,social_profile__discoverable=True).order_by('username')[:4]
    links=[]
    for r in row.refs:
        try:title,href,_=resource(r['kind'],r['id']);links.append({'ref':r,'title':title,'href':href})
        except Exception as exc:
            from django.http import Http404
            if not isinstance(exc,(Http404,DomainError)):raise
    result={**base(row),'authorId':str(row.author_id),'text':row.text,'type':row.kind,'media':[i for i in (image(a) for a in row.photos.all()) if i],'refs':row.refs,'moderation':row.moderation,'reactionCount':row.reactions.count(),'commentCount':comments.count(),'version':row.version,'author':author_dto(row.author,request),'participants':[{'id':str(u.pk),'username':u.username,'displayName':u.display_name or u.username,'avatar':avatar(u)} for u in people],'participantCount':len(participant_ids),'linkedEntities':links,'viewerReacted':bool(uid and row.reactions.filter(user_id=uid).exists()),'viewerSaved':bool(uid and Saved.objects.filter(user_id=uid,kind='post',target_id=row.pk).exists()),'viewerOwns':uid==row.author_id}
    if uid==row.author_id and row.moderation in ['pending','rejected']:
        result['ownerMedia']=[{'id':str(a.pk),'url':'/api/v1/media/'+str(a.pk)+'/content','alt':a.alt,'visibility':'private','mimeType':a.mime_type,'bytes':a.byte_count,'sensitive':a.sensitive} for a in row.photos.all()]
    return result

@api_view(['GET','POST','PATCH','DELETE'])
@permission_classes([AllowAny])
def posts(request,key=None):
    if request.method=='GET':
        rows=Post.objects.select_related('author').exclude(moderation='removed').order_by('-created_at','-id');p=params(request)
        if key:
            row=lookup(rows,key)
            if row.moderation!='published' and (not request.user.is_authenticated or row.author_id!=request.user.pk):raise DomainError('Post not found.','NOT_FOUND',404)
            return Response(post_dto(row,request))
        if request.user.is_authenticated:rows=rows.filter(Q(moderation='published')|Q(author=request.user))
        else:rows=rows.filter(moderation='published')
        if p.get('authorId'):rows=rows.filter(author_id=identifier(p['authorId']))
        if p.get('q'):rows=rows.filter(text__icontains=p['q'])
        if p.get('saved'):
            user=auth(request);rows=rows.filter(pk__in=Saved.objects.filter(user=user,kind='post').values_list('target_id',flat=True))
        if p.get('tab')=='following':
            user=auth(request);rows=rows.filter(author_id__in=Follow.objects.filter(user=user,kind='user').values_list('target_id',flat=True))
        for kind in ['animal','horde']:
            if p.get(kind+'Id'):rows=[r for r in rows if any(ref['kind']==kind and ref['id']==str(p[kind+'Id']) for ref in r.refs)]
        return Response(paginate(rows,request,lambda r:post_dto(r,request)))
    def run():
        user=auth(request)
        previous_photos=[]
        if key:
            row=lookup(Post.objects.select_for_update(),key)
            if row.author_id!=user.pk:raise DomainError('Only the author may edit or delete a story.','FORBIDDEN',403)
            previous_photos=list(row.photos.all())
        if request.method=='DELETE':
            from .media_access import withdraw_unused_photos
            row.moderation='removed';touch(row);withdraw_unused_photos(previous_photos);return None
        v=data(request,PostInput)
        if len(v['refs'])>20 or len({(r['kind'],r['id']) for r in v['refs']})!=len(v['refs']):raise DomainError('Choose up to 20 distinct related records.')
        for r in v['refs']:resource(r['kind'],r['id'])
        files=media_owned(user,v['mediaIds'])
        if any(a.purpose=='private_evidence' or a.sensitive for a in files):raise DomainError('Sensitive or private evidence cannot be shared as story photos.')
        if key:version(row,v.get('expectedVersion'))
        else:row=Post(author=user)
        row.text=v['text'];row.kind=v['type'];row.refs=[{'kind':r['kind'],'id':str(r['id'])} for r in v['refs']];row.moderation='pending'
        if key:touch(row)
        else:row.save()
        row.photos.set(files)
        from .media_access import withdraw_unused_photos
        withdraw_unused_photos([*previous_photos,*files])
        return post_dto(row,request)
    return mutation(request,run,204 if request.method=='DELETE' else 201 if request.method=='POST' else 200)

@api_view(['PUT'])
def reaction(request,key):
    def run():
        user=auth(request);row=lookup(Post.objects.select_for_update().filter(moderation='published'),key)
        if data(request,Toggle)['active']:Reaction.objects.get_or_create(post=row,user=user)
        else:Reaction.objects.filter(post=row,user=user).delete()
        return post_dto(row,request)
    return mutation(request,run)

@api_view(['PUT'])
def saved(request,kind,key):
    def run():
        user=auth(request);resource(kind,key);value=request.data.get('saved')
        if type(value)!=bool:raise DomainError('Choose a save state.')
        if value:Saved.objects.get_or_create(user=user,kind=kind,target_id=identifier(key))
        else:Saved.objects.filter(user=user,kind=kind,target_id=identifier(key)).delete()
        return None
    return mutation(request,run,204)

def comment_dto(row,request):
    from .people import author_dto
    return {**base(row),'ref':{'kind':row.ref_kind,'id':str(row.ref_id)},'authorId':str(row.author_id),'text':row.text,'moderation':row.moderation,'version':row.version,'author':author_dto(row.author,request),'viewerOwns':request.user.is_authenticated and row.author_id==request.user.pk}

@api_view(['GET','POST'])
@permission_classes([AllowAny])
def comments(request,kind,key):
    title,href,target=resource(kind,key)
    if request.method=='GET':
        visible=Q(moderation='published')
        if request.user.is_authenticated:visible|=Q(author=request.user,moderation__in=['pending','rejected'])
        rows=Comment.objects.filter(ref_kind=kind,ref_id=identifier(key)).filter(visible).select_related('author').order_by('-created_at','-id')
        return Response(paginate(rows,request,lambda r:comment_dto(r,request)))
    def run():
        user=auth(request);v=data(request,Text)
        if len(v['text'])>1000:raise DomainError('Keep comments within 1,000 characters.')
        row=Comment.objects.create(author=user,ref_kind=kind,ref_id=identifier(key),text=v['text'],moderation='pending')
        return comment_dto(row,request)
    return mutation(request,run,201)
