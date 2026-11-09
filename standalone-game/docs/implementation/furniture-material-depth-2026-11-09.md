# Reference-driven furniture material depth

The owner requested stronger similarity to the existing 2D assets through details, shadow/edge colors and clear divisions between furniture parts, and explicitly authorized visual confirmation. This supersedes the previous source-only review limit for this focused visual pass.

## Changes

The reference comparison was inspected at nearest-neighbor scale before editing. The old couch was too squat and wide, with similar green values across its backs, arms and seats; its small timber feet were hidden. The old aquarium lost the reference's cyan/teal depth, orange wood and plant silhouettes.

The couch now has taller rounded-rectangle backs, a continuous dark upholstered foundation instead of the brown central gap, separate dark cushion welts, raised seat faces, rolled arms with different cap/edge colors, a darker skirt and visible honey-colored feet. Its reference palette includes olive `#898a4a`, highlight `#b1b771`, shade `#656238`, cream `#f2e3c5` and warm orange embroidery. The pillow flowers have outlined petals rather than a single flat orange shape. Floor collision and seat sockets remain derived from the same model; the actual Sit pose is still connected at the current 14.6-unit seat height.

The shared furniture material kit adds deterministic 32×32 nearest-filtered fabric grain, timber grain and cyan-to-deep-teal water depth bands. It uses stronger top/front/side/underside vertex values, and explicitly registers all surface colors in the furniture pixel palette. These are real mesh materials embedded in the source GLBs. They do not paste the reference image onto a billboard or change the shared actor pixel finisher. Texture resources are cached within a model and disposed with its geometry/materials.

Curtains now use cream fabric with stronger fold shadows and warm timber edges. Aquarium timber has separate dark insets and brighter faces; larger fish have cream bellies, eyes, tails and warm outlines; fuller fern shapes and gravel remain readable through the water. Glass/plant render ordering was adjusted so the transparent water does not wash them out. Native cloth/fish frames, four facings and foreground layers were regenerated and installed for all styles. Existing IDs and owned inventory are preserved.

The visual pass also fixed an actual mobile layout defect: the preview's percentage height could overrun its flex slot and intercept taps on the model selector. Mobile preview height now follows the content, and a small reserved space keeps the circular rotation action above tall furniture at the smallest integer zoom. Desktop keeps its fitted preview layout. An unset optional material-map warning was corrected by explicitly using `null` when a mesh has no texture.

## Visual evidence and limits

Firefox was used at 1280×720 and 390×844. The desktop creator review selected all three models, captured front/side views, used the above-object clockwise control and confirmed the 90° captions. Couch seat 1 was also rendered and captured. No renderer-error state appeared in these flows. After the mobile layout fix, the model selector could be clicked, the couch rotated using its top button, and the document had no horizontal overflow at 390px. The mobile aquarium was inspected to confirm that the rotation button remained above its hood.

Evidence in `output/playwright/`:

- `furniture-before.png`, `furniture-after.png`: reference/native comparison boards.
- `couch-desktop-front.png`, `couch-desktop-side.png`, `couch-seated.png`.
- `curtain-desktop-front.png`, `curtain-desktop-side.png`.
- `aquarium-desktop-front.png`, `aquarium-desktop-side.png`.
- `couch-mobile.png`, `couch-mobile-rotated.png`, `aquarium-mobile-final.png`.

The first headed Firefox viewport resize stalled; an isolated headless Firefox session completed the review instead. A new material helper variable-shadowing error was caught during isolated art export and fixed before app synchronization. The page's remaining context-disposal/preload warnings are separate from the corrected unset-map warnings; no claim of an entirely warning-free browser is made.

The main worktree received only the corresponding furniture material/model/definition sources, UI sizing changes, native asset revisions and merged catalog items. The housing service was reloaded with its existing environment to load matching geometry. The furniture skill now records proportion/value checks, material division and authorized visual review. No accounts, balances, fixture records or inventory grants were created. This is creator/art verification, not an authenticated home placement/seat-lease or terrain concurrency test. No production build or unrelated automated suite was run.
