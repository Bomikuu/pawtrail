# Shared actor sound and shadows

Action presentation now combines the model/sprite, pixel effects, contextual
foley and a world-anchored ground shadow. The actor binding and comparison field
reuse the same runtime layers across personal characters, exported skins and
cats. No body sheets or collision dimensions changed.

`systems/action-sounds.ts` synthesizes original, lightweight foley: voiced sobs
with local rain for crying, a rising charge/low hum/crackle for power-up, and an
engine/exhaust loop for jetpack. Floating, dashing, reactions and care have
restrained matching cues. Related clips share a sound family, preserving the
voice while walking or turning and through flight stages. Jetpack landing fades
thrust through its existing envelope. The effect/master sliders and mute apply;
nearby actors use distance falloff and remote-player muting. Browser audio still
requires a real pointer/key interaction. The reference column stays silent.

The existing AudioManager owns one scheduler and an eight-voice action limit.
`runtime/action-audio.ts` owns each actor's voice; hidden pages, paused/sleeping
scenes, culling, action changes and cleanup release it with a short fade.

`runtime/actor-shadow.ts` renders an integer-pixel stepped contact shadow behind
standing/moving/resting characters and cats. Floating and jetpack spread/lighten
the shadow on the floor below the body. The shadow follows the physical ground
anchor rather than lifted model joints. Preview and flight-specific duplicate
shadows were removed. These layers are owned by ActorEmoteEffects, including
their visibility/depth/scale and destruction.

The reusable PawTrail Actors skill documents these requirements in
`references/sound-and-shadows.md`. No automated checks, tests, builds, or running
app browser verification were performed for this change.
