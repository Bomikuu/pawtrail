from django.core.management.base import BaseCommand, CommandError
from community_map.areas_models import CommunityArea
from community_map.area_publication import split_area

class Command(BaseCommand):
    help = 'Split a stored local area into two explicitly custom community zones.'
    def add_arguments(self, parser):
        parser.add_argument('slug')
        parser.add_argument('--axis', choices=['longitude','latitude'])
        parser.add_argument('--cut', type=float)
    def handle(self, *args, **options):
        try:
            area=CommunityArea.objects.get(slug=options['slug'])
            result=split_area(area,options.get('axis'),options.get('cut'))
        except (CommunityArea.DoesNotExist,ValueError) as error: raise CommandError(str(error))
        self.stdout.write(self.style.SUCCESS('Published '+', '.join(area.name for area in result)))
