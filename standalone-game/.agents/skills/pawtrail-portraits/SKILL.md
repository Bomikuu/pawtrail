---
name: pawtrail-portraits
description: Create or repair reference-guided PawTrail 2D dialogue portraits with character-specific emotions, blinking, speech and breathing. Verify one style completely before starting the next. Invoke independently or from PawTrail Actors or Cats; not for gameplay body rigs.
---

# PawTrail Portraits

## Living idle motion — owner preference

Keep the selected angle and emotion, with naturally paced, visible breathing.
The front view defaults to a held head and restrained chest/shoulder breathing;
avoid conspicuous bobbing or continuous head turning. A resting breath commonly
takes about 4–5 seconds. Other angles may retain small facial/head movements.
The owner rejected the fast 1.5-second portrait loop; more drawings should smooth
a chosen movement, not make it faster or busier. Keep blink and speech timing
independent of the slow breathing cycle.

For a pacing repair, preserve the liked face artwork, expressions and authored
blink/speech states. Reuse suitable complete breath drawings and adjust their
sequence/timing; do not redesign faces or regenerate the whole pack. Richer
head/neck movement and larger frame sets remain options when explicitly wanted.
Do not orbit the camera, cycle the angle selector, or slide/scale the whole picture.
A new emotion such as shy needs its own complete resting, breath, blink and
speech art in each requested angle. Offer it only in styles with actual matching
artwork. Keep the complete style within its existing byte budget.

Create a recognizable illustrated or pixel-art head/shoulders/upper-torso portrait
that retains its expression while it moves. This skill is independently callable
as `$pawtrail-portraits`; actor and cat creation use the same workflow for their
portrait portion. Do not change a gameplay body or saved appearance merely to
create its portrait.

**Owner defaults for new or rebuilt portraits:** at most **300,000 bytes (300 KB,
decimal) per complete selected style**, covering all served animation data,
metadata and reference/poster images. Use **three angles: front, three-quarter
and head tilt**. Omit the side profile from generation, exports and review unless
the owner explicitly requests it. Existing four-angle packs and original design
references do not override these defaults; changing the skill does not itself
authorize rewriting existing assets. Keep every requested emotion, blink, speech
and breathing state in each retained angle.

The **initial displayed angle is three-quarter**, with front and head tilt still
selectable. Resolve its actual pose ID from the manifest instead of assuming an
array index. Preserve an explicit angle, current selection or saved preference.
Use the selected angle in dialogue; keep angle selection in the portrait preview
rather than adding controls to the dialogue panel.

**Work one style at a time.** A request for several styles is a queue, not permission
to generate and integrate them all before reviewing motion. Complete steps 1–5
for the current style before starting another. A failed or incomplete review keeps
that style in progress. The owner identified Yae Miko Sharp cel as a failed motion
case in both the V1 and V2 patch-based exports. Their old “reviewed” reports are
not approved patterns to copy. The owner chose complete authored frame playback
instead; the V3 trial has its own fresh review and cannot approve other styles.

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

When integrating portraits, make actual dialogue, expression and action states perceptible. An artwork-only request does not authorize new gameplay or combat.

Reuse the existing event/feedback layer, pool or bound transient indicators, and
clean them up on reset/exit. Preserve contrast and useful reduced-motion feedback;
sound or color alone is insufficient. Keep local receipts distinct from confirmed
server saves/rewards. Review feedback under current verification permissions and
leave unobserved runtime behavior pending.

## Fast workflow with quality safeguards

Read the current character/style job, sources and manifests once. Reuse suitable
approved drawings, complete frames, extraction tools and the shared renderer;
do not rediscover or rebuild playback for each emotion. Generate/export only
missing or changed artwork and its affected derivatives. Reuse one authoring/
Firefox session for the selected style. Keep work one style at a time.

This does not reduce the requested emotions, angles, authored blink/speech/breath
states, style fidelity, complete-bundle byte cap or existing visual gates. A new
or rebuilt style must pass the complete requested matrix before the next style.
Inspect the final exported drawings and actual full-cycle playback; source code,
hashes or an old reviewed label cannot replace visual evidence.

For a focused repair, retain valid observations only for the exact unchanged
review units and dependencies. Recheck affected frames, combinations and
transitions. Source registration, exporter, renderer, timing/cache or binding
changes can affect many units and require wider review. Never inherit acceptance
from a different character/style/angle/emotion. Expand checks when a failure or
uncertainty warrants it; do not repeat passed checks without a relevant change.
Keep unavailable required reviews pending and respect verification permissions.

Use one combined review/evidence set and update the existing style matrix,
manifest, byte accounting and installation record once after corrections. Avoid
duplicate reports, broad application suites and unrelated style generation.
Report the actual bottleneck; no speed target waives a required state or gate.

## 1. Inspect the visual reference

Open every relevant reference with an image-viewing tool. Distinguish identity
from art-style references. Record recognizable face proportions, hair silhouette,
eyes, accessories, clothing, framing and palette. Keep local source provenance.
If repairing an existing portrait, inspect both its original generated artwork and
its live exported animation before choosing a fix. Don't assume an exporter or
manifest described as verified is visually correct.

## 2. Choose the style and state the prompt

**Recommend Refined cel, and ask the portrait-specific style question for each
new actor/portrait job.** Show the actual existing Amber examples before that
choice. See [style choice and visual examples](references/style-choice.md).
The animated illustration may already use Painterly anime fantasy; its style
does not answer the portrait question. A portrait style explicitly chosen by
the user for this job is already an answer; do not ask redundantly or generate
every option. Existing approved portrait repairs retain their chosen style.

An explicitly requested painterly anime fantasy portrait is a separate supported
direction. Preserve mature face construction and smooth painted shading with its
own style/rendering metadata; do not relabel it as Refined cel or force pixel-art
display. Keep complete authored expression/blink/speech/breath states and measure
the existing whole-pack byte cap. Optimize transparency and encoding before
reducing fidelity; never silently remove angles or states to make it fit.

If the user has not selected a style, ask which to apply before generating art.
For the existing pixel collection the choices are **Refined cel (recommended)**,
Sharp cel, Compact fantasy, Sparse anime, Console icon and Rough manga. Also offer
**Painterly anime fantasy**, the separate smooth style used for Sieghart.
They are options, not a default batch. Distinguish available example artwork from
styles actually generated and approved for the requested character.
Honor a supplied style reference rather than forcing one of these names.

Follow the [style contracts](references/style-contracts.md). Lock the selected
design against its original reference before generating motion sheets. Compare
one resting front pose at equal native zoom for proportions, outline/cluster
geometry, shading and highlights. Matching resolution/palette or passing motion
review does not establish style fidelity. Correct drift before expanding. Never
replace a named style with a different look; retain it as a new style only when
the owner requests that classification. The V3 Yae Miko whole-frame output was
retained as **Refined cel**, not accepted as Sharp cel. Original Sharp cel references
remain the design authority. The fresh `yae-sharp-cel-rebuild-v1` job rebuilds its
complete-frame animation from those original references, independently of Refined
cel. Read that job's current review rather than inheriting the V3 trial's result.

If the user already chose a style, continue without asking again. State the
selected style and the actual generation prompt/brief, including native size,
framing, palette, requested poses/emotions and identity invariants. Use the current
request's scope; do not silently multiply styles or camera angles. For a repair,
keep the approved art direction and neutral appearance unless a redraw is needed
and explained. No extra stage approval is required unless the owner requested it
or a genuinely missing choice blocks the work.

## 3. Author the 2D artwork and emotions

Use the imagegen skill for new raster artwork. Reuse suitable approved art and
authorized local production tools for cropping, alignment and native exports.
Keep a complete authored resting base for every requested pose and emotion.
Review those static expressions against the reference before animating them.

Plan the facial performance with the artwork. Each character/style/pose/emotion
needs compatible blink and speech artwork, its own landmarks and an expression
intent: brows, eye opening, lip corners, teeth visibility and mouth opening.
Angry speech must still look angry, sad speech sad, and surprised eyes must return
to their wide resting shape. An already closed happy eye may intentionally hold.

Prefer manageable sheets with complete, equally sized cells and clear registration.
Reject clipped or ambiguous cells; don't stretch them or quietly replace requested
speech with a surprised/happy mouth. Preserve versioned originals. Don't rebuild
the face with generic eyelids, guessed skin fills, RGB-threshold feature fragments
or a neutral mouth transferred to every emotion.

## 4. Animate and verify this style

Talking is required independently of voice generation. In every requested angle
and emotion, exercise Speaking preview and actual dialogue text reveal. Observe the
character's authored resting/small/open mouth drawings visibly change, then return
to the matching rest when text finishes or dialogue stops. Keep compatible blinks
and breathing. An active speaking button/flag with a still mouth is failed integration,
even if speech artwork exists. Follow the complete-frame rules below and the actor
[performance contract](../pawtrail-actors/references/illustration-performance.md).

Check actual creator/dialogue display framing, not only the source sheet. Measure
tight visible content across the complete states and angles; transparent cell
padding must not force a small face or leave a large empty area above the head.
Preserve native whole drawings, use integer display zoom, and check the chin and
hair remain visible through all states. Full actor deliveries also follow the
[live visual acceptance](../pawtrail-actors/references/visual-acceptance.md) with
action-linked emotions. Respect the latest verification permissions.

Reuse the shared renderer, cache, dialogue and lifecycle code. **Shared playback
is desirable; shared neutral facial performance is not a default.** Own the
complete artwork, whole-frame registration, timing and breathing-frame settings in
portrait data. A reused motion frame needs demonstrated anatomical and emotional
compatibility in the current pose; record that evidence. A filename change or
distinct frame ID does not make copied artwork expression-specific.

**Use complete authored portrait frames by default.** The owner rejected runtime
eye/mouth patch compositing. Play full resting, blink and speech images. Do not
procedurally paint lids, replace lips, morph faces, blend emotions or displace the
face for breathing. Prepare idle breathing offline as a complete image. Runtime
code selects/decodes images only.

Use all suitable generated artwork and record its source-to-frame mapping. If
existing native PNGs already contain patch artifacts, simply baking/renaming them
does not repair them. Inspect jaw, chin, neck and hair too. Use intact full-portrait
sources; author missing complete motion drawings when only cropped face sheets
exist. Explain why new art is needed and retain prior good sources as references.

Register whole drawings with a uniform native scale and whole-frame translations.
Inspect real sheet gutters: nominal division can clip a character or retain bits
of its neighbor. Preserve detached ornaments. Do not shift individual eyes/lips.

Without a supplied combined blink/speech drawing, speech briefly yields to a full
blink frame and resumes afterward. Never manufacture a mixed face. Already closed
resting eyes can skip automatic blinks. Manual inspection can show every supplied
drawing. Legacy deltas remain compatible; obtain a specific owner choice before
reintroducing live facial assembly for new portraits.
Protect the selected emotion's brows, lip corners, face outline and accessories.
When integrated into an actor creator, select the portrait emotion from the
presented body action through `actor-rig/action-portrait.ts`. Include action to
emotion changes, rest/closed eyes and return to neutral in the integrated review;
use existing authored frames, not procedural feature edits. A missing emotion
uses an explicit supported fallback until suitable artwork is provided. Follow
the actor skill's [action acceptance](../pawtrail-actors/references/action-review.md)
when body and portrait are created together.
Keep breathing subtle, anchored to the torso, without scaling the whole face.
Different framing or anatomy may need different bands/amplitudes; don't force one
chest boundary onto every portrait. Record how supported data reaches the renderer
rather than adding metadata it ignores.

Follow the [visual verification protocol](references/verification.md). Inspect
rest, half/closed blinks, speech, breathing, their combinations, and emotion/pose
changes. Cover **every requested emotion in every requested angle for this style**.
Watch actual movement as well as stepped frames. A changing pixel hash, zero console
errors or exact equality to a processed reference does not prove natural acting.
Compare to the original generated artwork so the review is not circular.

Read [PawTrail integration](references/pawtrail-integration.md) for supported
runtime contracts, existing exporter limitations, size accounting and installation.
Respect workspace restrictions on agents, tests and browsers. Use authorized
Firefox visual review when available. If live review is required but unavailable
or unauthorized, mark it pending; don't call the style verified or start the next
style. Do not run broad application tests/builds/checks as a substitute for looking.

## 5. Finish only after the style passes

Record a pass/fail/pending result for each pose/emotion and the observed transition
behavior. Repair failures in the same style and re-review the affected states.
Keep the candidate separate from approved assets until its visual gate passes;
an existing failed installed candidate must not be relabeled as approved.

Measure the actual complete style bundle against the owner's cap (currently
**at most 300,000 bytes**), including served references/posters. Report runtime bytes
separately from authoring sources and archives. Keep native pixels crisp and
display sizes consistent. After a pass, integrate through the shared catalogue,
increment content revisions and confirm the installed preview within the authorized
review scope. Report remaining limitations honestly. Then, and only then, proceed
to the next requested style; repeat the workflow with fresh style-specific art and
calibration. Do not inherit the previous style's acceptance or anchors.
