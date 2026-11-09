# Furniture reference fidelity and actual model rotations

The owner rejected the first generic couch interpretation and clarified that rotation means a clickable circular button above the furniture. This update replaces the pilot's silhouette, promotes the curtained opening and aquarium from legacy-art overlays to real authored 3D models, and slightly increases furniture size/detail.

## Delivered surfaces

The creator (`/play?preview=furniture`) and comparison (`/play?compare=furniture`) now select **Trail couch**, **Curtained opening** and **Little reef aquarium**. Each has its own original reference and four authored model facings. The original reference remains at its real size/anchor and front facing. Styling and actor seating remain available; seating is disabled for pieces without seats. Both pages use the current character creator appearance.

A circular clockwise action sits directly above the rendered current model. In live decoration, a screen-sized circular rotate action appears above the selected piece and placement ghost, including after placement. It invokes the existing authored-facing rotation command and leaves the normal save, keyboard R, validity and in-use furniture guards intact. Existing left/right toolbar actions remain keyboard-accessible alternatives. The owner explicitly requested circular rotation actions; this does not change the platform's other rounded-md buttons.

## Models and art

`model-kit.ts` owns shared mesh/material disposal and native shading; `model.ts` dispatches explicit couch, curtain and aquarium constructors. Unknown model kinds fail rather than producing a mislabeled fallback shape.

- Couch: two plump rounded/scalloped sage back cushions, two cream pillows with orange embroidered flowers, rolled arms, piping, skirt seams, a timber rail and four feet. The physical width grows from about 61 to 70 units. Seat sockets move with the model at x=-15/+15, y=9.3, z=12, maintaining the shared Sit hip contract.
- Curtain: a freestanding timber opening with carved posts, cornice, rod/rings, pinched pleated cloth sheets, tie bands and weighted hems. Rigid posts retain collision and the middle remains traversable. Cloth geometry deflects around its top attachment, separate from its frame.
- Aquarium: paneled timber cabinet with inset fronts, side panels, drawer pulls and brass handles; tank rims, water/glass volume, plants, gravel, pebbles, air bubbles and five fish with body/eye/tail geometry. Fish move within the tank. The water has sufficient alpha to survive the native pixel finish's matte threshold; it is not silently discarded in side views.

Native cells increase from 80×96 to 96×112 with floor anchor (48,96). Physical scale stays shared with actors; nearest-neighbor display uses integer zoom. All supported facings carry projected collision, placement, approaches, seat contacts, sensor bounds and control height. Meshes—not flat image angles—generate the views.

The isolated Firefox production exporter writes transparent base/foreground art, GLB sources and per-item manifests. Each style/facing also has nine native motion pairs for the curtain (signed cloth deflection) and aquarium (fish phase). `generated.json` is now a version-2 registry of item manifests. Renderer previews use the same model animation code. Live room reactions choose the matching native motion texture and foreground rather than drawing the previous 2D cloth/fish overlays. The local interaction field uses the installed native assets and collision metadata too.

The separate legacy bamboo-window decoration and garden bush remain 2D; only their existing advertised support applies. Old reference PNGs stay intact. The old curtain example was removed from `reactive-items.json` so a later legacy-item merge cannot overwrite the actual model catalog entry.

## Persistence and delivery

The existing item IDs `studio-couch`, `curtain-passage` and `aquarium` are preserved, including inventory and saved styles. Catalog entries are merged by ID. The new construction definitions use the existing game-only building service and material-price rules; no accounts, inventory grants, seed balances or verified rewards are generated. No new schema migration is needed.

Only corresponding furniture/UI/game modules and native revisions are mirrored to the main worktree. The housing service is reloaded for the updated catalog and matching server geometry. The furniture skill now records reference-detail fidelity, actual-model versus legacy-art distinctions, native motion contracts and the above-object circular action requirement.

Art output was produced in isolated Firefox and source images were inspected as part of authoring. Source review covered item selection, frame dimensions, model contacts, motion texture keys and rotation control lifecycle. No application tests, builds, game browser verification or automated skill validator were run; no end-to-end result is claimed.
