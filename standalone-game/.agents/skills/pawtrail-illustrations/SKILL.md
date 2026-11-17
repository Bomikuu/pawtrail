---
name: pawtrail-illustrations
description: Create reference-guided PawTrail character illustrations with readable looping hair/garment motion, natural blinking and separate background/aura layers for loading screens and special-ability cut-ins. Invoke separately or from PawTrail Actors; not dialogue emotions, selection icons or gameplay body rigs.
---

# PawTrail Illustrations

## Illustration-first direction

For a full new actor, this is the **first artwork stage**, before the portrait,
icon and 3D model. The default is **Refined cel + painterly**, combining **new
Sieghart's current illustration** with **old Sieg's Refined cel illustration**.
Keep new Sieghart's mature proportions, detailed face/hair, layered clothing,
painted material depth and polished finish. Integrate old Sieg's deliberate pixel
texture, grouped highlights, cel-shadow structure and stronger stepped edges.
Both references guide the style; keep the actual requested character's identity.
This is a combined illustration preset, not a replacement with pure old Refined
cel or a retroactive relabeling of either existing style. Do not invent a blend
percentage. Judge the actual design against both references at equal head size.
Keep a mostly held pose with natural secondary motion and honor an explicit
different direction.
Preserve **semi-bold dark outlines on the outer silhouette**, including hair,
garments, limbs and held props. Use finer jaw/eye/seam lines inside. Keep the
contour attached to the same material in every frame; avoid either borderless
soft edges or an indiscriminate thick sticker halo. Respect an explicitly
different illustration style. The portrait is chosen later and may independently
use Refined cel; it does not retroactively set this illustration's style.

After approving the full-body design, retain a clean still as the downstream
model reference. If its construction is unclear from the hero pose, generate
only useful matching static front/three-quarter/side/back views. Those additional
views need no animation and must preserve the same anatomy, clothes and details.

Full new-actor delivery also includes a separate **enraged / attack-mode
illustration with a changed body pose**, retaining the same style and identity.
Show the authored illustration results and ask whether they are good. The owner
allows continuing the current version if there is no response after a reasonable
opportunity to reply. Follow [variants and feedback](references/variants-and-feedback.md)
for the two performances, preview binding and precise continuation rule.

## Full-body sources and richer motion — owner preference

Generate the complete actor, including lower body, knees, boots, feet and soles,
with motion-safe margins. A torso-oriented display may crop that full source;
do not omit the lower body from generation unless the owner explicitly requests
a cropped source. Preserve the selected style, angle, pose and facial expression.

Keep resting movement naturally paced: a breathing/settling cycle is commonly
about 4–6 seconds, with restrained movement and eased holds. The owner rejected
the fast 1.4–1.6-second idle loops. Extra frames should smooth motion, not force
rapid head/body swaying. A pacing-only repair preserves liked facial artwork
and can reuse the current complete drawings with calmer sequencing and timing.
When richer movement is requested, use genuinely authored full-frame movement
with visible head/shoulder settling, breathing, hair and clothing follow-through.
Keep feet or structural roots anchored and preserve attachments. Giant bosses
need anatomy-specific neck, jaw/throat and armor movement with a stationary
wall/base where applicable. Repeating drawings faster or sliding/scaling an
entire illustration is insufficient.
Derive UI frame counts and loop duration from the actual manifest.

Visible hair must always animate during active illustration playback, in both
normal and enraged variants. Give short hair tips suitable movement too; moving
clothing or aura does not substitute for hair animation. Keep roots and the face
stable and avoid long frozen holds. Preserve pause, reduced-motion and offscreen
suspension, and do not invent exposed hair for a bald or fully covered head.
Whenever lightning is included, animate its arcs/energy visibly rather than only
pulsing a static bolt. Follow [hair and lightning motion acceptance](references/motion-and-export.md#hair-and-lightning-motion).

Create a larger illustrated character performance: a mostly held pose with living
hair, clothing and accessories. Call independently as `$pawtrail-illustrations`,
or automatically as the **first artwork stage** of full new-actor creation.
The actor workflow includes generating and installing the matching animated
illustration in the actor preview; no separate illustration request is needed.
Honor explicit narrower requests, and reuse matching approved assets when suitable.
This is a separate 2D asset from the gameplay model, animated dialogue
portrait and compact character icon. The normal and enraged performances each
hold their own expression throughout their loop and include natural blinking when
eyes are visible. Neither needs talking or a full dialogue emotion set by default.
Apply the actor skill's [updated performance contract](../pawtrail-actors/references/illustration-performance.md):
clear background/aura, stronger secondary motion and authored blinks.
The latest motion preference is stronger loose-tip/hem travel with a slightly
quicker sway cycle for hair, robes, ribbons and other flexible pieces. Keep body
breathing calm, attachments and the held face stable, and use enough in-betweens.
Both variants must show an actual authored closed-eye phase, not merely blink
metadata. Follow that contract's tuning guidance and version changed packs.

## Visible interaction feedback — owner requirement

Every interactive result in this skill's scope must visibly register: show pending
work when needed, then the actual success, failure or changed state. Existing
clear state changes may suffice; do not add a toast for every animation frame.
Use real outcome events, never a cosmetic effect or a console log as evidence of
success. For fictional combat, confirmed contact must play an actual animated
impact sprite on the affected enemy/player: e.g. a slash flash, spark burst or
elemental impact. Damage numbers, HP changes, tint and floor rings supplement
that sprite; they do not replace it. Distinguish weak points and incoming damage
where useful, and keep blocked/miss/cooldown cues separate from successful hits.
Reuse suitable approved transparent VFX atlases; generate missing raster effects
with the available image-generation workflow. Preserve native frames, anchors
and nearest-neighbor playback; bind contact to accepted outcomes, not casts.
Artwork-only and noncombat work do not gain new combat scope from this rule.

When integrating cut-ins or loading/ability artwork, distinguish pending, activation and actual completion. Artwork alone must not imply applied damage or earned rewards.

Reuse the existing event/feedback layer, pool or bound transient indicators, and
clean them up on reset/exit. Preserve contrast and useful reduced-motion feedback;
sound or color alone is insufficient. Keep local receipts distinct from confirmed
server saves/rewards. Review feedback under current verification permissions and
leave unobserved runtime behavior pending.

## Fast workflow with quality safeguards

Read the approved character/portrait style, destination and manifest once. Reuse
matching approved rest art, whole frames, exporter and shared playback/preview
binding. Carry forward resolved choices. Generate only missing or changed art
and affected exports; do not rebuild a renderer, regenerate other package assets
or reopen settled style decisions for each illustration. Group compatible work
in one authoring/browser session while respecting the current style review gate.

Keep every required identity detail, motion part, complete frame, transparency,
native size, byte accounting and preview-installation stage. Compare rest art
against the original portrait before expanding motion. Inspect the final complete
loop and seam at intended size: face stability, attached roots/props, overlaps,
clipping and style cannot be approved from a poster or changing frame hashes.

Reuse evidence only for unchanged artifacts, inputs and dependencies. A focused
art repair rechecks the affected frames and loop continuity; shared exporter,
timing/cache, renderer, lifecycle or binding changes require wider checks of
affected illustrations, reduced motion, fallback and requested action integration.
Failures or uncertainty warrant further review; unchanged passed behavior does
not need repeated tests. Respect permissions and keep unobserved required review
pending. Do not approve another character/style from this one's result.

Update existing manifests, acceptance and requested installation once after the
final pass. Avoid duplicate reports, repeated setup and unrelated game tests.
Report the real bottleneck; never replace a required animation with a still or
omit requested details just to finish faster.

## Reference and composition

Read the workspace's AGENTS.md and the selected character's approved appearance
and illustration-style metadata. Open the relevant references with an image tool.
Preserve face shape, hair silhouette, costume construction, palette and signature
accessories; don't use the gameplay body render as the illustrated style authority.
Keep the illustration style explicitly selected for this job; otherwise use the
Refined cel + painterly default above. An existing portrait may supply identity
or a specifically selected style reference, but it is not a prerequisite.

The owner's supplied references guide different uses:

- [Sieg Refined cel reference](assets/sieg-refined-cel-reference.png): original
  source sheet for the default
  pixel/cel drawing language. Mature the actual new character's anatomy/features,
  while retaining its identity and semi-bold stepped contours. This is a visual
  style reference, not a preset frame count, timing or motion pass.
- [Demonic enrage reference](assets/enraged-demonic-expression-reference.png):
  expression/gesture authority for a dangerous smile or angry battle performance;
  borrow its intensity, not its character, youthful proportions or equipment.
- [New Sieghart painterly reference](assets/sieghart-painterly-reference.webp):
  the default blend's mature, detailed painted construction/material anchor.
  Combine it with old Sieg's pixel/cel edge treatment; its existing movement is
  not an approved template for the new motion request. Pure painterly remains an
  explicit separate choice.
- [Hero illustration board](assets/hero-illustration-reference.png): expressive
  full/three-quarter-body silhouettes, costume detail, long hair, capes and held
  props. Useful for loading screens and ability cut-ins.
- [Scene-side character](assets/scene-side-illustration-reference.png): a larger
  torso illustration standing beside the world, with a clear readable gesture.
  Useful for contextual panels or scene overlays.

They are composition references, not directions to reproduce their advertisements,
labels, stars, logos, dialogue UI, scenery or unrelated characters. New character
references supply identity. Do not force the same crop or movement onto everyone.

State the intended destination, chosen style, crop, pose, display/native size,
moving details and export budget before generation. Carry forward choices already
made; do not add extra angles or a batch of styles. A full-body reference may be
displayed in a requested torso composition while retaining the complete authored
body source and its identity.
Leave safe space for the full motion envelope, hair tips, wings and held objects.
Reserve room for loading copy or game UI in the composition, outside the artwork.

## Distinct illustration styles

**Default blend:** retain the new Sieghart illustration's adult anatomy, face/hair
detail and rich painted materials, while using old Sieg's readable cel planes,
pixel texture, grouped highlights and semi-bold stepped contours. Interior painted
transitions are allowed; preserve the intended pixel accents and crisp silhouette.
Do not flatten away the new illustration's detail or merely pixel-filter a smooth
painting. Compare the candidate with both stored references before motion work.
Choose and record a native density/display treatment that preserves this balance;
keep it consistent through all frames. The dialogue portrait still has its own
style choice, and the icon derives from the approved combined illustration.

When the owner explicitly chooses
**mature painterly anime fantasy splash art**,
preserve smooth painted material shading, **semi-bold outer anime contours**,
finer internal detail, adult proportions and layered hero-card motion.
Keep it as its own style choice with smooth 2D display, rather than naming it
Refined cel or forcing nearest-neighbor/palette reduction onto the artwork.
The portrait has an independent style choice; recommend Refined cel and show
actual examples at that later stage. Existing pixel art
retains its native grid and nearest-neighbor rendering. Shared animation timing,
whole-frame provenance, layer separation and visual review still apply.

For an explicitly chosen **pure Refined cel** or another strict pixel illustration style, the
illustration should look almost like an expanded portrait, only slightly more
refined in selected details. Refined cel still means visibly authored pixel art,
not a smooth cel-shaded anime painting. The owner's Amber loading V1 was too
smooth and is not an approved style anchor; its pose may guide composition only.

Inspect the actual approved pixel-style reference at native size and an integer
enlargement; use the portrait as that reference only when it was explicitly chosen.
Match its stepped outer/jaw contours, eye geometry, chunky hair highlights and
discrete shadow clusters. Favor intentional flat color planes and a few readable
shades per material over thin painted strands, soft shading, gradients, glow or
antialiased edges. Keep detail inside the portrait's pixel language; do not change
the character's face or replace Refined cel with Console icon/Sharp cel.

Choose a logical art grid from the style reference's **face/head pixel density**, not
from the desired large screen dimensions. A larger canvas can accommodate more
body without making the face smoother. For Amber's three-quarter-body composition,
160×240 or 192×288 is a useful starting range; adapt to the actual reference.
Use integer display enlargement for visible pixels. State native and display
sizes separately. Palette reduction, nearest-neighbor resizing or a pixel filter
alone does not turn a smooth drawing into the selected pixel illustration style.

Before expanding motion, compare a resting candidate beside the original style reference
with their heads at comparable visual size. Check cluster scale, stepped outlines,
face/eye construction and hair shading separately from identity and motion.
Repair style drift before producing the animation sheet. Keep each motion drawing
on the same logical grid, palette and outline treatment as the accepted rest art.

## Artwork and motion

Use the **imagegen** skill for new raster artwork and follow its tool and editing
rules. Reuse suitable approved artwork where possible. Keep generated originals,
exact prompts, identity/style references and source-to-frame provenance.

Deliver a **complete authored frame loop**: every frame contains the whole
illustration at the same scale, camera and anchor. Generate one good resting
design before expanding its motion. Do not transplant another character's hair,
costume fragments or facial animation into it. Runtime playback should select
the authored drawings, not fabricate face movement or warp a finished picture.

Animate loose parts according to their construction: hair tips lag behind roots;
robe/cape hems swing from fixed shoulders or waist; ribbons and pendants trail
their attachment; wings may gently settle when appropriate. Keep the face,
neck, hand grips and torso stable. A little authored breathing is optional;
do not wobble, stretch or rotate the entire illustration to imitate cloth motion.
Keep held props attached and retain overlaps as hair moves behind/in front of
shoulders. If a character has no loose clothing, choose an appropriate small
detail or subtle authored breathing rather than inventing a robe. A held main
pose is appropriate, but full new-actor delivery still includes an actual
secondary-motion loop rather than only a static illustration.

Keep the body, face and grip registered while loose layers move with eased
follow-through. A few widely spaced complete drawings held for most of a second
can look like pose popping; extending those holds does not make a smooth slow loop.
Use suitable in-between drawings, or purpose-built painted hair/cloth layers rigged
offline and baked to complete frames. Do not warp the finished whole character,
invent facial movement or blend/optical-flow between incompatible body drawings.
Treat 6–10 drawings as possible **key poses**, not automatic finished motion.
Natural cloth often needs a continuous cycle rather than mechanical reversal.
Follow the detailed motion contract below; frame count alone does not establish smoothness.
See [motion and export](references/motion-and-export.md) when authoring or integrating.

The required enraged variant uses its own attack-ready/attacking pose and a
reference-led demonic smile or angry glare, with matching natural secondary motion.
See [variants and feedback](references/variants-and-feedback.md) for its expression
reference, stable anatomy/grip and the owner's rejection of Sieghart v2 motion.
Reuse the selected design, not the
normal variant's unchanged silhouette. Other ability illustrations may use
additional dynamic held poses and separately authored energy particles when
requested. The looping illustration is presentation: it
does not implement gameplay damage, speed, rewards or ability duration by itself.
Reuse the actual action lifecycle if integration is authorized. Do not replay or
stack its sound/effects every time the illustration loop repeats.

## Export and installation

Use a transparent background for a reusable character cutout unless the owner
requests a complete loading composition. Keep background art, character animation
and optional effects separate so the same character can serve multiple screens.
No UI, decorative frame or text baked into the character artwork.

Choose native density from the selected illustration-style rule above and actual display
size. PawTrail's named pixel styles, including Refined cel, keep sharp clusters,
stepped edges and nearest-neighbor integer display. Use smoother illustrated
edges only when the owner explicitly selects a separate non-pixel art direction.
Favor native atlases or complete-frame WebP/PNG assets with per-frame timing and
a static poster. Prefer these over a large GIF or video for a transparent reusable
game illustration. Keep authoring sources out of the runtime bundle.

Suggested locations, adapted to existing conventions:

- Authoring: `assets/actor-appearances/illustrations/<actor-id>/<style>/`.
- Runtime: `public/pawtrail-game/actor-studio/illustrations/<actor-id>/<revision>/`.
- Record style, native dimensions, content/motion bounds, anchor, frame timing,
  loop sequence, poster, source provenance, revision and actual runtime bytes.

This collection has its **own size budget**; the portrait skill's 300 KB cap is
not automatically an illustration limit. Report the complete served bundle,
including poster, metadata and effects, separately from authoring sources. Aim for
the smallest convincing loop at its real on-screen size; do not promise a byte
cap before measuring the export or silently discard a requested detail to meet it.
If an explicit cap cannot be met, explain the size/detail/frame tradeoff.

During full new-actor creation, **preview installation is part of the default
delivery**. Follow [actor-preview binding](references/motion-and-export.md#actor-preview-binding)
to register this character's artwork in the existing Illustration tab and return
its direct URL. Inspect current contracts and reuse the shared playback component;
do not create a renderer per character or replace portrait/icon/body fields.
For a standalone asset-only illustration request, keep the requested installation
scope. Creating a preview does not authorize changing real loading screens,
gameplay behavior, ability overlays or the full game roster.

## Acceptance and handoff

For an adult reference, carry its mature face/head-to-body ratio, shoulders and
torso/leg proportions into the selected pixel style. Do not default to chibi or
teen proportions merely because the artwork is pixelated. Compare equal-size
heads with the portrait and the adult full-body reference before expanding motion.
Keep the actor dominant while retaining a clearly recognizable context background
and aura at normal display size. Use composition, local contrast and selective detail;
do not fade the scene or energy until barely visible. Each layer toggle must create
an obvious difference while protecting face/costume readability. Retain layer controls.
Register whole frames by fixed anatomy/feet, not a changing cape's bounding-box
center, which causes the entire body to drift as cloth moves.
The full actor workflow includes its actual browser/action and portrait review;
see [live visual acceptance](../pawtrail-actors/references/visual-acceptance.md).

Review one character/style first. Compare the resting artwork with its original
portrait for pixel-style fidelity before inspecting the loop, seam and continuity.
A technically small/native export or a convincing sway does not pass the style
review. Check stable
face proportions/expression, attached roots, no missing pixels/ornaments, natural
cloth swing, unclipped bounds, consistent scale and clean transparency against
light and dark surfaces. Inspect actual movement, not just different frame hashes.

Respect workspace permissions for agents, tests, builds and browser review.
If motion review is unavailable or unauthorized, mark it pending; do not claim
the loop was visually verified or use it to approve the rest of the roster.
Avoid generating unrelated actors or styles while this candidate needs repair.

Deliver the artwork/loop paths, selected style, composition, moving parts, actual
runtime bytes and approval/review status. Full new-actor delivery includes actual
preview installation alongside the portrait and icon; do not report it complete
while its Illustration tab is missing or bound to another character. Distinguish
generation, installed preview, visual acceptance and live-game use. An installed
preview does not imply visual approval or promotion into game loading screens.
