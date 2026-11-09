"""Virtual reserves, not clinical information or verified animal welfare evidence."""
import time
from django.conf import settings
from django.utils import timezone
from .models import AnimalCareQuest
THRESHOLD=30
SATISFIED=60

def advance(pet):
    now=timezone.now();seconds=max(0,(now-pet.needs_updated).total_seconds()) if pet.needs_updated else 0
    # Only a bounded amount of need is accrued while nobody is playing.
    food_loss=min(25,seconds/getattr(settings,'GAME_FOOD_SECONDS_PER_POINT',30))
    water_loss=min(25,seconds/getattr(settings,'GAME_WATER_SECONDS_PER_POINT',20))
    floor=20 if seconds>120 else 0
    pet.food=max(floor,pet.food-food_loss);pet.water=max(floor,pet.water-water_loss);pet.needs_updated=now
    pet.save(update_fields=['food','water','needs_updated'])
    ensure_quests(pet)

def ensure_quests(pet):
    for kind in ['food','water']:
        value=getattr(pet,kind);open_quest=AnimalCareQuest.objects.filter(pet=pet,kind=kind,state='active').first()
        if value<THRESHOLD and not open_quest:
            cycle=pet.need_cycles.get(kind,0)+1;pet.need_cycles={**pet.need_cycles,kind:cycle};pet.save(update_fields=['need_cycles'])
            AnimalCareQuest.objects.get_or_create(pet=pet,owner=pet.owner,kind=kind,cycle=cycle)
        elif value>=SATISFIED and open_quest:
            open_quest.state='completed';open_quest.completed=timezone.now();open_quest.save(update_fields=['state','completed'])

def satisfy(pet,kind,amount=45):
    setattr(pet,kind,min(100,getattr(pet,kind)+amount));pet.save(update_fields=[kind]);ensure_quests(pet)

def values(pet):return dict(food=round(pet.food),water=round(pet.water),virtual=True)
def quests(player):
    return [dict(id='care:'+str(q.pk),title=('Feed ' if q.kind=='food' else 'Bring water to ')+q.pet.snapshot.get('name','your animal'),pet=q.pet_id,kind=q.kind,cycle=q.cycle,state=q.state,reward=q.reward,requiredSupply='food' if q.kind=='food' else 'water',description='Offer a serving or fill a reachable bowl. The animal must successfully eat or drink.',progress=round(getattr(q.pet,q.kind)),target=SATISFIED) for q in AnimalCareQuest.objects.filter(owner=player).select_related('pet').order_by('-created')[:40]]
