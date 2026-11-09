import json
import os
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from config.errors import DomainError
from identity.calibration_dataset import prepare_report

class Command(BaseCommand):
    help = "Prepare an operational recognition calibration report from a real labeled manifest. Never runs on startup."
    requires_system_checks = []
    def add_arguments(self, parser):
        parser.add_argument("manifest", type=Path)
        parser.add_argument("--output", type=Path, required=True)
    def handle(self, **options):
        try:
            payload = json.loads(options["manifest"].read_text())
            result = prepare_report(payload)
        except (OSError, ValueError, DomainError) as issue:
            raise CommandError(str(issue))
        target = options["output"]
        target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as stream:
            json.dump(result, stream, indent=2)
        self.stdout.write("Calibration report saved. Import it through /spot/setup; this command does not activate automatic matching.")
