# PawTrail housing cats — v2

Ten cat variants were generated independently with built-in image_gen using the housing style reference and the first orange cat's pose grid. Original source renders and exact prompts are retained in sources/ and prompts/. These are new sibling assets; older cat exports are unchanged.

Each source was visually inspected and follows the actual observed eight-column by twelve-row grid. The first92 cells contain23 groups of four frames; the final four cells are empty. Native atlases are384×576 with48×48 cells. Each action is also exported as a192×48 strip and four individual48×48 PNG frames. The manifest maps observed source frame indexes and atlas rectangles, not hypothetical files.

The actions are standing, sitting, blink, tail swish, four-direction walking, lying down, sleeping, stretching, eating, drinking, being petted, happy reaction, playing, grooming, approaching, sofa jump, sofa sitting, bed sleeping, scratching and cat-tree play. The duplicate idle/rest sitting requirement is an explicit alias to the same sitting action, not a fabricated extra animation. Furniture interaction poses contain the cat only so furniture remains independently placeable.

Preparation thresholds generated alpha glow, keeps a fixed source-to-native scale, uses nearest-neighbor sampling without dithering, aligns standing/idle/walking feet to baseline46, and maps all ten variants to one64-color palette. Native margins, actual dimensions, binary0/255 alpha, nonempty frames and four distinct pixel frames per action were checked. Full native orange/Siamese review sheets and the ten-variant contact sheet were visually reviewed after all source sheets were inspected.

ProductionReady is deliberately false. Some generated actions have subtle body jitter or limited leg articulation; matching four pixel-distinct images does not prove a convincing gait or seamless loop. Lying/stretching/jumping are marked one-shot. Loop closure and character marking continuity need animation polish/in-engine review before this pack is described as production-ready. Nothing here creates gameplay, care records or real animal activity.
