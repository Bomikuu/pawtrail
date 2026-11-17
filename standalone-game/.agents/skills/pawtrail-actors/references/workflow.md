# PawTrail production workflow

## Locate the project

Work in the standalone game containing `src/game/actor-rig/rigs.ts`
and `assets/actor-appearances/catalog.json`. The current workspace is
`/home/micxsz/Documents/ChatGPT/pawtrail`. Its running social worktree is separate:
`/home/micxsz/projects/pawtrail/.worktrees/implementation`. Follow the project's
scoped integration guide rather than copying the entire game into that tree.

## Appearance catalogue

Before authoring a new actor, apply [production efficiency](production-efficiency.md):
reuse the selected style's working exporter, check the first portrait sheet and
native icon early, then check face/eye/fringe fit at the start of the final model
stage. Keep the full review below; early checks do not replace it.

For every new actor, the standard delivery is reference/working name →
normal + enraged attack-pose animated illustrations → illustration feedback
(continue without a reply under the owner's rule) → explicit portrait-style choice with Amber examples →
dialogue portrait → compact three-quarter icon derived from the illustration → finalized
story profile and six personality-led voiced cues → gameplay model → actor-preview
installation → complete action/voice review. Read
[identity and voice](identity-and-voice.md) for naming, fictional biography,
speech tone and reference-window constraints. Use
[voice production](voice-production.md) for a distinct saved speaker per actor,
six-cue export, preview action/portrait wiring and the CPU low-memory repair.
Voice files must be registered and playable in the actor preview; scripts or
unbound recordings alone do not complete that stage. Honor an explicit request
to omit voices or audition before producing the full pack.
Default the illustration to **Refined cel + painterly**: new Sieghart's mature
painted detail/material depth combined with old Sieg's pixel texture, cel-shadow
structure and semi-bold stepped silhouette outlines. Use both references. The
normal illustration also supplies the icon's design/style; keep the icon at
three-quarter even if a matching static view or dedicated small drawing is needed.
Recommend Refined cel for the separately chosen portrait; retain
Painterly anime fantasy as another named portrait option. Ask at the portrait
stage unless explicitly answered for this job. See
[style choice and examples](../../pawtrail-portraits/references/style-choice.md).
Portrait and icon default to three-quarter; alternate angles remain selectable.
The illustration's normal/enraged loops must pass anchored natural-motion review;
the owner rejected Sieghart v2's motion, so its old report is not an approved
motion template. See the illustration companion's current motion contract.
Build the gameplay model last among the asset stages, using the approved animated
illustration as its primary geometry/material reference. Generate static matching
turnaround views only where needed to resolve side/back construction. Keep the
original identity reference available, and compare the actual model with the
illustration and these views before acceptance.
Keep its shared skeleton, motions and world scale; the artwork guides the look
rather than becoming a replacement for the articulated body.
Use the three linked companion skills in the actor skill; the native body export
command does not generate the illustrated portrait, icon or loading artwork.
Do not call a new actor complete after its spritesheet alone. In particular,
create the illustration first, bind it to the same actor
in the preview and return its `art=illustration` URL. Follow
[the illustration preview binding](../../pawtrail-illustrations/references/motion-and-export.md#actor-preview-binding).
Preserve explicit narrower requests and existing approved assets.

The actor illustration now includes separate animated actor, context background
and aura layers, composed through shared preview infrastructure. Keep the source
layers even if a destination needs a stitched derivative. Follow
[feedback and layered effects](feedback-and-effects.md) for layer metadata,
click/open feedback, regular and item-specific combat VFX, foot magic circles
and dedicated centered boss-enrage portraits when relevant to the request.

Add an entry to `assets/actor-appearances/catalog.json`:

```json
{
  "id": "rowan-rescuer",
  "name": "Rowan",
  "kind": "rescuer",
  "status": "preview",
  "description": "Copper-red hair, glasses and a green jacket.",
  "reference": {
    "file": "/pawtrail-game/actor-studio/references/classic-rpg-style.webp",
    "role": "style",
    "source": "User-provided RPG sprite reference",
    "brief": "Red hair, glasses and green jacket requested by the owner."
  },
  "colors": {"hair": "#b85d3f", "jacket": "#4f7350"},
  "accessories": {"glasses": true}
}
```

IDs are lowercase letters, digits and hyphens/underscores. `kind` is `rescuer`
or `orange-tabby`; status is `preview` or `live`. Read the approved palette at the
top of rigs.ts for supported color roles and supply shadow/highlight roles
together. Keep source images under assets/actor-appearances/references. Set a
public reference.file URL only for artwork the owner intends to display in the
preview. Personal source photos can stay private and be compared through the
page's local reference picker; record a reference.privateFile for authoring.
For a cat recolor, use orange (base fur), furLight (highlights), stripe and cream/creamShadow.
Keep kibble at its approved food color when changing clothing or fur.
For human geometry slots, read [modular geometry](geometry.md). Other shapes or
coat markings need deliberate rig/texture work.

## Commands

From the game root:

```bash
node scripts/pawtrail-actors.mjs render --id rowan-rescuer
node scripts/pawtrail-actors.mjs render --id rowan-rescuer --actions idle,walk
node scripts/pawtrail-actors.mjs render --ids rowan-spiky,rowan-ranger,rowan-hood
node scripts/pawtrail-actors.mjs render --all --actions walk
```

The first command exports a complete new appearance. The second updates just
the selected source frames and repacks its sheet; earlier complete exports must
exist for other clips. The third propagates a shared walk change to all entries
in the catalogue, including live entries: use it for an authorized shared update,
not merely to preview a new skin. No automated project checks are part of these
commands. The private authoring server and its Firefox session are closed on exit.

Catalogue colors are inputs to the same model/pose functions; never copy the
animation functions into a new per-skin file. The export includes source GLB,
native frames, finished spritesheet, portrait thumbnail and a manifest. A content
hash versions asset URLs and texture keys. Preview exports update only
`src/game/runtime/actor-previews.json`; live entries update their existing
`baked-actors.json` record. The character picker list is separate. Promotion and
new roster entries require the user's requested game integration work.

## Source map

- `src/game/actor-rig/rigs.ts`: shared rigs, poses, palette and accessories.
- `src/game/actor-rig/appearance-parts.ts`: modular hair, headwear, clothing and equipped props.
- `src/game/actor-rig/angel-parts.ts`: articulated long hair, continuous gown and feathered wings.
- `src/game/actor-rig/costume-parts.ts`: hero hair, martial-arts gi, spacesuit, helmet and life-support pack.
- `src/game/actor-rig/part-kit.ts`: shared geometry/material construction helpers.
- `assets/animation-approval-v1/source/export.ts`: fixed cameras and appearance export.
- `scripts/render-animation-approval.mjs`: isolated authoring export endpoints.
- `scripts/pixel_actor_art.py`: shared native pixel finishing.
- `scripts/finish-actor-appearance.py`: manifest-driven per-appearance packing.
- `scripts/pawtrail-actors.mjs`: Firefox export, finishing and registry installation.
- `src/game/runtime/actor-previews.ts`: preview metadata and sheets.
- `src/game/runtime/actor-comparison-scene.ts`: shared preview/comparison field.
- `src/components/game/actor-preview-reference.tsx`: image reference and appearance brief.

Default frames are 32×48 for the rescuer and 32×32 for the cat, with ground
pixels (16,44) and (16,28). Extra transparent padding can accommodate geometry;
preserve world scale and use the new manifest anchor. Animation counts/rates come from actions.json. Native
images stay transparent and nearest-filtered. Props/effects are shared runtime
layers, not redrawn into every appearance's body sheet. Matching picker portraits
are sprite thumbnails; a large dialogue illustration is a separate asset task.
That distinction does not make the companion artwork optional in full new-actor
creation: dialogue portrait, icon and animated illustration are separate assets
within the same default delivery.

## Repacking existing native exports

`node scripts/pawtrail-actors.mjs pack --id ID` finishes and installs an existing
matching export without opening Firefox or regenerating its source frames. The
packer keeps whole clips horizontal and packs them by length inside 4096-pixel
texture limits. Use this for a packing-only recovery; changed geometry or frames
still need the appropriate render operation.
