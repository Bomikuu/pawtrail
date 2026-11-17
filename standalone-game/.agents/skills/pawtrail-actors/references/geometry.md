# Reference-guided geometry

The shared rig is a movement skeleton, not a requirement to reuse one fixed
silhouette. Interpret a reference in four layers: body/proportions, hair/headwear,
garments and accessories/held props. List visible shape changes separately from
color/texture changes. Preserve the approved original design language rather than
claiming that a recolor reproduces elaborate hair, hats or clothing volume.

For curved faces, fuller rounded bodies, layered edged hair, fitted shoulders and painted UV surfaces,
read [reference-specific model finishing](model-finishing.md). The approved Amber
construction is a useful baseline, not a fixed body or outfit for other actors.
Its [body-depth guidance](model-finishing.md#body-depth-and-volume) covers the
owner-approved fuller torso/hip/sleeve sections, hair thickness and side/rear
UV surfaces. Preserve the common rig and world scale while adapting the visible
volume to the reference; extra texture pixels cannot extend or round a mesh.

## Current human slots

Use `parts` in the appearance catalogue:

```json
{
  "parts": {
    "hair": "cropped",
    "headwear": "wide-brim",
    "outfit": "tunic",
    "legs": "trousers",
    "backpack": false,
    "held": "sword"
  },
  "frame": {"width":48,"height":64},
  "headHeight":44
}
```

| Slot | Supported values | Geometry |
|---|---|---|
| hair | swept, spiky, cropped, long, hero-spikes | Original swept locks; pointed clumps; cropped fringe; articulated long curtains and side locks |
| headwear | none, wide-brim, hood, halo, space-helmet | Crown/brim/band; open folded hood; floating horizontal gold ring |
| outfit | vest, tunic, coat, gown, gi, spacesuit | Vest; tunic; long split coat; fitted bodice and continuous pleated bell skirt |
| legs | shorts, trousers | Bare shins or wider trouser geometry with fabric shading |
| backpack | true, false | Original pack or an unobstructed garment silhouette |
| held | none, sword | Hand-bound blade/hilt/grip and separate torso-bound sheath |
| wings | none, feathered | Torso/hinge joints with layered primary/cover feathers |
| face | default, soft | Original face or softer cheeks with lashes/blush |

Defaults reproduce the approved rescuer. Do not apply human slots to the cat
rig. Further silhouettes, hats, weapons or unusual body shapes need
deliberate additions in `appearance-parts.ts`, or a new rig if anatomy requires
it. Keep new part groups uniquely named for GLB animation tracks.

## Attachment and animation

- Hair, glasses and headwear attach to Head and follow its turning/nodding.
- Garment torso pieces follow the existing spine. Split hems follow the hip
  joints with a small secondary swing, rather than stretching a rigid box across
  both legs. Sleeves and cuffs retain the existing arm joints.
- The sword attaches to the right wrist with a grip correction for idle, walking
  and inspection. Care gestures, clapping and other occupied-hand actions stow it
  on the torso. Sleeping hides the sword and sheath; the broad hat is removed.
- Keep anatomy and locomotion shared. Use small equipment-specific pose layers
  where a single pose would clip a weapon or put the hand outside its grip.
- For long hair, a gown or feathered wings, read the [angel example](angel.md).
  These use hair-tail joints, a pelvis-following skirt and articulated wing roots.

Inspect front, diagonal, side and back at idle/walk, plus a care pose, sitting
and sleeping. Real occlusion means the far hand or part of a hat can be hidden
from some headings. Check face/eyes remain readable and props do not intersect
the head, ground or unrelated held items. Use native exported art for review.

## Frame padding and world scale

Base cells remain 32×48 (human) and 32×32 (cat). Large silhouettes can use a padded
frame, in multiples of eight, up to 64×80. The renderer preserves one source
world unit per native pixel; it expands the camera window instead of zooming out.
For a human, the padded ground anchor is `(width/2, 44+(height-48)/2)`. The manifest
and preview consume these dimensions/anchors. A 48×64 cell does not make the
character physically larger in the world. The atlas repacker keeps each axis
within the existing 4096-pixel budget.

`headHeight` is the visible head/hair clearance above the ground anchor used by
overhead emote effects. Set it from the silhouette so icons clear tall hair or
headwear. Frame dimensions, parts and materials are included in the appearance
signature: changing them requires a complete render. A shared motion-only change
can still export selected actions across existing appearances.

Preview examples: `rowan-spiky`, `rowan-ranger` and `rowan-hood`. Generate them
together with:

```bash
node scripts/pawtrail-actors.mjs render --ids rowan-spiky,rowan-ranger,rowan-hood
```

These are preview-only appearances. They do not migrate the existing game roster.

Goku/astronaut geometry lives in `src/game/actor-rig/costume-parts.ts`. Hero hair
uses large swept pointed clumps; the gi has crossed lapels, loose trousers, a sash
and wristbands. A spacesuit uses padded limbs and its backpack becomes a tank/vent
assembly. A space helmet uses a full shell, visor seal and stepped gold reflections.
The helmet tucks any selected hairstyle away until removed. The authoritative slot
allowlist is `src/game/actor-rig/contract.json`, also read by the backend/exporter.

The shared `power_up` action is 24 frames at 12 fps, looping. Its skeleton pose
lives in rigs.ts; the aura, sparks and arcs live in runtime/emote-effects.ts.
Keep effect layers separate from exported body pixels. See the `goku` and
`astronaut` catalogue entries for palettes and recorded reference assumptions.
