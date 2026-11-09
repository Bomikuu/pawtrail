"""Shared conditions and player-scoped finds. Client balances are never inputs."""
import time
from .models import HouseVisitor
from .service import fail, fact, require_house
from django.core.cache import cache
from .community import DATA,is_hub

CAT_EMOTES = ['happy','confused','angry','sleepy','surprised','crying','laughing','excited','silly','loving','suspicious','relaxed']
FINDS = {
    'care-cache': dict(item='fish-treats', x=432, y=416, amount=2),
    'community-letter': dict(item='letter', x=528, y=448, amount=1),
    'hidden-token': dict(item='paw-token', x=624, y=480, amount=1),
    'toy-basket': dict(item='toy-mouse', x=280, y=416, amount=1),
    'water-crate': dict(item='water-bottle', x=560, y=480, amount=2),
    'first-aid-cache': dict(item='first-aid', x=144, y=352, amount=1),
    'material-cache': dict(item='wood', x=400, y=448, amount=2),
}
for item,position in zip(FINDS.values(),DATA['finds']):item['x'],item['y']=position
SUPPLY_ACTIONS = {'cat-food':'feed','dog-food':'feed','fish-treats':'feed','pet-snack':'feed',
                  'water-bottle':'water','first-aid':'help','grooming-brush':'play',
                  'yarn-ball':'play','feather-wand':'play','toy-mouse':'play','rubber-ball':'play'}
def conditions():
    now = time.time(); total = int(now * 2) + 450
    weather = ['clear','cloudy','light-rain','heavy-rain','cloudy','clear','clear','light-rain'][(total//180)%8]
    return dict(total=total, minute=total%1440, day=total//1440+1, weather=weather, epoch=now)

def collect(player, house, identifier):
    require_house(player, house.owner_id)
    if not is_hub(house):fail('These discoveries are in the shared outdoor community.')
    item = FINDS.get(identifier)
    if not item: fail('This discovery does not exist.')
    position = cache.get('positions:' + house.owner_id, {}).get(player.id)
    if not position or (position['x']-item['x'])**2 + (position['y']-item['y'])**2 > 85**2:
        fail('Walk closer to this discovery first.')
    key = 'world-find:' + identifier
    if key in player.facts: fail('This discovery is already in your backpack.')
    supplies = dict(player.supplies)
    supplies[item['item']] = min(10000, supplies.get(item['item'], 0) + item['amount'])
    player.supplies = supplies; player.save(update_fields=['supplies'])
    fact(player, key)
    return item
