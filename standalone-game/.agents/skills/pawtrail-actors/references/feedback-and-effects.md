# Actor feedback, illustration layers and combat presentation

These are owner-requested requirements for future actor production and relevant
focused revisions. A skill update alone does not install them into existing
characters or authorize unrelated encounter/UI work. Reuse approved shared
assets and current controllers; generate only artwork the requested delivery
needs. Keep real community animal records separate from fictional combat.

## Every interaction should register

Give actionable clicks a visible press/release response and open actions a brief
reveal with an appropriate effect, such as a small pixel spark, puff or framed
unfolding. Match the actor/interface context rather than playing the same large
burst everywhere. Carry the feedback through keyboard activation, focus and
touch; hover alone does not cover them. Reuse the shared HUD and controls.

Distinguish acknowledgement from outcome. A click may immediately depress a
button or begin an opening transition; pending work still needs its real loading,
success or failure state. Disabled/cooling-down actions explain why they cannot
run instead of playing a successful cast. Movement needs readable locomotion,
not a popup or particle spawn on every frame.

Where an action has phases, author the applicable chain: input acknowledgement
→ anticipation/cast → contact/result → follow-through/recovery. Sound can support
this sequence, but sound, color or a console entry alone is not sufficient.
Avoid repetitive full-screen flashes; reduced motion keeps a clear steady marker
or brief low-motion response. Bound repeated clicks and concurrent effects.

## Illustration layers

A full new actor receives independently reusable presentation assets:

| Layer | Required treatment |
| --- | --- |
| Context background | Match the established fictional setting and personality. Animate suitable environmental details—wind, leaves, embers, rain, machinery or similar—without changing the camera or inventing unrelated scenery. |
| Rear aura | Character-specific energy, motes, halo or other motif around/behind the silhouette. Keep it transparent and independently timed. |
| Actor illustration | The complete approved character with natural hair/robe/cape/accessory follow-through and stable anatomy/grip. Default: Refined cel + painterly, combining new Sieghart's mature painted detail/material depth with old Sieg's pixel texture, cel structure and semi-bold stepped edges. |
| Front aura, when needed | Separate foreground particles/arcs that cross in front. Preserve face, weapon and costume readability. |

The ordinary loop includes natural, illustration-specific blinking where eyes are
visible, preserving its held expression. It does not need talking or a catalogue
of dialogue emotions. Follow [the performance contract](illustration-performance.md).
Full new-actor artwork also includes an independently authored **enraged
attack-mode illustration**, with a changed body pose and expression rather than
a tint/aura over the normal pose. Retain actor/background/aura layer separation
for both versions; reusable background art may be shared. Follow the owner's
demonic smiling/angry expression reference, adapted to the actor. Preserve a
stable face and grip; added effects do not excuse awkward body/cloth motion.
For a supernatural enraged design, use a fitting, separately composited facial
accent such as eye/temple lightning, glowing cracks or markings. Keep its origin
attached to that character's eye/temple or authored feature, preserve the dangerous
grin/glare, and animate the effect independently. Lightning needs changing arc
paths, traveling branch energy or moving tips; brightness pulsing alone is not
enough. Follow [hair and lightning motion](../../pawtrail-illustrations/references/motion-and-export.md#hair-and-lightning-motion).
Avoid rapid flashes,
face warping, head shake and an opaque glow covering the expression. Sieghart's
violet eye arcs are an example, not a motif to copy onto every actor.
The normal illustration supplies the selection icon's look. Follow
[illustration variants and feedback](../../pawtrail-illustrations/references/variants-and-feedback.md)
for motion, presentation and the owner's optional-feedback continuation rule.
The actor's complete-frame animation remains inside its own transparent layer;
do not bake the context background or aura into every actor frame. Keep aura
and backdrop motion independently controllable and allow each layer to pause,
hide or use its resting fallback. Background setting and aura shape/color must be
clearly recognizable at the intended display size. Each toggle must visibly change
the composition. A quiet aura can remain restrained without disappearing; use local
contrast and composition to protect the face instead of globally fading both layers.
Do not inherit an old pack's near-invisible opacity values without visual review.

Record the common logical composition size, each layer's native size and offset,
anchor, motion bounds, z-order, palette/style, frame timing, loop/phase policy,
poster, provenance and actual runtime bytes. Layers can have different loop
durations, but they must loop cleanly together without scale drift, clipped hair
or a seam in the background. Fit the moving background to the character rather
than translating the whole character to fake secondary motion.

Compose the layers through the existing shared illustration catalogue/preview.
If its current contract cannot play layers, extend the shared contract within
the authorized implementation scope and identify legacy flattened entries
honestly. Do not build a new renderer per character or label a single flattened
image as an independently animated composition.

Keep the separate source assets even when a destination benefits from a stitched
atlas, complete composition or video. Treat that as a derived export and retain
the layer manifest so another screen can swap or omit the background/aura.
Report the combined runtime cost, including effects and posters, as well as
per-layer sizes. Illustration/VFX budgets are separate from the portrait's
current 300 KB budget; preserve any explicit cap supplied for this task.

## Normal hits, skills and special items

Basic attacks and regular skills need readable presentation, not only ultimates.
Choose effects from the actual action/weapon: a swing trail or slash for a blade,
contact spark/flash for a physical hit, and an authored cast/projectile/impact
sequence for magic. Reuse suitable approved effect families; a special item
should add its own recognizable motif, trail or impact when its behavior calls
for one, rather than recoloring every attack identically.

For relevant slashes, use flashy animated **2D pixel artwork** with an arc,
short bright accents, directional follow-through and a distinct impact burst.
A static arc, flat floor ring or damage number alone does not fulfill this.
Generate missing transparent frame/atlas art through the image-generation
workflow. Native manifests own dimensions, frames, fps and anchors; retain crisp
nearest-neighbor pixels, the selected palette and original sources.

Bind the swing/trail to the actual weapon socket and phase. A cast/swing may play
when an action is accepted; a successful-hit impact and damage display require
confirmed contact. Place impacts on the affected target at the actual contact
position. Differentiate misses, blocked hits, parries, immunity and cooldowns.
Never turn preview effects into authoritative damage, rewards or saved progress.

Special item effects belong to the equipped item's accepted behavior. Equip,
idle, use and impact layers can differ; clear or restore them on unequip,
replacement, interruption and scene exit. Use the existing weapon/item skill
for a requested usable weapon package; this actor guide does not silently add
three abilities and an ultimate to an ordinary prop.

## Magic circles at the feet

Every new actor's model preview includes an authored, visible foot-level
magic circle, even while inspecting idle/walk. Reuse the shared ground-sigil
implementation and suitable approved art, adapting palette/motif to the actor.
During ordinary gameplay, show it for the selected/highlighted character or
relevant skill activation; do not light every NPC or install new live-roster
behavior as a side effect of authoring an actor.

Give selected/highlighted actors or relevant skill activations an authored
magic/sigil circle under their feet, fitted to the character's palette and
motif. Keep it a separate ground-plane layer with a readable outline/glyphs and
a restrained pulse/rotation when appropriate. It should not be baked into the
body or illustration sprite. Make the circle visibly detailed and glowing:
concentric rune/sigil rings, a character-specific center, directional accents and
a restrained halo or a few small motes. Preserve clear fine glyphs at the actual
world zoom rather than substituting one bright solid ellipse. Reuse the existing
`ActorGroundSigil` approach in `src/game/runtime/actor-sigil.ts`, adapting its
art/identity binding rather than installing another renderer. Rotate the original
round drawing before projecting it onto a floor ellipse; rotating a flattened
ellipse would tilt the apparent floor plane.

Project it onto the floor and keep it below the actor with sensible occlusion.
It follows the actor's ground position as they move; for flight/float, it stays
on the ground rather than rising with the body. Preserve the separate ground
shadow. Selection circles, damaging telegraphs and interaction ranges must be
distinguishable; do not imply that a cosmetic circle marks a damaging area.
Keep a steady reduced-motion alternative and clean up on deselection/exit.

## Boss enrage presentation

When boss/enrage work is in scope, create a **dedicated enraged portrait or bust**
with a deliberate expression, pose, contrast and character-specific accents.
Retain identity and the chosen pixel style. Do not satisfy this by reusing the
neutral dialogue portrait with a red tint, shake or generic angry emoji.
For a humanoid demonic smiling/angry performance, use the owner's current
[expression reference](../../pawtrail-illustrations/assets/enraged-demonic-expression-reference.png)
and natural-motion criteria; adapt creature anatomy through the monster workflow.
Use the portrait/illustration workflow for the needed artwork and route the
actual creature/encounter through the monster skill when applicable.

On the confirmed transition into an enraged phase, briefly show this artwork in
a centered cut-in, with its own entrance/exit effect and restrained matching
sound if appropriate. Trigger once per real phase transition, not on every
damage tick or animation loop. A preview control may rehearse the presentation
but must not pretend to change the real encounter state.

Define duration, input/pause behavior and whether it obscures telegraphs. Restore
the underlying HUD on completion, interruption, boss defeat or scene exit.
Preserve the ordinary portrait for normal dialogue. A missing enrage asset needs
explicit pending status; the default portrait is not an accepted substitute.

## Delivery and acceptance

For applicable work, record the feedback phases, layer files/manifest, contact
trigger, actor/weapon/ground anchors, circle behavior, timings, sound, reduced
motion and cleanup ownership. Distinguish authored, preview-installed, reviewed
and gameplay-integrated states.

During authorized review, inspect the real composition and action: click/open
response, background/actor/aura loops and seam, slash timing, confirmed hit and
miss, equipment changes, ground-circle anchoring, movement persistence and exit
cleanup. For a boss, include entering and leaving enrage and restoring the HUD.
Respect existing verification permissions and mark unavailable review pending.
