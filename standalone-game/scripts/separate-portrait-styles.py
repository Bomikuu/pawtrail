"""Compatibility publisher: use independent current packs, never old motion exports."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
for name in ['yae-refined-cel-v1','yae-sharp-cel-rebuild-v1']:
 job=root/'output/imagegen'/name
 if (job/'sizes.json').exists():
  subprocess.run([sys.executable,str(root/'scripts/publish-portrait-pack.py'),str(job)],check=True)
