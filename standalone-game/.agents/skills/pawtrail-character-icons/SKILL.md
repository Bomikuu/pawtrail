---
name: pawtrail-character-icons
description: Create compact PawTrail character icons from approved animated illustrations, with coarser pixel clusters and square head-and-shoulders framing. Invoke independently or during PawTrail Actors creation; not dialogue animation, gameplay sprites or real animal profile photos.
---

# PawTrail Character Icons

Create a small static character-selection/profile icon that looks like the
approved **normal animated illustration**, simplified into more obvious pixels. This is a
separate 2D asset from the animated dialogue bust and the 3D gameplay body.
Actor creation calls this skill once the illustration direction is established;
it is also independently callable as `$pawtrail-character-icons`.

**Default angle: three-quarter**, unless the user specifies another icon angle.
Use an approved three-quarter illustration still or matching static view as the
usual source. If the hero pose lacks that angle, create a matching dedicated icon;
a frontal crop does not become three-quarter through relabeling. Keep angle as an
explicit authoring option; changing the portrait preview angle does not silently
replace a saved icon or request a batch of all angles. The icon retains the
illustration's style even when the dialogue portrait uses a different style.
Use the normal performance unless the user requests an enraged icon. An independent
request with an explicit different source keeps that scope; it does not require
creating an otherwise unrequested full character illustration package.

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

Interactive icon bindings need visible selected, focused, disabled and relevant availability/cooldown states. Static icon generation does not authorize adding combat or unrelated UI.

Reuse the existing event/feedback layer, pool or bound transient indicators, and
clean them up on reset/exit. Preserve contrast and useful reduced-motion feedback;
sound or color alone is insufficient. Keep local receipts distinct from confirmed
server saves/rewards. Review feedback under current verification permissions and
leave unobserved runtime behavior pending.

## Fast workflow with quality safeguards

Read the approved illustration/style and icon contract once. Carry forward known
choices and suitable approved artwork. Reuse native export tools, the shared
icon component and existing frames; do not recreate chrome or regenerate a whole
character package for an icon edit. Batch compatible icons into one review board
and generate/export only missing or changed art and affected derivatives.

Every delivered icon still needs its own identity/style comparison at 1× and
integer enlargement, readable coarser pixels, unclipped features, transparency,
correct native/display size and actual byte accounting. Batch review must inspect
each icon; one good icon does not approve the others. Keep existing review gates.

Reuse prior evidence only for unchanged artifacts, inputs and dependencies.
Artwork-only changes need focused art review. Shared frame/control/binding changes
also require the affected selected/unselected, keyboard-focus, reduced-motion,
size and layout checks within authorized scope. Expand review after failures or
uncertainty; avoid rerunning passed unrelated behavior. Required unavailable live
review stays pending, never passed.

Update the existing manifest, acceptance and requested binding once at completion.
Avoid duplicate reports, repeated browser setup and broad application tests for
static artwork. Report an actual bottleneck without dropping identity details or
required checks.

## Style and identity inputs

Read the workspace's AGENTS.md and relevant actor/illustration metadata. Inspect the
character reference, its approved normal illustration and this skill's
[owner-provided icon board](assets/icon-style-reference.png) with an image tool.
The board guides **compact framing and small-icon readability**. The character's
approved illustration remains the authority for identity and art style; do not import
another face, costume or art direction from the example grid.

Carry forward the approved illustration's style: the default combines new
Sieghart's mature painted detail with old Sieg's pixel texture, cel structure and
semi-bold edges (**Refined cel + painterly**). Keep another explicitly selected
illustration direction when applicable. Do not inherit a separately selected
dialogue portrait's style. If the source/direction is genuinely missing, ask one
focused reference question before generating; preserve an independently requested
alternative source. Do not batch styles or regenerate dialogue portraits for an icon.

Preserve recognizable face proportions, hair parting/silhouette, eye color,
signature ornaments and visible clothing. Simplify minor embroidery before
removing an identity-defining hat, fox ear, glasses or hair ribbon. Different
actors still need their own crop, face shape, feature placement and pixel clusters;
the same square canvas does not imply identical faces.

## Compact pixel treatment

- Prefer a **48×48 native** static icon. Use an existing destination's native
  contract first; consider 64×64 for elaborate silhouettes that lose identity at
  48. Treat these as starting sizes, not a requirement to enlarge every character.
- Frame the head and a little shoulder/upper chest, as in the reference board.
  Keep the face dominant, eyes readable and the chin visible. A slight
  three-quarter pose is the default; retain a different explicitly selected angle. Leave
  deliberate room for the top of hair/ears/headwear rather than cutting them off
  or shrinking the face to fit the entire body.
- Make the pixels coarser than the illustration's head crop: fewer/larger hair clusters,
  discrete skin planes, simple readable irises, stepped edges and restrained
  highlights. Preserve the selected style's contour and shadow language. A
  Refined cel icon is a simplified Refined cel drawing, not a switch to Console
  icon or a smoothed illustration with a pixel filter added afterward.
- Use a bold hair/outer silhouette and a finer cheek/jaw separation where skin
  would merge with the shoulders. Inspect shape and contrast separately;
  don't narrow every face merely because the jaw edge is missing.
- Keep sharp native edges, a cohesive limited palette and upper-left light cue.
  Avoid antialiasing, blur, smooth gradients, noisy dithering, text, watermarks
  and tiny ornamental marks that disappear at actual display size.
- Use square tile framing rather than automatically masking the character into
  a circle. Preserve transparent character art when possible; put the small-radius
  frame/background in the UI so selection states don't require duplicated images.
  The board's blue border is framing guidance, not a mandate to recolor PawTrail's
  app chrome. Supply a flattened/framed variant when the requested destination
  actually needs it.

Normal character selectors should display these like desktop/mobile app icons:
**48×48 pixels on screen**, with a compact label and small-radius frame. Do not
turn them into large portrait cards or enlarge them at desktop breakpoints.
If the master is 64×64, prepare a crisp native 48×48 display export rather than
stretching it fractionally. Reserve enlarged views for explicit inspection; the
separate animated dialogue portrait may stay large.

The owner's selected presentation is a **woody pixel frame with a visible warm
background**, retaining the board's stepped corners and hard bevel. Use brown
wood tones, restrained pixel grain and a cream backdrop. **Wood is the default
frame in both states. Active selection adds a glowing pixel rim** over that frame,
with a warm amber halo and a gentle opacity pulse. Do not replace wood with a
different solid-color frame or rely only on the button background. Keep a steady
glowing rim for reduced motion and preserve the parent's selected state. Keep both states
at the same 48×48 size so selection does not shift the layout; use native 40×40
art inside the four-pixel frame allowance. Reuse `shared/character-icon.tsx` with
its `active` prop: `icons/pixel-frame.svg` is the persistent wood frame and
`pixel-frame-active.svg` is the transparent glowing-rim overlay in PawTrail.
The parent shadcn button owns keyboard focus and `aria-pressed`; the decorative
frame does not become a second control. Preserve visible focus separately from
selection. Keep chrome separate from transparent art and the large portrait.
Only change this framing when the owner chooses another treatment.

## Author and export

Inspect every actual 40 px artwork / 48 px framed result in the selector. Face,
eyes and chin must read at that size. A generic top-left/full-cell crop is not
sufficient: use this actor's head bounds, leave enough hair/headwear, and avoid
cropping the face below the frame or shrinking it to show the whole bust. If a
illustration crop cannot achieve that, generate a dedicated compact icon. Check the
selected glow and neutral frame in the live preview. Full actor review follows
[live visual acceptance](../pawtrail-actors/references/visual-acceptance.md).

Reuse an approved illustration crop/downsample only if it retains the intended
silhouette, facial readability and deliberately simplified clusters at native
size. Otherwise use the **imagegen** skill to make dedicated reference-guided
icon artwork. Do not substitute a 3D body screenshot or code-drawn face for the
requested illustration-derived icon. Use built-in ImageGen unless the user explicitly
chooses another supported generation route.

A useful prompt structure is:

> Create one static [character] selection icon using the attached approved
> [selected style] normal animated illustration/resting still for identity and
> style, with a matching static three-quarter view when needed. The dialogue
> portrait is not the icon's style authority. Use the icon board only for
> compact square head-and-shoulders framing. Use three-quarter view unless a
> different icon angle was selected. Preserve [specific hair, eyes,
> ornaments, clothing]. Simplify to a deliberate [48×48 or chosen size] pixel
> design with larger stepped clusters than the illustration, a readable face,
> distinct cheek/jaw edge and a clean silhouette. [Transparent background or
> requested framed composition]. No text, blur, antialiasing or style drift.

Keep generated originals, reference provenance and the exact prompt with the
actor's authoring assets. Follow imagegen's editing/processing authorization;
use already granted production-pass permission where applicable rather than
asking again. Native resizing uses nearest-neighbor and no dithering. Pixel
cleanup may be needed; reducing a large detailed picture alone is not evidence
that a good small icon was produced.

Export a crisp transparent PNG or appropriate lossless WebP at the native size.
Avoid distributing the full generation canvas as the runtime icon. Aim for a
few KB and report actual bytes; do not spend the dialogue portrait's 300 KB
bundle allowance on a static icon. Keep the dialogue bundle's own accounting
separate and follow any explicit combined budget from the user.

Default project destinations, adapted to existing conventions when needed:

- Authoring: `assets/actor-appearances/icons/<actor-id>/<style>/` for reference,
  generated source and prompt.
- Runtime: `public/pawtrail-game/actor-studio/icons/<actor-id>/<revision>/icon.png`.
- Record actor/style IDs, native size, crop/content bounds, source provenance,
  revision and runtime bytes in a small authoring manifest. This does not add
  fields to account saves or claim that the existing API accepts an icon URL.

For integration, inspect actual catalogue/UI contracts first. The current actor
registry's `portrait` may be a **gameplay body thumbnail**; do not silently
replace it with a head icon or overwrite the dialogue collection. Use an explicit
character-icon field/binding where supported. When UI work is in scope, compose
official shadcn controls and Tailwind utilities, preserve small-radius framing
and use nearest-neighbor display at integer multiples. New icons do not alter
actual user/animal photos, saved appearance records or gameplay abilities.

## Review and handoff

Inspect each icon at 1× and an integer enlarged size beside the normal illustration's
head crop or matching static view. Record the exact source frame/revision and angle.
Look for recognizable identity, consistent art style, actual coarser pixels,
readable eyes, a distinct jaw, unclipped ornaments, clean transparency and balanced
framing. A row of icons should have comparable **visible face size**, not just
identical canvas dimensions. Prefer targeted fixes over regenerating all icons.

Inspect the supplied reference and exported raster artwork as part of creation.
Follow workspace permissions for browser verification, tests, agents and builds;
do not run broad application checks merely for an icon. Mark installation/live
review pending if it was not performed. Deliver the icon, chosen style/native
size, saved path, actual runtime bytes and whether it was integrated. In the actor
workflow, carry it into that actor's acceptance record; icon acceptance does not
replace the separate body action or animated portrait review.
