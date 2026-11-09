"""Opt-in virtual homes, represented by neighborhood pins, never home addresses."""
import hashlib
from datetime import timedelta
from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone
from .models import PlayerHouse, HouseVisitor, PetGameProfile, UserBlock, Friendship, Invitation

AREAS = {
    'poblacion': ('Poblacion, Davao City', 125.6128, 7.0731),
    'buhangin': ('Buhangin, Davao City', 125.6228, 7.105),
    'matina': ('Matina, Davao City', 125.5886, 7.0549),
}

def visible_houses(viewer):
    excluded = UserBlock.objects.filter(Q(owner=viewer) | Q(target=viewer))
    blocked = [edge.target_id if edge.owner_id == viewer.id else edge.owner_id for edge in excluded]
    friends = [edge.b_id if edge.a_id == viewer.id else edge.a_id
               for edge in Friendship.objects.filter(Q(a=viewer) | Q(b=viewer))]
    invited = Invitation.objects.filter(recipient=viewer, state__in=['pending', 'accepted'],
                                        expires__gt=timezone.now()).values_list('house_id', flat=True)
    allowed = Q(owner=viewer) | Q(visibility='public') | Q(visibility='friends', owner_id__in=friends) | Q(visibility='invite', owner_id__in=invited)
    return PlayerHouse.objects.select_related('owner').filter(
        allowed, owner__sample=viewer.sample, opened=True, map_area__in=AREAS,
    ).exclude(owner_id__in=blocked).exclude(owner__id__startswith='system:').order_by('owner_id')

def directory(viewer):
    cutoff = timezone.now() - timedelta(seconds=35)
    houses = visible_houses(viewer)[:500]
    counts = dict(HouseVisitor.objects.filter(updated__gt=cutoff).values('house_id').annotate(total=Count('player_id', distinct=True)).values_list('house_id', 'total'))
    pets = dict(PetGameProfile.objects.values('owner_id').annotate(total=Count('id')).values_list('owner_id', 'total'))
    items = []
    public_pets={}
    from community_map.models import HomePetMembership
    for membership in HomePetMembership.objects.filter(home_id__in=[h.owner_id for h in houses],is_visible=True):
        snap=membership.public_snapshot
        public_pets.setdefault(membership.home_id,[]).append(dict(id=membership.animal_id,name=snap.get('name','Animal'),species=snap.get('species','cat'),photo=snap.get('photo'),profileHref='/pets/'+snap['slug'] if snap.get('slug') else None))
    for pet in PetGameProfile.objects.filter(owner_id__in=[h.owner_id for h in houses],map_visible=True):
        snap=pet.snapshot
        if any(item['id']==snap.get('id',pet.id) for item in public_pets.get(pet.owner_id,[])):continue
        public_pets.setdefault(pet.owner_id,[]).append(dict(id=snap.get('id',pet.id),name=snap.get('name','Animal'),species=snap.get('species','cat'),photo=snap.get('photo'),profileHref='/pets/'+snap['slug'] if snap.get('slug') else None))
    for house in houses:
        name, lng, lat = AREAS[house.map_area]
        # Deliberately fictional offsets distribute game homes within the area.
        digest = hashlib.sha256(house.owner_id.encode()).digest()
        lng += (int.from_bytes(digest[:2], 'big') / 65535 - .5) * .012
        lat += (int.from_bytes(digest[2:4], 'big') / 65535 - .5) * .012
        items.append(dict(id='home:' + house.owner_id, kind='home', name=house.name,
            description='A community home with virtual pets, conversation, and a place to visit.',
            area=name, coordinates=[lng, lat], locationLabel='Virtual home · neighborhood pin, not a home address',
            sample=house.owner.sample, host=dict(id=house.owner_id,username=house.owner.username,name=house.owner.name, avatar=house.owner.avatar,profileHref='/users/'+house.owner.username),
            membership=dict(animals=public_pets.get(house.owner_id,[]) if house.permissions.get('pets',True) else []),
            residents=pets.get(house.owner_id, 0), occupancy=counts.get(house.owner_id, 0),
            capacity=settings.VISITOR_LIMIT, visibility=house.visibility,
            entry=dict(kind='home', house=house.owner_id)))
    return items
