---
name: pawtrail-hud
description: Create or refine reusable PawTrail game HUDs, dialogue panels and textured interface frames using the existing shadcn controls, pixel artwork and live game state. Use for in-game interface creation, not character portraits, body rigs or unrelated platform dashboards.
---

# PawTrail HUD Creator

Create a usable game interface that belongs to PawTrail's pixel world. Invoke as
`$pawtrail-hud` for dialogue panels, HUD layouts, quest/inventory/status surfaces
or reusable interface framing. Inspect the requested surface and preserve its
real behavior; do not turn a request for one HUD into a full game redesign.

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

Keep damage, HP/status, cooldowns and action completion/failure perceptible without opening a log. Pair color with readable text, numbers, icons or shape.

Reuse the existing event/feedback layer, pool or bound transient indicators, and
clean them up on reset/exit. Preserve contrast and useful reduced-motion feedback;
sound or color alone is insufficient. Keep local receipts distinct from confirmed
server saves/rewards. Review feedback under current verification permissions and
leave unobserved runtime behavior pending.

## Fast workflow with quality safeguards

Read the requested component, real state/callback contracts and relevant artwork
once. Carry forward known choices. Reuse approved textures, official shadcn
controls, shared HUD/dialogue components and portrait playback; do not create a
new renderer or per-character interface. Generate only missing/changed textures
and batch compatible work in one authoring/browser session.

Preserve required content, interactions, live callbacks, accessibility, native
artwork, responsive fit and existing review gates. Inspect the final composed UI
within authorized scope. Layout changes include long/translated text and narrow/
short viewport fit. Behavior changes include the affected reveal/speech timing,
choices, final-page actions, dismissal, keyboard/focus, pause/restoration and
reduced-motion paths; correct appearance alone does not establish these work.

Reuse prior checks only when the artifact, inputs and dependencies remain
unchanged. Shared dialogue, focus, state/lifecycle, renderer or binding changes
require broader review of their affected consumers. Expand after failures or
uncertainty; do not repeat passed unrelated checks or run broad application suites
for a texture-only edit. Explicit broader verification still applies. Keep
unavailable required live review pending and follow workspace permissions.

Update existing asset/implementation records and requested integration once after
corrections; avoid duplicate reports and repeated setup. Report the actual
bottleneck without dropping required states, viewport coverage or accessible
controls for speed.

## Start from the game

Read the active workspace's AGENTS.md and the current component, game state and
artwork before designing. The owner selects self-hosted **Pixelify Sans** for
this dialogue HUD: names, words, page counts and actions use the scoped
`--font-dialogue` token. Keep Saira Condensed and Instrument Sans in their existing
roles outside dialogue; this is a local game-font exception. The font and OFL
license live under `public/fonts/pawtrail/`.
Compose the actual official shadcn components in `src/components/ui`; use Tailwind
for ordinary layout and states. Keep actions small-radius, not circular pills.
Do not substitute painted buttons for real accessible controls or bake dialogue
text, names, icons and interaction labels into a background image.

The owner-selected dialogue design is **bottom center, character portrait on the
left and dialogue text/actions on the right**, using the owner's
[parchment dialogue reference](assets/dialogue-reference.png). Use a compact,
warmly framed portrait; a rust-red speaker ribbon with a paw icon; a separate
parchment speech panel with one left-facing
pointer and a faint paw watermark; diamond page markers/count below; and an
orange textured Next button at the lower right. The cream outer panel has a
thin wood/copper edge, fine inset rule and restrained leaf corners. Keep the
game visible above it and leave the outer close button easy to find. Names,
words, markers, icons and controls remain live UI. **Compact presentation is the
current default:** about 52rem maximum width, a 96×120 portrait on small screens
and a crisp 192×240 (2×) portrait from the small desktop/tablet breakpoint, small
name ribbon, 14–16px dialogue and modest actions. Do not restore the earlier
72rem panel, 3× portrait or oversized headings. **Omit the visible role badge**,
including Exploration guide; an accessible description can remain screen-reader
only. The reference guides materials/composition rather than large dimensions.
Reuse this baseline unless
the owner selects another direction. Other HUD types need their own practical
layout; do not force every inventory or status panel into a dialogue rectangle.

Treat the final compact layout as the implementation baseline: maximum 65dvh
height with internal overflow; 12px outer border (14px at `sm`); 112px portrait
column (208px at `sm`); 8px portrait-frame border; small 18–20px speaker name;
36px minimum-height Next action with 14–16px label; and small diamond/page markers.
The framed portrait is 112×136 on mobile and 208×256 at `sm`, leaving exactly
96×120 / 192×240 for its existing artwork. Grow the portrait only within that
responsive rule; keep the rest of the HUD compact. Reuse the current parchment,
red ribbon, speech pointer and orange action textures.

## Artwork and surfaces

The current skin is the six-part `dialogue-v2` texture set. Reference copies of
the [outer panel](assets/panel.png), [portrait recess](assets/portrait.png),
[speech panel](assets/speech.png), [red ribbon](assets/ribbon.png),
[action](assets/action.png) and [close control](assets/close.png) accompany this
skill. Use native export metadata for dimensions/slice cuts. Stretch only the
appropriate nine-slice regions; preserve corners, outlines and quiet reading
areas. The ribbon is a blank background sized to its live title, not a painted
name. Keep the single speech pointer separate from repeated/sliced edges.
The older `wood-frame.png` remains historical; it does not override the updated
parchment-reference design. Don't put noisy grain behind words or stretch a
finished screenshot containing a portrait and labels.

Reuse suitable existing artwork. Use the **imagegen** skill when new raster
texture, decorative material or frame artwork is needed. Give the generator a
specific native grid, material, palette, slice geometry and transparent interior;
request no text, UI screenshot, characters, gradients, haze or oversized decoration.
Inspect the generated source and export a compact native asset using previously
authorized production tools. Preserve prompt/source provenance and report actual
bytes. Image generation cannot guarantee exact nine-slice geometry; inspect the
real exported rails and corners. The included wood texture was generated with
ImageGen, then prepared with nearest-neighbor sizing and a limited palette.

## Dialogue behavior and portraits

Use the selected character's **existing approved dialogue portrait**, including
its actual selected style and character-specific authored speech/blink frames.
Do not substitute the gameplay body render, compact selection icon or loading
illustration. Use `$pawtrail-portraits` only when portrait artwork is genuinely
missing or its repair is requested. Keep authored facial performance inside the
portrait renderer; the HUD does not paint eyes/mouths or invent generic expressions.

Tie talking to text revelation and return the portrait to resting when words
finish or are revealed immediately. Preserve page boundaries, choices, enabled
states and real callbacks. Show text instantly for reduced motion and provide
an explicit way to reveal the remaining words. Announce complete paragraphs to
assistive technology rather than every character. Longer text and translated
names must wrap or scroll within the panel without hiding the final actions.
Keep typewriter/reveal work scoped and clean it up on page changes or dismissal.

Keep angle selection outside the dialogue HUD. Actor portrait previews expose a
separate **Portrait angle** selector using the
existing authored views for that collection. Use `PortraitAngleSelect` and
`resolvePortraitAngle`; don't invent missing views or reuse another actor's
angle. The choice is shared between the creator portrait and dialogue preview
through `actorComparison.portraitPose`, including selections made in the enlarged
portrait inspector via `onPoseChange`, and changes the existing renderer's pose
without resetting dialogue text. On opening or reopening a dialogue, use that
same selected pose rather than resetting to a default angle. The binding is
`actorComparison.portraitPose` → `Dialogue.portraitPose` →
`DialoguePortrait` → `LivingPortrait.pose`. The dialogue contains **no angle
dropdown, angle buttons or portrait-inspector controls**. Selection belongs only
to the portrait preview/enlarged inspector. Changing a pose must not regenerate
artwork or reset speech/page progression. Resolve unsupported poses against the
selected character's authored collection, never a different character's assets.
The 3D **Model angle** control stays independent.

## Integrate, don't duplicate

Read [the integration guide](references/integration.md) before implementation.
Use the shared `DialogueHud` for presentation and `GameDialogue` for conversation
progression. Reuse `DialogueNextButton` for the styled registry action and
`DialoguePageProgress` for dynamic markers/count. Actor preview demonstrations
must use this same surface and the
selected actor's own portrait. Existing quest/shop/care choices keep their real
callbacks; a preview dialogue must not grant currency, accept missions or modify
platform data. Do not create a second per-character HUD or attach a new global
dialogue to every frame of a running game loop.

Preserve focus management, keyboard dismissal, interaction blocking/restoration
and the game's pause policy. Dialogue and inventory overlays can use the shared
shadcn Dialog; an ambient status bar should not trap focus. Keep safe-area spacing,
mobile portrait/text columns and short landscape viewports usable. Pause only
the relevant preview/game scope and restore the exact prior state on close or
unmount. Support reduced motion without losing content or action feedback.

Scope authored transitions to opening/closing or meaningful state changes. Avoid
whole-HUD idle bobbing, looping glow behind text or per-character reflow. Leave
unrelated game/platform surfaces and authoritative rewards/data unchanged.

## Delivery and review

Provide a concrete preview entry point, asset paths/bytes, implementation notes
and any documented registry-source changes. Review matching portrait identity,
speech/rest timing, long text, final-page choices, close/continue focus, reduced
motion and viewport fit within the owner's authorized verification scope.
Respect restrictions on tests, builds, agents and browsers; source review is
not visual acceptance. Record pending live review honestly. Skill creation alone
does not apply a new skin to every HUD or authorize unrelated asset generation.
