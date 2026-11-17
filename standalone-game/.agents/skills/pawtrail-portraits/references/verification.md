# One-style visual acceptance

The review unit is `(character, style, angle, emotion)`. A pass for neutral/front
does not cover angry/head tilt. Reuse common review tools, not verdicts from
different units. During a focused repair, valid observations for an exact
unchanged unit and its inputs/dependencies can remain in the existing matrix.
Changes to source art, extraction, renderer or bindings invalidate the affected
observations and transitions. A new/rebuilt style still needs its complete
requested matrix; a failed or pending required unit prevents a pass.
Maintain a small report in the project alongside evidence; do not invent evidence
paths, silently omit failed states, or mark unobserved combinations as passed.

## Compare the right stages

Keep these distinct:

1. Appearance/style reference: identity and intended visual language.
2. Original generated artwork: whether the authoring actually expressed the intent.
3. Native exported resting and motion frames: whether extraction/alignment changed it.
4. Actual renderer output: whether compositing/timing/transitions changed it again.

A live canvas matching its processed PNG proves only export-to-display fidelity.
It cannot approve an awkward expression already baked into that PNG. Similarly,
successful loading or seven distinct frames proves activity, not animation quality.

## Review matrix

Speech acceptance is independent of voice generation: exercise Speaking preview
and real dialogue text reveal for each requested angle/emotion, including silent
characters. Observe authored mouth-shape changes, compatible blinks/breathing and
return to rest. If captures miss the motion, inspect it live or capture again.
A speaking label/flag or generated but unused frames cannot establish talking.

For every requested angle and emotion in the selected style, observe the following
at native/integer zoom and intended display size. Use still frames to diagnose and
normal-speed playback to judge the performance.

The current default is front, three-quarter and head tilt: with six emotions this
means **18 pose/emotion combinations**. Do not generate or review a side profile
just because a historical pack or capture script contains it. Include it only if
explicitly requested, and adapt the capture grid to the actual retained poses.
The initial displayed angle is **three-quarter**, while front and head tilt remain
selectable. Resolve the manifest's three-quarter pose by ID and verify it in the
creator and dialogue. Preserve an explicit/saved alternate angle. The dialogue
uses the preview's selected angle without adding its own angle selector.

| State | What must remain correct |
| --- | --- |
| Rest, breathing off | Identity, expression and intended authored facial details; stable scale/registration |
| Half and closed blink | Natural lid arc; lower iris where appropriate; no doubled eye, ghost whites, skin rectangle, sliding lash or overwritten emotion brow |
| Small/round speech and resting beats | Lips stay on their own anchor; cavity/teeth/corners fit this emotion; no copied neutral grin, floating mouth or jaw corruption |
| Breathing alone | Subtle torso motion; face proportions, hair, ornaments and lower bust anchor remain stable; no clipped neckline or brooch |
| Speech + blink + breathing | No overlap artifact; selected mood stays recognizable throughout the loop |
| End of speech | The selected emotion's resting mouth returns, including after interruptions |
| Emotion change during speech/blink | New emotion receives its own compatible eyes/lips immediately; no previous face fragment remains or flashes |
| Angle change during playback | Correct left/right/profile/tilted landmarks, no resizing jump, partial old pose or silhouette clipping |

Include neutral → smile → happy → sad → angry → surprised → neutral when those
emotions are in scope. Change emotion mid-speech and mid-blink, stop/restart speech,
then change angle. For narrower requests use the requested states, not extra scope.
Observe more than one blink and a complete breathing cycle; don't approve from
one fortunate captured frame. Eyes tilted at different heights need separate
anchors; a profile can need a lip silhouette change or a distinct blink shape.

Check pause/resume, reduced motion, hidden/offscreen handling and restored resting
state when the task changes these behaviors or when integrating a new performance
for the first time. Confirm desktop/mobile fit in the actual studio when live
review is authorized. Reuse the existing renderer rather than reimplementing it.

## Evidence and decisions

Record, at minimum:

- Character, selected style, candidate revision and exact original source paths.
- Requested poses/emotions and native dimensions.
- For each pose/emotion: rest, blink, speech, breath, combined playback and transitions
  as **pass**, **fail** or **pending**, with a short concrete note for failures.
- Evidence that can be opened: contact sheet, short animation or sequential live
  captures. Record browser and viewport for live observations. Wait for selected
  character, decoded asset and closed menus before capturing; two rAFs alone may
  precede React/asset updates. A screenshot under a new label may still show old art.
- Complete-style byte count and distinction between generated sources and runtime.
- A single style verdict. Any failed/pending required state prevents a pass and
  blocks the next style. State the exact remaining work; do not average failures
  away because other expressions look good.

Do not require manual owner approval after every internal operation. The gate is
the requested visual quality, supported by observations; ask for an aesthetic
choice or final approval only when the owner requested it or a choice is missing.
Respect explicit prohibitions on automated tests/checks. Native production and
authorized visual review are not permission to run a broad test suite.

## Repair failures locally

Find which stage introduced the problem. If the generated expression is wrong,
reauthor it. If a native extraction/anchor is wrong, fix that extraction. If the
renderer composes a stale or incompatible layer, fix its binding/state handling.
Do not regenerate all styles, conceal the problem by disabling speech on an emotion,
or reduce animation until it barely moves. Correct the current style's performance,
re-review it, then proceed. If a source frame is missing, author a suitable replacement
rather than silently substituting a different emotion's mouth.
