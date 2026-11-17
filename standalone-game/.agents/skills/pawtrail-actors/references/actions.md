# Creating actions, temporary forms and gameplay abilities

Use this for new gestures, transformations or actions that change how a character
or cat looks or behaves in the game. A new action may combine skeleton movement,
geometry visibility, material/color changes, pixel effects and real gameplay
modifiers such as running, super speed, dashing or NPC behavior. Implement only the parts the request
needs; Goku is one example rather than the required shape of every action.

Include synchronized audio and a ground shadow as part of the shared action
presentation. Read [sound and shadows](sound-and-shadows.md) for the implemented
cry/rain, power-up and jetpack sounds, floating/flight shadows and their lifecycle.
Read [feedback and layered effects](feedback-and-effects.md) for tactile click/open
responses, normal-hit versus skill/item effects, animated 2D slashes, foot-level
magic circles, separate illustration/background/aura assets and conditional
boss-enrage cut-ins. Include the applicable feedback phases when defining the
action; do not leave them only to an ultimate or a later polish pass.

## Define the action

Determine its trigger, supported actors, duration/loop, appearance changes,
movement compatibility, actual gameplay effect and exit behavior from the request
and existing context. For an ability, also define its duration, cooldown, stacking
policy and which state is owned by the client or server.
Distinguish an action's temporary form from a new permanent appearance. A request
for a preview action does not imply adding it to the normal game reaction menu.

Keep the user's selected colors/equipment as the base. Changes can include a
new hair silhouette, opened wings, a closed helmet visor, equipped props, eye
color or other authored geometry/materials. A substantial silhouette change
requires geometry, not just a recolor. Follow the established pixel style,
source world scale, camera, native palette/contour and attachment joints.

## Shared implementation

- `src/game/actor-rig/actions.json`: authoritative frame count, fps and loop mode.
- `src/game/actor-rig/rigs.ts`: shared pose and temporary geometry visibility.
  Attach additional pieces to existing joints; reset their transforms/visibility
  deterministically with the rest of the rig. Cat actions use the cat rig.
- `src/game/actor-rig/action-layers.ts`: current appearance eligibility, temporary
  color constants, effect routing and mobile-action policy. Extend deliberately
  when a new action needs those decisions.
- `src/game/actor-rig/pixel-renderer.ts`: include transient state that changes
  the rendered pixels in the frame cache key. Include all temporary colors in
  the finishing palette; otherwise quantization can erase the new appearance.
- `src/game/runtime/emote-effects.ts`: shared pixel aura, lightning, particles
  and other effects. Keep these separate from body sprites so they follow the
  actor and its depth consistently in preview, Explore and homes.

Do not overwrite saved appearance data to activate an effect. Temporary parts
can be prebuilt hidden groups or another suitable shared-rig layer. Restore the
base when the action finishes, is replaced/interrupted or its owning actor is
removed. Timed expiry must also work while a menu prevents the scene's usual
animation update. Release new materials/textures and transient state with the
actor's existing cleanup lifecycle.

All authored actions now inherit movement persistence from actions.json. Do not
add a new Power-up-only or per-action cancellation rule. Separate locomotion
phase from action phase. Use the
approved leg/foot cycle alongside the action's upper-body/form layer rather than
freezing the legs or replacing the entire action with walk. Keep stride phase
continuous when entering/leaving the action and when changing heading. Preserve
its timer/effects during movement. Grounded gestures use usesWalkingLegs; seated,
sleeping and airborne actions keep their full pose while translating. Explicit
action replacement and real care workflow constraints remain separate from
movement alone.

Register preview choices in `src/game/runtime/actor-comparison-state.ts`. If
normal gameplay is requested, integrate `src/game/reactions.ts` and the shared
appearance binding, Explore and home action handling. Multiplayer reactions also
need the allowed event in `backend/housing/live.py`. Reuse their existing action
paths rather than inventing a per-character controller.

## Actions that change gameplay behavior

Appearance, animation and gameplay behavior are independent layers. Implement
only the requested layers, but make a requested behavior real: playing a running
clip faster does not increase travel speed. Goku power_up now changes appearance and grants a server-authorized speed boost
when eligible. Jetpack still lifts the rendered body while retaining ground-plane
navigation/collision; do not describe it as obstacle traversal.

For run or super speed:

- The owner's selected movement style is a natural fast run: forward lean,
  bent elbows, opposing arm/leg swing, distinct toe push-off, knee/heel recovery
  and heel-first landing. Preserve the approved walk instead of making it a
  faster exaggerated walk, and keep anime arms-back sprinting an explicit variant.
- Keep planted-foot targets consistent with body compression/rise. IK should
  compensate for torso/pelvis displacement; don't add a separate unaccounted bob
  that drives feet through the ground. Toe roll and swing-recovery pitch must
  meet continuously at takeoff/landing. Use one stride pose for the arms and
  restore it through compatible action layers instead of calculating competing
  arm cycles. Hair, sleeves, skirts and capes must recognize run as locomotion.

- Derive movement speed from the normal controller plus active action modifiers.
  Reuse existing sprint behavior rather than adding a conflicting speed path.
  Apply the result to actual velocity/step distance for keyboard, touch and
  click-to-move input. Normalize diagonal input and retain delta-time movement.
- Match the run pose, stride and footstep cadence to actual distance/speed, with
  suitable acceleration/deceleration. Keep heading changes and camera follow
  smooth; increasing animation timeScale alone is insufficient.
- Define duration/cooldown and composition with existing sprint, transformations
  and other abilities. Keep these configurable rather than baking speed rules
  into a particular skin. Eligibility may be appearance-specific when requested.
- Keep the movement-persistence policy: moving does not cancel an ability.
  Remove its modifier on expiry, explicit replacement/cancellation, actor cleanup
  or scene/session exit as appropriate. Recompute from the current base and other
  still-active modifiers; do not permanently multiply saved/base speed or reset
  unrelated effects when one ability ends.
- Preserve navigation, furniture collision, path arrival and real interaction
  constraints. For a dash, validate the travelled segment and stop at obstacles
  rather than teleporting past collision cells.

Read the actual controllers before wiring behavior:

- `src/game/runtime/actors.ts` (`moveActor`) and
  `src/game/systems/behavior.ts` (`movementVector`): shared movement and sprint.
- `src/game/world-scene.ts` and `src/game/housing/scene.ts`: world/room input,
  active action lifecycle and controller calls. Keep Explore, house and yard
  consistent.
- `backend/housing/live.py`: multiplayer currently checks distance per elapsed
  time, room bounds and the full movement segment. A faster client alone can
  receive position corrections. Multiplayer abilities require server-authorized
  activation, expiry/cooldown and an action-specific movement allowance; do not
  simply raise the global limit or trust a client-supplied speed multiplier.
- `src/game/runtime/actor-comparison-scene.ts`: when a behavior is requested,
  demonstrate its actual movement in the preview field as well as its pose.

For other behavior-changing actions, apply the same separation to the relevant
system, such as an animal state machine or interaction controller. Cosmetic
input must not become authoritative care evidence, identification, Kibble or
animal welfare state. Preview-only experiments should be identified as such;
a documentation suggestion is not an already implemented ability.

The implemented **Rescue Dash** is a brief steerable 340 px/s burst (650 ms) with
a 6.5 s cooldown from activation. It uses the collision-aware controller, a leaning
run pose and pixel trail. It never completes animal care automatically.
**Gentle Approach** lasts 10 s with a 12 s cooldown, reduces speed to 58 px/s,
suppresses footsteps and reduces shy-animal flee distance in Explore.

## Existing example: Goku

Goku's gi + hero-spikes appearance reveals upright golden hair and turquoise
eyes during `power_up`. His normal hair/eyes return for other actions. The
`super_saiyan` effect route adds a wider golden corona and blue-white lightning.
His saved palette, equipment and portrait remain normal.

Power up supports walking through `RigPoseOptions.locomotionPhase`. The personal
runtime and creator retain an independent stride clock; shared scene/binding
policies preserve the action while moving. The game reaction currently lasts
eight seconds. The creator's powered speed follows that same timed ability;
an exported skin-only animation preview may loop until another action is chosen.
These timings and eligibility rules describe this example, not all future actions.

## Produce and inspect artwork

Use the production export command from workflow.md. Export affected clips for
appearances whose base geometry/colors remain compatible; render the whole
appearance if a shape change also changes its other clips. Respect the normal
manifest dimensions, padding and ground anchor.

Inspect native artwork for the changed form, representative headings and return
to its base appearance. Where requested and permitted, review action entry,
movement, exit/interruption and reduced-motion behavior. Distinguish art export
from running-app verification, and follow AGENTS.md restrictions on agents,
tests, checks, builds and browser use. Do not claim verification that was not run.

## Jetpack example and shared playback

The astronaut uses temporary outboard thrusters/fuel lines from jetpack-parts.ts.
The shared ActionPlayback in actor-rig/action-playback.ts resolves takeoff, hover
and landing, independently of movement and raw action expiry. Both runtime and
creator consume its presentation action and stage elapsed time. Do not snap to
idle or discard effects when the selected action ends before a landing finishes.

The three clips are jetpack_takeoff (10/20 fps), jetpack (16/12 fps) and
jetpack_land (12/20 fps). Derive transition lengths from their definitions, keep
functional transitions progressing under reduced motion, and use native clip
timing for flight even in synchronized comparison mode. The example reaction
runs eight seconds plus landing; preview ends through Land or replacement.

Flames stay in the shared pixel effect layer. Rotate their engine offsets with
the heading and match the rendered body's lift; reduce thrust during landing.
The physical actor retains normal navigation/collision, and saved equipment is
not overwritten. The canonical default rescuer and personal characters share
the same renderer/lifecycle; legacy bindings also preserve action/effect state
during movement. Export new body clips without baking the effects into them.

## Implemented behavior source map

- `src/game/abilities/definitions.json`: shared speeds, durations and cooldowns.
- `src/game/abilities/state.ts`: local/preview lifetimes, separate local storage
  cooldowns, server room snapshots and non-stacking movement profiles.
- `src/game/abilities/appearance.ts`: equipped appearance and fallback heading.
- `backend/housing/abilities.py`: row-locked activation with durable ability_state,
  eligibility checks, cooldowns and integrated movement budget. Migration 0012
  adds the state to PlayerGameProfile.
- `src/components/game/shared/ability-status.tsx`: shared status, remaining time,
  cooldown and cancel controls; reaction/creator choices expose the same state.

Goku uses 231 px/s for eight seconds, with a 12 s cooldown. Other Power up looks
remain cosmetic. Speeds replace the baseline while active and restore to normal
walk/held sprint afterward. Run and powered-run pose use measured travel for stride
and preserve opposing arm/leg swing. Preview motion is quarter game speed for
the bounded comparison lane, retaining relative speed differences. Keep room
speed changes server-owned; never solve a correction by raising the global cap.
