"""Game-only furniture construction. Call mutations inside the existing player transaction."""
import uuid
from datetime import timedelta
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .geometry import ITEMS
from .models import FurnitureBuild


def material_prices():
    return {material['id']: material['price'] for item in ITEMS.values() for material in item.get('construction', {}).get('materials', [])}


def jobs(player):
    return [dict(id=str(job.id), item=job.item, mode=job.mode, started=job.created.timestamp(), readyAt=job.ready_at.timestamp()) for job in FurnitureBuild.objects.filter(player=player, claimed_at__isnull=True).order_by('created')[:10]]


def start(player, item, mode):
    definition = ITEMS.get(item, {})
    recipe = definition.get('construction')
    if not recipe or mode not in ['timed', 'recipe']:
        raise ValidationError('Choose an available construction option.')
    if FurnitureBuild.objects.filter(player=player, claimed_at__isnull=True).count() >= 10:
        raise ValidationError('Collect an existing build before starting another.')
    cost = definition['price'] if mode == 'timed' else 0
    materials = recipe['materials'] if mode == 'recipe' else []
    if player.wallet < cost:
        raise ValidationError('You need more game Kibble for this build.')
    if any(player.supplies.get(row['id'], 0) < row['amount'] for row in materials):
        raise ValidationError('Gather all recipe materials before building.')
    player.wallet -= cost
    player.supplies = {**player.supplies}
    for row in materials:
        player.supplies[row['id']] -= row['amount']
    player.save(update_fields=['wallet', 'supplies'])
    FurnitureBuild.objects.create(player=player, item=item, mode=mode, cost=cost, materials=materials, ready_at=timezone.now() + timedelta(seconds=recipe['seconds']))


def claim(player, key):
    try:
        key = uuid.UUID(str(key))
    except (ValueError, TypeError, AttributeError):
        raise ValidationError('Choose an existing furniture build.')
    job = FurnitureBuild.objects.select_for_update().filter(pk=key, player=player).first()
    if not job:
        raise ValidationError('This build is unavailable.')
    if job.claimed_at:
        return
    if timezone.now() < job.ready_at:
        raise ValidationError('This furniture is still being built.')
    player.inventory = {**player.inventory, job.item: player.inventory.get(job.item, 0) + 1}
    player.save(update_fields=['inventory'])
    job.claimed_at = timezone.now()
    job.save(update_fields=['claimed_at'])
