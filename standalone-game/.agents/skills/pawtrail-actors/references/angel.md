# Long hair, gown and feathered wings

`aurora-angel` is the original, preview-only feminine angel requested by the
owner. Her visual cues are waist-length honey-blonde hair, a flowing ivory/lilac
gown, puff sleeves, a gold waist sash, rose detail, soft facial details, feathered
wings and a halo. These are design choices for this character, not requirements
for every female or long-haired character.

The existing RPG image is a style reference. The owner's explicit angel brief
supplies the appearance features; do not claim the style image depicts Aurora.
For a different reference, inspect its particular hairstyle, dress silhouette,
wing structure and palette before reusing or extending the parts.

## Configuration

```json
{
  "parts": {
    "hair":"long", "headwear":"halo", "outfit":"gown",
    "legs":"shorts", "backpack":false, "held":"none",
    "wings":"feathered", "face":"soft"
  },
  "frame":{"width":64,"height":72},
  "headHeight":47
}
```

## Geometry and motion

- Long hair uses a crown, parted fringe, back curtain and side locks, with
  separate lower segments. Hair has small delayed sway and compensates for the
  torso/head lean during care poses. The face remains open and readable.
- A gown replaces the cargo/boot silhouette with a fitted bodice, puff sleeves,
  sash, slippers and a continuous twelve-panel bell skirt. The skirt follows the
  pelvis, not one leg or the bending chest. It gathers and spreads as the pelvis
  lowers for care/sitting, keeping its hem above the ground. Sleeping flattens
  the skirt. No extra reward or gameplay state is involved.
- Each wing has shoulder and elbow groups plus seven primary and five cover
  feathers. Feather vanes have thickness, quills and highlights. Small wing
  motion follows idle/walk; celebratory/floating poses use a larger amplitude.
  Wings fold during close care and have a compact rest placement for sleep.
- The halo follows the head's position while compensating for pitch so its
  plane stays horizontal, including when the character lies down.

These parts share `part-kit.ts`; geometry is in `angel-parts.ts` and action
adaptations remain in the shared rescuer pose function. Keep joint names unique
so the source GLB's animation tracks bind correctly. Full geometry changes need
a full appearance render; motion-only changes can update selected clips.

Export with `node scripts/pawtrail-actors.mjs render --id aurora-angel` and review
front/diagonal/side/back, walking, care, sitting and sleeping. Use the native
manifest dimensions/anchor; do not resize Aurora's body to fit the original cell.
The 64×72 frame adds transparent space while preserving one world unit per pixel.
Keep the appearance in the preview registry until roster integration is requested.
