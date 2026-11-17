# Amber · Blender MCP mesh revision

Open `/play?preview=actors&skin=amber-outrider&model=blender`, or select Amber in
the actor creator and choose **Compare Blender revision**. The left side is her
current `createAmberShoulderStudy` model; the right side is the Blender revision.
Closing the comparison restores the creator's normal approved-base comparison.

The comparison starts at a larger fitted scale on a quiet studio backdrop.
Drag horizontally to rotate both live models, use the rotation slider or 45°
buttons, or select an exact heading. Ctrl+wheel and the zoom buttons adjust
integer zoom. **Expand comparison** hides the portrait column and enlarges the
field, making additional fitted zoom available. **Reset view** restores the
three-quarter view. The older `/play?compare=amber` study shares the rotation
controls and links directly to the Blender revision with its full action list.
Ability controls sit below the field instead of covering the models.

This is an isolated appearance study. It does not replace the game roster,
saved characters, skin editor, other actors, portraits, icons, illustrations or
voice packs.

## Authoring

The official Blender Lab MCP server's `execute_blender_code` tool ran the
authoring script inside Blender 5.2.4 LTS. The original scene was retained; a new
Amber scene contains both models and their named part/joint hierarchies.

The export carries the current live model, the approved fuller-volume study,
and 25 existing nearest-neighbor pixel texture surfaces into Blender. No new
image generation, realistic materials or antialiased replacement textures are
used. The candidate starts with the existing volume-study geometry, then adds:

- Small actual bevels on jacket edges, collar, cuffs and the satchel.
- A fitted chest/waist depth profile and slightly tucked shoulder caps.
- Staggered, swept ends on the separate back and side hair locks.

The face geometry, eye states, feet, rig joints, sockets and animated cape mesh
are not edited. Existing hair roots remain independently animated. Only 18
edited mesh buffers are exported from Blender, with UVs, normals, vertex colors
and material groups. The runtime mesh package is 358,327 bytes before HTTP
compression; the existing volume factory supplies the rest of the model.

## Live animation and comparison

`createAmberBlenderStudy` builds the existing volume-study rig and applies those
mesh buffers by their exact hierarchy paths. Pose functions, secondary-motion
closures and world measurements remain those of the current rig. This avoids
replacing the actor with a GLB that only contains idle/walk clips.

Actor preview uses two live `PixelActor` instances on the same shared renderer,
camera, 128×160 frame, palette/outline pass, timing, facing, movement offset and
integer zoom. Both receive the same action and transition inputs. The existing
care/rest/emote controls, voice lane and portrait response remain available.
The reference actor does not start a second voice line. Both renderers and their
canvas textures are disposed on comparison exit or failure.

The mesh package is fetched only when this comparison is selected. A load or
binding failure uses the existing visible error/retry flow; it does not silently
fall back while labeling the old model as a Blender revision.

## Source files

- `assets/actor-appearances/amber-blender-mcp-v1/amber-blender-mcp.blend`
- `assets/actor-appearances/amber-blender-mcp-v1/source.json`
- `assets/actor-appearances/amber-blender-mcp-v1/textures/`
- `assets/actor-appearances/amber-blender-mcp-v1/model-contact-sheet.png`
- `public/pawtrail-game/actor-studio/amber-blender-mcp-v1/mesh-patches.json`
- `tools/actors/export_amber_blender.ts`: export existing rig/painted surfaces.
- `tools/actors/refine_amber_blender.py`: Blender authoring and mesh export.
- `tools/actors/blender_mcp.py`: official MCP client for the authoring script.
- `tools/actors/finish_amber_blender.ts`: offline artwork contact sheet using
  the actual game palette and contour pass.

The authoring Canvas package lives outside the product at
`/run/media/micxsz/Drive/Blender/authoring`; it is not a game dependency.

## Review status

The MCP authoring call completed successfully. Offline front, three-quarter and
side artwork was inspected with the native pixel finish. The identity, face
shape and texture direction remain consistent; body and hair depth changes are
most visible in profile and three-quarter views.

The owner subsequently requested scoped browser verification. Firefox was used
for idle, walking and running sequences, care/rest poses, emotes and the remaining
action controls. Front-three-quarter and rear-three-quarter captures retain crisp
palette-limited pixel surfaces; hair and cape movement stays continuous, with a
restrained idle and stronger delayed follow-through during locomotion. Feeding,
petting, sitting, sleeping, water, pickup, cleaning, supplies, gestures and emote
poses were inspected. An ability blocked by its existing cooldown was revisited
once available; the power-up aura was captured. These are fictional local actions.

The browser confirmation exercised drag rotation (45° to 111°), rotation buttons,
Ctrl+wheel, fitted zoom, expansion/reset, running movement, retaining Pet while
moving, the older shoulder-study controls and its link back to the new comparison.
The 390×844 mobile viewport had a 390 px document width. No JavaScript exceptions
were recorded. The floating ability panel initially covered the enlarged model;
it was moved into the comparison's normal document flow and confirmed afterward.

Evidence lives under `output/playwright/amber-blender-motion/`, including captured
motion frames, core/care/emote contact sheets and desktop/mobile views. GIFs made
from sampled browser screenshots are review aids, not frame-accurate exports.
Browser review did not add production builds, type checks or an automated test
suite. Final likeness approval and promotion into gameplay remain with the owner;
portrait/audio production and other character packages were not regenerated.
