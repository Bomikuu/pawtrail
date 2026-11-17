# Furniture conversion — Batch 1

The owner explicitly accepted the shown Table, Side Table and Bookshelf reference angles and requested creation of these three models. Their existing catalog IDs are now authored 3D furniture. The original PNG fronts remain unchanged and authoritative.

| Item | Installed revision | Structure |
| --- | --- | --- |
| Table (`table`) | `4e917d0781de` | Chamfered top, deep continuous apron, lower molding and four short feet |
| Side Table (`side-table`) | `290c80d6dd7f` | Rounded square top, four straight legs, cross rails and one inset lower shelf |
| Bookshelf (`bookshelf`) | `78c316434804` | Cornice, side uprights, inset timber rear, three shelves, 24 individual book volumes and four feet |

Each item has a source GLB, four native facings and Honey oak/Walnut/Pale oak material styles. There are 24 native PNGs per item, 72 total, including foreground layers. These are static props; no duplicate ambient animation frames are manufactured. Current native frame and anchor are 96×112 and (48,96). Styles reuse their item's geometry.

## References and review

The built-in `image_gen` tool generated the reference sheets. Exact prompts, unchanged tool masters, canonical source hashes, selected revisions, native imports and the owner's response are saved per item:

- [Table sheet](</home/micxsz/Documents/ChatGPT/pawtrail/assets/furniture-studio/references/table/turnaround-v2.png>) and [provenance/prompts](</home/micxsz/Documents/ChatGPT/pawtrail/assets/furniture-studio/references/table/reference-set.json>).
- [Side Table sheet](</home/micxsz/Documents/ChatGPT/pawtrail/assets/furniture-studio/references/side-table/turnaround-v1.png>) and [provenance/prompts](</home/micxsz/Documents/ChatGPT/pawtrail/assets/furniture-studio/references/side-table/reference-set.json>).
- [Bookshelf sheet](</home/micxsz/Documents/ChatGPT/pawtrail/assets/furniture-studio/references/bookshelf/turnaround-v1.png>) and [provenance/prompts](</home/micxsz/Documents/ChatGPT/pawtrail/assets/furniture-studio/references/bookshelf/reference-set.json>).

The original front takes precedence where generated proportions differ, especially the low table's deeper apron. Raw sheets include a semi-transparent halo; native imports isolate opaque furniture and retain a transparent background. Import uses a common scale across each sheet. Generated profiles are approximate drawings, so documented profile pitches of 5°/15°/2° match Table/Side Table/Bookshelf, with a smooth absolute-sine blend. Geometry remains coherent through all views; the shared actor camera remains native. No exact all-angle reconstruction is claimed.

## Geometry, painting and contacts

`reference-timber.ts` builds distinct closed structural parts for each item. Canonical painting is mapped to front faces; reviewed side/rear paint finishes the hidden structure. Horizontal wood maps are separate to avoid stretching the source projection across tabletops. Books retain painted spines, wrapped cover colors and page surfaces. Texture styles preserve the book colors. `references/batch-01.json` stores palette-indexed source/hidden-face maps, dimensions, cameras and the accepted reference views. The furniture texture editor exposes these actual material maps.

Collision uses the same centered model footprint as rotation. Each facing has four native interaction approach points with 14 pixels of clearance beyond the projected ground bounds. The primary approach follows the furniture's front. The Table and Side Table retain `perch-1` cat surfaces, now projected from their real tops; none of these pieces declares a human seat. Existing prices, categories, zones, interaction labels and construction rules are preserved. Conversion does not introduce free recipes or mutate inventory, balances or saved placement records.

Native manifests include actual opaque `visibleBounds`. Client and server placement fitting use those bounds when present, so empty padding in a larger native frame does not invalidate small furniture near room boundaries. Existing items without this metadata retain their previous behavior.

## Authoring evidence and installation

Isolated Firefox art production exported and inspected the four facings and 45°/135° views, plus the actual shared rescuer standing nearby. The first render pass exposed stretched tabletop grain and over-bright page faces; the final material pass corrected those mappings and softened the cornice radii. Native evidence is saved in `output/furniture/2026-11-10-01/`, with references above actual model renders. Source GLBs and full manifests are under `assets/furniture-studio/exports/<id>/`.

The latest finish adds the character-matched one-pixel brown contour and physical structural joins, with painted interior colors preserved. The safe approaches remain unchanged. See `furniture-outlines-and-batches-2026-11-10.md` for the rendering policy and batch commands. Only the three catalog records/assets and required furniture/placement helpers were mirrored to the main app. Existing actor sources and unrelated worktree edits were retained.

The local housing service was not listening on port 8001 when the catalog reload was attempted. No stopped service was started; the installed backend catalog will load at its next startup. No authenticated gameplay actions, application/browser verification, automated tests/checks, or application builds were run. These results establish authored/exported art and source integration, not verified live care, navigation or account transactions.

Open the editor with `?preview=furniture&asset=table`, `asset=side-table` or `asset=bookshelf`. Setup and comparison use the matching original/generated reference for each supported facing.

## Remaining work

There are six authored models among 110 catalog IDs. This batch converted three of the initial 107 remaining IDs. Under the owner's later interaction-first scope, **27 interactive IDs await 3D conversion, 20 remain on the interactive 2D route and 57 sprites are deferred**. Existing models remain installed. See `assets/furniture-studio/batches/interaction-plan.json` and `docs/superpowers/plans/2026-11-10-interactive-furniture-queue.md`. Planned or retained sprites are not counted as converted models.
