# First baked pixel actor pilot

The owner approved the appearance of the first rescuer/orange-tabby previews and
requested an in-game trial before expanding the collection. The follow-up adds
the first pair's action set and fixes the overlapping legacy sprite draw.

## Try the pair

Open `/play?explore=1`. If another appearance is saved, choose **Settings → Your
character → Trail rescuer**. Orange cats, including Mango in the neighborhood,
use the approved tabby exports. The same binding applies in Home, yards, shelter
encounters, remote players using this appearance and following companions.
Other appearances and coats retain their existing rendering. Existing saved
character choices are not overwritten.

For original/current rescuer and cat comparisons, open `/play?compare=actors`
or **Your spaces → Compare character styles**. See
[the comparison field guide](actor-comparison.md).

## Runtime

`runtime/baked-actors.ts` loads the two native sheets and registers animations
from generated manifest metadata. `models3d/phaser-bridge.ts` uses these exports
for `player/rescuer` and `cat/orange_tabby` (including the `orange-tabby` alias).
Only their visible appearance changes: original Phaser actors retain collision,
hit testing, navigation, network identity, care behavior and depth placement.

Walking follows actual displacement. Teleports do not trigger strides; stopping
starts the idle loop. Eight direction sectors include a small boundary tolerance
to resist path/network jitter. Turning preserves animation progress. The last
direction survives a stop. Sprite dimensions, rates and ground anchors come from
the native export manifests. Texture filtering stays nearest-neighbor and the
existing integer world zoom remains in use. Reduced motion freezes incidental
idle motion while retaining walking and heading changes.

The rescuer is 32×48 with a ground anchor at (16,44); the cat is 32×32 with a
ground anchor at (16,28). Idle has eight frames at 4 fps. The rescuer walk now
has twelve frames at 15 fps; the cat walk retains eight at 10 fps. Both walking
loops last 0.8 seconds. Running inherits the original actor's animation
time scale. No live Three.js render is required for either approved appearance;
other actors continue using the existing renderer.

The rescuer now has twenty-six animations: idle, walk, feed, water, pet, play, sit,
sleep, pick up, clean, wave, laugh, dance, clap, cheer, hold supplies, give a gift,
inspect, sad, happy, angry, float, tired, surprised, sick and ride. The orange tabby has twenty-three: idle, walk, eat, drink, being petted,
sit, sleep, happy, play, groom, stretch, scratch, climb, lie down, sad, angry, dance, float, tired, surprised, laugh, sick and ride. Every action
has eight directions. The rescuer walk, both actors' core care actions, sitting
and sleeping use twelve frames, as do the expressive emotes; remaining clips use eight.
Care action aliases resolve to the same
native animation across Explore, Home and companion controls. One-shot actions
hold their final frame rather than restarting every update; looping care/rest
poses continue for the duration of the existing interaction.

The game records the requested action independently from the compatibility
sprite's available clips. For example, rest displays actual sleeping artwork
even when the old invisible sprite only has a sitting animation. Explicit care
targets set facing before a stationary action. World actions use the same shared
action functions as Home and companions, avoiding stale action metadata after
walking resumes.

The duplicate appearance was caused by Phaser 4 capturing its original
`renderWebGL` function in the render-step list at construction. Replacing that
function alone did not suppress the cached draw. The binding now intercepts
`renderWebGLStep`, plus WebGL/Canvas draw hooks, and only registers the invisible
source with the camera for input sorting. It retains physics, alpha, visibility
and hit testing. Fallback restores the original hooks while hiding the replacement
view, so a failed asset/renderer does not show two actors.

The model workshop excludes this fixed-export pair so it cannot promise color
or geometry edits that would not appear in game. Other characters are unchanged.

## Assets and installation

Authoritative source exports remain under `assets/animation-approval-v1/exports`.
`node scripts/install-baked-actors.mjs` installs their native sheets, original
manifests and a single-frame picker thumbnail under
`public/pawtrail-game/game-assets/baked-actors-v8`, and derives
`src/game/runtime/baked-actors.json`. It does not regenerate artwork or alter
the other characters. The art-production scripts and editable GLBs are retained.

Versioned textures have distinct keys and URLs so earlier textures cannot be
reused by an existing Phaser texture cache. Thirty-two columns keep each sheet
below 4096 pixels on either axis: rescuer 1024×3840, cat 1024×2336. Animations stay
within horizontal rows; packing leaves padding where a longer action
cannot fit. Frame numbering and dimensions are manifest-driven. There are
4,128 native frames across the two actors.

## Front walk and edge detail refinement

The initial walk moved the two hips vertically on separate curves, which could
detach the shorts silhouette from the pelvis and produce uneven front-view
steps. Both hips now share one pelvis height. A two-segment leg solve follows
an explicit foot path: longer ground contact, a small lifted return, planted
soles and forward knee bends. A continuous shorts waistband closes the old
joint gap. Arms counter the stepping leg with smaller shoulder swings, softly
bent elbows and narrower hands. Twelve walk frames preserve the original loop
duration while reducing visible pose jumps.

The same meshes now include clustered hair highlights, jacket/pocket stitching,
shirt folds, backpack piping, trouser seams, boot toe highlights and dark soles.
The cat receives small fur and muzzle edge accents. Stronger stepped material
shadows and a restrained warm highlight on top/left outline pixels add depth.
There is no random per-frame noise, blur, antialiasing or continuous color
gradient in the finished exports. The original v2 sheets remain available as
the source for `previews/front-walk-comparison.gif`.

## Bolder contours and painted hair

The v4 appearance keeps the refined gait, silhouette and brown-haired identity.
The crown, fringe, side lock and back hair now use an authored 32×16 nearest-
filtered texture with stepped lock highlights and dark strand separations.
It is mapped onto the actual hair surfaces and embedded in the exported GLB;
the face and clothing pockets do not inherit the hair material. This replaces
reliance on tiny accent meshes which could be hidden inside the rounded hair.
The pattern is fixed to the model, with no frame-randomized speckles.

The final native-pixel pass now uses a darker, connected eight-neighbor contour
for a bolder edge, with a restrained warm highlight rather than a light brown
border. It stays one pixel wide and retains the original cell sizes/anchors.
The v3 sheets remain the baseline for `previews/hair-texture-comparison.png`.

## Expressive care and rest actions

The v5 action pass adds a waist-level spine pivot and wrist joints while
preserving the approved walking/idle transforms. Feeding uses a deeper crouch,
torso weight shift and an extended/lowered bowl; water has a clear bottle pour.
Petting uses a broad shoulder/elbow/wrist stroke rather than a tiny forearm
rotation. Cleaning/play and pickup also use the waist hinge. Sitting lowers the
pelvis and folds the shins under the knees. Sleeping now faces up with closed
eyes, supported by a cosmetic pillow and blanket, with visible chest/blanket
breathing. These rest props are sprite artwork, not spawned inventory items.

The tabby visibly dips its head to a larger, contrasting-rimmed bowl and lifts
to chew. Petting combines leaning, head rubs, ear response, closed eyes and tail
motion. Sitting compresses the body onto rounded haunches and wraps the tail;
sleeping curls the head/paws/tail around the body with ribcage breathing.

Core care/rest clips use twelve frames while retaining their prior loop
durations: human feed/pet/water and cat eat/drink last one second, cat petting
lasts 4/3 seconds, and sitting/sleeping breathe over two seconds. The comparison
view supports optional `pose` and `facing` query values for focused reviews, e.g.
`/play?compare=actors&pose=feed&facing=down_right`. Other character artwork and
normal game rewards/data remain unchanged. This pass was reviewed as exported
artwork; no automated tests, builds or game browser verification were run.

Only the changed actor/picker files and this small asset directory were installed
into the running social worktree. The broad game sync was not used. No automated
tests, type checks, builds or browser verification were run for this integration,
as instructed; in-game movement and art acceptance remain for the owner's trial.

## Expressive pixel emotes (v6)

The first rescuer and orange tabby now have sad/cry, happy, angry, disco dance,
floating and tired body clips in all eight directions. Sleeping retains its
curl/blanket art and adds rising Zs. Their approved walking and hair style are
preserved. The new loops use twelve frames per direction.

`runtime/emote-effects.ts` draws shared pixel effects from `emote-art.json`:
dark rain clouds overhead with tears, jumping confetti, an angry face overhead,
a disco ball with slow colored sparkles, a floating cloud, rising Zs and a
low-energy/yawning cue. The cloud, confetti and symbols are separate layers
anchored to the actor's position and depth, so native sprite cells do not crop
them. Drawing uses integer pixel rectangles without particle allocations;
reduced motion keeps a quiet static pose and minimal effects. Offscreen effects
are culled. Scene/actor cleanup removes the graphics.

Use **React** (Q) for the rescuer. An owned orange tabby's portrait menu offers
**Game emote**, explicitly a cosmetic preview on the current device. Character
emotes in houses use the existing authorized room broadcast and server reaction
allowlist. Pet previews do not create server pet commands, care records,
identification evidence or Kibble. Pet emotes pause the local companion controller
briefly; movement cancels a player emote. Every effect is also selectable in the
comparison field; its Pause and Reset controls apply to the effect timeline.

The exported icons under `emote-fx-v3` come from the same pixel masks via
`scripts/prepare-emote-icons.py`. The pair's sheets use the `baked-actors-v8`
versioned URLs and texture keys. The scoped game changes are copied to the
running social worktree without running its broad synchronization script.
This change received source and exported-art review only; automated tests,
checks, builds and game browser verification were not run.

## Emote visibility refinement (v7)

Crying now places a charcoal rain cloud above the head. Angry uses a larger,
cream-rimmed red face with dark brows and a clear frown. Floating uses a 31×16
white cloud with rounded lobes, cool lower shading and small drifting puffs.
Being petted shows a red heart above the cat, pulsing between three native-pixel
sizes without fractional scaling. Reduced motion retains static effects.

Both actors have a new twelve-frame startled pose in eight directions. The
existing Surprised reaction now plays this pose with a large surprised face and
exclamation mark. Cat Play displays a rolling purple yarn ball, loose thread and
four strand orientations beside the front paws. The ball follows the selected
heading, draws behind the cat when appropriate, and uses the same clock as its
play action. **Game emote → Play with yarn** is a local cosmetic preview; it does
not consume supplies or count as welfare care.

The comparison field exposes **Surprised** and **Play / yarn ball**, and **Pet**
shows the pulsing cat heart. Taller framing leaves room for overhead effects.
New texture keys/URLs use v7, while thumbnails use emote-fx-v3. Only the 192 new
surprise frames were rendered; the existing source frames were reused. The
exporter accepts an optional action list in `window.exportApproval([...])` and
records both total frame count and the number rendered in the latest pass.
Native cell dimensions, anchors, approved walking and care artwork are retained.
Source and exported artwork were reviewed; no automated tests, checks, builds
or game browser verification were run.

## Laugh, sick and rooftop car ride (v8)

Laugh uses a twelve-frame belly-laugh gesture with closed eyes, an open mouth,
shoulder/chest movement, a large laughing face and small tears of mirth. Both
actors have a twelve-frame sick emote: hunched/coughing posture with a green
thermometer face overhead. Sick is cosmetic and never changes platform animal
health records. Use **React → Laugh / Sick** or the tabby's **Game emote** menu.

**Car rooftop ride** seats the actor on an original orange/cream hatchback. Its
80×64 cell keeps native pixels while leaving room for windows, windshield
reflections and wipers, grille, lights, mirrors, handles, roof rails and trim.
There are twelve car frames per direction, at 12 fps in eight directions. Tire
spokes and an asymmetric orange valve marker rotate. Car art is a separate
nearest-filtered sprite layer behind the rider, using a manifest-defined anchor
and seat offset. Small road flecks indicate motion. The actor keeps its existing
collision/navigation body; walking cancels the emote. This is a cosmetic ride,
not a new driving or property-placement system. Reduced motion freezes the car,
body and incidental effects. All vehicle layers are removed on actor/scene exit.

The car's editable source is `createEmoteCar()` in the approval rig source. Run
`window.exportCarApproval()` in the isolated Firefox art exporter before the
finishing/installation scripts to regenerate it. `emote-car-v1` contains the
960×512 car atlas and geometry manifest; `runtime/car-emote.ts` shares loading and
playback between normal scenes and the comparison field. The existing actor
sheets now contain 4,128 native frames; the car has 96 additional frames. New
actor keys/URLs use v8; menu thumbnails use emote-fx-v3. No unrelated character
art, verified welfare records or rewards are changed.

Character reactions use the existing authenticated room broadcast, with `sick`
and `car` added to its allowlist. Cat previews stay local cosmetics. **Laugh**,
**Sick** and **Car rooftop ride** are also selectable in the comparison field.
Source and exported artwork were reviewed. No automated tests, checks, builds or
browser verification of the game were run.
