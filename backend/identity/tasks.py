from config.celery import app
from .pipeline import process_analysis

@app.task(name="pawtrail.analyze")
def analyze(run_id):
    process_analysis(run_id)

@app.task(name="pawtrail.recover")
def recover():
    from .models import AnalysisRun
    from .pipeline import recover_expired
    recover_expired()
    for run_id in AnalysisRun.objects.filter(status="queued", attempts__lt=3).order_by("created_at").values_list("pk", flat=True)[:50]:
        analyze.delay(str(run_id))
