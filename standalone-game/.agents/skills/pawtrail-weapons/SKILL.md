---
name: pawtrail-weapons
description: Create reference-guided PawTrail weapons with front/side concepts, textured 3D equipment, a weapon icon, three regular abilities and one ultimate, matching ability icons and an Item Studio rehearsal. Use for weapons, spectral companions and weapon movesets; not ordinary furniture or standalone character creation.
---

# PawTrail Weapons

Create an equipped weapon on the existing PawTrail base character, with real
geometry, painted 2D textures and a reusable ability document. Read the current
workspace's AGENTS.md and preserve its permissions for agents, generation,
automated checks and browser review. Do not change engines or replace the actor
rig to create a weapon.

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

Show accepted strikes and applied damage at their actual targets; acknowledge cooldowns, blocked attacks and genuine misses after projectiles finish. Never show hit numbers from a swing alone.

Reuse the existing event/feedback layer, pool or bound transient indicators, and
clean them up on reset/exit. Preserve contrast and useful reduced-motion feedback;
sound or color alone is insufficient. Keep local receipts distinct from confirmed
server saves/rewards. Review feedback under current verification permissions and
leave unobserved runtime behavior pending.

## Reference → concept → textured model → abilities

1. **Inspect the reference and base character.** Identify the grip, silhouette,
   front/side thickness, carried state, moving parts and effects. Separate
   observed behavior from inferred attacks. A rotation/idle video does not
   establish an attack moveset. Reuse an approved concept when suitable.

2. **Generate a quick front/side concept.** Use the imagegen skill for a simple,
   consistent two-view weapon sheet. Prioritize proportions, silhouette and
   attachment over ornament. Include a small base-character scale reference
   when useful. A companion weapon also needs its guardian's front/side shape.
   Do not spend a generation pass on a polished promotional painting. Inspect
   both views before making geometry; reconcile contradictions rather than
   inventing a different side view. Carry forward the approved pixel style.

3. **Build geometry and generate its 2D texture skin.** Use the base character's
   existing hand/back sockets. Real thickness, curved edges, protrusions and
   independent articulated parts require geometry, not pixels beyond the mesh.
   Generate only the needed material surfaces; use a compact atlas and
   nearest-neighbor native exports. Keep UVs editable in Item Studio and retain
   source/prompt/export provenance. Preserve the character's scale, shared
   animation rig and ground collision. Refer to [runtime integration](references/runtime.md).
   Choose an appropriate weapon-specific idle/readied stance when the grip,
   weight or silhouette needs one. A long scythe, paired equipment and a sword
   need not share the same arm pose. Keep shared breathing, planted-foot IK and
   natural leg movement; blend the carry into walking/running without letting
   the prop sweep through the face or ground. Store upper-body carry angles and
   movement blend weights in `stance`, not a changed base actor. Weapons that
   work with the normal idle can omit it. Return to the chosen stance after
   every action. Reuse geometry/skin for paired copies with separate hand mounts.

4. **Generate the weapon's own icon.** This is a separate equipment/inventory
   image, not one of its ability icons. Match the actual model, material colors
   and silhouette; show paired equipment together when that defines the item.
   Use a neutral readable arrangement with no attack trails, ultimate halo or
   character. Default to a transparent 64×64 native pixel PNG, displayed compactly
   at 24–48 px. Store it in `ItemDocument.weaponIcon`; show it through the shared
   `WeaponIcon` in weapon selection, the equipped header and saved inventory.
   Preserve it through local save/export/import and retain source provenance.
   Reuse an approved equipment icon when revising mechanics rather than
   generating a duplicate. Do not substitute an ability image for the weapon icon.

5. **Create three regular abilities and one ultimate.** Unless the owner gives
   another arrangement, use J/primary, R/running and L/extend for the three
   regular skills, K/special for the ultimate. Optional J combo continuations
   belong to the first skill. Give every skill a name, readable preparation,
   active hit/release, follow-through, recovery, cooldown, sound and explicit
   ground hit area. Coordinate the actor, weapon and any guardian. Define
   interruptions, movement permissions and restoration. Keep the ultimate
   visually stronger and mechanically bounded; do not merely enlarge an icon.
   On a successful ultimate cast, briefly show the selected character's matching
   animated illustration on the left through the shared `UltimateCutIn`.
   Reuse approved character art and the shared illustration playback/cache;
   do not regenerate character illustrations for every weapon. Keep it
   click-through, short (about one second), responsive and reduced-motion aware.
   Failed/cooldown attempts and silent timeline scrubbing do not trigger it.
   Trigger once per actual cast, then clear on finish/cancel, reset, character
   change and leaving the scene. Skip mismatched/missing character art rather
   than showing another character. Preserve the live gameplay underneath.
   Author a concise player-facing description for each skill and combo follow-up:
   explain what it does, its important effects and relevant movement or targeting
   restrictions. Match the implemented behavior; do not invent damage, status
   effects or rewards. Store it in the action's portable `description` field.

6. **Generate four matching skill icons.** One distinct icon per regular skill
   plus the ultimate, consistent with the weapon's shapes, colors and selected
   art style. Use chunky pixel clusters, transparent backgrounds and no text.
   Default to 64×64 native PNG displayed at 40–48 px. Make the ultimate
   identifiable with a stronger motif and a restrained gold accent. Preserve
   generated alpha, native size, source provenance and a compact file budget.
   Reuse suitable approved icons on focused revisions. Install the icons in
   the item document and Item Studio's action list/hotbar with real cooldown
   and active states, not an unused asset directory.
   Hovering or keyboard-focusing an ability shows its icon, name, description,
   key binding, cooldown and movement restriction through the shared shadcn
   tooltip. Keep the tooltip available during cooldown/disabled states and
   provide an editable description in the Actions panel. Do not rely only on
   the browser's native title attribute.
   Use the shared `GameTooltipContent` wood/parchment frame from the existing
   dialogue artwork, with compact dimensions and warm brown readable text.
   Reuse its native nine-slice border; do not introduce a generic black bubble,
   duplicate the frame image or enlarge it into a dialogue-sized panel.

7. **Rehearse and deliver.** Install the weapon in the Item Studio dropdown,
   retaining the other presets and local drafts. Include its concept, icon
   previews and guardian controls when relevant. Save/export/import must retain
   its appearance, weapon icon, carry stance, paired mounts, skill icons and descriptions.
   Try mode uses the existing stage movement,
   collision and ability controller. Save locally for Stage editor equipment;
   do not imply a global online inventory installation. Follow the current
   review permissions. When visual review is authorized, inspect idle, walking,
   front/side/three-quarter rotation, all four skills, return/cancel behavior,
   sounds, cooldowns and mechanical hit areas. Otherwise mark review pending;
   source implementation is not visual acceptance or a measured 90% match.

## Companion and effect rules

- A ghost, familiar or giant spectral swordsman is a separate visual rig,
  anchored behind the owner with independent idle/hover and coordinated arms.
  It is not part of the player's walking collider. Add real companion hit
  windows only where the ability definition requires them.
- Retain correct front/back depth while facing and moving. Fit the entire
  visual bounds without shrinking the base character or changing tile size.
- Preserve ghost alpha through pixel finishing. Aura, trails and projectiles
  must not become opaque rectangles or acquire unrelated collisions.
- Reuse the existing effects audio volume, unlock and lifecycle. Scrubbing is
  silent. Clearing/canceling a cast removes its temporary effects and behavior.
- Local training hits, target dummies and visual effects never award verified
  Kibble, affect real animals or mutate Django welfare records.

Deliver the skill/weapon names, preview location, controls, asset provenance,
scope of installation and actual review status. Avoid unrelated actor portrait,
icon or illustration regeneration for an equipment-only request.
