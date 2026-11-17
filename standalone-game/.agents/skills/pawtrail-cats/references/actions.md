# Feline actions, sound and shadows

## Shared actions

The feline section of `src/game/actor-rig/actions.json` owns counts, fps and loop
mode. `rigs.ts/createCat` owns poses; all appearances share these functions.
Existing idle, walk, eat/drink, pet, sit/sleep, groom/stretch, scratch/climb and
emotes remain. Additional actions are:

| Action | Presentation |
| --- | --- |
| run | Faster quadruped stride, opposite diagonal paws and secondary tail motion |
| roll_yarn | Full-body floor roll, tucked paws and shared moving yarn prop |
| jump | Anticipation, airborne arc and landing/settle; one-shot |
| pounce | Lower playful jump with reaching paws; one-shot |
| knead | Alternating front-paw presses, relaxed eyes and breathing |
| chase_tail | Turning body with curved tail and coordinated paws |
| tail_wag | Expressive, phase-offset tail/base-tip swish |
| sniff | Low head, small investigative sweeps and nose movement |
| shake | Body/head/ear shake with delayed tail motion |
| fly | Tucked paws, visible wing flapping and gentle airborne body motion |

Frame counts/timing come from the manifest, not this table. All poses reset from
the same base, preserving appearance, markings and attachments. Keep a natural
baseline tail sway and ear/blink/breath motion even at idle. A cat's strong swish
is an expressive animation, not an automatic inference of happiness or welfare.

Roll around the body center so the cat does not rotate through the floor. Yarn
is a shared runtime prop, separate from body sheets. Jump/pounce use
`catJumpMotion` for matching anticipation/lift/settle and shadow timing. Loops
must close cleanly; one-shots end grounded. Props and accessories must not clip
the eyes, paws or floor. Fold wings for sleeping/rolling and adapt boots to paws.

`actor-rig/action-layers.ts` separates locomotion from gestures and whole-body
actions. Grounded gestures can layer the paw cycle; roll/jump/flight keep their
whole-body pose while translating. Movement and headings do not cancel actions.
Do not overwrite the saved coat/parts to enter a temporary action.

These new jump/pounce/fly clips are presentation on the existing navigation
plane. They do not authorize passing through obstacles or reaching furniture
surfaces. A real object traversal requires the existing surface/landing planner,
reserved landing point, collision/room validation and return path. Likewise a
run pose alone is not an actual speed boost. Implement requested behavior in the
appropriate controller/server, with duration/cooldown/restoration when relevant.

## Soundboard reuse

`runtime/cat-action-sounds.ts` maps cat actions to the existing original audio:
`/assets/game/soundboard/audio/{id}.wav`. Known ids come from `CAT_EMOTES` in
`immersion-data.ts`, including happy, angry, sleepy, surprised, crying, laughing,
excited, silly, loving, suspicious and relaxed. Use their actual mood/character
instead of generating a new recording for every coat.

`runtime/action-audio.ts` schedules restrained, spaced phrases, aborts samples
on interruption/exit and uses the shared mixer. `systems/audio.ts/playSample`
accepts an AbortSignal. Crying combines the cat crying sample with local procedural
rain; do not double it with a synthesized human sob. Kneading/petting use relaxed
or loving audio, yarn rolling uses silly, jumps use excited, and sniffing uses
suspicious. Foley such as bowl crunch/water/yarn can layer quietly underneath.

Keep sound family/stage identity independent from heading/stride. Do not replay
the meow every frame, footstep or direction change. Respect audio unlock, master/
effects settings, soundboard volume, nearby falloff and other-player mute. Stop
on action exit, actor removal, scene pause/sleep/shutdown and hidden documents.
Use existing bounded voices and disconnect sources; no per-cat AudioContext.
The preview reference copy is silent to avoid doubled audio.

## Ground shadows and presentation wiring

`runtime/actor-shadow.ts` supplies one stepped pixel shadow per cat beneath the
physical feet. It follows position, depth, alpha/scale, visibility and culling.
Jump/pounce expansion and opacity follow the same lift envelope as the body.
Wing flight/floating shadows stay below the body on the floor, broader/lighter
than contact shadows. Do not bake shadows into each coat, add duplicate preview
shadows or move the collision body to fake altitude.

`runtime/emote-effects.ts` owns yarn, emote props, audio and shadows; extend it
instead of inventing a per-breed effect system. Registration points include
`runtime/actor-comparison-state.ts`, the cat preview choices and native export
manifests. If adding a gameplay trigger is requested, wire the actual animal
controller/action path. Adding a menu option without a controller is not a new
animal behavior. Keep art generation/review separate from app verification,
and follow AGENTS.md restrictions on tests/builds/browser use.
