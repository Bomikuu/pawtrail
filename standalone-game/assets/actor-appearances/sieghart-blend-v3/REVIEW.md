# Sieghart — blended illustration revision, 15 November 2026

## Hair and moving lightning — v5

Applied the owner's requirement for actual lightning motion and continuous hair
motion in both illustrations. Both poses now have separate crown-spike and back-tip
painted layers. Their roots stay attached while their loose ends bend with staggered
phases through the existing five-second loop. These perimeter pieces are removed
from the fixed body rather than drawing moving hair over a stationary duplicate.

The enraged eye arcs now deform from the fixed eye/temple origin, completing three
motion cycles per five-second base loop. Branch paths and tips visibly change
position; opacity pulsing is secondary. The original pre-lightning artwork repairs
the old bolt/bloom footprint beneath the moving effect. The grin, face, arms, grip
and sword remain steady. No new illustration style or gameplay model was generated.

The shared optional part `cycles` field is consumed by the mesh renderer and bounded
by the loader to integers 1–4; absent values preserve existing playback. Runtime
installation is versioned under `illustrations/sieghart/v5`.

Focused Firefox review completed in the actual actor preview at 1600 × 1050:

- Inspected both poses with background/aura disabled and restored, including close-up
  phase boards for crown/tips, moving arcs, stable origins, face/grip and safe bounds.
- Recorded 10.5 seconds of each live canvas, covering two complete base loops and
  six lightning cycles for enraged. Inspected moving contours/overlaps and return
  through the loop; no new gaps, detached hair, clipping or face movement were seen.
- Pause held an identical canvas; resume/restart, reduced-motion stills and returning
  from the Portrait tab worked. No application exceptions appeared in the review.
- Retained the same normal/enraged artwork, icon, portraits, circle and gameplay rig.
  Legacy atlases bypass this optional part field; the existing part default is 1.

Evidence: `output/playwright/sieghart-effects/`, including both live recordings,
head phase board and a recorded enraged motion close-up. Actual runtime folders,
including metadata, all layers and posters: normal 235,785 bytes; enraged 212,471
bytes. No automated suites, builds or typechecks were run.

## Owner motion correction — v4

The owner reported the initial v3 illustration looked still. Focused Firefox
inspection confirmed playback was active, but weighted hair-tip travel was under
a pixel and loose cloth travel was only a few pixels at the ordinary preview
scale. The earlier motion acceptance below did not catch that readability issue.

The v4 installation keeps the exact same painted parts and five-second cycle,
but increases loose-tip amplitudes: normal scarf 8/9 native px, coat 6.5 px and
hair 3 px; enraged scarf 9/10 px, coat 7 px and hair 3.2 px. These are maximum
mesh amplitudes before root weighting, not displacement of the complete actor.
Face, body, grip and planted feet stay fixed. The new versioned runtime folder
prevents an already open preview from retaining cached v3 motion data.

Motion follow-up evidence: `output/playwright/sieghart-motion/`.
Follow-up review completed in Firefox. Inspected both normal and enraged poses
at the actual 359 px preview width, with background/aura hidden and restored.
The loose ends now visibly change position while the face, sword grip and feet
stay fixed. Captured phase boards for both and a 10.5-second live canvas recording
covering two complete five-second loops for the normal pose. Inspected moving
contours, attachment seams and safe bounds; no new detached pieces or clipping
were seen. The five-second pacing and staggered motion remain smooth.
The same reviewed painted parts/posters, icon, circle and portraits are reused;
only motion amplitudes and the versioned illustration binding changed.

Updated the installed actor skill and its illustration/visual-acceptance references
to require destination-size actor-only motion review, smooth pinned hair/cloth,
separate enrage face effects, a matching three-quarter icon and detailed glowing
floor circles. No automated suites, builds or typechecks were run.

## Original artwork and implementation

Normal and enraged illustrations now combine the mature anatomy and material
depth of Sieghart's painterly illustration with Sieg's cel shadow planes,
pixel texture and stepped, semi-bold silhouette lines. The normal draft was
retained. The owner requested a more demonic enraged performance with lightning
coming from the face; its revised source has a sharp grin, narrowed eyes and
violet-white arcs emerging from the near eye/temple.

## Motion and integration

- Native composition: 320 × 448. Both full-body performances retain their own
  pose, complete sword and feet, and motion-safe margins. The crouched attack
  pose is wider and proportionally shorter than the standing pose.
- Replaced the rejected six held pose frames with an actual continuous 2D
  painted-part mesh. The original body, face, arms, sword grip and feet stay
  fixed. Separately masked upper/lower scarf ends, hair tips and coat hems bend
  from fixed roots, with staggered phases over a five-second cycle at up to
  30 updates/second. This is a cutout rig, not newly generated per-frame drawings,
  a full-image sway or a claim of anatomical breathing animation.
- Clean generated underlays cover areas behind moving cloth. Detached underlay
  scraps are removed from the fixed body. Loose parts retain the original
  source pixels, contours, highlights and folds.
- Eye lightning is its own extracted painted part with a soft brightness pulse;
  it does not deform the face or flash rapidly. Background and aura remain
  independent, quiet layers with the existing switches.
- The normal illustration supplies the new three-quarter icon. Its dedicated
  40 × 40 export uses the existing 48 px wood frame and active glow.
- The preview's Sieghart floor circle now uses an authored glyph: concentric
  rune rings, a star/compass, paw center and directional sigils. The circular
  drawing rotates before projection onto the floor, with a restrained halo and
  four small orbiting motes. It follows the ground anchor, separate from the
  contact shadow. Reduced motion keeps the circle steady.
- The Refined cel dialogue portraits, earlier painterly portrait choice,
  gameplay model, shared body actions, hair/cape geometry and voices are retained.

## Focused Firefox review

Evidence is in `output/playwright/sieghart-v3/`.

- Compared normal and enraged artwork with source references and the revised
  face/lightning source. Inspected the compact icon at native and enlarged size.
- Sampled both live loops across five phases with background/aura hidden,
  checking stable faces, hands, sword and planted feet; attached scarf/coat
  roots; clean outlines/overlaps; and unclipped moving ends. Continuous periodic
  deformation returns to the same phase at five seconds without a pose reset.
- Pause held identical canvases; play/restart and variant switching worked.
  Background and aura could be disabled independently.
- Inspected the glowing circle during idle, running and floating; it stayed at
  ground level rather than rising with the cloud.
- Checked the reduced-motion still, disabled animation controls, retained
  Refined cel portrait and three-quarter selection, compact icon/frame/glow,
  and a 390 × 844 mobile layout. The mobile editor scrolls vertically.
- Reviewed Amber's unchanged legacy illustration through the shared compositor.
- Intentionally blocked the new parts image to inspect the resting-art error
  fallback, then removed the block and used Retry to recover playback.
- No application exceptions were observed during the focused review. Firefox
  emitted existing WebGL warnings; the deliberately aborted asset request was
  part of the fallback check.

No automated suites, builds or typechecks were run. This was the requested
focused browser/art review. The export script is production asset processing.
No database, account save, real animal, Kibble authority, live game roster or
voice recording was changed.

## Production

`scripts/prepare-sieghart-blend.py` retains both source poses, clean underlays,
mask polygons, exact prompts and native exports. See `export.json` for exact
bytes and decoded part-atlas memory, and `provenance.json` for source hashes.
Each illustration folder is under 250,000 bytes including all posters, layers,
parts and metadata. The icon is 1,065 bytes and the circle is 8,630 bytes.

Preview: `/play?preview=actors&skin=sieghart&art=illustration`.
Select **Enraged** for the revised demonic performance.
