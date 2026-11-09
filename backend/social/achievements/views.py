from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from ..common import DomainError, auth, audit, data, identifier, media_owned, mutation, notify, paginate, params, touch, version
from ..models import AchievementActivity, AchievementClaim, AchievementProof, AchievementShowcase
from .catalog import BADGES, DATED_PROOFS
from .engine import day, locked_wallet, progress, reconcile_owner, set_credit
from .inputs import ActivityInput, ClaimInput, ProofInput, ReviewInput, ShowcaseInput
from .references import resolve_reference


def badge_definition(key):
    badge = BADGES.get(key)
    if badge is None:
        raise DomainError('Choose an available achievement badge.')
    return badge


def evidence_files(user, keys):
    files = media_owned(user, keys)
    if not files or any(asset.public or asset.purpose != 'private_evidence'
                        or asset.mime_type not in ['image/jpeg', 'application/pdf']
                        or not asset.normalized or asset.byte_count <= 0 for asset in files):
        raise DomainError('Upload at least one private evidence photo or document.')
    return files


def validate_proof_subject(user, badge, kind, row, occurred_at):
    context = badge.get('proofContext')
    expected_kind = {'friend': 'user', 'campaign': 'fundraiser'}.get(context, context)
    if not context or kind != expected_kind:
        raise DomainError('Choose a relevant record for a badge that accepts reviewed evidence.')
    now = timezone.now()
    if occurred_at > now or occurred_at < user.date_joined:
        raise DomainError('Choose an activity date between joining PawTrail and the current server date.')
    if kind == 'user':
        if row.pk == user.pk:
            raise DomainError('A referral must identify another genuine joined account.')
        if occurred_at < row.date_joined:
            raise DomainError('The referred account must have joined before this activity date.')
    if kind == 'post' and row.author_id != user.pk:
        raise DomainError('Choose your own published post.', 'FORBIDDEN', 403)
    if kind == 'event' and (row.ends_at > now or not row.starts_at <= occurred_at <= row.ends_at):
        raise DomainError('Attendance needs an ended, non-cancelled event and a time within its schedule.')


def proof_dto(row):
    return {'id': str(row.pk), 'userId': str(row.user_id), 'badgeId': row.badge_id,
            'submitterName': row.user.display_name or row.user.username,
            'ref': {'kind': row.ref_kind, 'id': str(row.ref_id)}, 'occurredAt': row.occurred_at.isoformat(),
            'details': row.details, 'mediaIds': [str(key) for key in row.media.values_list('pk', flat=True)],
            'createdAt': row.created_at.isoformat(), 'updatedAt': row.updated_at.isoformat(),
            'dedupKey': row.dedup_key, 'state': row.state,
            'reviewerId': str(row.reviewer_id) if row.reviewer_id else None,
            'reason': row.reason or None, 'version': row.version}


@api_view(['GET'])
def overview(request):
    return Response(progress(auth(request)))


@api_view(['POST'])
def claim(request):
    def run():
        user = auth(request)
        badge = badge_definition(data(request, ClaimInput)['badgeId'])
        wallet = locked_wallet(user.pk)
        reconcile_owner(user.pk, wallet)
        row = AchievementClaim.genuine_objects.select_for_update().filter(user=user, badge_id=badge['id']).first()
        if row and row.state == 'active' and row.credited > 0:
            return progress(user)
        item = next(item for item in progress(user)['items'] if item['id'] == badge['id'])
        if item['current'] < item['target']:
            raise DomainError('Complete this badge’s requirements before claiming its reward.', 'CONFLICT', 409)
        now = timezone.now()
        if row is None:
            row = AchievementClaim.genuine_objects.create(user=user, badge_id=badge['id'], claimed_at=now,
                                                   reward_kibble=badge['rewardKibble'])
        else:
            row.version += 1
            row.claimed_at = now
        set_credit(wallet, row, row.reward_kibble)
        audit(user, row, 'achievement_claimed')
        return progress(user)
    return mutation(request, run)


@api_view(['PATCH'])
def showcase(request):
    def run():
        user = auth(request)
        value = data(request, ShowcaseInput)
        reconcile_owner(user.pk)
        active = set(AchievementClaim.genuine_objects.filter(user=user, state='active', credited__gt=0).values_list('badge_id', flat=True))
        if any(key not in BADGES or key not in active for key in value['badgeIds']):
            raise DomainError('Only your currently unlocked badges can appear in your showcase.')
        row, _ = AchievementShowcase.genuine_objects.get_or_create(user=user)
        row.badge_ids = value['badgeIds']
        row.show_mastery = value['showMastery']
        touch(row)
        return progress(user)
    return mutation(request, run)


@api_view(['POST'])
def record_activity(request):
    def run():
        user = auth(request)
        value = data(request, ActivityInput)
        kind = value['kind']
        current_day = day(timezone.now())
        if kind == 'daily':
            defaults = {'kind': kind, 'activity_day': current_day}
            dedup_key = 'daily:' + current_day.isoformat()
        else:
            ref = value['ref']
            subject = resolve_reference(ref['kind'], ref['id'])
            defaults = {'kind': kind, 'ref_kind': ref['kind'], 'ref_id': subject.pk}
            dedup_key = ':'.join([kind, ref['kind'], str(subject.pk)])
        AchievementActivity.genuine_objects.get_or_create(user=user, dedup_key=dedup_key, defaults=defaults)
        return progress(user)
    return mutation(request, run)


@api_view(['GET', 'POST'])
def proofs(request, review_scope=False):
    user = auth(request)
    if review_scope and not user.is_staff:
        raise DomainError('Moderator permission is required.', 'FORBIDDEN', 403)
    if request.method == 'GET':
        query = params(request)
        rows = AchievementProof.genuine_objects.exclude(user__social_profile__is_fixture=True).select_related('user').order_by('-created_at', '-id')
        if not review_scope:
            rows = rows.filter(user=user)
        if query.get('state'):
            if query['state'] not in ['pending', 'approved', 'rejected']:
                raise DomainError('Choose a supported proof state.')
            rows = rows.filter(state=query['state'])
        if query.get('badgeId'):
            badge_definition(query['badgeId'])
            rows = rows.filter(badge_id=query['badgeId'])
        return Response(paginate(rows, request, proof_dto))
    if review_scope:
        raise DomainError('Submit your own evidence through the member endpoint.', 'METHOD_NOT_ALLOWED', 405)
    def run():
        value = data(request, ProofInput)
        badge = badge_definition(value['badgeId'])
        ref = value['ref']
        subject = resolve_reference(ref['kind'], ref['id'])
        validate_proof_subject(user, badge, ref['kind'], subject, value['occurredAt'])
        files = evidence_files(user, value['mediaIds'])
        dedup_key = ':'.join([badge['id'], ref['kind'], str(subject.pk)])
        if badge['id'] in DATED_PROOFS:
            dedup_key += ':' + day(value['occurredAt']).isoformat()
        row = None
        if value.get('id'):
            row = AchievementProof.genuine_objects.select_for_update().filter(pk=value['id'], user=user).first()
            if row is None:
                raise DomainError('Evidence not found.', 'NOT_FOUND', 404)
            version(row, value.get('expectedVersion'))
            if row.state != 'rejected' or row.badge_id != badge['id']:
                raise DomainError('Only your rejected evidence for this badge can be revised.', 'CONFLICT', 409)
        duplicates = AchievementProof.genuine_objects.filter(user=user, dedup_key=dedup_key)
        if row:
            duplicates = duplicates.exclude(pk=row.pk)
        if duplicates.exists():
            raise DomainError('Evidence for this activity already exists. Revise its rejected submission or wait for review.', 'CONFLICT', 409)
        if row is None:
            row = AchievementProof(user=user, badge_id=badge['id'])
        row.ref_kind = ref['kind']
        row.ref_id = subject.pk
        row.occurred_at = value['occurredAt']
        row.details = value['details']
        row.dedup_key = dedup_key
        row.state = 'pending'
        row.reviewer = None
        row.reason = ''
        row.reference_version = None
        if row._state.adding:
            row.save()
        else:
            touch(row)
        row.media.set(files)
        audit(user, row, 'achievement_proof_submitted')
        return proof_dto(row)
    return mutation(request, run, 201)


@api_view(['POST'])
def review_proof(request, key):
    def run():
        user = auth(request)
        if not user.is_staff:
            raise DomainError('Moderator permission is required.', 'FORBIDDEN', 403)
        value = data(request, ReviewInput)
        if value.get('id') and value['id'] != identifier(key):
            raise DomainError('The proof does not match the review URL.')
        row = AchievementProof.genuine_objects.exclude(user__social_profile__is_fixture=True).select_for_update(of=('self',)).select_related('user').filter(pk=identifier(key)).first()
        if row is None:
            raise DomainError('Evidence not found.', 'NOT_FOUND', 404)
        if row.user_id == user.pk or (row.ref_kind == 'user' and row.ref_id == user.pk):
            raise DomainError('An independent moderator must review this evidence.', 'FORBIDDEN', 403)
        version(row, value['expectedVersion'])
        if row.state != 'pending' and not (row.state == 'approved' and value['decision'] == 'rejected'):
            raise DomainError('Only pending evidence or a previous approval can be reviewed.', 'CONFLICT', 409)
        if value['decision'] == 'approved':
            badge = badge_definition(row.badge_id)
            subject = resolve_reference(row.ref_kind, row.ref_id)
            validate_proof_subject(row.user, badge, row.ref_kind, subject, row.occurred_at)
            evidence_files(row.user, list(row.media.values_list('pk', flat=True)))
            row.reference_version = subject.version if row.ref_kind == 'post' else None
        row.state = value['decision']
        row.reviewer = user
        row.reason = value['reason']
        try:
            with transaction.atomic():
                touch(row)
        except IntegrityError as error:
            raise DomainError('This joined account has already been credited as a referral.', 'CONFLICT', 409) from error
        audit(user, row, 'achievement_proof_' + row.state, row.reason)
        notify(row.user, 'achievement', 'Your achievement evidence was ' + row.state + '.', None)
        return proof_dto(row)
    return mutation(request, run)
