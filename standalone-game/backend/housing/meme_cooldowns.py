"""Per-player sound limits, called while validate_live holds the player's row lock."""
import math
import time
from django.core.cache import cache

MEME_IDS = ('cat-laugh', 'mu-hehe', 'oiia-oiia', 'huh-cat', 'happy-cat', 'yapapa', 'boing-cat', 'banana-cat', 'scuba-cat')
WHEEL_SECONDS = 5
MEME_SECONDS = 15


def _remaining(wheel, memes, now):
    return {
        'wheelMs': max(0, math.ceil((wheel - now) * 1000)),
        'memesMs': {name: max(0, math.ceil((until - now) * 1000)) for name, until in memes.items()},
    }


def status(player_id):
    saved = cache.get('cat-meme-cooldowns:' + str(player_id)) or {}
    return _remaining(saved.get('wheel', 0), {name: saved.get('memes', {}).get(name, 0) for name in MEME_IDS}, time.time())


def reserve(player_id, meme):
    now = time.time()
    key = 'cat-meme-cooldowns:' + str(player_id)
    saved = cache.get(key) or {}
    wheel = saved.get('wheel', 0)
    memes = {name: saved.get('memes', {}).get(name, 0) for name in MEME_IDS}
    accepted = wheel <= now and memes[meme] <= now
    if accepted:
        wheel = now + WHEEL_SECONDS
        memes[meme] = now + MEME_SECONDS
        cache.set(key, {'wheel': wheel, 'memes': memes}, MEME_SECONDS)
    # Rejections leave all deadlines unchanged; clicking cannot prolong a lockout.
    return accepted, _remaining(wheel, memes, now)
