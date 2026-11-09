"""Collect source changes until related rows/media are complete, then reconcile."""
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, field
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models.signals import m2m_changed, post_delete, post_save, pre_delete, pre_save
from media.models import Asset
from animals.models import Animal
from observations.models import Sighting
from ..models import (
    AchievementActivity, AchievementClaim, AchievementProof, AdoptionApplication,
    AnimalInfo, Campaign, Event, EventRsvp, FundReceipt, Horde,
    Mission, MissionParticipation, Post, Shelter, SupportPledge, UserProfile,
)


@dataclass
class Changes:
    owners: set = field(default_factory=set)
    before_rewards: list = field(default_factory=list)


_current = ContextVar('achievement_source_changes', default=None)


@contextmanager
def achievement_changes():
    current = _current.get()
    if current is not None:
        yield current
        return
    with transaction.atomic():
        changes = Changes()
        token = _current.set(changes)
        try:
            yield changes
            flush_changes()
        finally:
            _current.reset(token)


def flush_changes():
    changes = _current.get()
    if changes is None:
        return
    from .engine import locked_wallet, reconcile_owner
    while changes.owners or changes.before_rewards:
        keys, callbacks = set(changes.owners), list(changes.before_rewards)
        changes.owners.clear()
        changes.before_rewards.clear()
        wallets = {}
        # All affected wallets are serialized before deferred capture rewards.
        owners = list(get_user_model().objects.filter(pk__in=keys).order_by('pk'))
        for user in owners:
            fixture = UserProfile.objects.filter(user=user, is_fixture=True).exists()
            if fixture and not AchievementClaim.all_objects.filter(user=user, credited__gt=0).exists():
                continue
            wallets[user.pk] = locked_wallet(user.pk)
        for callback in callbacks:
            callback()
        for user in owners:
            if user.pk in wallets:
                # Source rewards may have updated this wallet through another ORM instance.
                if callbacks:
                    wallets[user.pk].refresh_from_db(fields=['balance'])
                reconcile_owner(user.pk, wallets[user.pk])


def queue_owners(owners):
    owners = {key for key in owners if key is not None}
    current = _current.get()
    if current is not None:
        current.owners.update(owners)
    elif owners:
        with achievement_changes() as changes:
            changes.owners.update(owners)


def defer_encounter_rewards(owner_id):
    from rewards.service import sync_encounter_rewards
    current = _current.get()
    if current is None:
        with achievement_changes():
            defer_encounter_rewards(owner_id)
        return
    current.owners.add(owner_id)
    current.before_rewards.append(lambda: sync_encounter_rewards(owner_id))


def reference_owners(kind, key):
    return set(AchievementActivity.genuine_objects.filter(ref_kind=kind, ref_id=key).values_list('user_id', flat=True)) | set(
        AchievementProof.genuine_objects.filter(ref_kind=kind, ref_id=key).values_list('user_id', flat=True)
    )


def affected_owners(instance):
    if isinstance(instance, (AchievementActivity, AchievementProof)):
        return {instance.user_id}
    if isinstance(instance, MissionParticipation):
        return {instance.volunteer_id}
    if isinstance(instance, AdoptionApplication):
        return {instance.applicant_id}
    if isinstance(instance, EventRsvp):
        return {instance.attendee_id}
    if isinstance(instance, SupportPledge):
        return {instance.supporter_id}
    if isinstance(instance, FundReceipt):
        return {instance.pledge.supporter_id}
    if isinstance(instance, Post):
        return {instance.author_id} | reference_owners('post', instance.pk)
    if isinstance(instance, (Animal, AnimalInfo)):
        key = instance.animal_id if isinstance(instance, AnimalInfo) else instance.pk
        return reference_owners('animal', key) | set(
            Sighting.objects.filter(animal_id=key).values_list('observation__capture__owner_id', flat=True)
        ) | set(MissionParticipation.genuine_objects.filter(mission__animal_id=key).values_list('volunteer_id', flat=True))
    if isinstance(instance, Mission):
        return reference_owners('mission', instance.pk) | set(
            MissionParticipation.genuine_objects.filter(mission=instance).values_list('volunteer_id', flat=True)
        )
    if isinstance(instance, Campaign):
        return reference_owners('fundraiser', instance.pk) | set(
            FundReceipt.genuine_objects.filter(campaign=instance).values_list('pledge__supporter_id', flat=True)
        )
    if isinstance(instance, Event):
        return reference_owners('event', instance.pk) | set(
            EventRsvp.genuine_objects.filter(event=instance).values_list('attendee_id', flat=True)
        )
    if isinstance(instance, (Shelter, Horde)):
        kind = 'shelter' if isinstance(instance, Shelter) else 'horde'
        return reference_owners(kind, instance.pk) | set(
            MissionParticipation.genuine_objects.filter(**{'mission__' + kind: instance}).values_list('volunteer_id', flat=True)
        ) | set(FundReceipt.genuine_objects.filter(**{'campaign__' + kind: instance}).values_list('pledge__supporter_id', flat=True))
    if isinstance(instance, Asset):
        return set(Post.genuine_objects.filter(photos=instance).values_list('author_id', flat=True)) | set(
            AchievementProof.genuine_objects.filter(media=instance).values_list('user_id', flat=True)
        ) | set(FundReceipt.genuine_objects.filter(evidence=instance).values_list('pledge__supporter_id', flat=True))
    if isinstance(instance, (get_user_model(), UserProfile)):
        key = instance.user_id if isinstance(instance, UserProfile) else instance.pk
        owners = {key} | reference_owners('user', key)
        owners.update(AchievementProof.genuine_objects.filter(reviewer_id=key).values_list('user_id', flat=True))
        # A fixture/deactivated account cannot keep public reference activity valid.
        user = instance.user if isinstance(instance, UserProfile) else instance
        fixture = instance.is_fixture if isinstance(instance, UserProfile) else UserProfile.objects.filter(user=user, is_fixture=True).exists()
        if fixture or not user.is_active:
            for model, field_name in [(Post, 'author_id'), (Mission, 'organizer_id'), (Campaign, 'organizer_id'), (Event, 'organizer_id'), (Animal, 'owner_id')]:
                for record in getattr(model, 'genuine_objects', model.objects).filter(**{field_name: key}):
                    owners.update(affected_owners(record))
        return owners
    return set()


def before_save(sender, instance, raw=False, **kwargs):
    if not raw and not instance._state.adding:
        previous = sender._base_manager.filter(pk=instance.pk).first()
        if previous is not None:
            instance._achievement_previous_owners = affected_owners(previous)


def source_saved(sender, instance, raw=False, **kwargs):
    if raw:
        return
    with achievement_changes():
        if isinstance(instance, Post):
            # A prior educational/awareness approval cannot certify edited content.
            # Preserve its audit history and put the current proof back into review.
            proofs = AchievementProof.genuine_objects.select_for_update().filter(
                ref_kind='post', ref_id=instance.pk, state='approved',
            ).exclude(reference_version=instance.version)
            for proof in proofs:
                proof.state = 'pending'
                proof.reference_version = None
                proof.reviewer = None
                proof.reason = 'The linked post changed. Its current version needs independent review.'
                proof.version += 1
                proof.save(update_fields=['state', 'reference_version', 'reviewer', 'reason', 'version', 'updated_at'])
        queue_owners(affected_owners(instance) | getattr(instance, '_achievement_previous_owners', set()))


def before_delete(sender, instance, **kwargs):
    # M2M links can be gone by post_delete, including private evidence links.
    instance._achievement_owners = affected_owners(instance)


def source_deleted(sender, instance, **kwargs):
    queue_owners(getattr(instance, '_achievement_owners', set()) | affected_owners(instance))


def media_changed(sender, instance, action, reverse, pk_set, **kwargs):
    if action == 'pre_clear':
        instance._achievement_media_owners = affected_owners(instance)
    if action not in ['post_add', 'post_remove', 'post_clear']:
        return
    owners = affected_owners(instance) | getattr(instance, '_achievement_media_owners', set())
    if reverse and pk_set:
        model = {Post.photos.through: Post, AchievementProof.media.through: AchievementProof, FundReceipt.evidence.through: FundReceipt}[sender]
        for record in model.objects.filter(pk__in=pk_set):
            owners.update(affected_owners(record))
    queue_owners(owners)


def register():
    sources = [AchievementActivity, AchievementProof, AdoptionApplication, AnimalInfo, Campaign,
               Event, EventRsvp, FundReceipt, Horde, Mission, MissionParticipation, Post,
               Shelter, SupportPledge, Asset, Animal, UserProfile, get_user_model()]
    for model in sources:
        key = 'achievements:' + model._meta.label_lower
        pre_save.connect(before_save, sender=model, dispatch_uid=key + ':saving', weak=False)
        post_save.connect(source_saved, sender=model, dispatch_uid=key + ':saved', weak=False)
        pre_delete.connect(before_delete, sender=model, dispatch_uid=key + ':deleting', weak=False)
        post_delete.connect(source_deleted, sender=model, dispatch_uid=key + ':deleted', weak=False)
    for through in [Post.photos.through, AchievementProof.media.through, FundReceipt.evidence.through]:
        m2m_changed.connect(media_changed, sender=through, dispatch_uid='achievements:media:' + through._meta.label_lower, weak=False)
