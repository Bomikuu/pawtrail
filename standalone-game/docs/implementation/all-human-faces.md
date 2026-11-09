# Shared face style throughout the game

All ten built-in human roster looks, saved device/account characters, visitors
and NPC bodies now use the canonical creator rig. The shared human face has no
nose, dark oval eyes, a restrained iris tint and one small catchlight. Powered
eyes use that same helper with temporary colors. Cats and independent dialogue
illustrations retain their existing art direction.

`actor-rig/game-appearances.ts` maps existing roster identities/palette roles to
the shared rig, preserving the existing look's hair, clothing colors, hats,
hoods, glasses and legwear. Local workshop hair/outfit/head/size choices remain
supported. This factory also drives the character picker and the workshop's
human preview, avoiding a second human face renderer.

`runtime/live-character.ts` samples the same PixelActor at density 2, with native
128×160 frames. `models3d/phaser-bridge.ts` displays that image at half scale and
the existing foot anchor, so world size/collision/movement remain on their prior
coordinates. The original physical sprite is still the interaction/audio/effect
target; its effects do not inherit the displayed image's half-scale. Body-size
preferences are applied consistently to image and shadow.

Saved character configurations are not rewritten. Current readers supply optional
face defaults for older data. Existing IDs, selected looks, palette and revisions
remain intact. Old PNG thumbnails lack the current FACE_STYLE_REVISION stamp and
are ignored; the picker/library regenerates their miniature from configuration.
New saved thumbnails carry the current style stamp. No database migration or
automatic account-save mutation is involved.

The approved rescuer fallback/reference sheet was regenerated from the current
rig: 34 actions, eight headings and 3,056 source frames. Its registry uses a new
content-hashed asset URL. Normal human gameplay uses the live rig rather than
the retired per-roster human UV mesh path. Original 2D comparison sprites and
separate dialogue illustrations were not replaced.

No automated checks, tests, builds or running-app browser verification were run.
The isolated Firefox production renderer was used only to generate the fallback
artwork. The actor skill records the shared renderer and thumbnail requirements.
