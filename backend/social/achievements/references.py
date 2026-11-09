from django.contrib.auth import get_user_model
from django.db.models import Q
from animals.models import Animal
from ..models import AnimalInfo, Campaign, Event, Horde, Mission, Post, Shelter
from ..common import DomainError, identifier


def genuine_users():
    return get_user_model().objects.filter(is_active=True).exclude(social_profile__is_fixture=True)


def public_animals():
    # Captured identities can predate their social projection. An explicitly hidden
    # social profile must not be bypassed merely because its identity is confirmed.
    return Animal.objects.exclude(social_info__is_fixture=True).exclude(owner__social_profile__is_fixture=True).exclude(
        social_info__caretaker__social_profile__is_fixture=True
    ).exclude(social_info__shelter__is_fixture=True).exclude(social_info__horde__is_fixture=True).filter(
        Q(social_info__is_fixture=False, social_info__published=True)
        | Q(social_info__isnull=True, state='confirmed')
    )


def public_missions():
    return Mission.genuine_objects.filter(state__in=['open', 'closed']).exclude(
        organizer__social_profile__is_fixture=True
    ).exclude(animal__social_info__is_fixture=True).exclude(
        shelter__is_fixture=True
    ).exclude(horde__is_fixture=True)


def public_campaigns():
    return Campaign.genuine_objects.filter(state__in=['active', 'completed', 'closed']).exclude(
        organizer__social_profile__is_fixture=True
    ).exclude(animal__social_info__is_fixture=True).exclude(
        shelter__is_fixture=True
    ).exclude(horde__is_fixture=True)


def public_events():
    return Event.genuine_objects.exclude(state='cancelled').exclude(
        organizer__social_profile__is_fixture=True
    ).exclude(shelter__is_fixture=True)


def resources(kind):
    if kind == 'animal':
        return public_animals()
    if kind == 'mission':
        return public_missions()
    if kind == 'fundraiser':
        return public_campaigns()
    if kind == 'event':
        return public_events()
    if kind == 'post':
        return Post.genuine_objects.filter(moderation='published').exclude(author__social_profile__is_fixture=True)
    if kind == 'shelter':
        return Shelter.genuine_objects.filter(published=True).exclude(owner__social_profile__is_fixture=True)
    if kind == 'horde':
        return Horde.genuine_objects.filter(published=True).exclude(owner__social_profile__is_fixture=True)
    if kind == 'user':
        return genuine_users()
    raise DomainError('Choose a supported achievement reference.')


def resolve_reference(kind, value):
    if kind == 'user':
        query = resources(kind).filter(social_profile__discoverable=True)
        try:
            row = query.filter(pk=identifier(value)).first()
        except DomainError:
            row = query.filter(username__iexact=str(value)).first()
    else:
        row = resources(kind).filter(pk=identifier(value)).first()
    if not row:
        raise DomainError('This reference is not a published, genuine community record.', 'NOT_FOUND', 404)
    return row


def eligible_references(refs):
    """Batch references once per kind, avoiding a query per proof/activity."""
    grouped = {}
    for kind, key in refs:
        grouped.setdefault(kind, set()).add(key)
    return {
        kind: set(resources(kind).filter(pk__in=keys).values_list('pk', flat=True))
        for kind, keys in grouped.items()
    }
