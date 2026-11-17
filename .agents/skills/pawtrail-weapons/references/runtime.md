# PawTrail weapon integration

These are repository-relative paths. Locate the active standalone game or
integrated app before editing; the integrated app prefixes game sources with
`src/features/neighborhood/game` and components with
`src/features/neighborhood/components/game`. Follow the workspace's scoped
installation policy and preserve unrelated social-worktree changes.

## Source contracts

- `src/game/items/document.ts`: version-1 `ItemDocument`, parts/UV textures,
  hand attachment, optional back carry, validated actions/events/areas, local
  library, export/import and four portable ability icons.
- `items/equipment.ts`: prepare texture data before creating a renderer; mount
  weapon geometry after refined factories finish so it is not archived as an
  obsolete body mesh. `equippedFactory` composes shared body poses and the item.
- `items/motion.ts`: pose interpolation and item-local rotation. Preserve joint
  names and use existing masks. `referenceStance` supplies the authored weapon
  clip's neutral stance; regular idle retains planted-foot breathing.
- `items/runtime.ts`, `presentation.ts`, `spatial.ts`: actual cooldowns, combo
  windows, releases, hit windows, projectiles, impacts and training hit areas.
  Do not make visible blade size authoritative for an area or collider.
- `items/scene.ts`: rotatable authoring viewport; enlarge its render bounds for
  an oversized companion without changing native pixel density.
- `items/preview.ts`, `stage-editor/playtest.ts`: rehearsal uses actual movement,
  collisions and equipped factories. `PixelActor` can measure equipped bounds
  and preserve alpha for spectral appearances; keep its bounded frame cache.
- `components/game/item-studio`: official shadcn controls, dropdown, geometry,
  attachment, action/effect/area editors, Try hotbar and local saves. Reuse
  `ItemAbilityIcon` for the generated icons and cooldown presentation, and
  `ItemAbilityTooltip` for hover/focus descriptions, bindings, cooldowns and
  movement restrictions. Disabled buttons keep a focusable tooltip trigger.
  Ability hovers use `shared/GameTooltipContent` (file `game-tooltip.tsx`),
  reusing `dialogue-frame.ts` and the approved dialogue-v2 panel texture.
  Keep the compact parchment/wood frame and brown text. The official Tooltip
  source has an optional `showArrow` prop, default true; game framing sets it
  false to avoid the stock dark arrow. Other tooltip consumers keep their default.

Every new weapon also has a separate equipment-selection image in `weaponIcon`,
not just its per-action `icons`. Both use the same square native PNG validation
(16–128 px, default 64 px) and portable embedded data. Reuse
`shared/weapon-icon.tsx` for compact selection/equipped/library thumbnails. The
chain and scythe built-in ID map also supplies display fallbacks for older saved
items without this field; it does not rewrite their customizations. Preset
factories embed the actual equipment icon into new save/export packages.

Each new `ItemAction` includes an authored `description` (up to 600 characters).
The version-1 reader validates/preserves it through local saves and JSON exports.
Legacy items without it receive a factual mechanics-based display fallback from
`itemActionDescription`; that fallback does not replace writing proper new
descriptions. The Actions panel edits descriptions using the official Textarea.

## Ultimate illustration presentation

`StagePlaytest.useItem` starts `items/ultimate-cut-in.ts` only after an accepted
special cast. It uses an instance-specific source plus the real cast ID, so
duplicate updates and failed/busy/cooldown input do not replay the presentation.
Reset, item changes, cancellation/completion and disposal clear or end it.
`seekItem` remains silent and does not show an illustration.

`shared/UltimateCutIn` (file `ultimate-cut-in.tsx`) is mounted in Item Studio's
live viewport and Stage editor play mode. It reuses `IllustrationPreview` in
`cutin` mode and `creator/illustration-assets.ts` for the existing authored
frames. The four-entry asset cache/preload is shared with normal illustration
previews. Current matching illustration mappings are Amber and Yae; future
characters need their own catalogue entry, not a fallback to someone else's art.
Presentation is about 900 ms plus a short exit, on the left, click-through and
independent of game time; reduced motion shows still art without sliding.

## Equipment and native art

Use `WristRight` / `WristLeft`; idle back carry uses `SpineBend`. Document grip,
pivot, tip and carry transforms. Current portable documents allow 24 parts,
PNG textures at most 128×128 native, and a 2 MB total local document. Four
square ability icons are embedded PNGs 16–128 px; use 64 px unless another
destination requires more. Keep generated texture maps nearest-neighbor with
no mipmaps. Store compact assets in the project and retain source provenance;
do not leave a project reference pointing only into generated_images or temp.

An optional `stance` stores a name, validated upper-body joint angles and
walking/running carry blend weights. `items/stance.ts` keeps the base breathing
and planted legs; the extra pose is scoped to idle/walk/run, not all actions.
Use it when the equipped silhouette needs another grip/ready pose. The Equip
panel exposes moving carry strength. Preserve the distinct stance in action
start/recovery frames and in local save/export/import.

`equipment.paired` adds a second hand mount with its own position, rotation and
optional mirroring. It shares source mesh geometry/materials/UV edits rather
than generating a second independent skin. The authoring renderer and live
factory both sync it; include both copies in native render bounds. Neither
model size nor paired visuals change player colliders. The crescent primitive
is actual thin extruded curved geometry with native UVs and editable vertices.

`spectral-pilot.ts`, `spectral-guardian.ts`, `spectral-art.ts` and the generated
native art show the current companion path. The optional guardian config
contains kind, scale, opacity and local offset. Its visual mesh is a dedicated
rig outside the editable player's skeleton, with its own ground shadow,
hovering talismans, energy movement, sword pivots and coordinated strikes.
New kinds need explicit geometry/animation and validated data; a string does
not automatically create an arbitrary companion. Preserve data-only imports.

## Skill slots

| Slot | Default key | Delivery |
| --- | --- | --- |
| primary | J | Regular skill 1; optional combo2/combo3 follow-ups |
| running | R | Regular skill 2; moving/advancing attack where appropriate |
| extend | L | Regular skill 3; reach, projectile or utility behavior |
| special | K | Ultimate with its own cooldown and recovery |

Name skills from the actual weapon concept. Every skill must execute a real
controller action; an icon, decorative ghost pose or trail does not implement
hits or projectiles. Specify duration, cooldown, windup, active end, pose mask,
keyframes, item rotation, movement lock/root motion, hit windows, area,
projectile behavior and sound/effect events. Spectral follow-up hit windows
must line up with guardian motion, not just the player's first swing.

Use the existing sound mixer and silent timeline scrubbing. Reuse current
mechanics where suitable rather than adding a separate combat/game loop.
Abilities and generated artwork remain local rehearsal unless online/platform
integration was explicitly requested and implemented.
