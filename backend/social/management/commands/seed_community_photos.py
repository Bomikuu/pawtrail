"""Give selected existing local fixtures collection photos; retain a mixed photo state."""
import json
from pathlib import Path

from django.conf import settings
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from media.models import Asset
from media.service import publish, upload
from social.models import AnimalInfo
from .seed_community import PREFIX, uid


# Filenames refer to the licensed collection, not the identity/species of a seeded pet.
PORTRAITS = (
    ('smokey', 'cat', 'shadow'),
    ('coco', 'cat', 'patches'),
    ('cloud', 'cat', 'bean'),
    ('luna', 'cat', 'luna'),
    ('milo', 'dog', 'milo'),
    ('biscuit', 'dog', 'bantay'),
    ('oreo', 'dog', 'cloud'),
    ('chai', 'dog', 'pip'),
)


class Command(BaseCommand):
    help = 'Add licensed collection photos to eight existing local fixture pets, preserving other photos and empty profiles.'

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError('Collection fixture photos are available only in local development.')
        directory = Path(settings.BASE_DIR).parent / 'public/images/pets/portraits'
        prepared = []
        for name, species, filename in PORTRAITS:
            info = AnimalInfo.all_objects.select_for_update().select_related('animal__owner').filter(
                seed_key=PREFIX + 'info:' + name, is_fixture=True,
                animal_id=uid('animal:' + name), animal__species=species,
                animal__state='listed',
            ).first()
            if not info:
                raise CommandError(f'The existing listed fixture {name} is required; no new animal was created.')
            photo = directory / (filename + '.webp')
            metadata = directory / (filename + '.webp.json')
            if not photo.is_file() or not metadata.is_file():
                raise CommandError(f'The collection photo and provenance for {filename} are required.')
            provenance = json.loads(metadata.read_text())
            if provenance.get('sourceType') != 'licensed-photo':
                raise CommandError(f'{filename} is not a documented licensed photograph.')
            prepared.append((name, info, photo, provenance))

        assigned = []
        preserved = []
        for name, info, photo, provenance in prepared:
            animal = info.animal
            if animal.photo_id:
                preserved.append(animal.name)
                continue
            key = PREFIX + 'collection-photo:' + name
            asset = Asset.objects.filter(
                owner=animal.owner, purpose='public_image', exif_evidence__seedKey=key,
            ).first()
            if not asset:
                asset = upload(animal.owner, SimpleUploadedFile(
                    photo.name, photo.read_bytes(), content_type='image/webp',
                ), f'Collection portrait for {animal.name}')
                asset.purpose = 'public_image'
                asset.exif_evidence = {
                    **asset.exif_evidence,
                    'seedKey': key,
                    'isFixture': True,
                    'generated': False,
                    'collectionPath': str(photo.relative_to(Path(settings.BASE_DIR).parent)),
                    'licenseProvenance': provenance,
                    'usage': 'Licensed collection photograph for a local fixture profile; not identity or capture evidence.',
                }
                asset.save(update_fields=['purpose', 'exif_evidence'])
            publish(asset)
            animal.photo = asset
            animal.version += 1
            animal.save(update_fields=['photo', 'version'])
            info.version += 1
            info.save(update_fields=['version', 'updated_at'])
            assigned.append(animal.name)

        cache.delete('public-city-statistics:v2:' + str(settings.COMMUNITY_FIXTURES_VISIBLE))
        fixtures = AnimalInfo.all_objects.filter(
            is_fixture=True, seed_key__startswith=PREFIX + 'info:',
        )
        with_photos = fixtures.filter(animal__photo__isnull=False).count()
        without_photos = fixtures.filter(animal__photo__isnull=True).count()
        self.stdout.write('Added collection photos: ' + (', '.join(assigned) or 'none'))
        if preserved:
            self.stdout.write('Preserved existing photos: ' + ', '.join(preserved))
        self.stdout.write(f'Local fixture pets: {with_photos} with photos; {without_photos} without photos.')
