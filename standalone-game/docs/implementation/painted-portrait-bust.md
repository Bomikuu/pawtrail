# Painted portrait bust

Human portraits now use a dedicated 3D bust rather than the flat illustration
cut-out or an enlarged gameplay rig. The shared appearance configuration still
selects hair, outfit, headwear, wings, glasses, colors and face details. No saved
schema, gameplay body or collision change is required.

The bust contains a rounded head, modeled hair volume, neck, shoulder/upper-arm
volumes and a torso ending below the chest. The cylindrical face UVs put the
front at u=.5, with their own side/back pixels. Face, hair and cloth use authored
canvas textures, nearest filtering and unlit materials, finished at 192×192 with
crisp pixel contours. The face preserves dark oval eyes and no visible nose.

The expression state offers neutral idle, smile, happy and talking. Head/breath
motion and blinking accompany the facial texture states; jaw-opening and cheek
morph targets support speech/smiling. Talking follows dialogue text reveal and
ends when revealing stops. This is not recorded-audio lip-sync.

The shared LivingPortrait supports drag and keyboard rotation. Its expand button
opens a shadcn portrait studio with front/three-quarter/side/back presets,
expressions and reset. It remains above Animal Friends in the left HUD and in
the creator/dialogue. Reduced motion and pause keep the current pose static;
manual view/expression changes still redraw it. Hidden/off-screen views stop
animation. The shared GPU stage and per-portrait 24-frame cache bound resources.
Existing cat portraits share rotation and retain their own happy expression.

The former illustration renderer and generated PNG remain reference/fallback
assets. They are no longer the active human rendering path. No unit suite, typecheck or production build was run. The requested Firefox
visual verification is recorded below.

Native art was rendered in isolated Firefox and visually reviewed as an reference/view/expression sheet at `assets/actor-appearances/reviews/maya-painted-bust-v4.png`. Reproduce it with `node scripts/pawtrail-portrait-art.mjs`; this exporter disables file watching and uses a temporary port. This was artwork production, not application browser verification.

## Maya illustration refinement

The v4 portrait adds generated skin/hair UV artwork (48-color native maps), preserved tonal palettes, shaped glossy eyes/lids/brows, warm cheek/lip detail, a more defined jaw, overlapping curved locks, finer vest lapels/pockets/stitching and a three-quarter resting view. The painted portrait has intentionally different detail/proportions from the gameplay body; shared appearance data keeps its likeness. Portrait geometry changes do not alter the gameplay character or saved data.

The async portrait factory loads/recolors the artwork before rendering. Source images and exact prompts are preserved in the painted-v4 asset manifest and portrait-sources/maya-v4 directory. The comparison sheet is assets/actor-appearances/reviews/maya-painted-bust-v4.png, including the original Maya illustration.

At the owner's explicit request, Firefox visual verification covered the real game dialogue/portrait studio at 1440×960 and 390×844, view presets, drag rotation, smile/happy/talking and neutral restoration. Captures are under output/playwright/maya-*.png. No unit suite, typecheck or production build was run.
