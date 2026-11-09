from django.db.models import Q,Sum
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from animals.models import Animal
from .models import Campaign,CampaignDraft,CampaignUpdate,CampaignExpense,SupportPledge,FundReceipt,Shelter,Horde,AnimalInfo,Post
from .common import *

class BudgetLine(serializers.Serializer):
    description=serializers.CharField(max_length=500)
    amountMinor=serializers.IntegerField(min_value=1,max_value=10000000000)
class CampaignInput(serializers.Serializer):
    title=serializers.CharField(max_length=200)
    story=serializers.CharField(max_length=20000)
    category=serializers.ChoiceField(choices=['medical','food','rescue','shelter','community'])
    urgency=serializers.ChoiceField(choices=['critical','high','normal'])
    currency=serializers.ChoiceField(choices=['PHP'])
    goalMinor=serializers.IntegerField(min_value=1,max_value=10000000000)
    location=Location()
    animalId=serializers.UUIDField(allow_null=True)
    shelterId=serializers.UUIDField(allow_null=True)
    hordeId=serializers.UUIDField(allow_null=True,required=False,default=None)
    budget=BudgetLine(many=True,required=False,default=list)
    timeline=serializers.CharField(max_length=2000,allow_blank=True,required=False,default='')
    mediaIds=serializers.ListField(child=serializers.UUIDField(),max_length=6)
    privateEvidenceIds=serializers.ListField(child=serializers.UUIDField(),max_length=6)
    draftId=serializers.UUIDField(required=False)
    expectedVersion=serializers.IntegerField(min_value=1,required=False)
    def validate(self,v):
        if len(v.get('mediaIds',[]))+len(v.get('privateEvidenceIds',[]))>6:raise serializers.ValidationError('Choose up to six attachments in total.')
        if len(v.get('budget',[]))>30:raise serializers.ValidationError('Choose up to 30 budget lines.')
        return v
class PledgeInput(serializers.Serializer):
    amountMinor=serializers.IntegerField(min_value=100,max_value=10000000000)
    message=serializers.CharField(max_length=1000,allow_blank=True)
    anonymous=serializers.BooleanField()
class Expense(serializers.Serializer):
    amountMinor=serializers.IntegerField(min_value=1,max_value=10000000000)
    description=serializers.CharField(max_length=3000)
    receiptIds=serializers.ListField(child=serializers.UUIDField(),max_length=6,required=False,default=list)
    correctsEntryId=serializers.UUIDField(required=False)
class Update(serializers.Serializer):
    text=serializers.CharField(max_length=10000)
    mediaIds=serializers.ListField(child=serializers.UUIDField(),max_length=6)
class ReceiptInput(serializers.Serializer):
    pledgeId=serializers.UUIDField()
    amountMinor=serializers.IntegerField(min_value=100,max_value=10000000000)
    reference=serializers.CharField(max_length=200)
    receiptIds=serializers.ListField(child=serializers.UUIDField(),min_length=1,max_length=6)

def money(row):
    received=row.fund_receipts.filter(is_fixture=False).aggregate(total=Sum('amount_minor'))['total'] or 0
    spent=row.expenses.filter(correction__isnull=True).aggregate(total=Sum('amount_minor'))['total'] or 0
    return received,spent

def update_dto(row):
    source=row.post if row.post_id else row
    return {**base(row),'campaignId':str(row.campaign_id),'authorId':str(row.author_id),'text':source.text,'media':[i for i in (image(a) for a in source.photos.all()) if i],'publicationPostId':str(row.post_id) if row.post_id else None}
def expense_dto(row):return {**base(row),'campaignId':str(row.campaign_id),'authorId':str(row.author_id),'amountMinor':row.amount_minor,'description':row.description,'correctsEntryId':str(row.corrects_entry_id) if row.corrects_entry_id else None}
def pledge_dto(row):return {**base(row),'campaignId':str(row.campaign_id),'supporterId':str(row.supporter_id),'amountMinor':row.amount_minor,'currency':'PHP','message':row.message,'anonymous':row.anonymous,'status':row.status,'paymentTaken':False}

def campaign_dto(row,detail=False):
    received,spent=money(row)
    result={**base(row),'slug':row.slug,'title':row.title,'category':row.category,'urgency':row.urgency,'state':row.state,'currency':'PHP','goalMinor':row.goal_minor,'raisedMinor':received,'organizerId':str(row.organizer_id),'shelterId':str(row.shelter_id) if row.shelter_id else None,'animalId':str(row.animal_id) if row.animal_id else None,'hordeId':str(row.horde_id) if row.horde_id else None,'location':row.location,'photo':next((i for i in (image(a) for a in row.photos.all()) if i),None),'verification':{'status':'verified' if row.verified else 'unverified','label':'Evidence reviewed' if row.verified else 'Not independently verified','evidenceRefs':[]}}
    if detail:result.update(budget=row.budget,timeline=row.timeline,story=row.story,gallery=[i for i in (image(a) for a in row.photos.all()) if i],updates=[update_dto(x) for x in row.updates.filter(Q(post__isnull=True)|Q(post__moderation='published')).select_related('post').order_by('-created_at')],expenses=[expense_dto(x) for x in row.expenses.order_by('created_at')],balanceMinor=max(0,received-spent),supporterCount=row.pledges.exclude(status='withdrawn').values('supporter_id').distinct().count(),payoutStatus=row.payout_status,version=row.version,pledgedMinor=row.pledges.filter(status='pledged').aggregate(total=Sum('amount_minor'))['total'] or 0)
    return result

def visible_campaigns(user):
    query=Q(state__in=['active','completed','closed'])
    if user.is_authenticated:
        query|=Q(organizer=user)|Q(shelter__owner=user)|Q(shelter__staff=user)
        if user.is_staff:return Campaign.objects.all()
    return Campaign.objects.filter(query).distinct()

@api_view(['GET','POST','PATCH'])
@permission_classes([AllowAny])
def campaigns(request,key=None):
    if request.method=='GET':
        rows=visible_campaigns(request.user).select_related('organizer','shelter').order_by('-created_at','-id');p=params(request)
        if key:return Response(campaign_dto(lookup(rows,key),True))
        # Public lists never expose unpublished organization campaigns to other visitors.
        rows=rows.filter(state__in=['active','completed','closed'])
        for f in ['category','state','urgency']:
            if p.get(f):rows=rows.filter(**{f:p[f]})
        if p.get('q'):rows=rows.filter(Q(title__icontains=p['q'])|Q(story__icontains=p['q']))
        if p.get('areaId'):rows=rows.filter(location__areaId=p['areaId'])
        if p.get('nearlyFunded'):rows=[r for r in rows if .8*r.goal_minor<=money(r)[0]<r.goal_minor]
        if p.get('sort')=='urgent':rows=sorted(rows,key=lambda r:({'critical':0,'high':1,'normal':2}[r.urgency],-r.created_at.timestamp(),str(r.pk)))
        return Response(paginate(rows,request,campaign_dto))
    def run():
        user=auth(request);raw=normalize(request.data);validator=CampaignInput(data=raw,partial=bool(key));validator.is_valid(raise_exception=True);v=validator.validated_data
        if key:
            row=lookup(Campaign.objects.select_for_update(),key);owner(request,row);version(row,v.get('expectedVersion'))
            if row.state in ['closed','completed']:raise DomainError('This campaign is closed.','CONFLICT',409)
        else:
            row=Campaign(organizer=user,slug=slug(v['title']))
            if v.get('draftId'):
                draft=get_object_or_404(CampaignDraft.objects.select_for_update(),pk=v['draftId'],owner=user);version(draft,v.get('expectedVersion'))
        for fk,model in [('shelter',Shelter),('horde',Horde),('animal',Animal)]:
            if fk+'Id' in v:
                related=lookup(model,v[fk+'Id']) if v[fk+'Id'] else None
                if related and fk in ['shelter','horde'] and not own(user,related):raise DomainError('You cannot organize for that community.','FORBIDDEN',403)
                if related and fk=='animal' and not AnimalInfo.objects.filter(animal=related,published=True).exists():raise DomainError('Choose a published animal.')
                setattr(row,fk,related)
        for src,dest in [('title','title'),('story','story'),('category','category'),('urgency','urgency'),('goalMinor','goal_minor'),('location','location'),('budget','budget'),('timeline','timeline')]:
            if src in v:setattr(row,dest,v[src])
        previous_photos=list(row.photos.all()) if key else []
        public_count=len(v['mediaIds']) if 'mediaIds' in v else row.photos.count() if key else 0
        private_count=len(v['privateEvidenceIds']) if 'privateEvidenceIds' in v else row.private_evidence.count() if key else 0
        if public_count+private_count>6:raise DomainError('Choose up to six public photos and private attachments in total.')
        photos=media_owned(user,v['mediaIds']) if 'mediaIds' in v else None;evidence=media_owned(user,v['privateEvidenceIds']) if 'privateEvidenceIds' in v else None
        if photos and any(a.purpose=='private_evidence' or a.sensitive for a in photos):raise DomainError('Private or sensitive evidence cannot be used as public photos.')
        if evidence and any(a.public or a.purpose!='private_evidence' for a in evidence):raise DomainError('Evidence must use separate private-evidence uploads.')
        selected_photos={a.pk for a in photos} if photos is not None else set(row.photos.values_list('pk',flat=True)) if key else set()
        selected_evidence={a.pk for a in evidence} if evidence is not None else set(row.private_evidence.values_list('pk',flat=True)) if key else set()
        if selected_photos & selected_evidence:raise DomainError('Public photos and private evidence must be separate uploads.')
        row.state='pending_review';row.verified=False
        if key:touch(row)
        else:row.save()
        if photos is not None:row.photos.set(photos)
        if evidence is not None:row.private_evidence.set(evidence)
        if not key and v.get('draftId'):draft.delete()
        from .media_access import withdraw_unused_photos
        withdraw_unused_photos([*previous_photos,*row.photos.all()])
        audit(user,row,'submit');return campaign_dto(row,True)
    return mutation(request,run,201 if request.method=='POST' else 200)

@api_view(['GET','PUT'])
def drafts(request,key=None):
    user=auth(request)
    if request.method=='GET':
        rows=CampaignDraft.objects.filter(owner=user).order_by('-created_at','-id')
        if key:
            row=lookup(rows,key);return Response({'id':str(row.pk),'expectedVersion':row.version,'values':row.values})
        return Response(paginate(rows,request,lambda r:{**base(r),'title':r.values.get('title','Untitled campaign'),'version':r.version}))
    def run():
        raw=normalize(request.data);validator=CampaignInput(data=raw.get('values',{}),partial=True);validator.is_valid(raise_exception=True)
        if raw.get('id'):row=get_object_or_404(CampaignDraft.objects.select_for_update(),pk=identifier(raw['id']),owner=user);version(row,raw.get('expectedVersion'))
        else:row=CampaignDraft(owner=user)
        values=validator.validated_data
        media_owned(user,values.get('mediaIds',[]));media_owned(user,values.get('privateEvidenceIds',[]))
        row.values=json.loads(json.dumps(values,cls=DjangoJSONEncoder));row.version+=1;row.save()
        return {'id':str(row.pk),'expectedVersion':row.version,'values':row.values}
    return mutation(request,run)

@api_view(['POST'])
def pledge(request,key):
    def run():
        user=auth(request);row=lookup(Campaign.objects.select_for_update().filter(state='active'),key);v=data(request,PledgeInput)
        p=SupportPledge.objects.create(campaign=row,supporter=user,amount_minor=v['amountMinor'],message=v['message'],anonymous=v['anonymous'])
        notify_team(row.organizer,row.shelter,'fundraiser','A new support pledge was recorded for '+row.title,{'kind':'fundraiser','id':str(row.pk)})
        return pledge_dto(p)
    return mutation(request,run,201)

@api_view(['GET'])
@permission_classes([AllowAny])
def supporters(request,key):
    row=lookup(visible_campaigns(request.user).filter(state__in=['active','completed','closed']),key)
    rows=row.pledges.exclude(status='withdrawn').select_related('supporter').order_by('-created_at','-id')
    def public_supporter(p):
        anonymous=p.anonymous or not profile(p.supporter).show_contributions or not profile(p.supporter).discoverable
        return {'id':str(p.pk),'displayName':'Anonymous supporter' if anonymous else p.supporter.display_name or p.supporter.username,'userId':None if anonymous else str(p.supporter_id),'amountMinor':p.amount_minor,'message':p.message,'createdAt':p.created_at.isoformat(),'provenance':PROVENANCE}
    return Response(paginate(rows,request,public_supporter))

@api_view(['POST'])
def updates(request,key):
    def run():
        row=lookup(Campaign.objects.select_for_update(),key);user=owner(request,row);v=data(request,Update)
        if row.state not in ['active','completed','closed']:raise DomainError('Updates require a published campaign.','CONFLICT',409)
        files=media_owned(user,v['mediaIds'])
        if any(a.purpose!='public_image' or a.sensitive for a in files):raise DomainError('Use story photos only; private or sensitive evidence cannot be published.')
        post=None
        if files:
            post=Post.objects.create(author=user,text=v['text'],kind='story',refs=[{'kind':'fundraiser','id':str(row.pk)}],moderation='pending',is_fixture=row.is_fixture)
            post.photos.set(files)
        entry=CampaignUpdate.objects.create(campaign=row,author=user,text=v['text'],post=post,is_fixture=row.is_fixture);entry.photos.set(files);touch(row)
        return update_dto(entry)
    return mutation(request,run,201)

@api_view(['POST'])
def expenses(request,key):
    def run():
        row=lookup(Campaign.objects.select_for_update(),key);user=owner(request,row);v=data(request,Expense)
        files=media_owned(user,v.get('receiptIds',[]))
        if not files or any(a.public or a.purpose!='private_evidence' for a in files):raise DomainError('Attach private-evidence receipts for the recorded expense.')
        prior=get_object_or_404(CampaignExpense.objects.select_for_update(),pk=v['correctsEntryId'],campaign=row,correction__isnull=True) if v.get('correctsEntryId') else None
        received,spent=money(row)
        if spent-(prior.amount_minor if prior else 0)+v['amountMinor']>received:raise DomainError('The expense exceeds independently recorded funds. Pledges are not collected money.','CONFLICT',409)
        entry=CampaignExpense.objects.create(campaign=row,author=user,amount_minor=v['amountMinor'],description=v['description'],corrects_entry=prior);entry.receipts.set(files);audit(user,entry,'expense');return expense_dto(entry)
    return mutation(request,run,201)

@api_view(['POST'])
def record_receipt(request,key):
    def run():
        row=lookup(Campaign.objects.select_for_update(),key);user=auth(request)
        if not user.is_staff:raise DomainError('Independent finance review permission is required.','FORBIDDEN',403)
        v=data(request,ReceiptInput);pledge=get_object_or_404(SupportPledge.objects.select_for_update(),pk=v['pledgeId'],campaign=row,status='pledged')
        if user.pk in [row.organizer_id,pledge.supporter_id] or row.is_fixture or pledge.is_fixture or profile(pledge.supporter).is_fixture:raise DomainError('An independent reviewer and genuine non-fixture payment evidence are required.','FORBIDDEN',403)
        if v['amountMinor']>pledge.amount_minor:raise DomainError('Recorded funds cannot exceed this pledge.')
        files=media_owned(user,v['receiptIds'])
        if any(a.public or a.purpose!='private_evidence' for a in files):raise DomainError('Payment evidence must use private-evidence uploads.')
        if FundReceipt.objects.filter(reference=v['reference']).exists():raise DomainError('This payment reference is already recorded.','CONFLICT',409)
        receipt=FundReceipt.objects.create(campaign=row,pledge=pledge,reviewer=user,amount_minor=v['amountMinor'],reference=v['reference']);receipt.evidence.set(files);pledge.status='fulfilled';touch(pledge);audit(user,receipt,'receipt_recorded',v['reference']);return {'id':str(receipt.pk),'campaignId':str(row.pk),'amountMinor':receipt.amount_minor,'paymentTaken':False}
    return mutation(request,run,201)

@api_view(['POST'])
def close(request,key):
    def run():
        row=lookup(Campaign.objects.select_for_update(),key);user=owner(request,row)
        if row.state not in ['active','completed']:raise DomainError('Only a published campaign can be closed.','CONFLICT',409)
        row.state='closed';touch(row);audit(user,row,'close');return campaign_dto(row,True)
    return mutation(request,run)

@api_view(['GET'])
def dashboard(request):
    user=auth(request);rows=Campaign.objects.all() if user.is_staff else Campaign.objects.filter(Q(organizer=user)|Q(shelter__owner=user)|Q(shelter__staff=user)).distinct()
    expenses=CampaignExpense.objects.filter(campaign__in=rows)
    return Response({'campaigns':[campaign_dto(r) for r in rows.order_by('-created_at')],'contributionCount':SupportPledge.objects.filter(campaign__in=rows).exclude(status='withdrawn').count(),'totalRaisedMinor':sum(money(r)[0] for r in rows),'receipts':[{'expenseId':str(e.pk),'mediaIds':[str(a.pk) for a in e.receipts.all()]} for e in expenses]})

@api_view(['GET'])
def my_pledges(request):
    user=auth(request)
    return Response(paginate(SupportPledge.objects.filter(supporter=user).order_by('-created_at','-id'),request,pledge_dto))

@api_view(['POST'])
def withdraw_pledge(request,key):
    def run():
        user=auth(request);row=get_object_or_404(SupportPledge.objects.select_for_update(),pk=identifier(key),supporter=user)
        if row.status!='pledged':raise DomainError('Only an unfulfilled pledge can be withdrawn.','CONFLICT',409)
        row.status='withdrawn';touch(row);return pledge_dto(row)
    return mutation(request,run)
