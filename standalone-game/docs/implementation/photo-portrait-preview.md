# Five-style portrait collection in the live studio

The initial crop-based export described below is superseded by
[portrait fidelity and breathing](portrait-fidelity-and-breathing.md). The active
collection uses version 2 authored expression bases and measured Firefox review.
The original file sizes and implementation details below describe the archived
first installation, not the active collection.

`/play?preview=portraits` now opens **New pixel collection** by default. The existing roster remains in **Game portraits**. This installs the approved generated art as a portrait-studio collection; it does not replace Maya, other roster portraits or gameplay bodies.

Choose any of the five approved larger-native styles, then switch between the front, three-quarter, left profile and tilted-head poses. Neutral, smile, happy, sad, angry and surprised are available for each pose. The emotion remains selected when changing style or starting speech. **Compare angles** plays all four angles side by side using one shared downloaded atlas.

**Eyes** selects natural blinking, resting eyes, a half blink or closed lids. **Keep talking** loops the three generated speech shapes independently of the eye layers. **Play dialogue** reveals editable text and restores the selected resting mouth on completion. Pause stops text reveal and portrait playback; reduced-motion preferences initially pause the preview. Background choices expose the transparent native artwork on sage, cream or dark surfaces.

## Shared runtime

The studio composes the existing official shadcn controls and `LivingPortrait`. Its new optional collection source uses `photo-portrait-renderer.ts`; the legacy portrait factory and consumers remain supported. The native-size renderer clears the canvas before drawing the pose base, expression delta, blink delta and mouth delta. Frame positions and timing come from the generated manifest. It never accumulates changes into an earlier face.

`LivingPortrait` retains the common visibility, pause, reduced-motion, retry and automatic neutral-profile snapshot behavior. A resize observer fits these new native canvases using integer nearest-neighbor zoom. The original dialogue/HUD/creator rendering size remains unchanged. Pose, expression and eye controls update the existing renderer without asset refetches. At most two collection bundles and 24 composed frames per renderer are cached; canvases and observers are released on unmount.

## Assets and bytes

The authoritative generated native PNG/JSON pairs are copied from `output/imagegen/photo-character-emotions-v1/runtime/` into `public/pawtrail-game/game-assets/dialogue-portraits/photo-collection-v1/`. Four static pose posters per style come from the approved V2 exports. No source photograph, raw generated master, authoring reference or review GIF is served by the application.

The five complete entries, counting atlas, JSON and all four poster PNGs, are 41,692 / 47,197 / 43,833 / 30,017 / 56,479 bytes. All five together are **219,218 bytes**, below 250,000 bytes. The shared application JavaScript and catalogue index are separate. The UI shows both the animated-pack size and the complete-entry size. Only the selected animation pack is fetched; small style thumbnails are separate posters.

Native frame and layer manifests are unchanged. Their `gameInstalled: false` flag describes the original offline generation delivery, not the current preview installation; selection/authority comes from the studio catalogue rather than that provenance field.

## Installation and scope

Copy only the changed portrait components, renderer/state/catalogue files and `photo-collection-v1` assets into the integrated game's `src/features/neighborhood` and public asset paths, rewriting the existing `@/game` and `@/components/game` aliases. Do not run the broad game-sync script for this scoped update: it can overwrite unrelated furniture/world work in the social worktree.

The Next development server stays running on port 3000. No account, database, reference-evidence, verified reward or payment records change. Per the owner's standing instructions, no automated tests, type/UI/format/detector checks, builds or browser verification were run. Source review was used; the preview is provided for the owner's manual evaluation in Firefox.
