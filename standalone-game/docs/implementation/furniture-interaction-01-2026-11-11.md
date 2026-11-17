# Interactive furniture — Chair, Armchair and Dining Chair

The owner accepted the generated angles for these three items. All three are now
authored 3D sources with native game views, one human seat, their existing cat
perch, physical collision, colors and the shared above-item rotation control.
Original front PNGs, catalog IDs, prices and construction rules are preserved.

| Item | Installed revision | Colors |
| --- | --- | --- |
| Chair | `05ea6280e31e` | Honey oak, Walnut, Pale oak |
| Armchair | `fb75522f53bc` | Sage, Terracotta, Cream |
| Dining Chair | `88c0b6360bee` | Honey oak, Walnut, Pale oak; sage seat retained |

Each item has four 96×112 native facings anchored at (48,96), with base/foreground
layers per color (24 native PNGs), source GLB, 45°/135° review renders, standing
and seated actor images, and a single-seat fit report. There are 72 native game
PNGs in this batch. Source models are in `assets/furniture-studio/exports/<id>/`.

## References and modeling

Built-in Imagegen produced a six-view sheet per distinct shape, using each native
source as canonical. The wooden chairs received a targeted second generation
for proportions and the dining-chair slat count. Raw masters and prompts remain
under `assets/furniture-studio/references/<id>/`; transparent native imports
remove the raw semi-transparent brown halo without replacing the original art.
`output/furniture/interaction-01/reference-review.png` shows originals and angles.

The configured review window first resolved under the owner's no-response
default; the later explicit “Good enough — build these three” is recorded as
affirmative approval. Original front proportions take precedence over the taller
generated Dining Chair. The authored wooden chairs are slightly larger than the
original small sprites for readable native actor clearance.

`reference-chairs.ts` builds actual frame/leg/seat/cushion volumes. The wood Chair
has one lower back opening. Dining Chair has two interior splats and three gaps,
a shaped crest and sage seat. Armchair has a rounded single back, rolled arms,
one separate seat and one angled cream floral pillow. Canonical material patches
preserve native paint; generated side/rear upholstery supplies hidden faces.
Filtered material maps prevent the pillow motif from leaking onto the armchair
side panels. The final color pass also removes surrounding sage cloth from the pillow patch itself, keeping cream pillows clean in Terracotta/Cream styles. Upholstery shadow colors also follow the selected palette rather than retaining mid-dark sage. Thin brown contours and restrained structural edges match the actors.

The 8° profile camera calibration blends into the normal front/rear camera.
Actors retain their native projection and unit scale; projected pelvis docking
aligns them with the same seat sockets used by the game. Surface, collision,
approach, foreground and rotation share the furniture pivot. Four approach points
sit 14 native pixels outside the projected ground bounds. The seat is human;
the retained perch is cat-only, not a second human seat.

## Actor connection and batch workflow

Single-seat previews now enable seat 1 while disabling seat 2/Both seats. The
previous controls only enabled sitting for the couch; setup and comparison now
use the registered seat count. Shared rig/actor sources were not changed.

Canonical batch previews include seated/standing evidence and the single-seat
fit report, while skipping other colors, ambient sequences and GLB. Final export
uses one Firefox/Vite session for all three items and retains all colors/evidence.
The existing batch review script reads each export's own reference manifest,
instead of assuming every new model belongs to the original timber batch.

Four breathing-phase samples use the actual shared rescuer at scale (1,1,1).
Armchair minimum clearances are approximately 2.01 units to the pillow, 2.90
units at the arms and 1.85 units of pelvis-front seat support. Wooden-chair pelvis
side allowance is 6.20 units and seat support allowance is 3.85 units. Feet clear
the floor; the shared sitting pose has not been retargeted to plant the feet.
These are authoring measurements, not authenticated gameplay verification.

## Installation, scope and remaining work

Only selected definitions/catalog/generated records, required furniture helpers,
preview controls and new versioned assets/reference imports were mirrored to
`/home/micxsz/projects/pawtrail/.worktrees/implementation`. Unrelated actor/social
work was retained. A source-reviewed ASI boundary in the main app's existing
curtain material assignment was made explicit without remodeling the curtain.
No stopped service was started, accounts generated, placements mutated or balances
changed. Backend catalog files were updated; a running service must load them
before newly authored geometry is used in live transactions.

All facings, quarter views and native actor compositions were inspected as art
artifacts. No automated application tests/checks/builds or live browser/game
verification were run. Generated hidden geometry/cameras remain interpretations;
no exact all-angle pixel match or authenticated sitting/rotation claim is made.

The Furniture skill now explicitly separates state from representation: candles,
lamps, bowl fill levels and watering visuals remain 2D unless there is a separate
physical-view/actor-fit reason for a mesh. State-only groups were moved out of the
3D queue; no candle-state gameplay/art implementation was added in this batch.

Current queue totals: nine authored model IDs, 24 pending interactive 3D IDs,
20 interactive 2D IDs and 57 deferred sprites. The next 3D batch is Wooden Door
(`interaction-03`). This delivery completes only the approved three-chair batch.

Open `/play?preview=furniture&asset=chair` (or `armchair`, `dining-chair`), then use
the setup/comparison links for colors, native seat preview and rotation controls.
