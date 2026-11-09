# Cat creation and shared feline rig

The dedicated reusable skill is `~/.codex/skills/pawtrail-cats/SKILL.md`.
Use `$pawtrail-cats` with a reference or description; it reuses the same cat
skeleton, native export pipeline, soundboard and shadows as the game.

`/play?preview=cats` opens the live cat creator in the character creator's shared
layout. Choose breed, coat, fur length, tail/motion, hats, boots, collars, wings
and colors; draft edits render immediately through the canonical cat rig. The
left column is the approved orange tabby, and the right is the editable cat.
Only the right column plays sound. All 33 shared feline actions are available;
wing flight requires wings. Walk/run animate in place as well as during input.

Appearance catalogue entries use `kind: orange-tabby` for the shared skeleton
and a separate `cat` object validated against `actor-rig/cat-contract.json`.
Breed controls anatomy/defaults; pattern, fur, tail, tail motion, hat, boots,
wings and collar can be selected independently. `cat-parts.ts` builds textured
markings and accessory geometry; `createCat` retains shared joints and poses.
Tabbies have forehead M/cheek/flank/dorsal markings and ringed tails. Persians
have rounder flatter faces, ruffs/cheek fluff and plume tails. Siamese have slim
bodies, taller ears, blue eyes and dark face/extremities. Bobtails shorten real
tail geometry. Maine Coon and additional pattern presets are also supported.

Added shared run, yarn roll, jump, pounce, knead, tail chase, tail swish, sniff,
shake and wing-hover clips. Jump/pounce have anticipation and landing; their
ground shadows use the same height envelope. The existing original soundboard
provides contextual feline phrases through abortable playback, with restrained
foley and existing master/effects/mute/range controls. Yarn and shadow layers
remain separate from body sheets. Movement does not clear action state.

These clips provide presentation on the current navigation plane. They do not
grant object traversal, change actual animal welfare, identify real animals or
award Kibble. Real furniture traversal continues to use the surface planner.

The existing orange_tabby is re-exported into its live record. It and the four
new preview cats use padded 64×64 native frames, versioned
URLs and authoritative manifests. The production command remains
`node scripts/pawtrail-actors.mjs render --id ID`. Morphology is part of the
appearance signature; shape changes require full exports, while compatible pose
updates can use `--actions`. Shared changes reach baked cats after export.

Names and configurations can be saved to a 24-cat device library or private
account library. The editor supports edit, duplicate, delete and JSON backup/
import, with dirty-state and conflict feedback. Account records use the actual
PlayerCatAppearance model and authenticated `api/homes/cat-appearances` endpoint;
migration 0014 adds that separate table. These are cosmetic appearance records,
not actual animals, fixtures, home pets, real-world identification references or
verified care/rewards. Saving does not automatically spawn/publish a cat.

`cat-creator/{appearance,state,library}.ts` owns the strict versioned DTO, drafts
and persistence. `actor-rig/cat-pixel-renderer.ts` samples createCat directly with
the production camera/PixelFinish and a bounded native frame cache. Existing
combinations require no image export; shared rig changes appear live in personal
cats. Baked catalogue PNGs still require the normal production re-export.

No automated checks, tests, builds or running-app browser verification were run.
The isolated Firefox production renderer is used only to create requested art.

## Face detail and denser live rendering

The personal creator now samples 160×160 pixels over an 80×80 world window,
using density 2 and a half-scale sprite to preserve world proportions. The shared
pixel finisher keeps a two-native-pixel contour, equivalent to the original bold
world outline. Props and shadows compensate for density and body size. The native
anchor is (80,104); the live cache remains capped at 96 frames.

Body sizes are kitten (.85), standard (1.15) and large (1.4). Face markings
include mustache, split mustache, tuxedo blaze/muzzle and freckles. Independent
irises, nose and marking colors use a separate top-level face object, avoiding
changes to the human palette schema. Match both eyes supports matching eyes or
heterochromia. Inspect face centers one cat at a closer integer zoom; Full body
restores the comparison. Existing action/sound/shadow presentation is reused.
No room collision dimensions change.

Version-1 saves without the new fields load with backward-compatible defaults.
Client and API validate the extended configuration. The existing JSON database
column stores these fields without a migration. Previously exported catalogue
PNGs retain their earlier render; these changes appear immediately in personal
creator cats, not by modifying old PNGs in place. Source review only; no automated
checks, tests, builds or running-app browser verification were performed.
