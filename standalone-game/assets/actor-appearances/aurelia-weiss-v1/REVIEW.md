# Aurelia Weiss — Moonfeather Warden

Created from the supplied pink-haired feather-armored reference as an original
fictional PawTrail adaptation. The owner approved both illustration designs,
selected Refined cel portraits, and explicitly omitted voice creation.

## Delivered

- Normal and enraged Refined cel + painterly illustrations, 320 × 448, with
  continuously deformed pinned hair and feather panels over a repaired underlay.
  The face, torso, hands and costume attachment points remain anchored.
- Separate quiet moon-sanctuary context and feather-sigil aura layers. Enraged
  facial energy deforms independently; it reuses suitable painted energy from
  Sieghart v5, recolored and registered to Aurelia's own eye. No face artwork is
  shared between their identities.
- Three Refined cel portrait angles, six emotions, five authored facial states,
  and offline complete-frame chest-breath variants: 90 source drawings / 180
  complete frames. Runtime playback does not paint generic eyes or mouths.
- A dedicated coarse 40 px three-quarter icon from the approved normal artwork,
  inside the existing 48 px wood frame and selected glow. The first icon was
  replaced because its finer source lost eye readability when reduced.
- An illustration-led textured model on the existing articulated action rig:
  curved face/scalp, shaped overlapping pink locks, thick asymmetric feather
  crest, fitted front/back armor, rounded layered pauldrons, lilac skirt,
  eight tapered feather cape panels with textured lining and closed edges,
  knee jewels, bracers and boots. No new skeleton or movement replacement.
- A detailed generated feather/crescent ground sigil, contact shadow kept
  separate, character profile, preview registration and original dialogue.
- No voices, new weapon moveset, live roster promotion or account changes.

## Focused Firefox visual review — 15 November 2026

Used the real actor preview at
`/play?preview=actors&skin=aurelia-weiss&art=illustration`.
Evidence is in `output/playwright/aurelia/`.

Observed the model against its own approved illustration from front,
three-quarter, side and back, including enlarged inspection. Checked actual
idle, walk, run and the complete 34-option human preview action set at two
moments per action. This includes care interactions, crouching, sitting,
sleeping, emotions, floating, jetpack, dash and supply gestures. Sampled feeding
while moving, return to idle, actor switching and the shared Amber/Sieghart
walking presentation. Action captions select the corresponding portrait emotion.
The model intentionally retains the established stylized gameplay scale;
full-body artwork uses mature adult proportions.

Repairs made during review:

1. Feather panels initially angled inward and hid behind the body. Their root
   spread now fans outward, with tapered geometry and a painted reverse.
2. Eye artwork initially sat behind the separate fringe. The face UV source
   region now includes forehead room so eyes sit below the modeled bangs.
3. The first small icon lost its eyes. A specifically coarse icon was generated
   and reviewed at the actual 40 px native export.

Reviewed all 3 × 6 portrait angle/emotion combinations in the inspector with
speech active and repeated captures over blink/breath cycles. Inspected exported
rest, half, closed, small-mouth and open-mouth cells against their own source
drawings. Happy rest has character/pose-specific eye behavior; it does not use
one universal closed-eye assumption. The selected three-quarter portrait also
appears in the actual compact dialogue HUD with Aurelia's own text.

Reviewed both illustration variants across multiple complete five-second loops
with background/aura hidden, then restored the independent layers. Hair tips and
feather hems visibly change position while the face/body remain stable. The
enraged energy changes its arc shape around the eye. Pause captures remain
identical; restart/play, reduced-motion stills and mobile presentation work.
The ground sigil remains anchored beneath idle/moving/floating presentations.
At 390 px, document width is 390 px. No browser console errors were recorded;
Firefox emitted font-preload and a resize-related WebGL viewport warning.

No automated test suites, typechecks or builds were run. This is focused visual
review under the owner's actor-skill authorization, not a whole-site audit or a
claim that every continuous animation frame has been manually inspected.

## Size and provenance

The complete portrait style is **289,795 bytes**, below its 300,000-byte limit.
Active runtime asset folders total **1,198,869 bytes** (illustrations, portrait,
icon, model textures, sigil and profile; excludes shared code and authoring files).
These are separate budgets: the entire actor package is not a 300 KB download.
Assets load through the existing preview/layer infrastructure.

See `delivery-sizes.json`, `portrait-export.json`, `illustration-export.json`,
`model-texture-provenance.json`, the exact saved prompts, generated source files
and `generated-sources.json`. The large originals/native review drawings remain
on the other drive for future scoped edits. The skill and shared renderer were
reused rather than rebuilt for this actor.
