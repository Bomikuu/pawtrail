# Monster and boss presentation contract

Apply these owner requirements to new creature packages and the affected part of
a focused revision. Updating a skill does not regenerate existing bosses, install
an encounter or authorize runtime verification. Keep fictional combat distinct
from real community animals, identification evidence and verified rewards.

## Responsive interactions and normal combat

Opening creature details, encounter controls or a selection needs a brief,
context-appropriate reveal/effect; actionable clicks need visible press/release
feedback. Support keyboard/touch and reduced motion. An immediate click response
acknowledges input, while loading/success/failure must reflect the actual outcome.
Disabled, rejected and cooling-down actions must not play successful attacks.

Provide effects for normal hits and regular skills as well as special attacks.
Relevant slashes use flashy **animated 2D pixel art**: a directional arc/trail,
short bright accents, follow-through and a separate confirmed-contact burst.
Use transparent frame/atlas assets with explicit native dimensions, anchors,
timing and nearest-neighbor sampling. A static arc, floor ring, tint or damage
number alone is insufficient. Reuse approved VFX or generate missing artwork.

Cast/swing effects follow an accepted action and its active part or weapon
socket. Impact flashes and damage numbers follow confirmed contact at the
affected player/creature. Distinguish weak-point hits, armor, blocks, parries,
immunity and misses. Special equipment can supply distinct trails, cast or hit
effects; keep that ownership in the item/weapon controller instead of duplicating
it in each boss. Cleanup on interruption, unequip, defeat, reset and scene exit.
Use restrained screen effects and bounded transient instances.

## Separate illustration, environment and aura

Deliver independently reusable assets for the animated creature illustration,
its context background and its aura. Match the creature's habitat, personality,
story and selected pixel style. Animate appropriate background details and keep
the creature's authored breathing/neck/jaw/armor motion distinct from scenery.
The character remains a complete transparent actor layer; do not simulate cloth
or anatomy by warping an already finished combined picture.

Keep rear/front aura layers separate where depth requires it. A normal aura and
an enraged aura can differ, but they must be bound to the correct encounter state.
Preserve face, silhouette, attack cues and weak-point readability. Aura animation
is not itself an attack area or proof that enrage mechanics are active.

Record common composition coordinates, per-layer native size/offset, anchors,
motion bounds, depth, frame/loop timing, posters, source provenance and runtime
bytes. Preview the layers alone and combined using shared playback. Keep the
separate originals and composition manifest even if a destination needs a
stitched derivative. Never label a flattened loop as independently layered.
Preserve explicit budgets; account for the complete served composition separately
from the dialogue portrait budget.

## Foot-level magic circles

For a highlighted actor/boss or applicable ability, provide a character-matched
magic/sigil circle as a separate ground-plane layer beneath the feet/root.
Use native pixel glyphs with an appropriate pulse/rotation and a steady reduced-
motion version. The circle follows the ground position during movement/flight;
it does not rise with the body or replace the shadow.

Selection/highlight circles must remain distinguishable from damaging telegraphs,
safe zones and interaction ranges. For a wall-anchored boss, fit the highlight to
its actual structural/ground anchor rather than inventing feet or covering the
playable arena with a misleading hazard. Clear it when no longer relevant.

## Dedicated centered enrage portrait

Boss enrage includes its own dramatic portrait/bust with deliberate expression,
pose and phase-specific details. Preserve identity and style. Use a purpose-fit
crop of approved **enraged** artwork if suitable; otherwise author the missing
asset. The normal portrait with a tint, shake or generic angry icon is not an
accepted substitute. Keep the dedicated portrait binding separate from the
existing enraged full-body illustration and gameplay visual state.

On the actual HP/phase transition, briefly present the special portrait at the
center of the screen with a matching entrance/exit effect and appropriate sound.
Trigger once per real entry into enrage, never once per hit or illustration loop.
Define duration, input/pause behavior and how critical telegraphs remain readable.
Restore the normal HUD/portrait afterward; clear the cut-in on interruption,
defeat, reset and scene exit. A labeled preview can rehearse this sequence but
does not prove a live phase transition or reward occurred.

Retain the skill's existing mechanical enrage contract: explicit threshold,
changed attack pattern, readable telegraphs and consistent damage areas. The
special portrait/aura announces that state; cosmetic playback does not implement
the state or establish that mechanics were reviewed.

## Acceptance

Record art generation, preview binding, permitted visual review and gameplay
installation separately. When review is authorized, inspect normal and enraged
layers, centered cut-in entry/return, click/open feedback, regular/special hit
effects, circle placement, reduced motion and cleanup. Verify the once-per-phase
trigger and reset using real local/server encounter state. Leave unavailable
artwork or unobserved behavior pending; a default portrait is not a silent pass.
