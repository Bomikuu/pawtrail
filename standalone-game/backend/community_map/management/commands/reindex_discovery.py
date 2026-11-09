from django.conf import settings
from django.core.management.base import BaseCommand,CommandError
from community_map.models import IncidentReport,HelpRequest,ReputationEvent
from community_map.domain import index_public

class Command(BaseCommand):
    help='Rebuild the optional public PostGIS index from authoritative reporting records.'

    def handle(self,*args,**options):
        if not settings.MAP_USE_POSTGIS:
            raise CommandError('Set PAWTRAIL_MAP_POSTGIS=1 with a PostGIS database before indexing.')
        from community_geo.models import MapPoint
        # No private coordinates are copied. Public generalized points only.
        MapPoint.objects.filter(kind__in=['incident','help','contribution']).delete()
        count=0
        for model,kind in [(IncidentReport,'incident'),(HelpRequest,'help'),(ReputationEvent,'contribution')]:
            for record in model.objects.iterator(chunk_size=250):
                index_public(record,kind)
                count+=1
        self.stdout.write(f'Indexed public locations from {count} discovery records.')
