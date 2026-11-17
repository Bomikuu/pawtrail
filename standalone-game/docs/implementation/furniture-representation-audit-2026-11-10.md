# Furniture representation audit

Historical representation audit: the owner subsequently limited new 3D work to meaningful interactions. The current queue is `assets/furniture-studio/batches/interaction-plan.json` and the execution plan is `docs/superpowers/plans/2026-11-10-interactive-furniture-queue.md`. The broader counts below describe the earlier recommendation.

Reviewed the catalog's 110 IDs, native sprite artwork and current action/geometry
metadata before scheduling more models. This records authoring decisions; it does
not modify game assets, interactions, saved placements or catalog prices.

| Route | Catalog IDs | Work remaining |
| --- | ---: | --- |
| Already authored 3D | 6 | Preserve existing models |
| Retain native 2D | 16 | Separate sprite/facing/interaction review batches |
| Planned hybrid 3D | 6 | Structural mesh with sprite foliage/effects |
| Planned volumetric 3D | 82 | Coherent volume and supported facings |

There are now **88 IDs on the pending 3D route**, including six hybrid items.
The other 16 remain deliberate 2D tasks. They have not been counted as completed
3D conversions. The previous 104-item remaining count included both groups.

## Retain these 16 as 2D

| Group | IDs | Why |
| --- | --- | --- |
| Floor coverings | `decorative-rug`, `small-rug`, `woven-area-rug`, `woven-runner` | Flat ground artwork; floor-plane rotation is sufficient |
| Wall art and fixtures | `wall-clock`, `painting`, `picture-frame`, `decorative-lights`, `bamboo-window` | Fixed wall-facing graphics; light states can be sprite layers |
| Soft foliage | `garden-bush` | Native sprite plus sway/contact sensor can provide its behavior |
| Small toys | `yarn-ball`, `feather-wand`, `toy-mouse` | Small fixed-facing props; use state/motion frames where needed |
| Small props | `rubber-ball`, `fish-plush-toy`, `grooming-brush` | Mesh detail adds little at native scale for their current role |

These decisions assume deliberate supported facings. Turning a standing sprite
on screen does not create its side or back. If future play needs visible turning,
author sprite facings or promote that prop to hybrid/3D. Static bamboo-window
art does not implement an opening or passage. Keep existing collision/actions
independent of representation: remaining 2D does not mean nonblocking or inert.

Sprite batches still review outlines, alpha, anchors, facing support and actual
state/contact requirements. Do not double-outline already finished source art.
Existing runtime layer or interaction behavior has not been verified in this audit.

## Use hybrid construction for these six

- `small-indoor-plant`, `large-indoor-plant`, `flower-pot`, `garden-pot`:
  simple solid pot/base with layered or crossed sprite foliage/flowers.
- `garden-banana`: simple trunk/base with sprite leaves.
- `candles`: 3D bodies/wicks with sprite flames; fire does not need a mesh.

These remain 3D tasks requiring reviewed turnaround references. Their structure
must have real depth; the whole object must not become a front-image billboard.
Pot collision and leaf sway should have separate contracts. Existing plant
actions need review: small/large indoor plants currently declare `toggle_door`,
which is not evidence of a working plant interaction.

## Keep volume where it matters

Seats, beds, tables, cabinets, bowls, cat structures, tunnels and carriers retain
their 3D route. Source-painted surfaces and illustrated secondary details remain
valid; volumetric does not mean sculpting every decorative pixel.

The source mirror has a standing frame and feet. Blankets and the towel are
folded with visible thickness. Wall shelves project outward and have supports.
Those items remain on the 3D route despite names that might suggest flat art.

Candidate shared families are recorded for sofa colors, food/water fill states,
blanket colors and east/west loveseat facings. These can reduce distinct shape
work after matching the actual references; no reuse has been counted as another
completed model.

## Batch records and review scope

`assets/furniture-studio/batches/representation-plan.json` records every ID's
route, rationale and batch. `conversion-queue.json` preserves installed batch
history, routes retained sprites out of pending model batches and adds five
separate 2D review groups. Empty former model batches are marked `routed_to_2d`.
The next 3D batch remains Sofa, Armchair and Floor Lamp.

Source contact sheets are under
`output/furniture/representation-audit-2026-11-10/catalog-{1,2,3}.png` and were
inspected at integer nearest-neighbor scale. The existing Furniture skill now
requires representation triage before angle generation or modeling. No new
angles/models were generated; no application tests, checks, builds or browser
verification were run.
