# Focused live visual review

**Passed the requested scope in the Codex in-app browser.** No product changes
were needed during this review. This is acceptance of the requested performances,
not a blanket approval of unrelated styles, emotions or gameplay systems.

| Amber Shy angle | Rest | Half / closed blink | Small / open speech | Automatic combined playback | Return to Shy rest |
| --- | --- | --- | --- | --- | --- |
| Front | Pass | Pass | Pass | Pass | Pass |
| Three-quarter | Pass | Pass | Pass | Pass | Pass |
| Head tilt | Pass | Pass | Pass | Pass | Pass |

The actual rendered states retain the shy brows, lowered gaze and facial details.
There are no floating mouth parts, doubled eyes or face patches. Automatic blinks
complete and speech resumes afterward. Stopping speech restores the selected Shy
resting face. Switching the actor inspector's angle during speech retains Shy
and displays the correct complete portrait for each angle.

Amber's front neutral breathing reads as a restrained pixel-art idle. The full
actor illustration retains visible hair/ribbon/coat movement and planted feet,
with the legs/boots fully visible. Vaelrith's illustrated necks and heads move
around a stationary wall, with no clipping or conspicuous loop discontinuity
found in the captured cycles. The boss portrait also uses its calmer held breath.
Browser error logs were empty for both tabs when inspected.

Timed native full-window captures covered 8.8 seconds for front neutral and each
Shy combined performance, 10.64 seconds for Amber's 4.8-second illustration,
11.04 seconds for Vaelrith's 5.15-second illustration, and 8.8 seconds for its
4.2-second portrait. More than one automatic blink is visible in every Shy
combined capture. Controlled states were also reviewed separately at 3× native
portrait size. Pixel-change counts were used only to organize the evidence;
they were not treated as proof of natural movement.

- `shy-live-state-matrix.jpg`: 15 actual rendered states, cropped from full UI captures.
- `shy-auto-playback-variants.jpg`: the distinct complete drawings observed during automatic combined playback, with capture timestamps.
- `front-neutral-breathing-live.gif`: actual front neutral playback.
- `front-shy-combined-live.gif`, `three-quarter-shy-combined-live.gif`, `head-tilt-shy-combined-live.gif`: automatic breathing/blink/speech playback.
- `amber-illustration-live.gif`, `vaelrith-illustration-live.gif`, `vaelrith-portrait-live.gif`: actual actor/boss motion.
- `amber-shy-final-context.jpg`, `vaelrith-final-context.jpg`: final previews with their surrounding UI.
- `visual-review.json`: source publication, viewport sizes, observations, captured blink times, scope and limitations.

Initial attempts with the browser's clipped screenshot API returned the wrong
area. The `shy-front-rest/`, `shy-front-speaking/` and `shy-front-context.jpg`
captures are excluded. Accepted evidence uses the native full-viewport capture
API; face crops were made afterward solely for visual comparison.

The boss portrait's pause was observed holding its frame. Play art was restored;
no separate complete post-resume cycle was recorded. Mobile fit, OS reduced
motion, other unchanged emotions/styles, combat and voice listening were outside
this focused run. No automated suite, typecheck or production build ran. Runtime
artwork/timings remain unchanged from the calm-idle/Shy revision.
