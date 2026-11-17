# Item & Ability Studio

Open `/play?preview=items`, or **Your PawTrail spaces → Item & Ability Studio**.
This is a local authoring and rehearsal tool. It does not install abilities in the
live Phaser world, modify animals, issue Kibble or send multiplayer effects.

## First trial

The initial training sword can be equipped on Amber or Yae. Geometry/vertex tools
edit only the item. Existing refined actors, their painted textures and their
shared skeleton are retained. Equipment attaches after the refined actor factory
has completed, so it cannot be hidden in the base model archive.

- **Geometry:** add shapes, import native PNG details, transform parts and edit
  their vertices using the existing Character Studio controller.
- **Equip:** choose either wrist, edit local position/rotation and move the grip
  pivot without changing visible placement. Gold/green markers show grip/tip.
- **Actions:** edit masked joint poses, record keyframes, add hand-local item
  rotation keys and set preparation, active, recovery and cooldown timing.
- **Effects:** add, duplicate, delete and drag timed trails, bursts, waves and
  sound cues. Visual size and hit size are separate properties.
- **Area:** arc/circle/box/capsule queries, drag handles and numeric values share
  the same ground dimensions. Highlighted tiles and target outlines show local
  eligibility; collision shapes use ground footprints, not image bounds.
- **Try:** WASD/arrows move, Shift runs, J uses Primary and K uses Special. Visible
  buttons support touch. Reset clears local counters and cooldowns.

The primary slash lasts 600 ms, activates from 150–280 ms and uses a 120° arc with
64 px reach. The cooldown starts with the cast and lasts 800 ms. The special
releases once at 300 ms, recovers at 900 ms and has a 2,500 ms cooldown. Its default
wave is 96 px wide and 16 px deep, moves at 192 px/s and travels at most 192 px or
1,000 ms. A released wave may remain after the actor recovers. Each target is hit
once per cast/projectile. Waves use swept oriented rectangles: the full band
stops at its earliest wall contact, including when a narrow doorway admits only
the centerline. Melee also checks wall line of sight. Target state remains local.

The garden has near targets, a multi-tile target and a target behind a solid wall.
The log exposes timed releases, hits, stops and recovery completion. Changing
authoring data cancels the active cast; leaving a rehearsal disposes owned sounds,
effects, input state and the actor renderer. Timeline seeking resets and silently
resimulates from the training snapshot; playback does not refire past cues.

## Save and use in a room

Save locally writes a version 1 `pawtrail-item` document to a device library,
separate from character skins and stage layouts. Export/import carries geometry,
native textures, sparse vertex edits, equipment transforms, masked clips, hit
areas, projectile settings and stable-ID events. Imports are normalized to known
data fields; no scripts or executable effect modules are accepted. Invalid
imports leave the current draft intact. Undo/redo is bounded to 24 snapshots;
the library holds 20 items. Each document is limited to 2 MB, 24 parts, 24 motion
keys and 32 timed events (at most eight projectile releases per action). Browser
storage can fill sooner; export is the recovery path.

Open the Stage editor, choose the saved item in the play toolbar, then **Play
room**. The same actor decoration, ability simulation and presentation run on the
stage's real furniture/wall footprints. J/K use the item; E remains furniture
interaction. Returning to editing restores the edit camera and preserves layout
history. An item selection does not become part of the stage or a live inventory.

## Implementation boundaries

- `items/document.ts`: versioned local format and storage.
- `items/equipment.ts`: attachment roots, native textures and rig decoration.
- `items/motion.ts`: shortest-path pose sampling, shared with Character Studio.
- `items/spatial.ts` and `runtime.ts`: renderer-independent queries and fixed-step
  simulation; captured facing, movement lock, one-time events and per-target IDs.
- `items/presentation.ts` and `systems/item-sounds.ts`: cancellable world effects
  and original short sounds through the existing effects volume/mute channel.
- `items/scene.ts`: editable Three.js preview with the existing pixel finish.
- `items/preview.ts`: Canvas2D adapter reusing StagePlaytest movement/collision.
- `components/game/item-studio`: official shared shadcn controls, Tailwind panels
  and accessible timeline. Mobile switches Library/Preview/Properties/Timeline.

The actor raster measures sampled action bounds, adds native-pixel padding and
retains world scale and feet anchoring. World waves/trails are drawn outside that
raster. Frame caching is bounded by pixel memory as well as entry count. Active
projectiles are capped at 16; effect bursts at 32 (four particles each). These are
resource limits, not measured performance claims.

## Validation status

Implemented by source editing only. Per owner instructions, no automated tests,
checks, builds or browser verification were run. The saved plan's manual
acceptance list remains pending. Live Phaser installation and server-authorized
item IDs/effects remain deferred until this local pilot is accepted.

## Movement refinement — 11 November 2026

The Item Studio and Stage editor share a faster local movement controller:
126 px/s walking and 186 px/s running, with short acceleration/braking and a
140 ms pose transition. The existing foot trajectories and 84/104 px step-cycle
distances remain unchanged; cadence follows actual traveled distance and stops
against obstacles. Facing interpolates through smaller angular steps rather than
switching straight between the eight input directions. Model size, feet anchor,
walking footprint and 32 px tiles retain their dimensions. Live-room speed rules
and authoritative movement services are outside this local pilot.

The default training sword now includes full-body preparation, leg/hip weight
transfer, follow-through and recovery. Item clips flow through intermediate
poses rather than easing to a stop at every key. Character Studio motion keeps
its previous interpolation. Hair/fabric secondary movement continues during
item actions.

Actions can author an optional ground step (`rootMotion`: distance/start/end).
The new slash advances 10 px; the wave advances 6 px. The real actor position
moves through the existing collision substeps, and active hit/release origins
follow that collision-resolved position while aim stays captured. Timeline seek
resets to its original ground position before silent replay, preventing repeated
scrubbing from accumulating travel. Existing item files default to zero travel;
saved custom actions are preserved. Choose **Load training sword** to use the
new default poses in an already-open studio, then save if desired.

Changes were source-reviewed only. No automated tests, checks, builds or browser
verification were run, following the owner's instruction. Visual acceptance is
pending in the local preview.

## Moonvine chain moveset pilot — 11 November 2026

Open Item Studio and choose **Load Moonvine chain → Try**. New studio sessions
start with this original reference-inspired weapon. Existing saved swords and
custom items are not rewritten. All installation remains local to Item Studio
and Stage editor rehearsal; there is no live multiplayer combat or animal data
mutation.

| Input | Move |
| --- | --- |
| J | First ground strike |
| J again during the displayed window | Queue the second strike, then the finisher |
| Shift + movement + J, or R | Running sweep with collision-resolved advance |
| L | Longer extending chain with retraction |
| K | Circular special with three independently timed hit windows |
| E in Stage play mode | Existing furniture interactions |

Primary/Special remain required in version 1 item files. Optional `combo2`,
`combo3`, `running` and `extend` clips carry independent motion, cooldowns and
geometry-contact settings. Inputs are buffered for a bounded early window and
consume at most one follow-up per cast. Held keys do not auto-repeat. Each link
has a new cast ID and preserves facing/current ground position. Targets dedupe
per strike window, so the multi-tile target counts once per strike while a later
window may hit it again. Hit events include bounded local recoil and impact
pause. Training targets recoil through solid collision checks and reset with
their original positions and eligibility.

The deployed weapon is a segmented, authored curve with sweep, thrust and orbit
modes. It extends and retracts without changing the character or walking box.
The native rig's projected hand socket anchors its visible root; ground path
queries remain separate from visual height. Segment paths clip at solid contact,
and actual segment/swept samples gate eligible area hits. The special holds full
reach through its middle phase and makes three rotations with corresponding hit
windows. Curved afterimages, a weighted tip, short original cues, target flashes
and a tip ground shadow supply feedback. This is controlled animation, not a
rigid-body simulation of every link.

Actions → combo/trajectory/hit-window controls edit the moveset. Effects also
exposes trajectory controls; Area exposes strike-window shapes. The timeline
shows independent strike windows and the combo-link interval. Save/import/export
carries these definitions; validation limits clips, windows, segment counts,
reach, timing and impact pause. Save locally, then choose the item in Stage
editor to use the same runtime in a furnished room. Legacy files retain their
previous single-area behavior.

Source implementation and manual source review only. No agents, automated tests,
checks, builds or browser verification were run. Visual acceptance and exact
reference timing remain pending; the YouTube reference was reviewed through
sampled frames, not a frame-accurate capture.

## Body spiral and training zoom — 11 November 2026

Orbit trajectories now wind twice around the actor before the outward tail. The
visible chain rises from lower torso to shoulder height, then drops toward the
weighted tip. Its ground trajectory remains the source for clipping/contact;
visual height does not resize the actor or alter walking footprints. Rear
segments and their afterimages render before the character; front segments
render after it, within the actor's existing Stage depth entry. This body-depth
composition is shared by Item Studio and Stage play mode. K on the Moonvine
pilot demonstrates it; new pilot definitions use 32 orbit segments.

The training canvas has integer 1×–6× camera zoom, floating shadcn buttons, a
current zoom label and Fit reset. Wheel zoom anchors under the pointer; buttons
anchor on the character. With the canvas focused, +/− zoom and 0 fits the camera.
The wheel is bounded/accumulated for trackpads and also supports Ctrl+wheel.
Explicit zoom survives canvas resizing. The same camera controls are available
in Effects/Area/Try without changing actor/tile dimensions or resetting casts.

Source edits and manual source review only; no automated checks, builds, tests
or browser verification were run under the owner's standing instruction.

## Default equipped hover — clarification, 11 November 2026

The owner's intended default is an anime-like chain continuously floating around
the body, not a spiral visible only during K. Chain items now have that equipped
state while standing and walking. Native 3D interlocked links wind around the
lower torso through shoulder height with slow rotation, bobbing and a floating
weight. Actor depth naturally hides rear links. The same helper is used by the
editable Three.js preview and the game actor factory; it is not a detached
screen-space ornament.

Equip → **Default hovering body chain** controls the state and saves an optional
`idleChain` boolean. Existing chain files without that flag automatically enable
it; explicit false restores the handheld rest appearance. Non-chain items keep
their prior appearance unless the owner enables it. Resting duplicate weight/link
parts are hidden while hovering, except an explicitly selected geometry part in
the editor. Item actions gather the hovering chain before deployment and restore
it during recovery. The idle helper never enters hit detection, cooldowns,
projectile lists or rewards and has no continuous sound.

Idle motion is visibility-suspended in the editor. Preview animation clocks and
native actor secondary motion drive it; decorative links do not change foot
collision, tile dimensions or item authority. This clarification supersedes the
previous interpretation that the body spiral should exist only as the special.
No automated checks, builds, tests or browser verification were run.

## Weapon selector and artwork provenance — 11 November 2026

The studio header now has a Sword/Chain dropdown beside the character selector.
Each preset keeps its unsaved draft for the current editor session when switching
between those presets. The selected workspace and character remain in place.
Save locally is still required for persistence across page reloads. Imported,
duplicated and new items display Custom item until a preset is selected; the
existing undo stack retains the preceding draft.

The current weapon presets do not contain AI-generated image textures. The held
sword/chain parts use procedural Three.js primitive geometry with solid material
colors and vertex shading. The hovering chain uses 3D torus links and a 3D weight;
its deployed attack path uses procedural Canvas2D links/trails in the world.
Pixel finishing supplies the low-resolution palette/outlines. The part renderer
supports native PNG texture maps, but neither default preset currently embeds
one. No new image-generation pass or brush-painting work is claimed.

Source editing only; no automated checks, builds, tests or browser verification.

## Generated ruby hammer skin — 11 November 2026

The Ruby hammer preset references the owner's oversized red/brass hammer image.
Unlike the original solid-color Sword/Chain presets, it uses artwork generated
with the built-in image_gen tool. The four-panel opaque texture atlas provides a
ruby/gold front, bronze side, red striking cap and wrapped wooden shaft. Native
exports are 128×128 for the atlas and 64×64 for its tiles, nearest-neighbor reduced
and stored as 64-color indexed PNG. The prompt, region/UV manifest and PNGs are in
`public/assets/game/items/ruby-hammer-v1/`; generated artwork is not a complete
hammer screenshot. `items/hammer-art.json` embeds the atlas/handle in the portable
preset so Save/Export includes the actual generated textures.

Choose **Ruby hammer** from the weapon dropdown. Its oversized 3D head uses a
`box-2x2` UV layout: ±Z front/back = top-left, ±X sides = top-right, ±Y striking
ends = bottom-left. The shaft uses the handle tile. Shared geometry/model tools
preserve this layout, vertex edits and native textures; Geometry exposes a
texture-mapping selector. This remains real 3D geometry plus a generated 2D skin,
with small additional gold/ruby accent meshes and the existing pixel finish.

The optional `equipment.carry` torso transform places it diagonally behind the
character while standing/walking. Item actions attach to the hand; normal poses
restore the back mount. Equip exposes a carry toggle and local back transform.
The same attachment helper serves the editable preview and rehearsal actor.
Primary/Special provide a heavy slam and warm shockwave for local trials; no
live-world ability installation or new character rig is implied.

The built-in generated atlas and native exports were visually inspected as asset
production. No application automated tests, checks, builds or browser verification
were run under the standing instruction. In-game visual acceptance remains
pending; no frame-perfect match to the reference is claimed.
