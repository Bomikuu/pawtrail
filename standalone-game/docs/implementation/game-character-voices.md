# Amber and Yae game voice integration

The existing six-cue packs now serve game play as well as actor previews. No new
speech was generated. Amber remains 45,319 audio bytes; Yae remains 73,961.

## Selecting a character

Choose **Amber** or **Yae Miko** in the existing game character picker. Their
stable IDs are `amber-outrider` and `yae-miko`. Selection waits for the approved
refined model's textures/factory, with loading and failure feedback. World and
home rendering reuse those factories through the existing live-pixel renderer,
shared movement and interactions. No new native sprite sheets or collision scale
changes are required. Existing saves retain their prior selected characters.

`featured-actors.ts` carries shared identity, appearance and portrait collection
metadata. Housing profile validation explicitly permits these two built-in IDs;
other custom appearances still require the existing ownership check. No database
migration or reward/payment authority change is involved. A running Django
process must load the updated service source for the new home-profile choices.

## Voice triggers

| Cue | Game event |
| --- | --- |
| Greeting | Accepted wave; opening a human NPC conversation |
| Farewell | Explicit conversation close / Done |
| Attack | Accepted power-up / dash; accepted weapon casts in existing Amber combat arenas |
| Hurt | Confirmed positive player damage in existing Amber combat arenas |
| Thanks | Accepted clap / gift gesture; successfully claimed local quest |
| Encouragement | Accepted cheer; accepted local quest or completed care interaction |

Explore triggers run after action validation or local progress application.
Home/yard emotes follow the accepted room event. Home care follows the
InteractionController's completed phase, including `pet.updated` receipts and
successful asynchronous local care. Repeated complete status updates are
deduplicated by interaction ID. Failed, canceled or pending care/casts do not
produce success speech. Sick emotes are not treated as real damage events.
Yae does not gain fictional hurt events where the world has no damage system;
the existing boss arenas still have their fixed Amber player model.

## Dialogue and portraits

`Dialogue.voiceActorId` and optional `voiceCue` can identify a voiced speaker
explicitly. Existing appearance IDs and authored portrait collections also
resolve Amber and Yae. A voiced NPC uses its own large dialogue portrait.

When an Amber/Yae player talks to an unvoiced NPC such as Maya, the greeting and
farewell belong to the **player**. The brief voice-caption portrait and player
HUD show that actor, while the NPC's portrait stays separate. Care notes and
ordinary object inspection do not automatically become greetings. Short Japanese
cue text and its translation are shown as a cue, not represented as a recording
of the full English dialogue. Advancing paragraphs does not replay the greeting.

Portraits select the speaker's existing authored emotion and mouth frames.
Talking follows actual audio start/end/cancel events; the current action emotion
returns afterward. The selected dialogue angle, normal breathing/blinking and
reduced-motion behavior remain in the existing renderer. No facial features or
new artwork are synthesized at runtime. Exact saved copies of featured looks
may reuse their matching voice; arbitrary renamed or recolored characters do not.

## One speech channel and cleanup

`game-voice.ts` owns game intent, priority, current speaker and per-cue cooldowns.
There is no unbounded speech queue: lower/equal-priority requests are dropped
while a line is active. Dialogue has priority over action chatter; confirmed hurt
can interrupt an attack line. Actual actor changes and scene transitions cancel
stale speech. Movement/turning and frame updates never retrigger a cue.

The shared AudioManager now has a single exclusive `playSpeech` lane used by
both game and preview. Replacement silences/stops the previous speech source
immediately, including pending decoded requests; voice cancellation does not
crossfade into another line. The shared sample count is released once, and old
AudioContexts cannot decrement the new context's active count. Foley, music and
ambient audio retain their normal mixer channels.

Pause/reset, scene teardown, hidden tabs, focus loss, mute, character switches
and home disconnection/decoration cancel the applicable speech. Arena-specific
mute also blocks future arena voice requests. Stale async completions cannot
restore an old speaker or portrait expression.

## Review status

Implementation and source review only. No automated tests, type checks, builds,
browser verification or new listening review were run, per current instructions.
The frontend development server remains on port 3000. Runtime playback,
cross-scene cleanup and authenticated home selection remain for manual review.
