# Boss families implementation plan

**Goal:** Extend the four existing boss families with one larger mini-boss and
three smaller normal mobs each, using the existing artwork-first creature and
playable arena workflow. Implement directly, without agents or automated tests,
checks or builds. Firefox review and screenshots are requested for this scope.

**Design:** Preserve the existing four boss controllers, rigs and assets. Add a
data-driven family catalogue, native authored sprite poses, a shared subordinate
encounter controller and exact attack-area rendering. Each selected creature
uses the existing Amber model, sword, movement, accepted damage/contact feedback,
pause/reset and scene lifecycle. Only one creature arena is active at a time.
The family selector links the boss, its mini-boss and its three mobs. New family
members are local combat previews, not persistent world spawns or server rewards.

**Roster:**

| Family | Mini-boss | Normal mobs |
| --- | --- | --- |
| Vaelrith | Gloamwarden, a two-headed rift drake | Riftling, Shardback, Ashwing |
| Kaedros | Cindervane, a juvenile two-headed hydra | Ember Whelp, Cinder Imp, Coalback |
| Morvane | Ribwarden, an armored ossuary crawler | Bone Crawler, Skull Skitter, Grave Adder |
| Vesper | Bellwarden, a hovering chapel reaper | Lantern Wisp, Huskling, Sickle Shade |

Mini-bosses have two named skills, recovery weaknesses and a distinct 30%-HP
enraged state. Normal mobs have one readable attack each and no automatic boss
enrage. Mini-boss body heights are approximately 2.2–2.7 player heights; normal
mobs are approximately 0.75–1.15. The actual Amber scale remains unchanged.

## Implementation

- [x] Update the local and installed monster skill: full boss creation includes
  exactly one related mini-boss and three distinct mobs; focused revisions retain
  existing family members. Add family-specific authoring and acceptance guidance.
- [x] Generate four family sprite sheets from the respective approved boss art.
  Each has five registered poses per member, with another row for the mini-boss's
  enraged form. Preserve alpha, prompts and masters. Export portraits, icons,
  illustrations, native manifests and runtime atlases without replacing boss art.
- [x] Add the catalogue with profiles, HP, scale, movement, weaknesses and skill
  timing/area definitions. Keep mini-boss and ordinary-mob tiers explicit.
- [x] Implement subordinate movement, warning/contact/recovery, accepted hits,
  enrage, defeat and reset; bind authored frames and exact area meshes.
- [x] Extend the existing arena loader and preview with an optional creature
  selection, plus family navigation on all four boss pages.
- [x] Review the sixteen selected rigs, representative normal/mini combat,
  phase/reset and existing boss navigation in Firefox. Record only observed
  outcomes, screenshot paths, asset sizes and remaining unverified cases.

## Main review risks

Generated atlas cells must retain complete silhouettes and stable registration.
The mini-boss must be larger through its real world size, not a smaller Amber.
Telegraph geometry must use the same area data as hit detection. No hit effects
may claim unaccepted damage. Family changes must dispose the prior scene and
must not affect the original boss encounters or unrelated work.
