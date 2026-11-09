# Compact reference couch and shared actor fit

The owner requested narrower proportions, rounded paired back cushions and angled pillows closer to the original 2D couch, plus another visual review and actor clearance. Work is limited to the couch and its authoring/fit preview.

The front opaque silhouette is now **60×47** pixels, compared with **58×47** for the original and **76×56** for the preceding wide model. The transparent production cell remains 96×112. Individually extruded rounded shoulders and a shallow dark centre join replace shallow-bevel box backs. Upholstery/piping highlights, visible tufts, narrow rolled arms and outward-angled rectangular floral pillows retain the identifying reference details. Pillows were moved in depth with the seat contacts after visual review revealed that their top corners were intersecting the back cushion face.

The couch-only root scale is (0.875, 0.8, 1). Named local sockets are (±12, 14.6, 16.1), so returned physical contacts are (±10.5, 11.68, 16.1). Ground rectangles and top height receive the same transform once; projected contacts, foreground layers and collision are regenerated for every style and facing. Shared actors remain unscaled. The native Sit pose is docked using its existing 5.8-unit hip offset. This does not change the shared action library.

The creator and comparison now have **Both seats**, using a second instance of the actual shared actor rig and current creator appearance. The exporter saves each seat and both-seat previews for 0/90/180/270, plus a source `seat-fit.json`. Four breathing phases of the exported rescuer measure **2.68** world units from the outer arm bounds, a minimum **2.30** from the pillow bounds and **5.80** between the two actors. These are visible mesh bounds including the current clothing/hair; they do not guarantee clearance for every oversized accessory. The existing short-leg Sit pose leaves feet hanging above the floor; actor geometry/pose was not stretched to disguise it.

Firefox review used the real creator at 1280×900: empty reference/current, each seat individually, both seats together and all four facings via the above-item rotation button. The final revision was reloaded and the empty/both-seat/front/left/back/right views captured again after the last material adjustment. No renderer error state appeared; rotation captions matched. Source native proofs were also inspected at integer nearest-neighbor zoom. This is furniture creator/art review, not an authenticated home placement, seat reservation or backend concurrency test. No build or unrelated automated suite was run.

Evidence in `output/playwright/`:

- `couch-proportions-fit.png`: reference/new silhouette, individual seats and both-seat front/side native proof.
- `couch-final-empty.png`, `couch-final-seat-1.png`, `couch-final-seat-2.png`.
- `couch-final-both-front.png`, `couch-final-both-90.png`, `couch-final-both-180.png`, `couch-final-both-270.png`.

Installed revision: **43d2aaa523fb**. All three couch styles, four facings, GLB source and matching foreground/contact metadata were regenerated. The matching couch entry was merged into each frontend/backend catalog and the main app registry without replacing other items. Only the relevant furniture modules/components/assets were mirrored to the main app; unrelated actor/social work was preserved. The housing service was reloaded with its existing environment to load the current couch geometry. No accounts, balances, fixtures or inventory grants were created. The furniture skill now documents the compact transform, unscaled actors, both-seat preview and fit report.
