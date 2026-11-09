"""Read genuine contribution records; serialize all reward changes on the wallet."""
from collections import defaultdict
from datetime import timedelta
from zoneinfo import ZoneInfo
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import F, Sum
from django.utils import timezone
from media.models import Asset
from observations.models import Sighting
from rewards.models import LedgerEntry, Wallet
from rewards.service import genuine_entries
from ..models import (
    AchievementActivity, AchievementClaim, AchievementProof, AchievementShowcase,
    AdoptionApplication, AnimalInfo, EventRsvp, FundReceipt, MissionParticipation, Post,
)
from ..common import DomainError
from .catalog import BADGES, TIERS
from .references import eligible_references, public_animals, public_campaigns, public_events, public_missions

MANILA = ZoneInfo('Asia/Manila')


def day(value):
    return value.astimezone(MANILA).date()


def longest_streak(values):
    best = run = 0
    previous = None
    for value in sorted(set(values)):
        run = run + 1 if previous is not None and value == previous + timedelta(days=1) else 1
        best = max(best, run)
        previous = value
    return best


def summary(claims):
    active = [c for c in claims if not c.is_fixture and c.state == 'active' and c.credited > 0 and c.badge_id in BADGES]
    count = len(active)
    tier = next(t for t in reversed(TIERS) if count >= t['count'])
    return {'unlocked': count, 'total': len(BADGES), 'tier': tier['name'],
            'nextMilestone': next((t['count'] for t in TIERS if t['count'] > count), None),
            'kibbleEarned': sum(c.credited for c in active)}


def area_key(location):
    if not isinstance(location, dict) or not location.get('areaId'):
        return None
    if location['areaId'] == 'reported-area':
        if location.get('latitude') is None or location.get('longitude') is None:
            return None
        return ('reported-area', round(location['latitude'], 2), round(location['longitude'], 2))
    return location['areaId']


def progress(user, now=None, claims=None):
    now = now or timezone.now()
    claims = list(AchievementClaim.genuine_objects.filter(user=user)) if claims is None else claims
    active = {c.badge_id: c for c in claims if not c.is_fixture and c.state == 'active' and c.credited > 0}
    missions = list(MissionParticipation.genuine_objects.filter(
        volunteer=user, mission__in=public_missions(), state='approved',
        reviewer__isnull=False, submitted_at__isnull=False,
    ).exclude(reviewer=user).exclude(mission__organizer=user).exclude(
        reviewer__social_profile__is_fixture=True
    ).select_related('mission').order_by('created_at', 'id'))
    sightings = list(Sighting.objects.filter(
        observation__capture__owner=user, active=True,
        observation__publication_state='published', observation__identity_state='confirmed',
        observation__evidence_state='plausible', animal__in=public_animals(),
    ).select_related('observation__capture'))
    public_posts = Post.genuine_objects.filter(author=user, moderation='published')
    posts = public_posts
    receipts = list(FundReceipt.genuine_objects.filter(
        pledge__supporter=user, pledge__is_fixture=False, pledge__status='fulfilled',
        campaign__in=public_campaigns(), amount_minor__gt=0,
        evidence__public=False, evidence__purpose='private_evidence', evidence__byte_count__gt=0,
        evidence__owner_id=F('reviewer_id'), evidence__mime_type__in=['image/jpeg', 'application/pdf'],
    ).exclude(reviewer=user).exclude(reviewer=F('campaign__organizer')).exclude(
        reviewer__social_profile__is_fixture=True
    ).exclude(evidence__normalized='').select_related('campaign').distinct())
    # A pledge, application approval, RSVP or digital profile visit is never
    # silently promoted into a payment, completed adoption or physical visit.
    campaigns = {r.campaign_id: r.campaign for r in receipts}
    activities = list(AchievementActivity.genuine_objects.filter(user=user))
    proofs = list(AchievementProof.genuine_objects.filter(
        user=user, state='approved', reviewer__isnull=False,
    ).exclude(reviewer=user).exclude(reviewer__social_profile__is_fixture=True))
    refs = eligible_references(
        [(a.ref_kind, a.ref_id) for a in activities if a.ref_id]
        + [(p.ref_kind, p.ref_id) for p in proofs]
    )
    activities = [a for a in activities if a.kind == 'daily' or a.ref_id in refs.get(a.ref_kind, set())]
    proofs = [p for p in proofs if p.ref_id in refs.get(p.ref_kind, set())
              and user.date_joined <= p.occurred_at <= now]
    event_refs = {p.ref_id for p in proofs if p.ref_kind == 'event'}
    event_rows = public_events().filter(pk__in=event_refs).in_bulk() if event_refs else {}
    proofs = [p for p in proofs if p.ref_kind != 'event' or (
        event_rows[p.ref_id].ends_at <= now
        and event_rows[p.ref_id].starts_at <= p.occurred_at <= event_rows[p.ref_id].ends_at
    )]
    referral_refs = {p.ref_id for p in proofs if p.ref_kind == 'user'}
    referral_dates = dict(get_user_model().objects.filter(pk__in=referral_refs).values_list('pk', 'date_joined'))
    proofs = [p for p in proofs if p.ref_kind != 'user' or referral_dates[p.ref_id] <= p.occurred_at]
    owned_posts = set(posts.values_list('pk', flat=True))
    public_post_versions = dict(public_posts.values_list('pk', 'version'))
    proofs = [p for p in proofs if p.ref_kind != 'post' or (p.ref_id in public_post_versions and p.reference_version == public_post_versions[p.ref_id])]
    # Private evidence must still exist; no imported approval can bypass uploads.
    evidence_proofs = set(Asset.objects.filter(
        achievement_proofs__in=proofs, owner_id=F('achievement_proofs__user_id'), public=False, purpose='private_evidence', byte_count__gt=0,
        mime_type__in=['image/jpeg', 'application/pdf'],
    ).exclude(normalized='').values_list('achievement_proofs__id', flat=True))
    proofs = [p for p in proofs if p.pk in evidence_proofs]
    proof_counts = defaultdict(set)
    proof_days = defaultdict(lambda: defaultdict(set))
    for proof in proofs:
        proof_counts[proof.badge_id].add(proof.dedup_key)
        proof_days[proof.badge_id][proof.ref_id].add(day(proof.occurred_at))
    per_animal_days = lambda badge: max((len(days) for days in proof_days[badge].values()), default=0)
    animal_ids = {p.mission.animal_id for p in missions if p.mission.animal_id}
    relevant_animals = animal_ids | {s.animal_id for s in sightings}
    locations = dict(AnimalInfo.genuine_objects.filter(published=True, animal_id__in=relevant_animals).values_list('animal_id', 'location'))
    areas = defaultdict(set)
    for participation in missions:
        mission = participation.mission
        key = area_key(locations.get(mission.animal_id, mission.location))
        if mission.animal_id and key is not None:
            areas[key].add(mission.animal_id)
    for sighting in sightings:
        capture = sighting.observation.capture
        location = locations.get(sighting.animal_id) or {
            'areaId': 'reported-area', 'latitude': capture.latitude, 'longitude': capture.longitude,
        }
        key = area_key(location)
        if key is not None:
            areas[key].add(sighting.animal_id)
    membership_days = max(0, (now - user.date_joined).days)
    balance = genuine_entries().filter(owner=user).aggregate(value=Sum('amount'))['value'] or 0
    top_three = False
    if missions and balance > 0:
        from ..leaderboard import ranked
        top_three = any(row['userId'] == str(user.pk) for row in ranked(include_showcase=False)[:3])
    approved_ids = {p.pk for p in missions}
    reviewed = MissionParticipation.genuine_objects.filter(
        volunteer=user, state__in=['approved', 'rejected'], mission__in=public_missions(),
    ).exclude(mission__organizer=user).order_by('created_at', 'id')
    run = best = 0
    for participation in reviewed:
        run = run + 1 if participation.pk in approved_ids else 0
        best = max(best, run)
    photos = Asset.objects.filter(post__in=posts, public=True, byte_count__gt=0).exclude(
        derivative=''
    ).exclude(purpose='private_evidence').values_list('pixel_digest', 'sha256', 'pk').distinct()
    photo_count = len({pixel or digest or str(key) for pixel, digest, key in photos})
    approved_days = [day(s.observation.capture.captured_at) for s in sightings if s.observation.capture.captured_at]
    mission_rows = [p.mission for p in missions]
    rescue_animals = {p.ref_id for p in proofs if p.badge_id == 'rescue-ally'}
    metrics = {
        'first-sighting': len(sightings), 'first-help': len(missions), 'top-pawpal': int(top_three),
        'fundraiser-supporter': len(campaigns),
        'shelter-supporter': len({m.shelter_id for m in mission_rows if m.shelter_id and not m.shelter.is_fixture}
                                 | {c.shelter_id for c in campaigns.values() if c.shelter_id and not c.shelter.is_fixture}),
        'care-companion': per_animal_days('care-companion'),
        'explorer': len({a.ref_id for a in activities if a.kind == 'discovery'}),
        'community-storyteller': len(owned_posts), 'animal-guardian': len(animal_ids | rescue_animals),
        'horde-helper': len({m.horde_id for m in mission_rows if m.horde_id}
                             | {c.horde_id for c in campaigns.values() if c.horde_id}),
        'event-participant': EventRsvp.genuine_objects.filter(attendee=user, event__in=public_events()).count(),
        'mission-complete': len(missions),
        'green-paw': int(len(missions) >= 10) + int(len(animal_ids) >= 3),
        'true-pawpal': int(len(missions) >= 20) + int(len(owned_posts) >= 10) + int(len(sightings) >= 5),
        'daily-pawpal': longest_streak(a.activity_day for a in activities if a.kind == 'daily'),
        'keen-spotter': len(sightings), 'paw-photographer': photo_count,
        'area-guardian': max((len(animals) for animals in areas.values()), default=0),
        'generous-donor': len(campaigns),
        'advocate': len({(a.ref_kind, a.ref_id) for a in activities if a.kind == 'share'}),
        'mission-streak': best,
        'paw-legacy': int(membership_days >= 30) + int(len(set(active) - {'paw-legacy'}) >= 20),
        'mission-leader': len(missions), 'horde-friend': len([m for m in mission_rows if m.horde_id]),
        'medical-supporter': len([c for c in campaigns.values() if c.category == 'medical']),
        'recovery-partner': per_animal_days('recovery-partner'),
        'sighting-streak': longest_streak(approved_days),
        'adoption-supporter': sum(
            row.status in ['submitted', 'needs_information', 'approved', 'rejected']
            or any(entry.get('status') == 'submitted' for entry in row.history)
            for row in AdoptionApplication.genuine_objects.filter(
                applicant=user, animal__in=public_animals(), shelter__is_fixture=False,
            )
        ),
        'volunteer': MissionParticipation.genuine_objects.filter(volunteer=user, mission__in=public_missions()).exclude(mission__organizer=user).count(),
        'kindness-explorer': len({p.ref_id for p in proofs if p.badge_id == 'kindness-explorer'}),
        'kibble-saver': max(0, balance), 'pawtrail-supporter': membership_days,
    }
    criteria = {
        'green-paw': [('Approved missions', len(missions), 10), ('Different animals helped', len(animal_ids), 3)],
        'true-pawpal': [('Approved missions', len(missions), 20), ('Published posts', len(owned_posts), 10), ('Approved sightings', len(sightings), 5)],
        'paw-legacy': [('Membership days', membership_days, 30), ('Other unlocked badges', len(set(active) - {'paw-legacy'}), 20)],
    }
    by_badge = {c.badge_id: c for c in claims}
    items = []
    for key, badge in BADGES.items():
        current = metrics.get(key, len(proof_counts[key]))
        claim = active.get(key)
        if claim and badge.get('historical'):
            current = max(current, badge['target'])
        items.append({'id': key, 'current': current, 'target': badge['target'],
            'percent': min(100, current * 100 // badge['target']),
            'state': 'unlocked' if claim else 'ready' if current >= badge['target'] else 'revoked' if key in by_badge else 'locked',
            'claimedAt': claim.claimed_at.isoformat() if claim else None, 'rewardKibble': badge['rewardKibble'],
            'criteria': [{'label': label, 'current': count, 'target': target}
                         for label, count, target in criteria.get(key, [(badge['unit'], current, badge['target'])])]})
    showcase = AchievementShowcase.genuine_objects.filter(user=user).first()
    return {'items': items, 'summary': summary(claims),
            'showcase': {'badgeIds': [key for key in showcase.badge_ids if key in active] if showcase else [],
                         'showMastery': showcase.show_mastery if showcase else False},
            'pendingProofs': AchievementProof.genuine_objects.filter(user=user, state='pending').count(),
            'checkedInToday': any(a.kind == 'daily' and a.activity_day == day(now) for a in activities)}


def locked_wallet(user_id):
    Wallet.objects.get_or_create(owner_id=user_id)
    wallet = Wallet.objects.select_for_update().get(owner_id=user_id)
    balance = LedgerEntry.objects.filter(owner_id=user_id).aggregate(value=Sum('amount'))['value'] or 0
    if balance < 0:
        raise DomainError('The ledger requires a reviewed correction before rewards can continue.', 'CONFLICT', 409)
    if wallet.balance != balance:
        wallet.balance = balance
        wallet.save(update_fields=['balance', 'updated_at'])
    return wallet


def set_credit(wallet, claim, target):
    amount = target - claim.credited
    if not amount:
        return
    if wallet.balance + amount < 0:
        raise DomainError('The wallet must be reconciled before this correction.', 'CONFLICT', 409)
    claim.reward_revision += 1
    wallet.balance += amount
    badge = BADGES.get(claim.badge_id, {'title': claim.badge_id})
    LedgerEntry.objects.create(
        owner_id=claim.user_id, achievement_claim=claim, revision=claim.reward_revision,
        amount=amount, balance_after=wallet.balance,
        reason='achievement_awarded' if amount > 0 else 'achievement_reversed',
        description=('Achievement unlocked: ' if amount > 0 else 'Achievement correction: ') + badge['title'],
        reward_day=day(timezone.now()), observation_version=claim.version,
    )
    claim.credited = target
    claim.state = 'active' if target else 'revoked'
    claim.save(update_fields=['credited', 'state', 'reward_revision', 'version', 'claimed_at', 'updated_at'])
    wallet.save(update_fields=['balance', 'updated_at'])


@transaction.atomic
def reconcile_owner(user_id, wallet=None):
    # Always serialize before inspecting claims. A pre-lock "no claims" shortcut
    # would race a first claim against a moderator's source withdrawal.
    user = get_user_model().objects.get(pk=user_id)
    from ..common import profile
    genuine = not profile(user).is_fixture
    if not genuine and not AchievementClaim.all_objects.filter(user=user, credited__gt=0).exists():
        return
    wallet = wallet or locked_wallet(user_id)
    claims = list(AchievementClaim.all_objects.select_for_update().filter(user=user))
    for _ in range(len(BADGES) + 1):
        active = [c for c in claims if c.state == 'active' and c.credited > 0]
        if not active:
            break
        items = {item['id']: item for item in progress(user, claims=claims)['items']} if genuine else {}
        invalid = [c for c in active if c.is_fixture or not genuine or c.badge_id not in BADGES or (
            not BADGES[c.badge_id].get('historical') and items[c.badge_id]['current'] < items[c.badge_id]['target']
        )]
        if not invalid:
            break
        # Legacy can depend on the badges revoked in this pass, so iterate to a fixed point.
        for claim in invalid:
            claim.version += 1
            set_credit(wallet, claim, 0)
    return wallet


def public_showcase(user, request=None):
    from ..common import profile
    p = profile(user)
    empty = {'badges': [], 'mastery': None}
    if p.is_fixture or not user.is_active or not p.discoverable or not p.show_contributions:
        return empty
    cache = getattr(request, '_achievement_showcases', {}) if request is not None else {}
    if user.pk in cache:
        return cache[user.pk]
    preference = AchievementShowcase.genuine_objects.filter(user=user).first()
    if not preference or not (preference.badge_ids or preference.show_mastery):
        result = empty
    else:
        claims = list(AchievementClaim.genuine_objects.filter(user=user, state='active', credited__gt=0))
        active = {c.badge_id for c in claims}
        result = {'badges': [{'id': key, 'label': BADGES[key]['title']} for key in preference.badge_ids if key in active and key in BADGES],
                  'mastery': summary(claims) if preference.show_mastery else None}
    if request is not None:
        cache[user.pk] = result
        request._achievement_showcases = cache
    return result
