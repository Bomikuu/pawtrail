"""Game environmental contacts. Cosmetic wetness expires; terrain edits are durable."""
import math
import time
from django.core.cache import cache
from django.db import transaction
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import PlayerGameProfile, PlayerHouse, WorldInteraction
from .community import fixed_cells, reserved_cells, active_layout
from .spatial import get_navigation

TOOLS = {'shovel': {'label': 'Garden shovel', 'price': 30}, 'lawn-mower': {'label': 'Lawn mower', 'price': 120}}
PREFIX = 'garden-tool:'


def equipped(player):
    return next((value[len(PREFIX):] for value in player.facts if value.startswith(PREFIX) and value[len(PREFIX):] in TOOLS and player.supplies.get(value[len(PREFIX):], 0) > 0), '')


def expose(player_id, owner):
    from .immersion import conditions
    if (owner.endswith('|yard') or owner.startswith('system:hub')) and conditions()['weather'] in ['light-rain', 'heavy-rain']:
        cache.set('environment-wet:' + player_id, time.time() + 45, 50)


def visit(player_id, owner):
    previous = cache.get('environment-room:' + player_id)
    if previous and previous != owner:
        expose(player_id, previous)
    expose(player_id, owner)
    cache.set('environment-room:' + player_id, owner, 45)


def status(player, house=None):
    if house:
        expose(player.id, house.owner_id + ('|yard' if getattr(house, '_zone', '') == 'yard' else ''))
    tool = equipped(player)
    cache.set('environment-tool:' + player.id, tool, 5)
    return dict(tool=tool, wetUntil=cache.get('environment-wet:' + player.id, 0))


def equip(player, tool):
    if not isinstance(tool, str):
        raise ValidationError('Choose a garden tool or put it away.')
    if tool and (tool not in TOOLS or player.supplies.get(tool, 0) < 1):
        raise ValidationError('Own this garden tool before equipping it.')
    player.facts = [fact for fact in player.facts if not fact.startswith(PREFIX)] + ([PREFIX + tool] if tool else [])
    player.save(update_fields=['facts'])
    cache.set('environment-tool:' + player.id, tool, 5)


def work(player, house, zone, event, position, automatic=False):
    if zone != 'yard' or house.owner_id != player.id:
        raise PermissionDenied('Change grass only in your own yard.')
    tool = equipped(player)
    if tool != ('lawn-mower' if automatic else 'shovel'):
        raise ValidationError('Equip the matching owned garden tool first.')
    from django.utils import timezone
    if WorldInteraction.objects.filter(player=player, phase__in=['perform', 'held'], expires__gt=timezone.now()).exists():
        raise ValidationError('Finish the current interaction before working the ground.')
    x, y = event.get('x'), event.get('y')
    if type(x) is not int or type(y) is not int or not 1 <= x < 13 or not 1 <= y < 13:
        raise ValidationError('Choose a grass tile inside the yard.')
    if (x, y) in fixed_cells('yard') | reserved_cells('yard'):
        raise ValidationError('Keep paths, buildings and structural ground intact.')
    point = [x * 32 + 16, y * 32 + 16]
    nav = get_navigation(active_layout(house, zone), False, zone, house.interior_preset)
    if math.dist([position['x'], position['y']], point) > 52 or not nav.clear(point) or not nav.segment([position['x'], position['y']], point):
        raise ValidationError('Stand beside an open grass tile before working it.')
    key = f'yard:terrain:{x},{y}'
    if house.object_states.get(key, {}).get('surface') == 'soil':
        return None
    value = dict(surface='soil', tool=tool, actor=player.id, at=time.time())
    house.object_states = {**house.object_states, key: value}
    house.save(update_fields=['object_states'])
    return dict(type='terrain.changed', room=house.owner_id + '|yard', cells={f'terrain:{x},{y}': value}, id=player.id, tool=tool)


def motion(player_id, owner, position, moved):
    zone = owner.partition('|')[2] or 'interior'
    expose(player_id, owner)
    tool = cache.get('environment-tool:' + player_id)
    if tool is None:
        player = PlayerGameProfile.objects.get(pk=player_id)
        tool = equipped(player)
        cache.set('environment-tool:' + player_id, tool, 5)
    changed = None
    tile = str(math.floor(position['x'] / 32)) + ',' + str(math.floor(position['y'] / 32))
    if tool == 'lawn-mower' and zone == 'yard' and owner.partition('|')[0] == player_id and moved > .5 and position.get('walking') and cache.add('environment-mow:' + player_id + ':' + tile, True, 1):
        with transaction.atomic():
            player = PlayerGameProfile.objects.select_for_update().get(pk=player_id)
            house = PlayerHouse.objects.select_for_update().get(pk=player_id)
            try:
                changed = work(player, house, zone, dict(x=math.floor(position['x'] / 32), y=math.floor(position['y'] / 32)), position, automatic=True)
            except (ValidationError, PermissionDenied):
                pass  # Moving across a path or protected tile remains ordinary movement.
    return dict(tool=tool, wetUntil=cache.get('environment-wet:' + player_id, 0)), changed
