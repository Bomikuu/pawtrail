import copy
from collections import Counter
from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError
from .geometry import validate_layout
from .presets import PRESETS


class NativeLayoutTests(SimpleTestCase):
    def test_all_current_furnished_presets_have_reachable_items(self):
        for key in ['studio', 'cottage', 'two-storey']:
            floors = PRESETS[key]['floors']
            inventory = Counter(piece['item'] for floor in floors.values() for piece in floor['items'])
            for zone, floor in floors.items():
                with self.subTest(preset=key, floor=zone):
                    other = [piece for name, plan in floors.items() if name != zone for piece in plan['items']]
                    self.assertEqual(validate_layout(floor['items'], inventory, zone, other, key), floor['items'])

    def test_placement_still_rejects_a_piece_over_the_entrance_route(self):
        floor = PRESETS['studio']['floors']['interior']
        layout = copy.deepcopy(floor['items'])
        layout[0].update(x=floor['spawn'][0], y=floor['spawn'][1])
        inventory = Counter(piece['item'] for piece in layout)
        with self.assertRaises(ValidationError):
            validate_layout(layout, inventory, preset='studio')
