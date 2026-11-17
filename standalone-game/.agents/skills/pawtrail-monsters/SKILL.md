---
name: pawtrail-monsters
description: Create reference-guided PawTrail monsters and bosses with matching artwork, models, encounters and related mini-boss/mob families. Use for roaming enemies, multi-headed creatures and wall-anchored bosses; not player appearances, equipment or real community animals.
---

# PawTrail Monsters

Read the current workspace's `AGENTS.md`. Preserve its permissions for agents,
generation, tests, builds and browser review. A request to create/update this
skill does not itself authorize generating a monster or changing live gameplay.
Keep fictional combat separate from real animal records and verified rewards.

## Visible interaction feedback — owner requirement

Every interactive result in this skill's scope must visibly register: show pending
work when needed, then the actual success, failure or changed state. Existing
clear state changes may suffice; do not add a toast for every animation frame.
Use real outcome events, never a cosmetic effect or a console log as evidence of
success. For fictional combat, confirmed contact must play an actual animated
impact sprite on the affected enemy/player: e.g. a slash flash, spark burst or
elemental impact. Damage numbers, HP changes, tint and floor rings supplement
that sprite; they do not replace it. Distinguish weak points and incoming damage
where useful, and keep blocked/miss/cooldown cues separate from successful hits.
Reuse suitable approved transparent VFX atlases; generate missing raster effects
with the available image-generation workflow. Preserve native frames, anchors
and nearest-neighbor playback; bind contact to accepted outcomes, not casts.
Artwork-only and noncombat work do not gain new combat scope from this rule.

Boss/player hits, area damage, armor, exposed weaknesses, phase/stagger and defeat/reset must be readable at the affected target and in the HUD.

Reuse the existing event/feedback layer, pool or bound transient indicators, and
clean them up on reset/exit. Preserve contrast and useful reduced-motion feedback;
sound or color alone is insufficient. Keep local receipts distinct from confirmed
server saves/rewards. Review feedback under current verification permissions and
leave unobserved runtime behavior pending.

Follow [boss feedback and layered effects](references/feedback-and-effects.md)
for tactile click/open responses, flashy animated 2D slashes, normal/skill/item
contact effects, foot-level magic circles, independently animated creature /
context-background / aura layers, and dedicated centered enrage portraits.
Preserve the reusable layer assets even when a destination needs a stitched
composition. These are presentation requirements alongside real encounter state.

## Select the operation

- **Full new monster/boss:** follow the artwork-first sequence below.
- **Profile/stat design:** deliver the biography and encounter/stat document;
  do not silently generate art, create a model or install an encounter.
- **Focused art, anatomy, attack or balance revision:** preserve the identity
  and approved assets; rerun only the stages affected by the change.
- **Game installation:** add a monster to a real encounter only when requested.
  A preview/catalog entry is not a live spawn or authoritative online reward.

Carry forward the selected style and representation. Ask only when an unresolved
choice blocks the task. If `50x` is ambiguous, clarify **health-bar stacks, HP
multiplier or visual size**; they are separate parameters. Do not multiply all
three. Read [profiles and health](references/profile-and-health.md) for the
biography fields, mechanical weaknesses and stacked-bar arithmetic.

## Choose the representation

If not already chosen, ask whether the creature should use **native 2D sprites /
layered cutouts**, **3D rendered to 2D**, or **live 3D**. Recommend a representation
from the required camera, attacks and art direction; carry an explicit choice
forward without asking again. Fixed-view wall bosses are good candidates for
layered 2D; freely orbiting creatures need live 3D or sufficient authored views.
Interactions, HP, collision and weaknesses do not require a 3D creature base.

For native 2D or a 2D comparison, read [2D creatures and comparisons](references/2d-creatures.md).
Use the existing profile and encounter rules when comparing representations;
keep presentation separate from damage/state authority. A generated head sliding
around is not a finished attack animation. Author anticipation, active contact,
recovery, follow-through and hurt/defeat responses for the visible parts.

## Full creation: reference → artwork → profile → creature → encounter

1. **Inspect the reference and establish identity.** Preserve a supplied name;
   otherwise propose a fitting name and stable ID without another naming gate.
   Record silhouette, anatomy, head/limb count, colors, material divisions,
   attachment, movement and a provisional origin/temperament. Separate visible
   evidence from invented lore or mechanics. Use the selected PawTrail pixel
   style and an actual player-height comparison. Ignore reference logos/text.

2. **Create the matching portrait.** Use `$pawtrail-portraits` when available,
   adapting it to the creature's anatomy. Include only expressions it can perform
   and the encounter needs: e.g. dormant, alert, threatening, hurt or staggered.
   Preserve identity across heads; do not force a dragon into a human face rig.
   For a boss, also bind a dedicated dramatic enraged portrait/bust for the
   centered phase-change cut-in. The normal portrait with only a tint is not
   sufficient; reuse an appropriate crop of approved enraged art when it fits.

3. **Create its compact icon.** Use `$pawtrail-character-icons` with a readable
   crop of the actual monster silhouette. For several heads, compose a legible
   group or its defining head; do not substitute unrelated animal artwork.

4. **Create a matching animated illustration.** Use `$pawtrail-illustrations`
   for authored breathing, visible head/neck/armor follow-through and jaw/throat
   movement. Default to naturally paced resting motion, commonly a 4–6-second
   cycle, with restrained movement and eased holds. The owner rejected rapid
   1.4–1.6-second illustration loops. Additional drawings smooth the movement;
   they do not require a faster or busier performance. Preserve liked facial
   art on timing repairs; do not repeat pictures faster or move the whole
   illustration. Idle artwork timing stays separate from encounter attacks and
   damage timing. Preserve the selected view and stationary structural
   anchor. This is part of a
   full new creation, as with actors. Keep readable subject boundaries and alpha
   in exported foregrounds; put arena scenery in its own layer. Reuse approved
   artwork during focused revisions. Show newly generated art for the applicable
   owner review before dependent modeling; no silence rule is assumed here.

   Keep the animated creature, character-context background and aura as separate
   assets with shared composition coordinates and explicit depth/timing. Preview
   them alone and together; retain their sources/manifest if stitching a derived
   export. Follow the layered-effects reference for style, size accounting and
   independent playback.

5. **Finalize the monster profile and encounter stats.** Use the brief, reference
   and artwork to author the name/title, description, bio, origin, temperament,
   motivation, habitat, threat role, weaknesses and resistances. Define HP,
   attacks, phases, cooldowns, hit areas, stun/death/reset behavior and any reward
   eligibility. Lore alone does not implement a weakness. Read the health reference.
   Include up to six appropriate short sound/voice cues for a full package: e.g.
   awakening, warning, attack, hurt, phase change and defeat. Non-speaking monsters
   use creature sounds; do not force six human dialogue lines or copy source audio.
   Use available authorized audio tooling and record missing cues as pending.

6. **Build the selected gameplay representation after its artwork.** Native
   2D uses authored frame sequences or registered head/neck/jaw/body cutouts with
   explicit pivots, layer order and state poses. Follow the 2D reference above;
   do not require a hidden 3D creature merely for interaction. For 3D modes, use
   real volume, layered geometry, painted texture skin and coherent promised
   angles; 3D-to-2D also needs native sprite exports. Reuse shared rendering,
   materials, pixel finishing and playback. Author a creature-specific hierarchy
   instead of stretching the rescuer rig. Retain editable artwork or geometry,
   native manifests, anchors, bounds and provenance. Read
   [giant and wall bosses](references/giant-and-wall-bosses.md) for anchored designs.

7. **Create the boss's related encounter family.** Full new boss creation also
   includes one mini-boss and three distinct normal mobs. Follow the same
   artwork/profile/model/animation/encounter process for each member; read
   [boss families](references/boss-families.md). A focused boss revision preserves
   existing members and does not silently rebuild every family.

8. **Install the authored package in an actual preview.** Bind the model, profile,
   normal/enraged portraits, icon, layered illustration/background/aura,
   available cues, stats and defined actions to the
   same stable monster ID. Reuse the current authoring/stage infrastructure and
   the actual player/weapon rigs for scale and interaction. Read
   [integration and acceptance](references/integration-and-acceptance.md) before
   promising an editor, route, exporter or runtime capability. A poster-only tab
   does not demonstrate an encounter; no monster-specific command is assumed to
   exist merely because this skill documents a workflow.

9. **Review applicable actions and the encounter.** Include idle, the authored
   attacks' preparation/active/recovery, hit/stagger responses, defeat/reset and
   any defined phase changes. Roaming monsters also need their movement set;
   anchored bosses do not need meaningless walking clips. Inspect visible angles,
   true scale, textures, effects, shadows, sound timing, HP display, weaknesses,
   damage windows, cancellation and cleanup under the existing review permissions.
   Record art, installation and actual runtime review separately. Supply only
   preview URLs/controls that were really implemented.

## Low-health enrage — boss requirement

For a new boss, author an explicit low-HP enraged phase. Keep the threshold in
encounter data and trigger it once from the authoritative local/server HP state,
as appropriate. Do not trigger it from a health-bar animation. Reuse an existing
boss's approved phase design when revising unrelated behavior.

- Generate a **distinct matching enraged illustration** and corresponding live
  visual state: preserve anatomy/identity while changing meaningful features
  such as cracked armor, raised spines, open wings or eyes. A tint alone is not
  the requested new illustration. Install both assets under the same boss ID.
- Change the actual attack pattern: greater AoE coverage or additional hazard
  areas, shorter attack cooldowns and any appropriate revised sequences. Store
  normal/enraged values explicitly. Preserve a readable warning and escape route;
  faster attacks must not become unavoidable hits.
- Share the exact AoE definitions between telegraphs and contact detection.
  Keep continuous fire bounded, use swept projectile contact, and define
  multi-hit cadence/invulnerability so one frame cannot apply a whole burst.
- Announce the confirmed phase with a brief **centered cut-in of the dedicated
  enraged portrait**, using its special expression/look and entrance/exit effect.
  Keep it separately bound from the normal portrait and enraged full-body art.
  Define duration, input/pause handling and telegraph readability; restore the
  normal HUD/portrait afterward. Trigger once per real phase entry, not per hit.
  Cancel incompatible old casts/projectiles, then resume the new pattern. Keep
  damage, contact sprites, phase events and cosmetic transitions separate.
- Reset restores HP, normal artwork/pattern, cooldowns and one-shot phase state.
  Pause/exit/defeat clear pending hazards and release assets/listeners.
- Under authorized verification, review normal and enraged behavior separately,
  including the threshold and reset. An explicitly labeled phase-rehearsal
  control may set real local preview HP, but cannot pretend a hit or reward
  occurred. Record which transitions were observed versus only implemented.

## Fast production without lost details

Read the relevant source/manifest once. Reuse suitable approved artwork, shaders,
rig helpers, controllers and preview tools. Author only missing visible views,
parts, attacks or changed stats; do not restart portrait/icon/voice generation
for a mechanical revision. A wall hiding the torso does not justify omitting its
visible neck volume, head articulation or exposed structural detail.

Keep creature-specific data separate from shared combat. Preserve the actual
player's scale and equipment. Never enlarge an existing sprite 50 times and call
it a detailed giant model, or shrink the player to disguise insufficient scale.
Reuse unchanged evidence only while its artifact and dependencies are unchanged.
Shared hit detection, HP, phase, rendering or lifecycle changes expand review to
affected encounters; an asset edit does not require unrelated mobile/app sweeps.

Deliver the monster ID/name, profile, health interpretation, scale/anchor, art and
presentation assets, moves/phases, real preview location, installation scope and exact
review status. Keep unavailable checks pending. Do not call the boss complete
after a biography, a generated picture or an untested model alone.
