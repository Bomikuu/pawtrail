import time
from django.core.management.base import BaseCommand
from django.db import close_old_connections
from identity.models import AnalysisRun
from identity.pipeline import process_analysis, recover_expired

class Command(BaseCommand):
    help = "Process the persistent local analysis queue; use Celery with Redis for production."
    requires_system_checks = []
    def handle(self, **options):
        self.stdout.write("PawTrail local analysis worker is waiting for submitted photos.")
        try:
            while True:
                close_old_connections()
                recover_expired()
                job = AnalysisRun.objects.filter(status="queued", attempts__lt=3).order_by("created_at").first()
                if job:
                    process_analysis(str(job.pk))
                else:
                    time.sleep(2)
        except KeyboardInterrupt:
            return
