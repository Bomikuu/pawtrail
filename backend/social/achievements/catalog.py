"""Public, static rule configuration shared with the frontend; never seeded rows."""
import json
from pathlib import Path

CONFIG = json.loads((Path(__file__).resolve().parent.parent / 'achievement_catalog.json').read_text())
BADGES = {badge['id']: badge for badge in CONFIG['badges']}
TIERS = CONFIG['tiers']
DATED_PROOFS = {'care-companion', 'feeding-hero', 'hydration-helper', 'recovery-partner'}
