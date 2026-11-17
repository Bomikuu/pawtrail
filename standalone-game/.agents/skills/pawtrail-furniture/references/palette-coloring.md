# Masked palette coloring

Use this for changing a material's color while retaining its authored silhouette,
shadows and highlights. Sitting, collision and rotation stay separate from color.
A new color alone does not need ImageGen, a new mesh or another sprite PNG.
Patterns, changed construction or newly visible surfaces can still need artwork.

## Author once per view

- Keep original RGBA immutable. Author a semantic material mask for **every installed
  facing/state**, including any foreground/occlusion layer. Do not select every pixel
  of a matching RGB globally: pillows can share the fabric's colors.
- Index 0 protects pixels; positive indices map to authored shadow/mid/highlight
  colors. Explicitly exclude wood, pillows, decorative motifs, outlines and fixed
  structural seams. Preserve alpha exactly. Inspect the mask against the actual art.
- Store native dimensions, source and foreground hashes, indexed/RLE masks and a
  revision. Invalidate/re-author affected masks when source artwork changes.
  Validate masked source RGB/dimensions before applying them; fail visibly on a
  stale mask rather than recoloring unrelated pixels.
- Derive a light/dark ramp from the selected color. Keep tonal separation for
  pale/dark choices; a whole-image tint/multiply is not a replacement. Restoring the
  default must restore the **exact original RGBA**, without conversion drift.

## Runtime

Keep each placed item's selected color independent. Reuse bounded, native-size
render surfaces; update only on color changes, never every animation frame.
Apply one palette to both body and matching foreground layers, preserving nearest
filtering, integer zoom and existing anchors/contacts. Never share a mutable
colored surface across instances or create a PNG/cache entry for each chosen hex.

Use the existing renderer: Canvas2D copies/index masks suffice for small previews;
live Phaser integration may use per-instance surfaces or a masked shader when the
actual item count warrants it. Do not add a rendering framework just for color.
Persist colors through the existing authoritative placement/style contract only
when live installation is in scope. Local authoring controls are explicitly local.

## Focused verification

Check that only masked opaque RGB changes, all protected RGBA/alpha and original
buffers stay exact, source revisions match, and default restoration is byte-exact.
Cover light/dark colors, invalid input, body/foreground consistency and independent
instances. Inspect all affected facings with actors seated and rotate while
colored; confirm sitting/occlusion remains intact. Reuse unchanged collision and
navigation evidence. No unrelated mobile/item sweeps or broad test loops.

For live saves, verify the **transition out of decoration mode**, not only a fresh
room load: the room render signature must include decoration/play mode so saved
layouts recreate foreground arms/backrests even when placement JSON is unchanged.
Stand and walk clear before rotating occupied furniture; retain the server's
player-overlap/in-use guard. Compare differently colored instances in the same
frame when checking live pixels, since world lighting may tint all art equally.
Server-owned sitting/contact poses need an explicit actor-facing lock, released
when the pose ends. Do not infer this lock from cosmetic-emote movement policy:
an authored sitting emote may allow movement while a furniture seat must keep its
fixed facing. The shared renderer's `models3d/interaction-facing.ts` preserves
ordinary movement/emotes when no contact lock is supplied.

## Current sofa integration

Original two-seat item `sofa`:
`/play?compare=furniture&asset=sofa&representation=sprite`.
The interaction trial keeps four views/eight reusable body/foreground canvases.
`/play?preview=furniture&asset=sofa` also offers the color picker, presets, custom
hex, exact restore and four authored preview views. Editor color preferences save
automatically in `pawtrail:sofa-upholstery:v1` on this device and supply the default
for newly placed sofas. They never overwrite colors of existing sofas.

Live decoration controls store optional `Placement.upholsteryColor` per original
`sofa` item. **Save arrangement** sends the layout to the existing authenticated
housing service, including the last valid placement preview; invalid previews
block saving. The backend accepts only six-digit hex colors for supported sofas,
normalizes case and stores the color in the existing layout JSON. Ownership,
inventory, revision conflicts and in-use furniture rules remain enforced. No new
database table/migration or client-authoritative account save is needed.

Each colored live placement owns two reusable Phaser canvas textures for its
current body/foreground. Recoloring/rotating refreshes them only on change. Release
them on removal, original-color restoration and scene shutdown; the ghost has a
separate slot so it cannot mutate another placed sofa. Keep source textures intact.
Wood, pillows and brown contours remain original in every view. Other sofa item
IDs need their own reviewed masks before offering coloring.

Editor packages carry the optional hex as metadata, with underlying paint surfaces
unbaked. Explicit brush edits stay separate and override the palette on edited
pixels; palette changes do not erase those edits. Local package/texture saves
remain authoring output, not live account placements.

Workspace implementation:
`src/game/furniture/{palette-color.ts,sofa-palette.ts,sofa-palette-textures.ts,sofa-color-preference.ts,palettes/sofa.json}`.
`scripts/prepare-sofa-palette.py` reproduces the semantic masks from installed
source art; `tests/sofa-palette.test.ts` checks palette/source invariants. Mirror only
the changed owned modules/UI and targeted backend validation into the main app,
rewriting its existing feature import prefix. Preserve unrelated backend changes.
Source sprites remain unchanged. Follow workspace restrictions: tests, automated
checks and browser review run only when requested; source review alone does not
prove authenticated persistence or GPU behavior end to end.
