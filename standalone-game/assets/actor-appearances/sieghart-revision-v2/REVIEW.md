# Sieghart v2 — 15 November 2026

Applied the revised actor workflow to the existing Sieghart preview. This is a
scoped artwork/model revision, with the shared rig, voices and live roster retained.

## Delivered artwork

- Normal Painterly anime fantasy illustration with stronger semi-bold silhouette
  contours, finer internal lines and six authored hair/scarf/coat drawings.
- Separate six-drawing enraged attack illustration: low stance, two-handed sword
  grip, narrowed eyes and a restrained crooked smile. The owner requested a mix of
  anger and unsettling confidence, then explicitly accepted the final facial edit.
- Background and aura remain independent animated layers. Normal/Enraged controls
  select the actual separate assets; pause, restart, isolation and reduced motion
  retain their shared implementation.
- New Refined cel portrait, default three-quarter: three angles and six emotions.
  Ninety complete generated face drawings cover rest, half/closed blink and two
  speech states. Complete offline one-pixel torso-inhale versions provide breathing
  without runtime eye/mouth patches. The final atlas has 180 complete frame entries.
- Three-quarter Refined cel selection icon, 40×40 native pixels inside the shared
  48×48 wood frame and active glow. Generated specifically for compact face readability.
- Earlier Painterly anime fantasy portrait remains separately selectable. The
  selected portrait style and angle reach the existing dialogue HUD.

The portrait bundle is **217,929 bytes**, including metadata and three reference
images. The icon is **698 bytes**. Normal and enraged illustration bundles are
588,511 and 585,422 bytes respectively, including their separate layers/posters.
All new served artwork totals **1,392,560 bytes**, excluding authoring files,
unchanged model texture maps and the separately preserved earlier portrait.

## Model revision

Retained Sieghart's curved head, layered/tapered hair locks and original directional
UV textures. The cloth helper is currently used only by Sieghart. Replaced nearly
coplanar double-sided cloth sheets with shaped outer surfaces, mapped reverse
linings and closed textured perimeter/hem surfaces. Front/back culling prevents
the lining from covering the outer artwork. Curved folds and direction-based
secondary motion remain attached to their existing roots; normal, reverse and
edge vertices share their deformation. The scarf reverse retains its patterned map.

The shared skeleton, action library, native-pixel renderer and world scale remain
the model contract. This is stylized gameplay geometry, not the illustration's
full adult anatomical proportions or a physically simulated cloth replacement.
The separate foot sigil follows the ground anchor and keeps the existing shadow.

## Focused Firefox review

Evidence: `output/playwright/sieghart-v2/` in this workspace.

- Observed front, three-quarter, true side and back model views, including enlarged
  hair/face and textured garment inspection (`model-*`, `volume-*`).
- Exercised all 34 selectable human actions with two captured moments per action
  (`action-0` through `action-33`, `actions-board.png`). Included care/rest,
  expressive actions, run, flight, temporary abilities and return to idle.
- Inspected three actual cloth-motion moments in idle, walk and run from back-left,
  plus care while moving (`cloth-*`, `moving-pet.png`). Confirmed attached roots,
  visible texture/lining, depth, floor clearance and ground-circle behavior.
- Reviewed every authored native portrait state in all three angles (`states-*.png`)
  against generated sources. Removed detached neighboring-cell slivers during
  production extraction; face features remain intact full drawings.
- Exercised all 18 angle/emotion combinations in the live portrait inspector,
  observing rest, speech, emotion/angle transitions and an extended neutral
  blink/breath sequence (`portrait-*-*-*`, `blink-breath-*`). Native state boards
  also expose all half/closed/small/open artwork for direct inspection.
- Verified portrait style switching and the selected-angle Refined cel dialogue
  (`painterly-preserved.png`, `dialogue-refined.png`). Dialogue has no second picker.
- Reviewed three moments of each illustration loop, independent actor-only display,
  reduced-motion still and the 390×844 mobile fit (`illustration-*`,
  `isolated-actor.png`, `reduced-motion.png`, `mobile-illustration.png`). Desktop
  review used 1600×1050. Smooth illustrations shrink to fit narrow screens;
  existing pixel illustration styles keep integer display scaling.
- Inspected native and enlarged compact icon artwork, with the existing shared
  selector frame. No application exceptions were found in the reviewed console.

One action capture paused when an open dropdown hid the underlying region from
the accessibility locator. Closing that menu allowed the remaining actions to be
reviewed. This was a review-driving interruption, not an unreviewed action or an
application exception. Canvas element screenshots can include clipped surrounding
UI because of their oversized positioned bounds; native state boards and complete
page/dialogue captures provide the corresponding clean visual references.

No automated suites, builds or typechecks were run. Browser interaction was the
focused visual review requested by the owner. No live game roster, account save,
database record, currency service or voice pack was changed.

## Production and provenance

`scripts/prepare-sieghart-revision.py` exports the illustration, enraged revision,
portraits and icon individually, or all stages. Run it with the working Pillow
environment on Drive. Original generated sources, exact prompts and source hashes
are retained in this authoring folder; see `provenance.json`, `brief.json` and the
per-stage export reports. A superseded portrait candidate was retained outside
the public asset tree. The prior painterly character package remains separate.

Preview: `/play?preview=actors&skin=sieghart&art=illustration`.
Choose **Enraged** in Illustration, or **Refined cel** in the Portrait style picker.
