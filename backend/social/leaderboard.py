from datetime import datetime,timedelta
from zoneinfo import ZoneInfo
from django.db.models import Sum,Count,Q
from django.utils import timezone
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rewards.models import LedgerEntry
from rewards.service import genuine_entries
from .models import MissionParticipation,FundReceipt,UserProfile,AnimalInfo
from .common import PROVENANCE,params,paginate,DomainError

MANILA=ZoneInfo('Asia/Manila')
def period_start(period):
    now=timezone.now().astimezone(MANILA)
    if period=='month':return now.replace(day=1,hour=0,minute=0,second=0,microsecond=0)
    if period=='week':return (now-timedelta(days=now.weekday())).replace(hour=0,minute=0,second=0,microsecond=0)
    if period!='all':raise DomainError('Choose all time, this month or this week.')
    return None

def ranked(period='all',category='all',include_showcase=True):
    if category not in ['all','missions','sightings','fundraisers']:raise DomainError('Choose a supported contribution category.')
    since=period_start(period)
    profiles=UserProfile.objects.select_related('user').filter(is_fixture=False,discoverable=True,show_contributions=True,user__is_active=True)
    entries=genuine_entries().filter(owner__social_profile__in=profiles)
    missions=MissionParticipation.objects.filter(state='approved',is_fixture=False,mission__is_fixture=False,volunteer__social_profile__in=profiles).exclude(mission__animal__social_info__is_fixture=True)
    from observations.models import Sighting
    sightings=Sighting.objects.filter(active=True,observation__publication_state='published',observation__capture__owner__social_profile__in=profiles).exclude(animal__social_info__is_fixture=True)
    receipts=FundReceipt.objects.filter(is_fixture=False,campaign__is_fixture=False,pledge__anonymous=False,pledge__supporter__social_profile__in=profiles)
    if since:
        entries=entries.filter(created_at__gte=since);missions=missions.filter(reviewed_at__gte=since);sightings=sightings.filter(approved_at__gte=since);receipts=receipts.filter(created_at__gte=since)
    totals=dict(entries.values('owner_id').annotate(value=Sum('amount')).values_list('owner_id','value'))
    mission_counts=dict(missions.values('volunteer_id').annotate(value=Count('id')).values_list('volunteer_id','value'))
    sight_counts=dict(sightings.values('observation__capture__owner_id').annotate(value=Count('id')).values_list('observation__capture__owner_id','value'))
    support_counts=dict(receipts.values('pledge__supporter_id').annotate(value=Count('id')).values_list('pledge__supporter_id','value'))
    category_totals=totals
    if category in ['missions','sightings']:
        category_totals=dict(entries.filter(reason__startswith='mission_' if category=='missions' else 'sighting_').values('owner_id').annotate(value=Sum('amount')).values_list('owner_id','value'))
    results=[]
    for p in profiles:
        uid=p.user_id;counts={'missions':mission_counts.get(uid,0),'sightings':sight_counts.get(uid,0),'fundraisers':support_counts.get(uid,0)}
        score=counts['fundraisers'] if category=='fundraisers' else max(0,category_totals.get(uid,0))
        if score<=0:continue
        from .people import avatar
        from .achievements.engine import public_showcase
        achievements=public_showcase(p.user) if include_showcase else {'badges':[],'mastery':None}
        results.append({'level':1+max(0,totals.get(uid,0))//250,'avatar':avatar(p.user),'contributions':counts,'badges':achievements['badges'],'mastery':achievements['mastery'],'userId':str(uid),'username':p.user.username,'displayName':p.user.display_name or p.user.username,'kibble':max(0,totals.get(uid,0)),'provenance':PROVENANCE,'_score':score})
    results.sort(key=lambda r:(-r['_score'],-sum(r['contributions'].values()),r['username'].casefold(),r['userId']))
    for rank,row in enumerate(results,1):row['rank']=rank;row.pop('_score')
    return results

def rank_for(user,request=None):
    if request is not None and hasattr(request,'_social_top_ten'):values=request._social_top_ten
    else:
        values={r['userId']:r['rank'] for r in ranked(include_showcase=False)[:10]}
        if request is not None:request._social_top_ten=values
    return values.get(str(user.pk))

@api_view(['GET'])
@permission_classes([AllowAny])
def leaderboard(request):
    p=params(request);rows=ranked(p.get('period','all'),p.get('category','all'))
    podium=rows[:3]
    summary={'activeHelpers':len(rows),'kibbleEarned':sum(r['kibble'] for r in rows),'contributions':sum(sum(r['contributions'].values()) for r in rows),'animalsHelped':0}
    eligible=[r['userId'] for r in rows]
    from observations.models import Sighting
    sighting_rows=Sighting.objects.filter(active=True,observation__publication_state='published',observation__capture__owner_id__in=eligible)
    mission_rows=MissionParticipation.objects.filter(state='approved',is_fixture=False,mission__is_fixture=False,volunteer_id__in=eligible,mission__animal__isnull=False)
    since=period_start(p.get('period','all'))
    if since:sighting_rows=sighting_rows.filter(approved_at__gte=since);mission_rows=mission_rows.filter(reviewed_at__gte=since)
    helped=set(sighting_rows.values_list('animal_id',flat=True));helped.update(mission_rows.values_list('mission__animal_id',flat=True));summary['animalsHelped']=len(helped)
    if p.get('q'):rows=[r for r in rows if p['q'].lower() in (r['username']+' '+r['displayName']).lower()]
    result=paginate(rows,request,lambda x:x)
    try:
        from django.core import signing
        offset=signing.loads(p['cursor'],salt='social-page')['offset'] if p.get('cursor') else 0
    except Exception:offset=0
    result.update(podium=podium,summary=summary,spotlights=[],offset=offset,previousCursor=None)
    return Response(result)

@api_view(['GET'])
def transactions(request):
    from .common import auth,base
    user=auth(request)
    rows=LedgerEntry.objects.filter(owner=user).select_related('grant','mission_participation').order_by('-created_at','-id')
    return Response(paginate(rows,request,lambda r:{**base(r),'userId':str(user.pk),'amount':r.amount,'reason':r.reason,'contributionId':str(r.grant.observation_id) if r.grant_id else str(r.mission_participation_id or r.achievement_claim_id),'description':r.description}))
