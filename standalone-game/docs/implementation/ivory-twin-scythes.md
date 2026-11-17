# Ivory twin scythes

The owner supplied a dual-scythe image and requested a suitable weapon-specific
idle. The new Item Studio preset follows its long slim pale staffs, narrow ivory
crescent blades, bronze star collars, burgundy wraps and cyan gems. The generated
equipment-only front/side concept and native material/icon exports are installed
under `public/assets/game/items/twin-scythes/`; the manifest retains provenance,
native sizes, processing and review status. Gameplay attacks are original because
the supplied reference is a still image.

## Geometry and carrying

Twenty editable parts form one scythe. The blade is a thin extruded crescent
with a curved outline and front/side UVs; it is not a billboard. Staff segments,
star points, counterweight feathers, pommel, gems and rivets have actual geometry.
Generated ivory/bronze/leather/crystal material tiles are 64 px native PNGs,
nearest-neighbor filtered and embedded for portable item packages.

The other hand reuses the same mesh geometry and texture skin with its own
attachment transform. Editing a part, its vertices or skin updates both copies.
Low crescent guard carries the front staff lower and the other at a higher angle.
It changes upper-body grip and carry without replacing the actor rig, breathing
or fixed idle foot targets. Moving carries blend with the shared gait; unlocked
attacks retain walking/running legs. The animated idle resumes after actions.
Equip exposes second-hand transforms/mirroring and moving carry strength.

The optional `stance` and `equipment.paired` data are validated and retained in
local saves/imports/exports. Existing items can omit both and retain normal
behavior. The shared creator primitive list also exposes the new crescent shape.
Rendering bounds include both props without increasing the player collider.

## Skills

| Key | Skill |
| --- | --- |
| J | Crossing crescents; J follow-ups reverse and finish the sequence |
| R | Reaper's stride; a short collision-respecting advancing sweep |
| L | Moonlit crescent; a turquoise wave with explicit range and wall behavior |
| K | Harvest moon ultimate; two wider circular hit windows and a 5 s cooldown |

All four have generated transparent 64 px icons, authored hover descriptions,
cooldowns and real controller events. Existing wood/parchment ability tooltips,
sounds, stage rehearsal, save/export controls and item library are reused. The
other weapon presets remain selectable and retain current-session drafts.

The reusable PawTrail Weapons skill now explicitly chooses a suitable idle/grip
for each weapon when needed, preserving shared breathing/legs and returning to
that stance after actions. It does not force every weapon into a new pose.

Implementation and native source/art inspection only. No agents, automated
tests, checks, builds or browser/gameplay verification were run. Review of both
actors, angles, body/prop clearance, movement and all abilities remains pending.
The equipment is local rehearsal, not an online inventory or welfare-data change.

## Separate equipment icon

The twin scythes now include a generated transparent 64 px equipment icon
showing both complete staffs. It is separate from the four ability emblems,
uses the shared WeaponIcon selection/library component, and is embedded in new
local save/export packages. The item manifest records its source and bytes.
