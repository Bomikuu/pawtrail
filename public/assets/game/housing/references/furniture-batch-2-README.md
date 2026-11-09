# PawTrail furniture — batch 2

Nine new static furniture sprites continue the first housing batch's cozy pixel-art style. All generation uses the built-in imagegen tool with the existing reference. Original generated renders are retained beside native exports in housing/furniture; exact generation prompts and processing details are in the three category manifests.

## Native cells

- Living room: armchair 32×64, bookshelf 64×64, floor lamp 32×64.
- Bedroom: single bed 32×64, wardrobe 64×64, desk 64×64.
- Kitchen: refrigerator 32×64, stove 32×64, sink counter 64×64.

The review sheet reads left to right, top to bottom in that order. It uses integer 3× nearest-neighbor enlargement and a cream review-only backdrop. Individual native PNGs are transparent.

## Production boundary

Sprites use the same 32-color palette as the first sofa/table batch. Native preparation includes alpha-glow removal, silhouette alignment, nearest-neighbor sampling and palette cleanup without dithering. Observed dimensions, alpha and color-palette checks are recorded in housing-furniture-batch-2.json. Category manifests provide placement anchors and proposed collision footprints. Those footprints have not been verified in gameplay.

This batch adds assets only. No gameplay, React components or interface was implemented. No furniture interactions, rotations, animated states or modular customization layers are implied by these single-frame PNGs. Existing first-batch assets remain untouched. Earlier wall/corner assembly limitations remain recorded in the first-batch documentation.

The native ZIP contains the nine PNGs, category manifests with prompts, combined manifest, contact sheet and this readme. High-resolution source renders stay in the project rather than inflating the lightweight native pack.
