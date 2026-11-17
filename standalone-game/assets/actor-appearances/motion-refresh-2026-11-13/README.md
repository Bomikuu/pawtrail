# Amber and Vaelrith motion refresh

The owner canceled the Tripo experiment. The existing articulated 3D models with
painted 2D skins remain the default representation. This revision changes their
separate illustrated presentations and Amber's voice direction, not their rigs.
Other actors and the separate social-application worktree are outside this revision.

## Artwork

- Amber Refined cel portrait: 12 complete neutral-idle drawings for each of the
  three existing angles. The selected angle stays fixed while the head, shoulders,
  hair and ribbon move. New complete neutral blink/speech drawings match the new
  resting art; the five other expressions and their states remain available.
- Final portrait: 96 × 120 native frames, 132 complete frames, 268,780 bytes for
  the complete served style including metadata and reference images. Lossless
  WebP avoids a standalone-game dependency on the social app's Brotli API adapter.
- Amber illustration: 12 complete frames at 192 × 320, including knees, boots,
  feet and soles with margins. Hair, ribbon and coat move around the held pose.
  Runtime package: 160,875 bytes; 1.44-second cycle.
- Vaelrith illustration: 16 complete frames at 384 × 256. Heads and necks
  counter-sway, jaws/throats move, and the wall base stays anchored. Runtime
  package: 615,259 bytes; 1.6-second cycle. The separate boss portrait is unchanged.

The reference video is a motion example, not game artwork or voice material.
Its copied source, sampled metadata and hashes are recorded in
`reference-inputs.json`. Exact generation prompts, source images, frame mappings
and publication records are retained beside this file. The native atlases are
authoritative; preview GIFs/contact sheets are authoring artifacts only.

## Runtime integration

The existing complete-frame portrait renderer now supports authored idle
sequences while retaining blink, speech and legacy expression playback. The
shared illustration player reads counts/timing from the installed manifest and
is reused by the boss artwork tab. Existing pause, offscreen, hidden-tab and
reduced-motion behavior is retained. No model weights, voice engine, source WAVs,
reference video or source-generation sheets are imported by the game.

Review routes when the local app is running:

- `/play?preview=actors&skin=amber-outrider&art=portrait`
- `/play?preview=actors&skin=amber-outrider&art=illustration`
- `/play?preview=monsters&monsterView=3d` → Artwork
- `/play?compare=amber-representations&mode=painted-3d`

## Voice revision

The active authoring profile remains
`../profiles/amber-outrider/voice-audition-v1.json`; its revision field identifies
the new `audition-v2` takes. The original profile/audio are retained. The greeting
is a direct friendly “こんにちは。”; hurt is a single “うっ！” impact grunt.
Appreciation retains the longer two-utterance line. Other cues use one short
utterance. Flirtatious delivery is reserved for profiles that explicitly call
for it. Delivery quality requires listening, not a transcript alone.

Generation uses the existing saved VoxCPM2 speaker and cached model. Its original
CPU attempt timed out without a take. The retry uses opt-in dynamic int8 weights
for LM Linear layers only, retaining original activation types and AudioVAE.
This is an authoring-only memory accommodation, not a runtime game dependency.
Actual audio takes, measurements, generation timings and installation status are
recorded in the voice profile and the VoiceStudio source-take directory.
The final installed six-cue pack is 36,029 bytes. Its new hurt take is 1.526
seconds. Overlong first takes are archived and were not installed. All new
recordings remain listening auditions; their requested scripts are not claimed
as independently verified transcripts. The temporary external VoiceStudio source
patch was restored after generation. See `revision.json` for final take IDs and
measured durations.

## Review status

Inspected the generated art and native exported contact sheets, including the
portrait's rest/blink/speech scale transitions, full lower-body coverage and the
boss's anchored composition. Source integration and native asset exports are
complete. Full-cycle visual playback, in-game behavior, voice listening and
owner acceptance remain **pending**. No automated tests, builds or browser
verification were run; the current project instructions do not authorize them
for this request. Static artwork inspection does not approve live animation.

Updated the actor, portrait, illustration, voice-production and project monster
skills with these authoring preferences and the same review/permission limits.
