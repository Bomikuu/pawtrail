"""Publish whole-city communities, retaining retired barangay/zone history."""
import json
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from community_map.areas_models import CommunityArea, GeographicCommunity
from community_map.area_geometry import polygon
from community_map.area_publication import publish_area, publish_room
from housing.models import PlayerHouse

class Command(BaseCommand):
    help = 'Publish sourced whole cities and retire smaller enterable areas without deleting their records.'
    def add_arguments(self, parser):
        parser.add_argument('--file', required=True)
    @transaction.atomic
    def handle(self, *args, **options):
        path=Path(options['file'])
        if path.stat().st_size>20_000_000:raise CommandError('Use a bounded local city extract.')
        data=json.loads(path.read_text())
        features=data.get('features',[]);source=data.get('source',{})
        if data.get('type')!='FeatureCollection' or not 1<=len(features)<=2000:raise CommandError('Supply 1–2000 sourced city polygons.')
        if not all(isinstance(source.get(key),str) and source[key] for key in ['name','url','version']):raise CommandError('City source and edition are required.')
        prepared=[];keys=set()
        for feature in features:
            p=feature.get('properties',{})
            if not all(isinstance(p.get(key),str) and p[key] for key in ['key','name','color']):raise CommandError('Each city needs a stable source key, name and color.')
            import re
            if p['key'] in keys or not re.fullmatch(r'#[0-9a-fA-F]{6}',p['color']):raise CommandError('City keys must be unique and colors must be hex values.')
            if p.get('kind','city') != 'city':raise CommandError('Publish whole cities only.')
            keys.add(p['key']);prepared.append((p,polygon(feature['geometry'])))
        retired=GeographicCommunity.objects.exclude(area__kind='city')
        PlayerHouse.objects.filter(pk__in=retired.values('house_id')).update(opened=False)
        retired.update(enabled=False)
        CommunityArea.objects.exclude(kind='city').update(published=False)
        for p,geometry in prepared:
            city_source={**source,'metadata':{**source.get('metadata',{}),'city':p['name'],'mapColor':p['color'],'psgcCode':p.get('psgcCode'),'granularity':p.get('kind','city'),'province':p.get('province',''),'region':p.get('region',''),'namriaCode':p.get('namriaCode'),'subdivisions':False}}
            area=publish_area(source_key=p['key'],name=p['name'],kind=p.get('kind','city'),geometry=geometry,source=city_source)
            area.published=True;area.save(update_fields=['published','updated_at'])
            room=publish_room(area)
            room.enabled=True;room.save(update_fields=['enabled'])
            room.house.opened=True;room.house.visibility='public';room.house.name=p['name'][:100]
            room.house.save(update_fields=['opened','visibility','name'])
        self.stdout.write(self.style.SUCCESS(f'Published {len(prepared)} whole-city communities. Smaller areas and their room histories were retained, with entry disabled.'))
