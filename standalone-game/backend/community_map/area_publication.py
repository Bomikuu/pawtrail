"""Idempotent administrative publishing of sourced areas and public game rooms."""
import uuid
from django.db import transaction
from django.utils.text import slugify
from shapely.geometry import shape
from .areas_models import CommunityArea, GeographicCommunity
from .area_geometry import geometry_fields, divide

NAMESPACE = uuid.UUID('b35f7759-73c1-44e4-9c18-5a2582836df7')

def publish_area(*, source_key, name, kind, geometry, parent=None, source, split_rule=None):
    fields = dict(name=name[:160], kind=kind, parent=parent, source_name=source['name'], source_url=source['url'],
        source_version=source['version'], source_metadata=source.get('metadata', {}), split_rule=split_rule or {}, **geometry_fields(geometry))
    identifier = uuid.uuid5(NAMESPACE, source_key)
    area, created = CommunityArea.objects.get_or_create(source_key=source_key, defaults=dict(id=identifier,
        slug=(slugify(name)[:130] + '-' + identifier.hex[:12]), published=True, **fields))
    if not created:
        if area.children.filter(published=True).exists() and shape(area.geometry).symmetric_difference(geometry).area > max(geometry.area * 1e-8, 1e-12):
            raise ValueError('A subdivided source boundary changed; publish it under a new source edition.')
        for key, value in fields.items(): setattr(area, key, value)
        area.save(update_fields=[*fields, 'updated_at'])
    return area

def publish_room(area):
    from housing.models import PlayerGameProfile, PlayerHouse
    identifier = 'system:hub:geo:' + str(area.id)
    host, _ = PlayerGameProfile.objects.get_or_create(id=identifier, defaults=dict(username='community-'+area.id.hex[:16],
        name=area.name[:120], sample=False, visible=False, wallet=0, inventory={}, facts=[], claimed=[]))
    if host.sample: raise ValueError('Geographic communities require the real-account realm.')
    house, _ = PlayerHouse.objects.get_or_create(owner=host, defaults=dict(name=area.name[:100], visibility='public', opened=True,
        layout=[], permissions=dict(pets=True, help=True, furniture=False, guestbook=True, chat=True, decorators=[], invitations=False)))
    community, _ = GeographicCommunity.objects.get_or_create(area=area, defaults=dict(id=uuid.uuid5(NAMESPACE, 'community:'+str(area.id)), house=house))
    return community

@transaction.atomic
def split_area(area, axis=None, cut=None):
    area = CommunityArea.objects.select_for_update().get(pk=area.pk)
    if area.kind == 'city': raise ValueError('Split a local area, rather than its city parent.')
    if area.children.exists(): raise ValueError('This area already has subdivisions; edit those explicitly.')
    parts, rule = divide(shape(area.geometry), axis, cut)
    source = dict(name=area.source_name, url=area.source_url, version=area.source_version, metadata=area.source_metadata)
    result = []
    for index, geometry in enumerate(parts, 1):
        child = publish_area(source_key=area.source_key+':zone:'+str(index), name=f'{area.name} · Zone {index}', kind='zone',
            geometry=geometry, parent=area, source=source, split_rule=rule)
        publish_room(child)
        result.append(child)
    old = GeographicCommunity.objects.filter(area=area).select_related('house').first()
    if old:
        old.enabled=False; old.save(update_fields=['enabled'])
        old.house.opened=False; old.house.save(update_fields=['opened'])
    return result
