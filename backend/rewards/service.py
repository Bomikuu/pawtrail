"""The real platform's canonical non-cash ledger. Never consumes client balances."""
from datetime import timedelta
from zoneinfo import ZoneInfo
from django.db import transaction
from django.db.models import Sum
from observations.models import Observation, Sighting
from .models import Wallet, EncounterGrant, LedgerEntry

REWARD = 10
DAILY_LIMIT = 100
POLICY_VERSION = "verified-sighting-v1"
MANILA = ZoneInfo("Asia/Manila")

def genuine_entries():
    """Keep fixture-origin history out of achievements and public contribution rank."""
    return LedgerEntry.objects.exclude(grant__animal__social_info__is_fixture=True).exclude(
        grant__observation__capture__owner__social_profile__is_fixture=True
    ).exclude(mission_participation__is_fixture=True).exclude(
        mission_participation__mission__is_fixture=True
    ).exclude(mission_participation__mission__animal__social_info__is_fixture=True).exclude(
        achievement_claim__is_fixture=True
    )


def reward_day(observation):
    value = observation.capture.captured_at
    return value.astimezone(MANILA).date() if value else None

def eligibility(observation, active_sightings):
    from social.models import AnimalInfo, UserProfile
    if UserProfile.objects.filter(user_id=observation.capture.owner_id, is_fixture=True).exists():
        return "not_eligible", "Verified encounter rewards require a genuine contributor."
    if observation.animal_id and AnimalInfo.all_objects.filter(animal_id=observation.animal_id,is_fixture=True).exists():
        return "not_eligible", "Verified encounter rewards require a genuine animal identity."
    if observation.identity_state == "disputed" or observation.evidence_state == "rejected":
        return "not_eligible", "Encounter evidence or identity was withdrawn."
    if observation.publication_state != "published" or observation.pk not in active_sightings:
        return "pending_review", "Identity and encounter evidence must both be accepted."
    captured = observation.capture.captured_at
    if not captured:
        return "capture_time_unknown", "A known capture time is required for a daily sighting reward."
    age = (observation.capture.received_at - captured).total_seconds()
    if age < -300 or age > timedelta(hours=24).total_seconds():
        return "not_eligible", "Rewards cover encounters submitted within 24 hours of the reported capture time."
    return "eligible", "Accepted recent encounter."

def append_entry(wallet, grant, amount, animal, day, version, description):
    grant.revision += 1
    wallet.balance += amount
    if wallet.balance < 0:
        raise ValueError("The authoritative wallet cannot become negative.")
    LedgerEntry.objects.create(owner=wallet.owner, grant=grant, revision=grant.revision, amount=amount,
        balance_after=wallet.balance, reason="sighting_approved" if amount > 0 else "sighting_reversed",
        description=description, animal_id_snapshot=animal.pk if animal else None,
        animal_name_snapshot=animal.name if animal else "", reward_day=day, observation_version=version)
    grant.credited += amount

@transaction.atomic
def sync_encounter_rewards(owner_id):
    """Reconcile one owner's accepted encounters under a wallet lock in the publication transaction.

    Deterministic daily selection allows a previously limited valid encounter to replace a reversed
    one. All debits happen before credits, and a re-assignment reverses attribution before restoring it.
    """
    Wallet.objects.get_or_create(owner_id=owner_id)
    # Member mutations lock their account before this wallet. Do not acquire an
    # owner account lock after taking the wallet during a moderator correction.
    wallet = Wallet.objects.select_for_update(of=("self",)).select_related("owner").get(owner_id=owner_id)
    observations = list(Observation.objects.filter(capture__owner_id=owner_id, submitted_at__isnull=False)
                        .select_related("capture", "animal").order_by("capture__received_at", "pk"))
    sightings = set(Sighting.objects.filter(active=True, observation__capture__owner_id=owner_id).values_list("observation_id", flat=True))
    grants = {row.observation_id: row for row in EncounterGrant.objects.filter(owner_id=owner_id).select_related("animal")}
    totals, animals_per_day = {}, set()
    targets = []
    for observation in observations:
        status, reason = eligibility(observation, sightings)
        day = reward_day(observation)
        animal = observation.animal
        if status == "eligible":
            bucket = (day, observation.animal_id)
            if bucket in animals_per_day:
                status, reason = "already_recognized_today", "Another accepted sighting of this animal earned your Kibble for this Manila day."
            elif totals.get(day, 0) + REWARD > DAILY_LIMIT:
                status, reason = "daily_limit", "Your 100 Kibble daily limit for sighting rewards has been reached."
            else:
                animals_per_day.add(bucket)
                totals[day] = totals.get(day, 0) + REWARD
                status, reason = "awarded", "10 Kibble for an accepted animal encounter."
        grant = grants.get(observation.pk)
        if not grant:
            grant = EncounterGrant.objects.create(owner_id=owner_id, observation=observation, animal=animal, reward_day=day)
        target = grant.amount if status == "awarded" else 0
        attribution_changed = grant.animal_id != observation.animal_id or grant.reward_day != day
        if grant.credited and (not target or attribution_changed):
            append_entry(wallet, grant, -grant.credited, grant.animal, grant.reward_day, observation.version,
                         "Sighting credit reversed after its eligibility or animal identity changed.")
        targets.append((grant, observation, target, status, reason, day))
    # Credit only after all obsolete credits are reversed, preserving nonnegative running balances.
    for grant, observation, target, status, reason, day in targets:
        grant.animal = observation.animal
        grant.reward_day = day
        if target and not grant.credited:
            append_entry(wallet, grant, target, observation.animal, day, observation.version,
                         "Verified sighting of " + (observation.animal.name if observation.animal else "an animal"))
        grant.status = "reversed" if not target and grant.revision else status
        grant.reason = reason
        grant.save()
    wallet.save(update_fields=["balance", "updated_at"])
    return wallet

def reward_receipt(observation):
    grant = EncounterGrant.objects.filter(observation=observation).first()
    if not grant:
        return {"rewardStatus": "pending_review" if observation.submitted_at else "not_awarded", "rewardAmount": 0,
                "rewardReason": "Rewards follow an accepted real encounter."}
    return {"rewardStatus": grant.status, "rewardAmount": grant.credited, "rewardReason": grant.reason}

def wallet_dto(user):
    # Balance is derived from immutable history. The locked Wallet row serializes writes only.
    entries = LedgerEntry.objects.filter(owner=user)
    balance = entries.aggregate(value=Sum("amount"))["value"] or 0
    return {"balance": balance, "nonCash": True, "provenance": {"kind": "real", "label": "Verified platform contributions"},
            "policy": {"sightingReward": REWARD, "dailySightingLimit": DAILY_LIMIT, "timezone": "Asia/Manila",
                       "version": POLICY_VERSION, "oncePerAnimalPerDay": True}}
