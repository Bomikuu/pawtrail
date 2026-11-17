# Amber loading illustration — 10 November 2026

## V2 — portrait-led pixel revision

The owner rejected V1's smooth rendering as a Refined cel style match. Preserve
V1 as history, not as an approved style reference. The illustration and actor
skills now require the approved portrait's visible pixel clusters and stepped
outlines, with only slightly finer selected details in the larger composition.

V2 was generated with built-in ImageGen from the approved native portrait
(also supplied at 4× nearest-neighbor) and Amber's identity reference. Its native
frame is 160×240 and the intended enlarged presentation is 320×480. Six complete
drawings retain the fixed expression while loose hair and cape tails sway.
The cycle remains 2,400 ms with a common 96-color palette and no dithering.

Runtime directory:
`public/pawtrail-game/actor-studio/illustrations/amber-outrider/v2-5a17b27d3162/`

| V2 asset | Bytes |
| --- | ---: |
| Animated `sway.webp` | 80,454 |
| Alternative `atlas.webp` | 46,470 |
| `poster.webp` | 8,092 |
| `illustration.json` | 2,241 |
| Complete V2 pack | 137,257 |

The V2 authoring directory is the sibling `refined-cel/v2/`, retaining original
generations, prompts, native drawings, the 2× contact sheet and `preview.gif`.
Resting and motion artwork were inspected for pixel style and registration.
Owner acceptance and live playback review remain pending; no automated checks,
tests, builds or browser verification were run. No existing game-loading binding
was changed by this asset revision.

### Actor preview integration

Open `/play?preview=actors&skin=amber-outrider&art=illustration` to show V2 in
the actor creator's Illustration tab beside the Portrait tab. The shared
`components/game/shared/illustration-preview.tsx` reads the frame rectangles,
native size, playback sequence and durations from `illustration.json`, then
draws complete frames from `atlas.webp` with smoothing disabled. It uses the
resting `poster.webp` while loading, on failure and for reduced motion. It does
not load the alternative animated WebP. These three source files total 56,803
bytes before transport overhead.

Play/pause and restart are independent of the model and dialogue portrait.
The preview uses integer 1× or 2× display according to available width, pauses
offscreen or in a hidden document and cleans up its timer and loads on unmount.
Amber and Yae Miko have their own illustration bindings in `creator/illustrations.ts`;
actors without a binding retain their existing portraits. Switching artwork tabs is local
and keeps the selection in the `art` query parameter. The existing game loading
screen and body-action lifecycle are unchanged.

Integration is source-reviewed. Browser verification, automated tests and builds
were not run under the owner's current workflow; live motion acceptance is pending.

## V1 — retained original, style rejected

Created with `$pawtrail-illustrations` using built-in ImageGen. The approved Amber
Refined cel portrait supplies the rendering style; her original illustration
supplies costume and identity. The loading composition is a transparent
three-quarter-body cutout, holding a small closed-mouth smile and a hand at her
goggles. Six complete authored drawings move loose hair and cape tails through
one back-and-forth breeze. No dialogue or emotion animation was added.

Runtime folder:
`public/pawtrail-game/actor-studio/illustrations/amber-outrider/v1-9dd18ad75926/`

| Asset | Bytes |
| --- | ---: |
| `sway.webp` — portable animated image | 162,108 |
| `atlas.webp` — six frames, 3 columns × 2 rows | 94,966 |
| `poster.webp` — resting fallback | 16,292 |
| `illustration.json` — rectangles, timing and provenance metadata | 2,280 |
| Complete served pack | 275,646 |

The animation alone plus its static poster is 178,400 bytes. The atlas is an
alternative playback source; a consumer need not load both animation formats.
The source cells are 256×384. Playback sequence is `0,1,2,3,4,5,4,3,2,1`, with
320 ms at its two extremes and 220 ms at the other steps, totaling 2,400 ms.
The common 128-color RGBA palette, no dithering and lossless WebP exports retain
pixel edges. Use nearest-neighbor integer display and the poster for reduced
motion or failed loads. Pause playback when offscreen or the document is hidden.

Authoring directory:
`assets/actor-appearances/illustrations/amber-outrider/refined-cel/v1/`

It retains original generated artwork, both references, the exact prompts in
`prompts.json`, raw and aligned native drawings, `registration.json`, the
production record `export.json`, a contact sheet and a warm-background
`preview.gif`. The GIF's background is preview-only; all runtime art is
transparent. Authoring originals and preview files are not runtime payloads.

Production removed low-alpha fringe and disconnected gutter debris, aligned
whole drawings with integer translations, then fitted their complete shared
motion envelope using one common nearest-neighbor scale. No per-frame fitting,
runtime face patches, character mesh deformation or whole-image sway is used.

Reference and native contact-sheet artwork were inspected. Loop playback and
live installation are pending owner review; no browser verification, automated
tests, builds or agents were used. These are ready-to-consume asset exports,
not a new application playback registry. No existing loading screen, character
portrait, icon, gameplay model or saved appearance was replaced.
