# Mochi — floating artwork skin prototype

Open `/play?preview=skin&skin=mochi-floating`, or select **Mochi · Floating
artwork** in Character studio. This scoped reference trial reuses the humanoid
rig; it does not create another model or install an account/game appearance.

The visual body is 24 transparent image panels: four head views, four garment
views, plus front/back upper arms, forearms, thighs and shins for both sides.
The generated reference sheet supplies the pink bob, glasses, floppy white cap,
white outfit and tiny dark neck fastener. The golden chair is intentionally not
part of the character. The eyes are held artwork; this prototype does not add
authored facial animation, dialogue portraits, voices or cloth simulation.

**Base body hidden** is the preset default. The skeleton remains active. Its
existing actions move the attached artwork. Selected directional drawings face
the camera while retaining joint pitch/roll; other view drawings are hidden to
avoid overlapping front and profile faces. This is an articulated 2.5D skin,
not new solid 3D volume or a new animation rig. Body and hair visibility toggles
allow inspecting the underlying base.

The preset is studio-only. JSON package version 7 retains artwork, model/pose
data and body/hair visibility. No gameplay equip/backend schema was changed.

## Source and exports

- `source/reference.png`: owner's supplied visual reference.
- `source/parts-generated.png`: transparent sheet from built-in ImageGen.
- `source/prompt.txt`: exact submitted generation prompt.
- `source/export.py`: approved local production slicing, nearest-neighbor
  fitting, hard alpha and a muted 15-color pixel palette. Run with a Pillow
  environment from any directory to reproduce the 24 panel PNGs.
- `public/assets/game/skins/mochi-floating-v1/`: runtime PNGs and manifest.

The 24 runtime PNGs total **41,634 bytes** (about 40.7 KiB). The generated source
sheet is retained separately and is never fetched by the studio. Surface sizes
are 128×160 for heads, 128×192 for garments and 64×96 for limbs.

The generated sheet and native head export were visually inspected. Runtime
front/profile/back registration, all action clips, painting and JSON round trips
remain unverified. No agents, automated tests/checks, builds or browser review
were run, following current workspace instructions.
