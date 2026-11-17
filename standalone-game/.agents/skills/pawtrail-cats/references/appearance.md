# Cat appearance and production

## Files and supported configuration

- `src/game/actor-rig/cat-contract.json`: authoritative supported choices.
- `cat-appearance.ts`: types, breed defaults/colors and shared jump envelope.
- `cat-parts.ts`: crisp coat textures, fur tufts, hats, shoes, collars and wings.
- `rigs.ts` / `createCat`: shared anatomy, joints and pose functions.
- `assets/actor-appearances/catalog.json`: appearance records; source of exports.
- `scripts/pawtrail-actors.mjs`: production validation/render/finish/install.
- `src/game/runtime/actor-previews.json`: generated preview registry.
- `src/game/runtime/baked-actors.json`: live installed sheets.

Current root: `/home/micxsz/Documents/ChatGPT/pawtrail`. The separate running app
is `/home/micxsz/projects/pawtrail/.worktrees/implementation`; copy only scoped
game changes/assets with its namespace mapping, never overwrite the platform.

Configure a catalogue entry's `cat` object separately from its `colors`:

| Field | Choices |
| --- | --- |
| breed | domestic, persian, siamese, maine-coon, bobtail |
| pattern | mackerel, classic-tabby, spotted, solid, bicolor, calico, colorpoint |
| fur | short, plush, long |
| tail | long, plume, bobtail, stub |
| tailMotion | sway, upright, swish |
| hat | none, cap, witch, flower |
| shoes | none, boots |
| wings | none, feathered, bat |
| collar | none, bell, bandana |
| bodySize | kitten, standard, large |
| faceMarking | none, mustache, split-mustache, tuxedo, freckles |

Breed chooses defaults; explicit fields override them. Persian defaults to long
solid fur and plume tail. Siamese defaults to colorpoint. Bobtail defaults to a
short tail. Breed geometry remains distinct even when its colors are customized.
Extend the contract, types, renderer and export signature deliberately when adding
options; do not silently coerce an unsupported accessory into an existing one.

```json
{
  "id": "misty-siamese",
  "name": "Misty",
  "kind": "orange-tabby",
  "status": "preview",
  "description": "Blue-eyed seal-point Siamese with a long tail and bell collar.",
  "cat": {
    "breed": "siamese",
    "pattern": "colorpoint",
    "tail": "long",
    "collar": "bell",
    "wings": "feathered"
  },
  "frame": {"width": 64, "height": 64},
  "colors": {},
  "accessories": {}
}
```

`kind: orange-tabby` identifies the existing feline skeleton for every breed;
it does not force an orange coat. Do not create a skeleton per breed. `colors`
uses the shared palette roles: `orange` is primary fur, `furLight` is highlight,
`stripe` is markings/points, and `cream`/`creamShadow` are pale fur/muzzle. Iris
defaults from `gold`, or `shirtLight` for colorpoint blue eyes. Optional top-level
`face: {leftEye, rightEye, nose, marking}` overrides those with four validated
hex colors. Include those colors in the finishing palette and signature.
Accessory colors reuse the
hat/leather/ribbon/feather roles. Preserve Kibble's own food color. Include any
new rendered color in the export/finishing palette.

## Shape and pattern rules

Make markings survive front, side and back views at native scale. Mackerel tabby
has broken vertical flank bars, a dorsal line, forehead M and tail rings. Classic
tabby adds broad swirls; spotted uses separated patches; calico combines coherent
orange, dark and pale regions. Keep markings attached to the skin across poses.
Use nearest-filtered low-resolution textures and deliberate tuft geometry; do
not introduce gradients, noise that reads as static, or surface antialiasing.

Persian cheek/chest/haunch fluff and rounded face must be readable at sprite
scale. Siamese has narrower torso, taller ears, darker mask/extremities and blue
eyes. Maine Coon adds a ruff and ear tufts. Short-tail options change tail geometry
and tip visibility. Avoid tiny floating dark bits masquerading as fur markings.

Headwear follows the head without hiding both ears/eyes. Boots follow paw joints
and leave feet on the same ground baseline. Collars follow the neck; wing roots
attach behind the shoulders and fold for sleep/rolling/grooming. Wide wings and
tall hats may require a padded frame. Never enlarge collisions for accessories.

## Production and existing examples

The initial examples are `tabby-scout`, `persian-cloud`, `siamese-sky` and
`bobtail-witch`. These are previews. The detailed `orange_tabby` is the existing
live cat, not an additional real database animal.

```bash
node scripts/pawtrail-actors.mjs render --id misty-siamese
node scripts/pawtrail-actors.mjs render --ids tabby-scout,persian-cloud --actions walk
node scripts/pawtrail-actors.mjs pack --id misty-siamese
```

The exporter uses isolated Firefox for artwork, native finishing, versioned URLs
and authoritative manifests. Bounds are multiples of 8 within 32–64 wide and
32–80 high for cats. Preserve the manifest ground anchor. Catalogue morphology
is included in the appearance signature. Shape/palette changes require full
exports; `pack` only repacks matching existing source frames. Shared pose edits
reach existing baked cats after affected clips are re-exported. Do not promise
that an old PNG changes just because the rig code changed.
