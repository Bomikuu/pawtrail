# Character identity, story tone and short voices

Owner cue-length and delivery preference: appreciation/thanks may be the longer
line; greeting, farewell, attack and encouragement use one short utterance and
hurt is one short impact grunt. A greeting is friendly and neutral by default.
Use flirtation only when the character's written personality explicitly calls
for it. Carry these defaults through scripts, performance direction and audition.

Use this for full new-actor creation, or when the owner requests a profile or
voice update. A focused geometry, icon or texture repair does not regenerate a
character's biography or audio. Preserve established identities and suitable
approved assets.

## First: working name and concept

Keep a supplied or already established character name. If none exists, generate
one without an extra naming approval: choose a fitting Japanese, German or
English name according to the intended tone and setting. Use coherent spelling
and record pronunciation/reading when useful. A Japanese or German name is not
evidence of a nationality, and a cool name need not imply an aggressive persona.
Check existing catalogue identities to avoid duplicates; keep the stable actor
ID independent of later display-name edits.

At reference inspection, record a provisional role, temperament and speaking
tone. Carry this concept into portrait expressions and the illustration while
preserving the owner's selected art style.

## After the illustration: finalize the story profile

Use the completed illustration and the original brief to author a consistent
fictional profile before constructing the gameplay model. Interpret visual cues
such as posture, expression, costume and equipment; don't present inferred
personality, age or nationality as facts about a real person in a reference.
For existing named fictional characters, retain supplied/established facts and
separate any PawTrail adaptation from canon. Keep unknown canon facts unknown.

Record these useful fields in a small versioned character-profile sidecar:

- Actor ID, display name, pronunciation and a one-sentence role/tagline.
- Age or age band. For an original fictional character, choose it as a story
  decision; distinguish apparent-age interpretation from an established age.
- Nationality/origin and cultural setting. Use supplied or established lore;
  otherwise author a fitting real-world or fictional origin and label it as an
  authored choice. Do not derive nationality/ethnicity from face or skin color.
- Three to five personality traits, plus a strength and a flaw that affect choices.
- A concise biography, present motivation, goal/fear and one or two story hooks.
- Dialogue tone: warmth/formality, vocabulary, sentence length, humor and how
  the character speaks when happy, upset or helping an animal.
- Voice direction: language/locale, approximate pitch range, vocal texture,
  pacing, energy, emotional restraint and pronunciation notes.
- Provenance distinguishing owner-supplied, established, visually inspired and
  invented details. Use this profile as continuity guidance in future stories.

Do not force the same cheerful rescuer personality onto every illustration.
A stern or reserved design can still communicate kindness through restrained
wording. Keep speech, portrait expressions and body action intent consistent.

## Six voiced cues, each no more than two short spoken lines

The owner expanded the previous five-clip allowance to six intents: hi, bye,
attack/special skill, hurt, thanks and encouragement. A full new actor gets all
six short audio clips and their actor-preview action/portrait integration unless
the owner explicitly requests an omission, smaller set or staged audition.
Each character has their own saved speaker derived from their personality and
speech tone; all six cues reuse that identity while varying delivery. Changing
the actor name, seed or pitch alone does not establish a distinct, suitable
voice. Do not reuse Amber's voice for every character. Do not exceed six without
an expanded request or silently add variants for individual abilities.

Read [voice production and preview integration](voice-production.md) before
rendering or installing voices. It covers native VoiceStudio profiles, the
pinned greeting reference, existing authoring tools, compact publication,
actual playback-driven portrait speech and the complete CPU loader repair.

Write original text, matching the profile's language and tone. Japanese greetings
are welcome where chosen; do not assume all Japanese-named characters must speak
Japanese. For non-English lines, record the native script, pronunciation or
romanization, and an English gloss. Use one short utterance per cue, with a
single grunt for hurt; appreciation/thanks alone may have two short utterances.

### Japanese example scripts and action delivery

These are original starting scripts to adapt, not a transcript of the supplied
audio. A slash separates the two short spoken lines within one cue/clip:

| Intent | Japanese | Reading | Meaning |
| --- | --- | --- | --- |
| Hi | こんにちは。 | Konnichiwa. | Hello. |
| Bye | またね！ | Mata ne! | See you! |
| Attack / special skill | くらえ！ | Kurae! | Take this! |
| Hurt | うっ！ | U! | Ugh! — one short impact grunt |
| Thanks | ありがとう！ / 助かった！ | Arigatō! / Tasukatta! | Thank you! / That helped! |
| Encouragement | 頑張ろう！ | Ganbarō! | Let's do our best! |

Use natural delivery appropriate to the individual: a warm greeting, gentle
farewell, projected attack/skill call, brief hurt effort, sincere thanks and
reassuring encouragement. A special skill may have a stronger breath/attack and
intonation without changing speaker identity. Don't apply one loud anime shout
to every situation. For quieter or formal characters, adapt the wording/register
as well as the volume. 「こら！」(Kora!) is a reprimand/"Hey!"; 「くらえ！」
(Kurae!) is a fitting "Take this!" attack call. Don't claim either was heard in
the reference without actual listening evidence.

An attack cue can use just its first short line for ordinary skills and a full
brief call for the selected special skill when authored that way. Distinct
recordings/variants count toward the six-file allowance; don't quietly generate
extra files for every ability. Keep this as a small action-cue pack, not full
voice acting for arbitrary conversations.

Reference: [YouTube, 2:40–3:00 only](https://www.youtube.com/watch?v=jfT7RrtqCXk&t=160s).
Inspect/listen only to 160–180 seconds when access and tools permit. Use it for
high-level timing, energy and delivery, then author a distinct character voice
and original lines. Do not extract its audio as the delivered voice pack.
The owner subsequently supplied the MP3 at
`/home/micxsz/Downloads/[Getamped2- Getz2] Bafabon Chain Vault (trigger build).mp3`.
It is accessible and has about 53 seconds of MPEG audio; its correspondence to
the original video's 160–180-second window is unverified. Keep the supplied
file as reference provenance, not a shipped game asset. Don't seek to 160
seconds inside this shorter upload or claim an exact source-window match.

Earlier work did not hear or transcribe that source recording; its listening
status is separate from each generated actor pack's review. Do not present page
access or file metadata as listening evidence, or request the same upload again
to solve a missing audio-analysis capability. Use the written direction for
original speech and retain any unreviewed reference status honestly.

Use an available voice-generation tool or authorized performance for actual
speech. Record the voice ID/settings and pronunciation direction so future
lines keep the same delivery. Procedural action foley and browser-dependent
speech synthesis are not exported character voice assets. If generation is
unavailable, deliver the profile and scripts, mark audio pending and explain the
specific missing capability; don't create silent files or claim speech exists.

Keep uncompressed masters in authoring storage and ship only compact supported
audio plus a small cue manifest. Mono is sufficient for these short voice lines;
trim dead air, retain natural consonants/tails, and use restrained consistent
levels. Aim around 100 KB or less for the whole short pack when intelligibility
allows; report actual bytes separately from the portrait's 300 KB allowance.
Record each cue's ID, intent, text, language, pronunciation, file, duration,
byte count, speaker/settings provenance and review state. Avoid duplicate audio
for trivial aliases. No new generation is triggered by ordinary in-browser saves.

## Binding and review

Suggested authoring location: `assets/actor-appearances/profiles/<actor-id>/`;
served audio follows the project's existing versioned actor-studio conventions.
Treat these as new story/audio metadata, separate from the strict appearance
save schema. Inspect the actual catalogue contracts and add a small validated
profile/voice binding when implementing an actor; don't insert ignored fields
into appearance JSON and claim the UI or backend supports them.

Full actor creation includes a profile summary and explicit play/stop voice
audition in the existing actor preview when the clips are available. Reuse the
shared audio manager and master/effects mute controls, user-gesture unlock,
bounded playback and lifecycle cancellation. Don't create another AudioContext.
Preview scripts/translations alongside their own clip. Dialogue may use a short
greeting or emphasis cue; don't loop speech continuously or treat a two-line
clip as a recording of arbitrary dialogue. Portrait talking follows actual
speech/dialogue state and returns to the character's authored rest frames.

Bind cues to meaningful events: hi at an intentional conversation opening, bye
at an explicit farewell, attack at an accepted skill cast, hurt at a real game
hit event, thanks at the appropriate completed interaction, encouragement at a
relevant help/quest beat. Use the action's actual presentation lifecycle and
avoid retriggering while walking, turning or rendering frames. Failed/cooldown
casts stay silent. Rate-limit repeated attack/hurt cues, avoid overlapping the
same actor's lines and cancel stale playback on interruption, actor/scene
changes or mute. A cosmetic preview button may audition each intent without
inventing gameplay damage, verified care or rewards. Use the shared portrait
emotion mapping and authored speech frames for each cue's intent.

With authorized listening/browser review, check pronunciation, character tone,
consistent speaker identity, clipping/tails, duration and readable portrait
speech behavior. Check replay/stop, interruption, mute, actor switches and scene
cleanup. Keep references, generated audio and actually reviewed playback distinct.
Follow current no-test/no-browser restrictions and record unavailable reviews
as pending. Deliver the story profile, cue scripts, actual files/bytes, preview
binding and any unresolved audio/tool limitations with the rest of the actor.
