"""Publish only accepted, located camera identities; never promote seeded animals."""
from observations.models import Sighting
from .models import AnimalInfo

def sync_animal(animal):
    if animal is None:return
    info=AnimalInfo.all_objects.select_for_update().filter(animal=animal).first()
    if info and (info.is_fixture or info.source_kind!='capture'):return
    latest=Sighting.objects.filter(animal=animal,active=True,observation__publication_state='published',observation__capture__latitude__isnull=False,observation__capture__longitude__isnull=False).select_related('observation__capture').order_by('-approved_at').first()
    if not latest or animal.state!='confirmed':
        if info and info.published:info.published=False;info.version+=1;info.save()
        return
    capture=latest.observation.capture
    if animal.photo_id != capture.media_id:
        animal.photo_id=capture.media_id;animal.version+=1;animal.save(update_fields=["photo", "version"])
    location={'areaId':'reported-area','neighborhood':capture.area_label or 'Approximate reported area','latitude':round(capture.latitude,2),'longitude':round(capture.longitude,2),'approximateRadiusMeters':max(1500,capture.accuracy_meters or 0)}
    if not info:
        AnimalInfo.objects.create(animal=animal,caretaker=animal.owner,source_kind='capture',location=location,published=True,status='community',adoptable=False)
    else:
        info.location=location;info.published=True;info.version+=1;info.save()
