# Action sound and ground shadows

New PawTrail actions include an intentional sound treatment alongside the pose,
pixel effects and any gameplay modifier. Keep humans, cats, the creator, Explore,
homes and yards on the shared implementation. Routine idle, walking and running
stay free of looping emote sounds; footsteps belong to the movement controller.

## Existing implementation

- `src/game/systems/action-sounds.ts`: action-to-sound mapping and original Web
  Audio foley. Crying has falling voiced sobs and close rain; powering up has a
  rising charge, low hum and crackle; jetpack uses filtered engine/exhaust noise.
  Other emotes and care actions use restrained contextual cues.
- `src/game/systems/audio.ts`: shared effects bus, master/mute/volume, bounded
  action polyphony and one scheduling clock. Use this manager; do not create a
  new AudioContext, global weather loop or unbounded timer for every actor.
- `src/game/runtime/action-audio.ts`: one voice per actor, distance falloff,
  other-player mute, action-family continuity and jetpack thrust envelope.
- `src/game/runtime/actor-shadow.ts`: one stepped, nearest-pixel ground shadow
  for each human/cat. It follows the world anchor, visibility, scale and depth.
- `src/game/runtime/emote-effects.ts`: owns these audio/shadow layers alongside
  the existing visuals; cleans them up when the actor/scene is removed.
- `src/game/models3d/phaser-bridge.ts` and
  `src/game/runtime/actor-comparison-scene.ts`: common runtime/preview callers.
  The comparison's current actor is audible; its reference copy is silent.

## Author an action's audio

For spoken character cues, use [identity and voice](identity-and-voice.md): up
to six short clips in one consistent voice, with authored scripts and the
character's story/tone profile. These are separate from procedural emote foley;
reuse `AudioManager.playSample`, unlock/mute controls and cancellation for real
recorded/generated files. An unavailable voice generator leaves audio pending,
not replaced by a procedural sob or a silent placeholder.

Define entry, active/loop and exit treatment with its duration and movement
policy. Reuse the same cue for aliases and related clips: `power_up`,
`power_run` and `super_saiyan` are one charging family; jetpack takeoff, hover and
landing are one engine voice. A heading change or movement must not retrigger
the startup sound. Use the action presentation lifecycle for staged landings.

Use original procedural foley or project-authorized recordings. Procedural sobs
are stylized voiced effects, not recorded human speech. Rain under a crying
cloud is local action audio, independent of the world's weather ambience. Route
all action sounds through the existing effects/master controls and browser audio
unlock from a real user gesture; never force autoplay or reset a user's mute.
Respect nearby audio range and other-player mute. Pause/sleep, hidden documents,
interruption, expiry and scene/actor cleanup must silence the voice. Fade and
disconnect every oscillator, buffer, filter, gain and scheduled source; limit
simultaneous voices. Do not fetch/decode or create audio nodes every render frame.

Sound does not confer movement authority, actual animal care, Kibble or trust.
Keep behavior validation and the animation/audio presentation independent.

## Grounding models

Provide a subtle contact shadow for standing, walking, running and resting human
models and cats, including exported appearances and personal creator characters.
Use the manifest ground anchor; do not alter collision/body position or feet
alignment to accommodate a shadow. Match the upper-left lighting with a small
down-right cast. Use stepped pixel shapes with no blurred edge or smooth shader.

Floating needs a clearly visible wider, lighter shadow on the floor beneath the
cloud/body. Jetpack shadow expansion and opacity follow the shared takeoff,
hover and landing envelope, returning to contact size on landing. Keep the
shadow on the physical ground while the body/cloud bobs. It follows movement,
depth, actor scale/alpha and visibility, and respects culling/reduced motion.
Remove duplicate ad-hoc comparison or flight shadows.

These are shared runtime layers, not baked into every sprite or portrait. Sound
and shadow changes alone do not require regenerating body sprites. When review
is permitted, inspect entry, motion, landing/exit, interruption, mute/volume and
cleanup, with only one shadow and one audible voice per actor. Follow AGENTS.md:
do not run checks, builds, tests or browser verification without authorization.
