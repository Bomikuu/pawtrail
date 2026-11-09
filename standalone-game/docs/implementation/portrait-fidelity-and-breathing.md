# Authored portrait fidelity and breathing

The preview at `/play?preview=portraits` now preserves a complete native authored
base for every style, pose and emotion. This replaces the first export, which
reconstructed faces from guessed eye/mouth crops, drew generic eyelids and
occasionally substituted a happy mouth into other emotions. Those operations
changed the original expression and produced awkward tilted-view blinks.

## Current behavior

The five approved styles retain front, three-quarter, left profile and tilted
views with neutral, smile, happy, sad, angry and surprised expressions. Each
resting state is pixel-identical to its generated native reference PNG. **Show
authored source** toggles the actual PNG beside the same preview layout, rather
than showing a second rendering of the animation's reconstructed face.

Native contextual eyelid/lip islands supply motion without repainting the face
or stretching an eyeball. Brows and lip corners retain the selected emotion;
speech includes resting beats and no longer inserts the happy-wide mouth into
angry/sad expressions. The small console style has independent calibrated eye
positions for its generated tilted views. Happy's authored closed smiling eyes
remain closed. Manual eye and mouth controls support inspection in every pose.

Breathing runs through shared `portrait-motion.ts`: one native pixel of rise over
4.8 seconds, with the head pixels intact, chest expansion and four lower rows
anchored. It uses no CSS scaling of the face. Reduced-motion preferences pause
playback, and the existing offscreen/visibility/pause lifecycle remains shared.
The neutral automatic profile snapshot disables motion.

Compare tiles are taller, and mobile uses one portrait per row so a face can
remain at a useful integer zoom. The existing game roster stays in its own tab;
gameplay bodies and unrelated world/furniture changes are unchanged.

## Export and installation

`scripts/prepare-portrait-collection.py` accepts the versioned
`output/imagegen/photo-character-emotions-v2/source.json` contract. It preserves
source pixel colors, records per-pose anchors and supports per-expression and
closed-source overrides. It does not RGB-filter the art into new facial shapes.
The existing approved native frames are reused; this correction makes no new
ImageGen calls and introduces no source photographs into public assets.

Active assets live in `public/pawtrail-game/game-assets/dialogue-portraits/photo-collection-v2/`.
The version 2 manifest maps each expression to its own base and contextual blink
and speech deltas. Only the selected animation pack loads. Served reference PNGs
are preview aids and are included in the complete-entry byte accounting.

The catalogue hashes atlas and manifest contents into a revision used by bundle,
image, poster and snapshot caches, preventing a corrected export from displaying
an earlier decoded atlas. Source/pose/emotion changes still reuse bounded caches.

| Complete style | Runtime atlas + JSON | With all 24 reference PNGs |
| --- | ---: | ---: |
| Sharp cel | 75,417 bytes | 143,958 bytes |
| Compact fantasy | 89,586 bytes | 170,067 bytes |
| Sparse anime | 76,334 bytes | 145,613 bytes |
| Console icon | 49,929 bytes | 98,197 bytes |
| Rough manga | 106,420 bytes | 200,071 bytes |

Every complete style is below **250,000 bytes**. The budget applies per style,
including all four poses and expressions, rather than to individual frames.
Shared application JavaScript is separate. Prior V1/V2 art exports are retained.

Only portrait modules and the new asset directory are mirrored to the integrated
application at `src/features/neighborhood`; the broad game-sync script is not run.

## Firefox visual review

The owner explicitly authorized visual testing for this correction. The initial
inspection reproduced the large closed-eye shapes in Compare mode. The final
Firefox confirmation exercised five styles, four poses and six resting emotions:
**120 live states matched their authored PNGs exactly** with breathing disabled,
resting eyes and resting mouth. Native comparisons include alpha and RGB values.

Forty native canvas screenshots cover closed-blink-plus-small-speech and
angry-plus-rounded-speech in all angles/styles. Breathing produced two distinct
native frames; combined playback produced seven. Reduced motion paused the
canvases. Desktop 1440×1000 and mobile 390×844 were captured, with no horizontal
mobile overflow or runtime page errors. Existing preload warnings are unrelated.

Evidence is in `output/playwright/portrait-fidelity/report.json`, screenshots and
browser-rendered motion contact sheets. The repeatable visual review is an
artifact in that directory, not an always-on application test suite. No production
build, type/lint/detector checks or unrelated application tests were run.

The actor and cat skills now require unchanged authored expression bases,
anatomy-specific motion islands, calibrated side/tilt anchors, subtle shared
breathing, measured complete-entry sizes, cache revisions and source-fidelity
review before claiming that future assets match their reference.


## Console neutral alignment and consistent size

Console icon neutral originates in the older approved drawing. Its neutral
closed/half eyes and small/rounded speech now use independent anchors for every
angle. Tilted eyes have separate offsets, and side-profile speech can extend its
lip silhouette by a native pixel. Resting reference PNGs remain unchanged. The
previous review covered resting neutral and other expressions in motion, which
missed this neutral-specific registration problem.

The manifest now records a fixed union of opaque content bounds plus a one-pixel
margin. Shared `portrait-display.ts` fits those bounds at integer zoom for both
animated canvases and actual reference PNGs. Transparent padding no longer makes
the 72×72 style smaller than the larger native canvases. Single and Compare
stages are 360 pixels high; the Console selector thumbnail is enlarged as well.
Bounds stay fixed across expressions, so animation never triggers a resize.

The targeted Firefox review is recorded in
`output/playwright/console-neutral-fix/report.json`. It captured seven neutral
motion combinations across all four poses, with zero resting-reference pixel
differences. Native playback produced seven distinct frames per angle. Console
visible art measured 330 pixels high at 5×, versus Sharp cel's 336–342 at 3×, on
both 1440×1000 desktop and 390×844 mobile. Mobile content width stayed 390 pixels
and no runtime page errors occurred. Live browser screenshots and a contact
sheet were visually reviewed. This follow-up is scoped to Console neutral and
shared sizing; it is not a new audit of every other expression's motion.
