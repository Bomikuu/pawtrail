# Visible interaction outcomes

The owner requires every interactive result to visibly register. Reuse a clear
existing state change when sufficient; avoid adding a toast to every keypress or
animation frame. Logs and audio support feedback but do not replace visible
outcomes. Combat contact needs an actual animated impact sprite on the affected
body as well as numbers and status information. Numbers, tint and ground rings
alone do not satisfy the owner's hit-feedback requirement. This applies to future
interactive work in the PawTrail skills.

## Combat implementation

`src/game/feedback/visual-feedback.ts` provides a bounded event-driven queue,
action outcome tracking and a Canvas2D painter. It does not create renderers,
textures or animation-frame caches. The current monster preview uses it for:

- Actual boss and player damage, drawn above the affected target. Armor and
  weak-point captions accompany their numbers; color alone never
  supplies the meaning. Numbers use Saira Condensed and captions Instrument Sans.
- Named incoming attack damage, phase changes, seal breaks/stagger and defeat.
- Cooldown/busy feedback and confirmed blocked attacks. A miss is reported only
  after the accepted cast and all its projectiles have finished without a hit or
  block. Cancelling/resetting an action must not create a miss.
- A visible, polite live-status summary in the HUD, retained after transient
  numbers expire. HP and bar counters still read canonical encounter state.

`MonsterEncounter` emits accepted outcome events. Damage numbers use actual HP
removed after armor/vulnerability and overkill clamping, never a nominal weapon
value or an attack animation. Rejected, duplicate and zero-damage calls do not
produce a successful damage receipt. Fictional local combat remains separate
from community animals, server inventory and verified Kibble.

`hit-impact.ts` and `hit-impact-view.ts` add original generated contact artwork:
eight gold slash/spark frames, eight cyan weak-point frames and eight orange fire
impact frames. They play at the struck seal/throat or the player's body, not on
the floor. `monsters/contact-feedback.ts` selects sprites only from accepted
positive damage events; casts, misses, cooldowns and phase messages never spawn
a successful hit burst. Incoming fang/sweep contacts use a warm slash tint.

The shared transparent atlas is 256 × 384 pixels (24 native 64 × 64 frames,
145,885 bytes). Its twelve reusable billboard sprites share one image source,
use nearest-neighbor playback and expire after 333–417 ms. Bursts replace the
oldest slot at capacity instead of allocating more materials or scene objects.
Reduced motion holds the authored peak for 140 ms with no moving fragments.
Pause/reset clears sprites; exit also disposes textures and materials. The source,
exact generation prompt, manifest and three animated review exports are retained
in `assets/combat-effects/hit-impact-v1/`. The supplied stock sheet was a style
reference only and is not a runtime asset.

The transient queue holds at most 16 entries for 1.1–1.3 seconds. Same-target,
same-region short bursts may combine; different targets or damage categories
do not merge. Reduced motion retains the number and caption without floating or
flashing. Indicators project from the real camera and affected world position.
Pause/exit clears pending receipts and labels; reset also replaces the summary.
Finite visible labels may keep drawing only until they expire. No continuous
idle rendering or unbounded color/bitmap caches are reintroduced.

## Other interactions

Furniture should show the actual seated/occupied, rotated, toggled or blocked
state. Saves, construction and resources need pending/completed/failure feedback
from their actual operation, with local receipts distinguished from server
confirmation. Portrait/icon/illustration bindings expose relevant dialogue,
selection, readiness and activation states. Artwork-only requests do not gain
unrequested combat or gameplay scope from this requirement.

## Standing skill instructions

The requirement is included in the nine personal `pawtrail-*` skills, the project
monster/weapon/furniture-batch skills, and the studio furniture-batch source.
The installed furniture skill's ownership hash was updated after confirming its
previous managed version. `AGENTS.md` carries the project-wide requirement.
No unrelated plugin skills or verification permissions were changed.

## Verification — 12 November 2026

All 40 focused combat, feedback, fire, geometry/resource and pixel-memory tests
passed. New coverage includes all contact frames, exact expiry, confirmed damage
binding, shared atlas ownership, body-height placement, fixed twelve-sprite reuse,
reduced motion and idempotent disposal. The atlas returns HTTP 200 `image/png`
with the correct PNG signature. Native artwork and true alpha were inspected;
no browser or WebGL renderer was launched. Complete live readability and
animation review remain pending. Logs and asset evidence are in
`output/playwright/vaelrith/hit-impact-tests.txt` and `hit-impact-asset.json`.
