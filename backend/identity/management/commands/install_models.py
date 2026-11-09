import hashlib
import json
import os
import urllib.request
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

# Fixed repository revisions: no trust_remote_code, pickle, or runtime download.
SOURCES = {
    "detector": ("Xenova/detr-resnet-50", "8be7ab59ff663484ee9ba2e8d8f267330d5ad03e"),
    "embedding": ("Xenova/dinov2-small", "c2bb04a51fab207c420665f1946016107bffc701"),
}

class Command(BaseCommand):
    help = "Install pinned, local ONNX weights and record their source/checksum. This does not evaluate recognition."
    requires_system_checks = []
    def handle(self, **options):
        for name, (repo, revision) in SOURCES.items():
            if not revision:
                raise CommandError("The embedding model revision must be pinned before installation.")
            directory = settings.MODEL_DIR / name
            directory.mkdir(parents=True, exist_ok=True)
            manifest_file = directory / "manifest.json"
            if manifest_file.exists():
                manifest = json.loads(manifest_file.read_text())
                if manifest.get("revision") == revision and (directory / "model_quantized.onnx").exists():
                    self.stdout.write(name + " is already installed.")
                    continue
            digest = None
            for filename in ["config.json", "preprocessor_config.json", "onnx/model_quantized.onnx"]:
                target = directory / filename.split("/")[-1]
                temporary = target.with_suffix(target.suffix + ".download")
                try:
                    with urllib.request.urlopen("https://huggingface.co/" + repo + "/resolve/" + revision + "/" + filename, timeout=60) as response:
                        sha = hashlib.sha256()
                        with temporary.open("wb") as stream:
                            while block := response.read(1024 * 1024):
                                stream.write(block)
                                sha.update(block)
                    os.replace(temporary, target)
                    if filename.endswith(".onnx"):
                        digest = sha.hexdigest()
                finally:
                    temporary.unlink(missing_ok=True)
            manifest_file.write_text(json.dumps({"repository": repo, "revision": revision, "sha256": digest,
                                                  "upstreamLicense": "Apache-2.0", "purpose": "candidate retrieval; not calibrated individual verification"}, indent=2))
            self.stdout.write("Installed " + name + " from " + repo + ".")
