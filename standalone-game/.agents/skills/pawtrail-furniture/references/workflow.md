# PawTrail furniture production

These modeling and render commands apply to the chosen **3D + 2D** route. Ask for the representation first when unspecified. For **2D sprites**, follow [the sprite workflow](sprite-workflow.md) and do not run model export commands.

## Source map

The current game root is `/home/micxsz/Documents/ChatGPT/pawtrail`. The main
social app is a separate worktree at
`/home/micxsz/projects/pawtrail/.worktrees/implementation`.

- `src/game/furniture/definitions.json`: source references, styles, price and
  optional construction recipe. Trail couch is the first registered definition.
- `src/game/furniture/model.ts` and `couch.ts`: model dispatch/geometry, material parts, seat sockets,
  foreground groups, fixed camera and projected contact geometry.
- `src/game/furniture/renderer.ts`: native rendering with the shared actor
  `PixelFinish`; source-painted furniture uses `pixel-outline.ts` to retain its colors
  with the same one-pixel contour. Actor seating uses `createRescuer().pose('sit')`.
- `assets/furniture-studio/export.ts`: isolated authoring export entry point.
- `scripts/pawtrail-furniture.mjs`: Firefox production render and optional catalog install.
- `assets/furniture-studio/exports/<id>/`: source GLB and export manifest.
- `public/pawtrail-game/furniture-studio/<id>/<revision>/`: versioned native
  images, foreground layers and provenance manifest.
- `src/game/furniture/generated.json`: version-2 registry of exported item manifests.
- `src/components/game/furniture-editor.tsx` and `furniture-editor-workspace.ts`: catalog-wide local texture editor, native painting/history and item/style drafts at `?preview=furniture`.
- `src/game/furniture-studio/{catalog,textures,scene}.ts`: actual asset/model lookup, bounded PNG packages and local material/orbit/UV rendering. Read `docs/implementation/furniture-texture-editor.md` for the save format and source-only verification scope.
- `src/components/game/furniture-studio.tsx`: setup at `?preview=furniture-setup`, colors, four facings,
  Sit/Stand demonstration and local authoring recipe settings.
- `src/components/game/furniture-comparison.tsx`: original/current couch
  comparison and playable contact field. Read [environment contacts](environment-contacts.md)
  when authoring collision, reactive props or status/tool-driven floor changes.
- `src/game/housing/{geometry,spatial,room-art,scene}.ts`: live resolution,
  navigation, texture choice, foreground layering and placement indicator.
- `backend/housing/{geometry,spatial,interactions}.py`: matching server geometry
  and transactional actor seat leases.
- `backend/housing/construction.py`: costs, recipes, readiness and once-only
  collection; `FurnitureBuild` stores the server-owned job.

## Start from the reference

For Request furniture and substantial conversions/remodels, generate and review a coherent multi-angle reference set before modeling; read [the turnaround workflow](furniture-turnarounds.md). Inspect the reference with an image viewer. Record the actual
source in the definition. For the pilot it is
`/assets/game/housing/furniture/sofa-housing-v1.png`: sage upholstery, two scalloped back cushions, rolled arms, two cream pillows with orange flowers, and a timber base. Preserve the
visual hierarchy at native resolution; small decorative details must survive
the pixel finish. Unknown rear surfaces need an authored interpretation, not a
claim that the reference supplied them.

For another shape, add a constructor and projection/sockets for that shape,
then register it in the renderer/export entry and creator selection. The current registry has couch, curtain and aquarium constructors plus individual Table, Side Table and Bookshelf structures in `reference-timber.ts`; it does not generate other shapes merely by changing an ID. Keep piece-specific geometry separate from
shared rendering and lifecycle mechanics.

## Geometry and actors

Trail couch uses a 96×112 transparent cell with floor anchor (48,96), a native
world scale shared with the actors, and facings 0/90/180/270: Front/Left/Back/Right.
The source front camera is orthographic. Couch profiles use a documented 12° calibration to match the generated references; actors keep their native camera and projected pelvis docking. Camera metadata, images and contacts must agree. Pixel display stays nearest-filtered
at integer zoom. Use generated dimensions and anchors, not these pilot values,
when rendering another item.

The couch uses the multi-angle-guided volumetric model in `couch.ts`, with unscaled seat nodes at x=±9.3, y=10.4, z=6. Geometry and contacts share the same centered pivot. Native reference anchor (32,55) aligns the unchanged original front with that pivot; keep the game anchor (48,96). Actors remain at their shared native scale; never shrink them to hide a fit problem. The shared
actor's current sit pose places its hip about 5.8 world units above its root;
the preview docks that hip to the seat. The generated game geometry expresses
the corresponding projected root/elevation, and the server chooses the
available seat. If the actor sit contract or furniture dimensions change,
regenerate contacts rather than keeping a copied pixel offset.

Each `renderedViews[rotation]` contains width, height, anchor, footprint,
indicatorHeight and full geometry v2. Geometry has ground and placement
rectangles, reachable approaches, seat IDs/points/facing/elevation/exit and
actions. These are already projected for that facing: `furnitureAt` and the
server `definition` resolver choose them before navigation and interaction.
They are not rotated a second time in 2D. Seat facing is relative to the base
front; the server applies the placement's quarter-turn and the render path
passes that facing to local and remote actors.

Native foreground images share their base image's bounds and anchor. The new couch keeps its front skirt behind the actor feet; front/near arms provide foreground coverage. The backrest
occludes them when viewed from behind. Keep the sprite and foreground depth
relationship aligned with the seat pose's `groundY`.

## Styles and construction

`styles` in the authoring definition contains named fabric/light/shade/pillow/
wood colors. Actual geometry can add silhouette changes where a reference needs
them. The exporter writes each style/facing and its foreground. Live placements
carry an optional allowlisted `style`; the inventory item ID stays unchanged.
Old placements without style use the default.

An optional `construction` has `seconds` and a materials array of
`{id,label,amount,price}`. Price is the game supply-shop unit price. Source
definitions are trusted authoring inputs; browser drafts are not server rules.
Use integer nonnegative seconds, positive bounded amounts and consistent prices
for the same material ID across items. Instant purchase uses the existing
catalog price. Timed building pays that price; recipe building consumes the
listed materials. Both complete at the server's ready time and require collection.
The pilot recipe is 6 timber, 4 fabric and 2 stuffing with 60 seconds build time.

Construction mutations run inside the existing locked, idempotent game action
transaction. Validate the complete cost before deducting it. Claim the build
under a row lock, check readiness and record collection together with the
inventory increment. Do not let client time, displayed progress or repeated
requests grant items. Material purchasing uses the existing game supplies store.
Do not create verified Kibble, real charges or free balances to make a recipe pass.

The creator's Save design/Export buttons produce device-local authoring data.
When applying an exported JSON, inspect its item, style and construction fields,
update the source definition deliberately, then regenerate. Keep unrelated
definitions and installed items intact.

## Production commands

From the game root:

```bash
node scripts/pawtrail-furniture.mjs render --id studio-couch
node scripts/pawtrail-furniture.mjs render --id studio-couch --install
node scripts/pawtrail-furniture.mjs render --ids table,side-table,bookshelf --preview
node scripts/pawtrail-furniture.mjs render --ids table,side-table,bookshelf --install
```

The first renders an authoring preview and versioned assets. `--install` also
updates only the matching item in the frontend/backend catalogs. It does not
place furniture in player homes or grant ownership. Use installation when the
request authorizes adding/updating that game item. The script opens a private
Firefox authoring session on port 5184 and closes it and Vite on completion.
`--ids` keeps that session open for the selected batch. `--preview` writes only
the canonical material's four facings and two review angles under
`assets/furniture-studio/previews/`; it skips other materials, ambient motion and
GLB, and never replaces installed assets or catalogs. Seating previews include
canonical seated/fit evidence; single-seat models also include standing views.
Nonseating previews skip actor evidence.
Use [batch mode](batches.md) for the review queue, caching boundaries and final
export pass. The CLI renders every supplied ID; it does not automatically detect
unchanged dependencies or provide a contacts-only operation.

Rendering produces all configured style/facing pairs and a GLB. Keep the native
views and contact metadata together. Remove abandoned outputs from the current
work only; do not delete versions still referenced by a live catalog or saved
design. Open the creator at `http://127.0.0.1:3000/play?preview=furniture` when
the user has authorized browser viewing; otherwise provide the link.

## Scoped main-app integration

The main app uses `src/features/neighborhood/`. Mirror only changed furniture
modules/components and versioned furniture assets, rewriting `@/game/` and
`@/components/game/` imports to the neighborhood prefixes. Patch existing large
files in place; do not run the blanket game sync script over unrelated actor,
map or social work. Merge the single catalog item into each destination catalog.
Preserve the official shared `src/components/ui` registry layer.

New construction database models need their committed migration applied to the
actual housing environment. Reuse the running service's environment without
printing secrets, skip automatic checks when workspace instructions require it,
then reload the housing service. No schema operation or art export implies a
test, build or browser-verification pass. State the actual review scope.

## Model fidelity and native animation

`model-kit.ts` shares mesh/material ownership; `model.ts` dispatches the authored models. Definitions include the original image frame/anchor so comparison preserves its scale rather than stretching it. Keep distinctive reference details (the couch's paired floral pillows and plump backs); a generic sofa with similar colors is insufficient.

The creator and comparison select all registered models and show an above-object circular rotate button. Render each using the same fixed 96×112 camera frame. Models have slightly larger physical silhouettes and explicit projected ground/contact geometry. Existing item IDs and player inventory stay intact.

Run the production command with `--id curtain-passage` or `--id aquarium` as well as `--id studio-couch`. `generated.json` is now a version-2 registry with an `items` array of per-item manifests. Native style/view entries contain `motion` file/foreground pairs. Curtain frames sample nine signed cloth deflections; aquarium frames sample nine fish phases. Runtime selects those authored frames, including the correct facing; do not add a legacy 2D overlay on top of them. Native sensors come from the view's `reaction` metadata. GLBs contain named cloth/fish/model parts; code owns their animation and the pixel frame export.

## Material depth

The material kit owns nearest-filtered procedural fabric grain, timber grain and a cyan-to-deep-teal water ramp. Textures are embedded in the GLB and disposed with the furniture; colors are registered in the furniture pixel palette. The kit applies stronger top/front/side/underside vertex values than the old near-flat shade bands. Contact/welt meshes still supply real internal separations; a global outer contour cannot make adjoining green parts readable on its own.

Match the original's relative height and width before polishing textures. The corrected couch has taller rounded-rectangle backs, explicit dark seat/arm/skirt boundaries, paired outlined flower embroidery and exposed honey-colored feet. Its seat sockets derive the same hip position as the actual Sit pose. Inspect timber feet and plant colors after rendering: an outer shadow mesh can hide a foot face, and a glass layer can wash out plants.

## Compact couch and seating allowance

The original Sage front and generated six-angle reference set guide a shared volumetric couch. `prepare-couch-reference.py` derives original component layers; `prepare-couch-turnaround.py` imports generated side/rear references and material patches. Real closed arms, thick rounded backs and a continuous rear panel replace the previous front-ray relief. The reference sheet, prompts and review manifest are saved in `assets/furniture-studio/references/studio-couch/`. See [reference fidelity](reference-fidelity.md).

Keep geometry, named contacts and root pivot aligned exactly once. Regenerate style/facing images, foregrounds, camera metadata and catalogs together. The comparison switches to the matching original/generated reference for each facing. Painted furniture, native-finished actors and foregrounds use separate composition layers. No exact pixel identity is claimed for this multi-angle model.

The creator and comparison include **Both seats** alongside each individual seat. They instantiate a second shared rescuer rig, with the same appearance and Sit pose; do not replace actors with mock silhouettes. The exporter saves `seated-<angle>.png` (seat 1), `seated-<angle>-2.png` (seat 2), `seated-<angle>-both.png`, plus `seat-fit.json` in the source export folder. `PixelFurniture.seatFit()` measures visible actor/clothing bounds through four breathing phases against the actual arm and pillow bounds, and records spacing between both actors. These measurements describe the exported shared rescuer, not every oversized costume. Inspect the user's current creator appearance visually in both seats and rotated views when requested. Leave clearance for pillows/breathing and avoid hiding intersections by changing actor scale or rendering the actor over every foreground.

## Source-painted aquarium with reviewed angles

Read [reference fidelity](reference-fidelity.md) before another conversion. The aquarium uses `aquarium.ts` with a centered closed beveled hood, source-painted cabinet, generated side/rear materials and two animated illustrated fish. `references/aquarium.json` stores source layers and landmarks; `references/aquarium-turnaround.json` stores the approved sheet, matching references, material patches and explicit camera calibration. The original front's four compartments override the generated two-door front. The prior exact front-only match belongs to the superseded model, not this multi-angle revision.

```bash
python3 scripts/prepare-aquarium-reference.py
python3 scripts/prepare-aquarium-turnaround.py
node scripts/pawtrail-furniture.mjs render --id aquarium --install
python3 scripts/review-aquarium-turnaround.py
```

These are authorized art-production commands, not a standing exception to workspace execution limits. Read the current camera metadata: source anchor (48,60), centered pivot, 8° profile pitch blended by sin(yaw)^2, separate native actor camera. The creator selects the corresponding original/generated reference for each quarter turn. The model rotates structurally; illustrated fish/plant layers are not fully sculpted contents. Preserve native colors and keep nearby actors on their shared finisher.

## Current couch authoring commands

```bash
python3 scripts/prepare-couch-reference.py
python3 scripts/prepare-couch-turnaround.py
node scripts/pawtrail-furniture.mjs render --id studio-couch --install
python3 scripts/review-couch-turnaround.py
```

`seat-fit.json` includes arm/pillow/inter-actor clearances and actual pelvis-to-seat-front allowance across four breathing phases. Read the current export rather than carrying forward old dimensions or fit values. These are not a guarantee for every oversized costume. The original-front reference preview uses generated contacts and source arm masks. The export also saves 45°/135° authoring views for depth/corner review; live placements retain four quarter turns.


## Creator lifecycle

Canvas ResizeObservers capture the observed element rather than reading a mutable ref in a queued callback. Stop callbacks and disconnect during cleanup; navigation can detach the ref before a pending resize fires. Keep creator/comparison/field switching usable while reviewing rotations and actor contacts.

When mirroring scoped furniture changes to a worktree with a different statement style, preserve automatic-semicolon-insertion boundaries. A line starting with a parenthesized type assertion can become a call on the preceding expression after blind semicolon removal. Prefer a named, directly typed mesh/material assignment. Keep constructor failures observable in development diagnostics.

## Furniture texture editor boundary

The texture editor lists the actual housing catalog. Only definitions registered with a shape constructor have 3D model views; keep remaining items as clearly identified native 2D sprites until modeled through Request furniture. Styles reuse an item's geometry. Preserve source UVs, dimensions and sampler transforms when painting. Convert RGBA DataTexture pixels into a CanvasTexture with a canvas source; cloning the DataTexture class itself retains an incompatible image.data upload path. Shared maps remain shared among their model parts. Local PNG packages do not install textures or change game inventory/recipes automatically.

## Reviewed catalog batches

The first catalog conversion batch adds `table`, `side-table` and `bookshelf` as distinct source-painted structural models in `reference-timber.ts`, with palette-indexed source/hidden-face paint in `references/batch-01.json`. `references/turnarounds.ts` is the shared camera/reference lookup; do not hardcode only couch and aquarium into new previews. The tracker is `assets/furniture-studio/batches/conversion-queue.json`; 104 original 2D catalog IDs remain after Batch 1. Read the live queue instead of assuming the entire catalog is modeled.

Use `prepare-furniture-batch-references.py --batch <id>` to import six-view reference proposals, `prepare-furniture-batch-models.py` for the current first-batch measured data, and `review-furniture-batch.py --batch <id>` for native authoring boards. These scripts do not constitute an automatic conversion of arbitrary catalog entries. References must be shown and their review resolved first. Preserve untouched masters and prompt provenance.

Keep horizontal wood UVs independent from a front projection; a source-painted roof can stretch badly when rotated. Wrap book covers around their real volumes and reserve pale page paint for pages. Explicit shallow profile camera calibration must be mirrored in the derived reference anchors and native geometry. Safe actor approach clearance is measured in projected game pixels when the profile pitch compresses floor depth. Carry forward original cat-perch IDs on actual tops, and preserve existing prices/categories/zones/interactions/construction when replacing a catalog sprite. Publishing an empty authoring recipe would create an unintended free craft.

Native manifests now carry opaque `visibleBounds`; client/server placement fitting uses those bounds when present, while native frame dimensions/anchors stay authoritative. Empty frame padding is not occupied artwork. Export motion frames only for genuinely animated props, and label no-seat actor evidence as standing rather than seated.
