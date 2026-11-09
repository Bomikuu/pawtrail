# Personal character creator

Open `/play?preview=actors` or **Your spaces → Character creator**. Existing
`skin`, `pose` and `facing` links work; `skin` starts from a named template.
`/play?compare=actors` retains the original character/cat comparison.

The creator offers real geometry for swept, cropped, spiky and long hair; a vest,
tunic, coat or gown; shorts/trousers; a wide-brim hat, hood or halo; glasses;
backpack; feathered wings; and an equipped sword/sheath. Colors include linked
highlights/shadows and individual channels. Hair tucks beneath hats and hoods.
Gowns, long hair, wings and equipped gear retain their shared motion policies.

The comparison field previews every human action from the authoritative
`src/game/actor-rig/actions.json`, eight headings, pause/restart, synchronized or
native timing, keyboard/touch movement, integer zoom and existing emote props.
The creator's native frame is 128×160, grounded at (64,120), sampling the original 64×80 world window at density 2, with the original world
scale and camera. Larger padding preserves accessory depth without shrinking the
body. GPU rendering happens only for changed native frames; the finish matches
`scripts/pixel_actor_art.py`. One shared offscreen GPU context serves personal
actors and thumbnails. The Phaser session/canvas remains shared across modes.

## Saves

- **PawTrail account:** owner-scoped `PlayerCharacter` rows in the actual housing
  database. The existing platform session exchange authenticates requests.
  Names and strictly allowlisted v1 configuration are stored, with revision
  conflict detection. A user can save at most 24 characters. Account looks can be
  equipped in Explore and homes. Only an equipped appearance is readable by other
  authenticated players, respecting visibility and blocks.
- **This device:** up to 24 named localStorage configurations and small PNG
  thumbnails. Storage failures are surfaced; these are never described as cloud
  saves. Device looks can be equipped for local Explore. Save a separate account
  copy to wear it in multiplayer homes.
- **Export/import:** versioned JSON backup of name and cosmetic configuration.
  Imports are size-bounded and validated. No executable geometry, arbitrary URLs,
  personal reference photos or rendering code is accepted.

The draft is restored locally. Explicit library save, update, save-as-new, edit,
use and confirmed deletion are separate actions. Dirty changes are flagged and
protected when replacing a look. Account update conflicts require reloading the
library; failures do not silently fall back to another storage location.

The existing game character picker includes the personal library, with account
characters only in home settings. Personal actors use the same canonical rig
and action functions as the creator. Approved built-in sprite atlases remain
unchanged; shared motion changes require rebaking those built-ins with the
existing production tool. Cosmetic saves are independent of care, real animal
records and Kibble.

## Sources

- `src/game/actor-rig/`: canonical rig, geometry, palette, slot contract, actions,
  browser pixel finish/renderer.
- `src/game/creator/`: validated personal library and draft state.
- `src/components/game/character-creator-editor.tsx`: shadcn/Tailwind editor and
  library. The animation field is the existing shared comparison scene.
- `backend/housing/characters.py`: owner-scoped API, validation and equip logic.
- `backend/housing/migrations/0011_player_characters.py`: persisted library schema.
- `assets/animation-approval-v1/source/`: exporter entry point; old rig module
  paths now re-export the canonical modules for compatibility.

No agents, automated tests, checks, builds or browser verification were run for
this work, per AGENTS.md. This document records implementation boundaries, not
an assertion of runtime verification.

## Goku, astronaut and powering up

Templates `goku` and `astronaut` extend the modular slots with `hero-spikes`,
`gi`, `spacesuit` and `space-helmet`. The martial-arts gi includes loose trousers,
a blue sash and wristbands. The spacesuit includes padded sleeves, gloves and
boots; its optional backpack becomes a vented life-support pack with tanks.
The helmet covers the retained hairstyle so it can be restored when removed.
Colors use existing palette roles, preserving saved v1 configurations.

`power_up` is a shared 24-frame/12-fps looping human action with a braced stance,
clenched fists, chest movement and restrained body rumble. The shared pixel
effect layer adds a stepped gold aura, rising sparks, blue arcs and loose ground
particles. Power up appears in the creator and the normal reaction picker.
The housing reaction allowlist supports broadcasting it in multiplayer.
Personal avatars also use their own canonical appearance in the emote wheel.

Only these two new appearances were exported: 2,368 native frames, 216 directional
clips each (27 actions × 8 headings), 64×80 cells grounded at (32,60), and a
3,584×3,520 atlas per appearance. Existing baked characters were not re-exported
or selected automatically. Review artwork lives under
`assets/actor-appearances/reviews/goku-astronaut.png`.

The named Goku appearance uses a classic black-haired, orange/blue interpretation.
The astronaut is an original white EVA-style interpretation. Both reference the
owner's approved RPG image for pixel style. Native art was exported in the private
Firefox authoring page and visually inspected; no project tests, checks, builds
or running-app browser verification were performed.

### Temporary Super Saiyan layer

Goku's gi + hero-spikes combination reveals a separate upright golden hair mesh
and turquoise eyes during power_up. Its normal hair and eye geometry returns for
all other actions. The native palette includes both forms, and neither the saved
appearance configuration nor its portrait is overwritten by a temporary form.
`actor-rig/action-layers.ts` owns eligibility, palette and mobile-action policy.

Power up is layered over the approved walking IK using an independent stride
phase. Preview input, Explore controls, home actions and the shared appearance
binding preserve the timed action during walking and turning. Stride phase
continues when entering/leaving the form. Care or a different action can interrupt
it. A timed in-game reaction lasts eight seconds and clears on expiry, including
when a menu prevented the scene's normal animation update. The creator keeps its
loop until another action is selected or End power up is clicked. Pausing retains
the displayed pose; it does not change a saved appearance.

The transformed effect has a wider stepped gold corona, more rising sparks,
long jagged blue-white lightning paths and additional ground particles. The
preview's integer zoom also considers vertical clearance for the effect. Only
Goku's 192 power_up body frames were re-exported; its existing clips and all other
characters' exported art remain unchanged. Native gold/normal artwork was
inspected. No automated tests, checks, builds or running-app browser verification
were performed.

## Jetpack and movement persistence for every action

Movement no longer cancels selected authored actions. The shared action policy
reads the human/cat action tables, so later additions inherit persistence without
a new per-action movement allowlist. Normal gestures and care poses retain their
upper-body animation/props while the canonical rig restores the approved walking
legs and stride. Sitting, sleeping, floating, riding and flying keep their full
pose while translating. A selected action ends on its normal completion, timer
or explicit replacement; actual care workflow locks and collision are preserved.

The default rescuer and personal characters use the canonical native renderer
for this shared behavior. Legacy appearances keep their emote and effect state
instead of having movement replace it. The creator's End action control covers
all actions rather than only Power up.

Astronaut flight is composed of `jetpack_takeoff` (10 frames at 20 fps),
`jetpack` (16 frames at 12 fps) and `jetpack_land` (12 frames at 20 fps).
`actor-rig/action-playback.ts` supplies the same takeoff/hover/landing state
machine to the creator and runtime; its durations come from actions.json.
An in-game launch lasts eight seconds, followed by a 600 ms landing. The preview
loops until Land or another action is selected. Movement and turning remain
available during takeoff, flight and landing; normal ground-plane collision
continues to apply. Choosing another action queues its appearance behind landing.

The suit's life-support pack gains temporary outboard nozzles and fuel lines.
Pixel exhaust rotates with the engine positions at each heading; hover and
landing use matching height/thrust envelopes, a ground shadow and brief landing
dust. The body rises in the padded native frame, leaving the physics actor and
saved appearance untouched. Flames and equipment disappear when landing ends.

Only the astronaut's three new body clips were exported (304 native frames).
Its updated atlas contains 240 directional clips in a 4,096×3,680 sheet.
Native art review: `assets/actor-appearances/reviews/astronaut-jetpack.png`.
No automated tests, checks, builds or running-app browser verification were run.

## Gameplay abilities

Power up now grants eligible Goku a real speed boost. Rescue Dash and Gentle
Approach change movement/animal behavior with timed activation, cooldowns and
automatic restoration. See [movement abilities](gameplay-abilities.md) for exact
values, native run animation, preview behavior and the database/server boundaries.


## Shared high-detail faces and inspection

The human creator now uses density 2, with native 128×160 frames and half-scale
presentation. It retains the original world camera and foot anchor. The shared
pixel finisher keeps a bold two-native-pixel outline. The in-game human runtime now shares that density-2 rendering, with its
physical actor, collision and world coordinates preserved. Old baked catalogue sheets are not
silently resized or regenerated by this creator update.

The Face tab adds independent left/right eye colors, a matching-eyes toggle,
facial hair and freckles/beauty marks. Shared rig geometry uses dark oval eyes,
a small iris tint and a tiny catchlight, with no white sclera or visible nose. Goku's powered form still overrides the eyes
temporarily and restores the saved palette afterward. Glasses/gear/actions keep
their existing attachment and movement behavior.

FaceDetailsEditor, FaceColors and the inspection helper are reused by the human
and cat creators. Inspect face hides the reference and centers the editable head
at a closer integer zoom. Full body returns to the comparison; this does not
remount the scene or cancel the selected action.

The version-1 appearance JSON now carries face colors and optional facial
accessories. Both frontend and account API validate these fields, with defaults
for older saves/imports. Existing JSON columns require no migration. New catalogue
exports include face/accessory data in validation, palettes, signatures and rig
hashes. The actor skill documents these defaults for future characters.

Source review only; no automated checks, tests, builds or running-app browser
verification were performed for this change.


The owner's latest face preference is a simplified human face with no nose and
dark oval eyes. Normal and powered eyes share the same eye helper. Eye colors,
blink/rest poses, glasses, markings and face inspection remain supported. Human
UI hides nose editing; the legacy nose field stays in saved JSON for compatibility.
Cat faces are unchanged. This preference is recorded in PawTrail Actors.


All in-game humans, built-in roster looks, visitors and NPC bodies now share this
renderer. Saved characters update at render time, without rewriting their account
or device configurations. See [the game-wide face rollout](all-human-faces.md).
