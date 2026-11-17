---
name: pawtrail-actors
description: Create reference-guided PawTrail actors, starting with animated artwork, then selected-style portraits, icons and matching textured models with shared actions and personality-led voices. Use PawTrail Cats for feline work.
---

# PawTrail Actors

For the owner's current game workflow, keep the established articulated 3D model
with a painted 2D texture skin as the default. Cloud image-to-3D generation,
untextured comparison studies and baked sprites are explicit alternatives, not
automatic replacements. Focused portrait, illustration and voice revisions reuse
that existing gameplay model. Apply the companion portrait's held-angle idle
motion and illustration's complete lower-body source requirements.

**Owner's creation order:** identity brief → animated illustration → explicit
portrait-style choice → portrait → icon → profile/voice when included → 3D model
→ integrated review. The illustration is the model's primary visual reference.
Default illustrations to **Refined cel + painterly**: combine the new Sieghart
illustration's mature proportions, rich painted detail and material depth with
old Sieg's pixel texture, cel-shadow structure and semi-bold stepped edges.
Keep both influences rather than reverting entirely to the old style.
Recommend **Refined cel** for portraits, independently of the
illustration style. Show actual Amber examples and ask the portrait-style
question at that stage unless the user already explicitly chose the portrait
style for this job. Portraits and icons initially show **three-quarter** view;
retain angle choices. Follow the companion skills for these distinct contracts.
The icon derives its identity and rendering style from the **approved normal
animated illustration**, not from whichever dialogue portrait style is chosen.
Painterly anime fantasy remains an explicit alternative illustration style.

The animated artwork includes normal and **enraged attack-pose** performances.
Enrage follows the owner's new demonic-expression reference: a dangerous smiling
or angry performance, adapted to the actor, with natural anchored secondary motion.
Show the finished illustration and ask for feedback before dependent artwork;
the owner permits continuing the current version if no reply arrives after a
reasonable opportunity. Follow the illustration skill's
[variants and feedback](../pawtrail-illustrations/references/variants-and-feedback.md).

Use this inside the PawTrail game workspace. Read its AGENTS.md first. The
approved actors use articulated 3D authoring rigs. All in-game humans, including
the built-in roster and saved characters, use the shared live native-pixel rig
and face style. Their baked exports remain fallback/reference assets; changing
those PNGs requires exporting them again. Cats retain their separate rig and
existing manifest-driven installation paths.

## Visible interaction feedback — owner requirement

Every interactive result in this skill's scope must visibly register: show pending
work when needed, then the actual success, failure or changed state. Existing
clear state changes may suffice; do not add a toast for every animation frame.
Actor interfaces must also feel responsive: provide press/release feedback on
actionable clicks and a brief, context-appropriate reveal/effect when opening a
panel, dialogue or selection. Preserve keyboard/touch equivalents and reduced
motion. This acknowledgement is separate from confirmation that work succeeded.
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

Use visible action/interaction results, hurt/status responses and applicable combat receipts on the actual actor. Keep fictional combat separate from real community animals.

Reuse the existing event/feedback layer, pool or bound transient indicators, and
clean them up on reset/exit. Preserve contrast and useful reduced-motion feedback;
sound or color alone is insufficient. Keep local receipts distinct from confirmed
server saves/rewards. Review feedback under current verification permissions and
leave unobserved runtime behavior pending.

Read [feedback and layered effects](references/feedback-and-effects.md) when
creating illustrations, interactions, attacks, item effects or boss presentation.
New actor delivery includes separate animated character, contextual background
and aura layers; highlighted actors use a separate foot-level magic/sigil circle.
Basic attacks and regular skills need readable effects, with flashy authored 2D
slashes where appropriate. Special items can add their own distinct effects.
Boss enrage uses dedicated dramatic portrait artwork in a brief centered cut-in,
not the default portrait with only a tint. These requirements apply to the
requested actor/encounter; they do not turn every friendly actor into a boss.

## Illustration and portrait performance — updated owner requirements

For future actors, make the illustrated background and aura clearly recognizable
at normal display size; do not fade them into near invisibility. Give hair, robes,
capes, ribbons and other flexible clothing stronger, clearly readable motion from
stable roots. Use a slightly quicker secondary-motion cycle than the earlier subtle
preset; increase travel as well as speed, without speeding up the body's breathing
or shaking the face. Include visible, authored illustration blinking in both normal
and enraged variants when eyes are visible. Keep the held expression, face
registration and grip steady. See the linked performance contract for tuning.

Portrait talking is required even when voices are omitted. Verify actual authored
mouth-shape changes in Speaking preview and during dialogue text reveal, followed
by a return to the matching rest. A speaking flag or unused mouth assets cannot pass.
Read [the performance contract](references/illustration-performance.md) for layer
visibility, motion, blink artwork and speech acceptance. These are prospective
requirements: a skill update alone does not regenerate or repair existing actors.

## Fast workflow with quality safeguards

Before new-actor production, read [production efficiency](references/production-efficiency.md).
Use the workspace's `scripts/actor-job.py` and `docs/actor-production-tools.md`
for persistent per-actor timing spans, declared export readiness and resumable
Firefox captures. Start one production manifest per job and resume its journal;
never rely on tool-session memory for timing. A capture is pending visual review,
not a pass. Keep all acceptance units and invalidate affected results when their
dependencies change. These tools implement reuse and checkpoints; they do not
replace the quality gates or authorize tests, agents or extra browser work.

Reuse the working exporter and encoding recipe for the selected style. Check the
first portrait sheet at native size before expanding its angles, and check the
icon's actual small export before integration. When the final model stage begins,
check the curved face, eye UVs and overlapping fringe before building out the
remaining costume. These early checks catch rework; they do not move the model
ahead of the artwork or replace the complete final acceptance pass.

Always perform the focused [live visual acceptance](references/visual-acceptance.md)
for each new actor and relevant revision: actual idle/walk/run and supported
actions, model-to-illustration likeness, natural hair/cape motion, portrait
emotions, compact icon/portrait framing and subdued review backgrounds. Follow
the owner's latest verification restrictions; unavailable review remains pending.
Adult character briefs must also pass the reference's adult proportion check
without abandoning the chosen pixel style.

For each gameplay model, perform an actual side-by-side likeness check against
its selected illustration. Use curved/tapered anatomy and overlapping hair,
collar, lapel, armor and cloth layers with painted UV textures; do not substitute
a recolored boxy body. Texture-painted curves cannot change a box silhouette.
Keep the shared skeleton/actions and check front, three-quarter, side and back,
then the complete applicable actions after geometry changes.
Always inspect long hair, robes, capes, scarves, ribbons and other moving pieces
when present: they need mapped texture, shaped depth/volume and appropriate
reverse/edge treatment. Check side/back views and maximum swing; a flat colored
sheet or untextured reverse is not a finished waving garment or hair mass.

An explicitly selected **mature painterly anime fantasy** style is a separate
artwork option, not Refined cel pixel art. Honor its smooth painted shading,
adult anatomy and material highlights in artwork selected for that style, retain its
own metadata and rendering mode, and keep existing pixel options intact. The
gameplay renderer/world scale remains the current game's contract unless the
owner also requests its replacement. Do not silently pixel-filter the painterly
art or smooth all previously approved pixel characters.

Read the relevant brief, manifests and implementation once; load additional
references only as needed. Carry forward resolved choices and suitable approved
assets. Reuse the creator, rig, exporters and preview components. Treat new shared
tooling as one-time work; do not rebuild it for each actor. Batch compatible
exports in one authoring/browser session and regenerate only affected outputs.
Start from a measured working preset; do not repeat codec experiments for each
actor. Batch review through controls discovered from the current browser snapshot,
and correct a missing locator before retrying the batch. Record actual generation,
export, model and review durations when reporting speed, separating service wait
from avoidable retries; do not promise a fixed completion time.

Speed does not remove required package stages, reference details, headings,
actions, props, sounds, shadows, size constraints or owner review gates. A new
actor or changed body geometry still needs the full applicable action acceptance
step and its own portrait/icon/animated-illustration delivery unless explicitly
excluded. A focused existing-actor revision does not restart unrelated stages.

Inspect the final native composition and affected behavior. Reuse prior evidence
only for the same unchanged artifact, inputs and dependencies. Rig, action,
lifecycle, exporter or binding changes require broader checks of affected actors,
clips, movement/interruptions, return behavior and connected artwork. Expand
further when failures or uncertainty warrant it; do not repeat passed checks
without a relevant change. Follow existing verification permissions and record
unavailable required reviews as pending, never passed.

Update the existing acceptance record, manifests and scoped installation once
after the final pass. Avoid duplicate reports, repeated setup and unrelated
application tests. Report a real blocker or slow generation/export step briefly;
do not omit required work to meet a time target.

## Representation comparisons

When requested, compare an existing actor as live lit 3D, painted 3D rendered to
native pixels, and native authored 2D sprites. Reuse the approved identity, profile
and companion art; this focused trial does not restart a new-actor package.
Painted textures on real geometry are still 3D. Native 2D must use actual authored
sprite artwork, not renamed 3D renders. Read
[representation comparisons](references/representation-comparison.md) for scope,
registration, shared playback and honest limitations. Keep the live roster and
saved creator appearances unchanged unless installation is explicitly requested.

## Part-built models and offline sprite baking

For a requested part-built/baked workflow, read
[part-built models and baking](references/part-built-and-baked.md). Carry the
approved actor identity into consistent views and named editable mesh parts;
review shape before painting, bind the parts to an explicit skeleton, then bake
the requested action/direction matrix offline. Install the resulting atlas and
manifest as a sprite-only comparison option. Retain the editable model, actual
animation clips, reference/prompt provenance and native export metadata.

Distinguish reference-guided Blender authoring from neural image-to-3D generation.
Do not imply that either method guarantees likeness merely because parts are
separate. Preserve the other comparison modes and the live actor unless their
replacement was explicitly requested. This focused operation reuses the existing
portrait, icon, illustration, profile and voice; it does not restart them.

## Choose the operation

- **Character icon only:** use [PawTrail Character Icons](../pawtrail-character-icons/SKILL.md)
  independently as `$pawtrail-character-icons`. It derives a compact, deliberately
  coarser pixel icon from the approved animated illustration, not a gameplay body render.

- **Loading/ability illustration:** use [PawTrail Illustrations](../pawtrail-illustrations/SKILL.md)
  independently as `$pawtrail-illustrations` for larger character artwork with
  readable looping hair/garment motion and natural blinking. It holds one expression and
  remains separate from the dialogue portrait, icon and gameplay model.

- **Cat-specific creation:** use the companion [PawTrail Cats](../pawtrail-cats/SKILL.md)
  for breed silhouettes, coats, expressive tails, feline accessories and actions.
  It reuses this production pipeline and the shared sound/shadow infrastructure.

- **Personal character:** use `/play?preview=actors` for existing hair, outfit,
  headwear, wing, item, face and color combinations. Use the Face tab for matching
  or independent eye colors, freckles, beauty marks and facial hair.
  Inspect face opens the shared close-up view. Save a named device/account look
  and explicitly choose Use in game. See [the creator](references/creator.md).

- **New appearance:** inspect the image reference, record an appearance brief,
  choose a name when none is established, create its animated illustration first,
  then ask the separate portrait-style choice and complete its portrait and icon.
  Finalize its story profile and short voice pack when included.
  Shape
  and texture the gameplay model using that approved artwork as an additional
  reference. Install the complete package in the actor preview; follow the
  default delivery sequence below.
- **New action, temporary form or ability:** create an animation that can also
  change hair, clothing, accessories, body geometry, colors or actual gameplay
  behavior while active. Running and super speed must change movement, not only
  animation playback. Read
  [action creation and temporary forms](references/actions.md) for movement
  layering, restoration and registration. Goku turning Super Saiyan is the
  implemented example, not a restriction on future actions.
- **Shared movement change:** edit the base rig's pose once, then export the
  affected actions for the selected appearances. Preserve unrelated clips.
- **Game installation:** promote an appearance only when the user requests its
  inclusion in the game roster. Preview generation alone does not imply that.

Read [the production workflow](references/workflow.md) for catalogue fields,
commands, source locations and integration boundaries.

## Default new-actor delivery

Every new character authored through this skill includes these stages without
requiring a separate request for the illustration:

1. Inspect the reference, select/carry forward the illustration style and establish a
   working identity. Preserve an existing name; otherwise invent a fitting
   Japanese, German or English name without blocking on a naming question.
   Record an initial personality/tone brief.
2. Create the animated illustration first using `$pawtrail-illustrations`, with separate
   animated actor, character-context background and aura assets. Retain the
   individual layers and their composition metadata; a stitched export is a
   derived delivery, not a replacement for the reusable sources. The default is
   **Refined cel + painterly**: new Sieghart's mature painted detail/materials
   combined with old Sieg's pixel texture, cel-shadow planes and semi-bold edges,
   with smooth, visibly readable hair/cloth motion at the actual preview size.
   Apply the updated performance contract above: legible background/aura, moderately
   stronger secondary motion and illustration-specific blinking in both variants.
   Visible hair must continuously animate in both normal and enraged illustrations
   during active playback, including short hair tips; moving cloth or aura alone
   does not satisfy hair motion. Preserve intentional pause, reduced-motion and
   offscreen behavior; do not invent exposed hair for a bald or fully covered head.
   Pin hair roots and garment attachments; stagger loose-tip/hem motion while
   holding the face, anatomy and grip steady. Use the existing continuous painted-part
   mesh or compatible authored frames; don't rebuild a renderer for each actor.
   Review the actor with background/aura hidden: an imperceptible subpixel sway
   or moving effects around a still actor does not complete this stage.
   Compare both style references. Keep
   face/internal detail finer. Carry forward a different explicit choice.
   Include the separate enraged variant with a visibly changed attack pose and
   a reference-led demonic grin or angry glare. Keep the face/grip stable and
   author natural follow-through without sparse pose popping. For supernatural
   enrage, add a fitting separate facial effect, such as eye/temple lightning or
   glowing markings. Lightning must visibly move: use changing arc paths, traveling
   energy or branching/retracting tips, with a restrained glow pulse as support.
   A frozen bolt with opacity changes alone is insufficient. Pin its origin to the
   authored facial feature and follow the illustration skill's motion contract;
   do not shake, distort or obscure the expression. Adapt the motif to the character.
   Show both results and ask for feedback; continue on
   silence only under the bounded rule in the illustration companion. Keep user
   feedback separate from technical acceptance and the portrait-style choice.
3. Show the existing portrait examples, including Amber's actual Refined cel
   artwork, and ask which portrait style to apply. Recommend **Refined cel**;
   **Painterly anime fantasy** remains a separate option. Follow
   [the style-choice reference](../pawtrail-portraits/references/style-choice.md).
   Do not infer this decision from the illustration's style or the source actor.
   Reuse an explicit portrait-style answer for this job without asking twice.
   Create that portrait using `$pawtrail-portraits`, preserving identity with its
   own authored expressions and blink/speech/breathing review. Exercise Speaking
   preview and text-reveal dialogue even for voiceless actors; observe the mouth
   drawings visibly change and return to rest. Default the visible
   angle to three-quarter; keep front and head tilt selectable.
   First inspect the representative facial states already present in the first
   sheet at the native destination size; repair registration/readability before
   generating remaining angles. Reuse the selected style's working export recipe.
4. Create the compact icon using `$pawtrail-character-icons`, based on the
   **approved normal animated illustration**, in **three-quarter view** unless
   another angle was requested. Preserve its face, hair, costume and style even
   when the dialogue portrait uses a different style. Use a matching static
   three-quarter view or dedicated icon drawing when the hero pose cannot supply it.
   Angle remains a supported authoring choice, not a required extra icon batch.
   Export and inspect the native-size candidate immediately. Fix disappearing
   eyes, an undersized face or cropped ornaments before framing/registration and
   before proceeding to the gameplay model; a detailed source is not acceptance.
5. Finalize the character's story profile from the illustration and brief: age
   or age band, origin/nationality, personality, biography, motivations and speech
   tone. These are authored fictional choices, not personal facts detected from
   a face. Create six original short voiced cues, each at most two short spoken
   lines: greeting, farewell, attack/special skill, hurt, thanks and encouragement.
   Each character gets their own personality-led saved voice; all six cues for
   that character retain the same speaker. Read
   [character identity and voice](references/identity-and-voice.md) and
   [voice production and preview integration](references/voice-production.md).
6. Reference-guided gameplay model and shared actions, built after the artwork.
   Use the approved animated illustration as the primary shape/material reference,
   supported by the original identity reference. When a side/back construction is
   ambiguous, generate only the needed **static** front/three-quarter/side/back
   views of that same design; animation is unnecessary for these turnarounds.
   Begin this stage with a small face/eye-map/fringe fit review on the shared rig,
   including front and angled views, before expanding the remaining geometry.
   Keep details and proportions consistent across views. Compare the actual model
   beside this artwork, using curved layered geometry and painted UV surfaces,
   while preserving the shared articulated rig, native-pixel renderer and world
   scale. Include an authored detailed glowing foot-level magic circle and a
   separate ground shadow. Use readable concentric runes/sigils, a character-specific
   center and restrained halo/motes; rotate the circular art before floor projection.
   Follow [ground circle placement and lifecycle](references/feedback-and-effects.md#magic-circles-at-the-feet).
   Review textured volume on every applicable long hair/robe/cape/scarf section
   from side/back and during its full swing; repair flat, hollow or untextured
   views before calling the model complete.
7. Register the actor, portrait, icon, illustration, story profile and completed
   six-cue voice pack in the existing actor preview. Connect each cue to an
   accepted preview gesture and the character's own authored portrait expression
   and speech frames. Supply the illustration URL with
   `skin=<actor-id>&art=illustration` and the voice/portrait URL with
   `skin=<actor-id>&art=portrait`.
8. Review the complete applicable action set with its matching portrait emotions,
   costume/prop fit, click/open feedback, cast/contact and item effects,
   foot circles, shadows, layered illustration playback and return behavior.
   Watch normal and enraged illustration loops at destination size with the backdrop
   and aura hidden, then restored. Confirm visible actor motion, stable attachments,
   a smooth seam, pause/restart and continued playback during preview state updates.
   A changing hash, running timer or motion label alone is not visual acceptance.
   For a boss, include the dedicated centered enrage portrait and actual phase
   transition. Record the
   model/action, portrait, icon, illustration and voice review outcomes. Check
   that dialogue wording and vocal delivery agree with the character profile.

The gameplay model is the last asset-production stage, followed by preview and
action acceptance. This reflects the owner's artwork-first decision; don't
revert to model-first for a full new character. A focused geometry/action task
can reuse existing approved artwork without regenerating the earlier stages.

Carry identity through every stage; record illustration and portrait styles as
separate decisions. Both icon and model follow the animated illustration and any
needed matching static views; the icon simplifies that design for its small size. The
illustration is a required creation deliverable, not an optional follow-up.
Reuse suitable matching approved assets when available. Honor an explicit
body-only/asset-only request or a request to omit a stage; a focused edit to an
existing actor/action does not silently regenerate the whole package. This is
the assistant's authoring workflow, not automatic paid generation on every
in-browser character save. Existing actors are not retroactively regenerated by
this skill update.

## Character identity and voice

Naming and an initial character concept belong at the start; the illustration
then informs the final story profile and vocal direction before model creation.
Use [identity and voice](references/identity-and-voice.md) for naming, fictional
age/background, personality, biography, dialogue tone and six short voice
cues. Preserve supplied facts and established identities. Use the selected
illustration as an interpretation aid, not evidence of a real person's age,
personality or nationality. Keep the profile available for future story writing.
The default voice intents are hi, bye, attack/special skill, hurt, thanks and
encouragement. Full actor creation includes generation and preview integration,
not just scripts or an unused audio folder. Honor an explicit request to omit a
stage, reduce the cue set or audition first. Reuse an approved actor's existing
voice for focused changes; do not silently share another actor's speaker.

Use [voice production](references/voice-production.md) for the existing local
VoiceStudio workflow, distinct speaker profiles, pinned greeting references,
compact exports and action/portrait bindings. Its
[CPU low-memory section](references/voice-production.md#voxcpm2-cpu-low-memory-repair)
records the complete two-part VoxCPM2 loader fix and bounded recovery after a
memory-pressure kill. Reuse the installed service and authoring tools rather
than reinstalling models for every character. Preserve current verification
permissions and keep unperformed listening/runtime reviews pending.

## Reference-guided appearance

Inspect the supplied image with an image-viewing tool before choosing colors,
markings, clothing or accessories. Separate **style** references from
**appearance** references. Write down what is visible, what the user explicitly
requested and what is assumed. Preserve a project-local reference copy and its
provenance. The [approved style image](assets/style-reference.webp) is available
when the owner asks to retain the established direction. If the image is unavailable and no existing reference fits, ask for
the missing reference; useful pipeline work can continue independently.

Translate the brief into materials, painted textures and actual geometry attached
to existing joints. Read [modular geometry](references/geometry.md) when hair,
headwear, garment shape or held items are involved. Inspect the silhouette before
the palette: spiky hair needs pointed clumps, a hat needs a brim/crown, a hood
needs folds and a face opening, and a weapon needs a grip/attachment and action
policy. A color change does not satisfy a shape requirement. Current human slots
include swept/spiky/cropped/long hair, a broad hat, hood/halo, vest/tunic/coat/gown,
trousers, backpack, sword and feathered wings. Additional slots cover swept hero
spikes, a martial-arts gi, padded spacesuit and sealed gold-visor helmet. Powering
up uses a shared braced pose and separate native-pixel energy effects. Long hair, full skirts and wings
need secondary motion and care/rest adaptations; read the
[angel example](references/angel.md) for those attachments. Extend pieces
deliberately for other reference details.
A reference image is interpreted by the agent, not automatically converted into
a rig by the browser.

For new or revised pixel-RPG body models, use the approved Amber work as the
construction-quality baseline: curved faces, rounded body cross-sections,
fuller layered hair, sloping tailored shoulders and directional painted pixel textures. Read
[reference-specific model finishing](references/model-finishing.md). Adapt the
actual proportions, meshes, UVs, accessory fit and secondary motion to each
character; Amber's measurements and anime face are not a universal template.
Reuse the movement skeleton rather than forcing every reference onto the same
visible model. Keep an approved character's unrelated features intact during
focused revisions.

The owner accepted the fuller Amber direction at `/play?compare=amber-volume`.
Future matching models need readable front-to-back torso, hip, sleeve and hair
volume, not a front silhouette extruded into a slab. Keep approved face geometry
and front-view identity while shaping depth; fit side/rear textures, headwear
and cape clearance to that volume. More texture pixels alone do not fix a flat
profile or unnatural movement. Adapt these techniques to each reference without
copying Amber's depth factors, widening every face or changing world/collision
scale. Use the synchronized front/three-quarter/side review in
[model finishing](references/model-finishing.md#body-depth-and-volume).
This visual-direction approval does not migrate existing actors or establish
that every action on a newly shaped model has been reviewed.

Current preferred face policy: keep each actor's reference-specific proportions
and a soft cheek/jaw separation edge. Yae's own profile is preferred; the
Amber-profile transfer was an optional trial, not the new default for all actors.

Treat face shape and cheek/jaw separation as a separate acceptance step, not an
assumed benefit of a good face texture. Check for a missing soft internal contour
before changing proportions: face and shoulder skin can visually merge. Compare
reference-specific cheek width/face height, jaw taper and eye spacing. Inspect the generated facial artwork
and the assembled mesh separately; follow the face review procedure in
[model finishing](references/model-finishing.md#face-shape-review). When browser
review is not authorized, state that the assembled face remains unverified.

Reuse the rig, joint names, shared action functions, world scale, camera and
lighting. Meshes can have different silhouettes and layered volumes. Additive
grip/garment corrections can adapt the shared motion for equipped gear. Extra
transparent cell padding is allowed when needed; preserve the feet's world
position using the new manifest anchor instead of shrinking the character.
Human actions come from createRescuer;
cat actions come from createCat. A substantially different species/body may
need a separate rig. Keep pixel contours, hair texture clusters and upper-left
shading consistent with the approved base. Routine palette variants can use
deterministic renders without new image-generation calls.

New personal characters use the high-detail creator: native 128×160 pixels over
the existing 64×80 world window at density 2. Preserve bold contours, feet and
world proportions with half-scale presentation and density-aware effects/shadows.
Do not increase transparent padding and call it added detail. Human and cat
creators share face-color controls and inspection behavior; use that layer for
future features rather than adding another per-character editor.
The in-game human binding now uses the same density and shared rig, including
NPC bodies and all ten roster looks. Use game-appearances.ts to preserve built-in
identity palettes/gear and the saved-character reader for personal configurations;
do not restore the superseded human mesh/UV path for individual roster entries.

Human faces use no visible modeled nose. The original cozy roster retains simple
dark oval eyes, a small colored iris accent and tiny catchlight. Reference-guided
anime models can use the approved Amber direction: narrower cheeks, a tapered
jaw and authored almond-shaped eyes. Match the selected style's eye shape and
texture rather than imposing the original oval-eye treatment on every model.
Avoid realistic protruding facial anatomy. Preserve the selected face style in
temporary forms; cats retain their separate face construction.

Interpret visible eye color, facial markings and facial hair from the
reference when available. Store them in the versioned appearance data and shared
rig. Add their colors to the finishing palette/signature. Saved base eye colors
must return after temporary forms, such as Goku's turquoise powered-up eyes.

## Living dialogue portraits

For dialogue/HUD presentation, use [PawTrail HUD Creator](../pawtrail-hud/SKILL.md),
also callable as `$pawtrail-hud`. New actor previews reuse its bottom-centered
dialogue surface with the actor's own portrait on the left and words on the
right. Keep this shared UI separate from portrait generation; do not regenerate
the wood frame or duplicate the HUD for each actor.

Every created character includes a lightweight illustrated 2D dialogue bust unless
the owner requested body-only work. The portrait is a separate asset from the
shared 3D/native-pixel gameplay rig; keep the body's geometry and movement unchanged.

Use [PawTrail Portraits](../pawtrail-portraits/SKILL.md) for this portion. It is also
independently callable as `$pawtrail-portraits`, without creating an actor. Follow
its reference inspection, style choice, authored expressions, specific facial
performance and full visual acceptance **one style at a time**. Don't batch five
styles before verifying the first. A shared renderer is appropriate; neutral blink
and speech artwork copied across incompatible emotions is not.

Preserve reference identity and upper-torso framing. Keep automatic neutral profile
pictures, the shared Canvas 2D component, dialogue-driven speech, lazy bounded
caches and the portrait skill's current angle and complete-style budget defaults. No rotatable 3D bust
is needed for these portraits. Consult the portrait skill's integration reference
for source contracts and actual renderer capabilities. Do not treat the rejected
V1/V2 Yae Miko Sharp cel motion exports as approved templates. The owner selected
complete authored frames instead of runtime facial patches; follow the current
portrait integration guide for that path and its review requirements.

Recommend Refined cel but ask the portrait-specific style question with actual
Amber examples before new portrait artwork, as described in the companion's
[style-choice reference](../pawtrail-portraits/references/style-choice.md).
Painterly anime fantasy is an additional named choice, not an automatic portrait
selection inherited from the illustration. Start the portrait preview/dialogue
at three-quarter unless a current selection, saved preference or explicit request
chooses another angle. Preview angle changes continue to drive dialogue; keep
the angle controls in the portrait preview, outside the dialogue panel.

## Character selection icons

Include a static character icon in new
actor creation unless the user requested body-only work or omitted icons.
Use [PawTrail Character Icons](../pawtrail-character-icons/SKILL.md), also callable
separately as `$pawtrail-character-icons`. Use the approved normal animated
illustration as its primary identity/style reference; a different dialogue
portrait choice does not restyle the icon. Use three-quarter view by default and
simplify it into coarser visible pixel
clusters with tight square head-and-shoulders framing, guided by the owner's
icon-board reference. Start at 48×48 native unless the destination or silhouette
needs another size. Keep the icon separate from the animated dialogue bust and
gameplay body thumbnail, retain prompt/source provenance, and review it at native
size alongside the illustration's head/shoulders. Reuse a suitable approved icon rather than
regenerating it on every actor revision. Include its result in the actor's
acceptance record before the action-review step.

Follow the icon skill's compact woody pixel frame and warm background. Active
icons keep that wood frame and add a glowing rim with a gentle pulse (steady
for reduced motion). Reuse
the shared `CharacterIcon` component and its `active` prop rather than duplicating
frame styling per actor; keep both selected and unselected tiles at 48×48.

## Living character illustrations

Create the loading/ability illustration **before** the portrait and icon for every
new actor, using [PawTrail Illustrations](../pawtrail-illustrations/SKILL.md).
Carry the reference identity and the illustration's own selected style. Default
to **Refined cel + painterly**, retaining new Sieghart's mature, detailed painted
construction/materials and old Sieg's deliberate pixel accents, semi-bold stepped
contours, grouped highlights and readable cel shadows. Fit anatomy/features to
the actual character. Use finer
internal facial/seam lines. Painterly anime fantasy is available when explicitly
chosen. The later
Refined cel portrait choice does not restyle the existing illustration. Follow
the illustration skill's style review before expanding a motion sheet.
Choose the appropriate full/three-quarter-body or torso composition and create
its own secondary-motion loop, using intact authored frames or the existing pinned
painted-part mesh: hair, cape, robe or accessories
sway naturally while the face, anatomy and weapon grip remain stable. Reject
visible pose popping, body drift, rigid cloth boards, imperceptible motion and a discontinuous loop;
follow the companion's updated in-between/secondary-motion guidance. No expression set,
blinking or speech is required. Give it its own asset budget and review status.
"Complete frame" here means the whole character within its transparent actor
layer, whether assembled from clean painted parts or an authored frame. Keep the
face/body/grip stable, roots pinned, loose tips visibly moving, and repaired
underlays behind moving pieces. See [the existing motion implementation and review](../pawtrail-illustrations/references/motion-and-export.md#live-painted-part-motion).
Visible hair always gets its own continuous, readable loop during active playback.
Any included lightning needs visibly evolving arcs or traveling energy as well as
glow; a stationary illustration with pulsing effects is not completed animation.
Produce a separately animated background suited to the character's
established setting/personality and an independently controllable aura layer.
Keep matching canvas/anchor/depth/timing metadata and preserve all sources.
Compose them in the shared preview; stitch a derivative only when useful for a
destination. Follow [the layered composition contract](references/feedback-and-effects.md#illustration-layers).
Include the separate enraged attack-pose illustration in full actor creation;
each variant holds its own expression without a dialogue emotion set. A boss's
enraged portrait also follows its distinct encounter-state cut-in requirements.
If the character has no long hair or cape, animate an appropriate existing
garment/accessory or subtle authored breathing rather than delivering only a still.
Install it in the actor preview's Illustration tab through the shared catalogue
and `IllustrationPreview` component; follow the illustration skill's
[preview binding](../pawtrail-illustrations/references/motion-and-export.md#actor-preview-binding).
Do not stop at a generated file or a poster-only tab. Show the actor's own
animated artwork, retain its Portrait tab and compact icon, and provide
`/play?preview=actors&skin=<actor-id>&art=illustration` in the handoff.
An ability
illustration follows the actual action lifecycle only when integration is
requested; cosmetic playback does not implement the ability or replace its body
animation. Include the illustration's style, motion, bytes and preview binding
in the actor's acceptance record. Keep it out of unrelated focused actor revisions.

## Actions can change appearance and behavior


An action can combine a pose, temporary model parts/materials, pixel effects, synchronized sound and
gameplay modifiers such as speed, acceleration or NPC responses. For a behavior
request, define its real effect, duration/cooldown and restoration; implement it
in shared game controllers as well as the animation. Keep multiplayer movement
validation consistent with server-authorized abilities. Reuse the shared rig; add real geometry when the silhouette
changes. Keep the saved appearance as the base, define which movement can run
alongside the action, and restore the base on completion or interruption. All
authored actions preserve their selected state during movement: layer walking
legs for grounded gestures, or retain the full seated/airborne pose while moving.
Use the shared playback lifecycle for staged exits such as jetpack landing. Follow
[the action workflow](references/actions.md) when creating or extending one.
Include the action's acknowledgement, anticipation/cast, confirmed contact,
result and recovery feedback as applicable. Use animated native 2D slash/impact
art for relevant attacks, distinct effects for special equipment and a separate
ground-plane magic/sigil circle to highlight the actor. Keep effects attached
and synchronized during movement, and end them with the owning action/item.
See [feedback and layered effects](references/feedback-and-effects.md) for
normal-hit versus skill/item effects, circle placement and boss enrage cut-ins.

Include action-specific audio in new actions: crying pairs sobs with local rain,
powering up has a charging sound, and jetpack flight has engine thrust through
takeoff, hover and landing. Reuse the shared audio mixer and lifecycle so moving
does not restart the sound, and ending the action stops it. Human models and cats
also inherit the shared ground shadow; floating/flight need an obvious shadow
remaining below the lifted body. Read [sound and shadows](references/sound-and-shadows.md)
when adding or changing an action, model, effect or preview integration.

## Produce and review

Character creation includes an **action acceptance step** after shaping/texturing
the body and preparing its portrait, icon and animated illustration. Read
[action review](references/action-review.md):
review the full supported action set, props, costume fit, movement persistence,
sound/shadows and return behavior. Check the portrait's matching emotion alongside
each body action. Use the character's own authored frames and record unsupported
emotion fallbacks. Do not call an idle/walk-only or source-only review complete;
record visual acceptance as pending when review is unauthorized or unavailable.

For native sheet exports, use `scripts/pawtrail-actors.mjs`. It renders
in an isolated Firefox authoring page, finishes the native pixels, creates
versioned sheets/manifests and updates the appropriate preview/live registry.
Use the actual reference and exported artwork to review silhouette, glasses or
marking visibility, all headings, ground alignment and representative actions.
Keep this distinct from verifying the running game.

For an isolated live geometry trial, a dedicated model factory and comparison
page can reuse the shared renderer without re-exporting every catalogue entry.
Compare the same approved model before/after the requested change at identical
scale, feet anchor, camera and animation phase. Preserve the accepted parts of
the model and obtain owner feedback before applying the approach to other
characters. Neither a preview-only factory nor an approved skill update migrates
the roster or saved appearances automatically.

The character creator is at `/play?preview=actors`; a `skin` query starts from
a generated template. The viewer reuses the shared
Phaser comparison field, timing and emote props. Review idle/walk first, then
care/rest and emotes. A generated gallery is not user approval of its appearance.
Do not rewrite already approved characters when creating a trial appearance.

An idle/walk/run review stage is not a reason to remove the other shared actions
from a new model's actor-preview selector. Preserve the human action list and
adapt the model's joint corrections, garment folds and face states. When replacing
body meshes, keep shared care/rest/flight props attached to their original joints
and visibility controls; `refined-action-support.ts` handles that for Amber/Yae.
Do not overwrite a waving/cheering/clapping arm pose with the model's idle arm
angle. Keep the existing effects, sound, shadow and moving-action lifecycle.

Follow the workspace's permissions for agents, tests, checks, builds and browser
verification. Exporting requested artwork does not authorize unrelated testing.
Report what was generated, its preview URL, any reference interpretation limits
and whether it was added to the roster. Never connect cosmetic emotes or preview
actions to verified welfare data, animal identification or authoritative Kibble.
