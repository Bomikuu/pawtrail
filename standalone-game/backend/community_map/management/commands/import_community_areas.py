import json
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from shapely.ops import unary_union
from community_map.area_geometry import polygon
from community_map.area_publication import publish_area, publish_room, split_area

class Command(BaseCommand):
    help = 'Publish sourced local polygons and their community rooms; optionally split large areas into two zones.'
    def add_arguments(self, parser):
        parser.add_argument('--file', required=True)
        parser.add_argument('--split-over-km2', type=float, default=10)
    @transaction.atomic
    def handle(self, *args, **options):
        path=Path(options['file'])
        if path.stat().st_size>20_000_000: raise CommandError('Use a bounded local extract.')
        data=json.loads(path.read_text())
        if data.get('type')!='FeatureCollection' or not 1<=len(data.get('features',[]))<=500:
            raise CommandError('Supply a FeatureCollection of 1–500 local boundaries.')
        source=data.get('source',{})
        if not all(isinstance(source.get(key),str) and source[key] for key in ['name','url','version','key','city']):
            raise CommandError('The extract needs source name, URL, edition, stable key and city metadata.')
        source['metadata']={**source.get('metadata',{}),'city':source['city']}
        geometries=[polygon(f['geometry']) for f in data['features']]
        city=publish_area(source_key=source['key']+':city', name=source['city'], kind='city', geometry=unary_union(geometries), source=source)
        areas=zones=0
        for feature, geometry in zip(data['features'],geometries):
            props=feature['properties']
            if not isinstance(props.get('key'),str) or not isinstance(props.get('name'),str): raise CommandError('Each feature needs its real source key and name.')
            area=publish_area(source_key=source['key']+':'+props['key'], name=props['name'], kind='barangay', geometry=geometry, parent=city, source=source)
            areas+=1
            if area.children.exists():
                zones+=area.children.count()
            elif options['split_over_km2']>0 and area.area_km2>options['split_over_km2']:
                zones+=len(split_area(area))
            else:
                publish_room(area); zones+=1
        self.stdout.write(self.style.SUCCESS(f'Published {areas} sourced local areas and {zones} community rooms. No member accounts or animal records were created.'))
