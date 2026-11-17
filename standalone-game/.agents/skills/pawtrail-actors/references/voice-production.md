# Personality-led voices, compact exports and preview integration

Use for an actor's voice stage or a focused voice update. Reuse the existing
portrait, illustration, model and shared audio system. A full new actor includes
six generated cues and working preview bindings unless the owner explicitly
changes that scope. Do not generate new voices during ordinary browser saves.

## Distinct speaker per character

Owner delivery preference: appreciation/thanks may be the longer line. Greeting,
farewell, attack and encouragement use one brief utterance, while hurt is one
short impact grunt rather than a two-line pain statement or prolonged moan.
Greetings default to direct, friendly, neutral delivery. Reserve flirtation,
breathy intimacy and teasing delivery for profiles that explicitly call for it;
do not infer flirtation from a feminine voice or a smiling portrait. Preserve the
actor's own speaker across cues and keep listening acceptance separate.

Author pitch/register, texture, pace, energy, warmth, formality, emotional
restraint and wording from the character profile. These are fictional performance
choices, not age/nationality/personality facts inferred from a real face.
Amber's bright, energetic delivery and Yae's composed, lower-register, lightly
teasing delivery are contrasting examples, not templates for every character.
Use the requested/profile language; do not choose Japanese from a name alone.

Create or reuse that actor's own saved speaker. Never default a new actor to
Amber's profile/seed/settings or overwrite another actor's accepted recordings.
Keep one identity across the six cues; vary delivery rather than performers.
A separate ID or seed provides repeatability, not proof of perceptual distinction.
Record listening acceptance separately. The default is original synthetic speech,
not a clone of an official character performer or reference-video speaker.

The six IDs are `hi`, `bye`, `attack`, `hurt`, `thanks`, `encouragement`. Each
clip stays brief; only thanks may use two short utterances by default. Record native text, pronunciation/
romanization, translation, delivery direction and intended portrait emotion.
Fit the dialogue register to the individual, including quiet/formal characters.

## Reuse VoiceStudio and pin the identity

Use `$voicestudio` and the existing local installation; discover `/health`,
`/openapi.json`, installed engines and saved voices/profiles. Honor an already
chosen provider. Do not download models, reinstall the backend or select a hosted
provider merely because a new actor is being authored. Obtain the user's choice
for a genuinely missing provider/model; preserve authorization and auth controls.

Current local setup: VoiceStudio 0.5.7, `voxcpm==2.0.3`, CPU, rooted at
`/run/media/micxsz/Drive/VoiceStudio`. Models, isolated environments, source WAVs,
caches and temporary files stay on that mounted Drive. Reuse the lowercase
`/home/micxsz/.local/bin/voicestudio` launcher if the service needs starting.

In the installed native API:

1. Reuse the actor's exact saved profile ID, or create a named `kind=design`
   profile through `/profiles` using supported attributes, original direction
   and a recorded seed. Inspect the design mapper's result: it previously read
   “not shrill” as “very high pitch.” Use explicit supported categories and
   cue-specific freeform delivery controls instead of trusting that parse.
2. Render `hi` through `/generate` with the selected engine/profile. Confirm an
   actual successful WAV response and save its real `X-Audio-Id` and settings.
3. Pin that recording through `POST /profiles/{id}/lock`, using its real
   `history_id` and seed. Set `ref_text` through the native profile update to
   **only the audible greeting text**. The lock operation otherwise copies inline
   delivery instructions from history into the reference transcript.
   When revising a greeting with an already locked speaker, retain the existing
   reference transcript unless its corresponding reference audio is also replaced.
4. Generate the other five with that same locked profile. VoxCPM2 currently
   supports `(delivery instruction)spoken text`; keep the instruction out of
   the spoken transcript. Preserve its stored reference, inference parameters
   and source audio; do not create five new speaker designs.

These are version-specific contracts; inspect the installed schema before using
them after an upgrade. The implemented packs use 10 inference steps, guidance
2.0, no denoise/postprocessing and 16-bit WAV, with performance direction changed
per cue. Reuse valid completed takes on resume; never duplicate a live request
just because a client wait timed out. Confirm native job/history/take state first.
Keep performance controls concise. Archive overlong or unsuitable takes and
rerender only those cues; a requested short transcript does not prove the audio
is brief or contains the right words. Do not hide a prolonged pain take behind
a short subtitle or cut through a vocal sound just to meet a duration target.
Format/duration measurements do not replace listening acceptance.
If the owner authorized all six, do not add a new approval gate after the greeting;
an explicit request to audition first still takes precedence.

## Existing authoring and publication tools

From the game root, reuse:

```sh
python3 scripts/create-amber-voice-audition.py --actor yae-miko
python3 scripts/install-amber-voice-preview.py --actor yae-miko
```

Their historical names are retained; `--actor amber-outrider` also works. The
tools support `--revision audition-v2` for generation, `--revision v2` for
publication, and a focused generation selection such as `--cues hi hurt`.
Unchanged completed cues remain in the full pack; publish only when all six exist.
Current CLI choices cover Amber and Yae only. For a new actor, extend the existing actor
selection/configuration and shared preview resolver instead of cloning these
scripts or letting an omitted configuration fall back to Amber. Supply explicit
actor-specific `voiceDesign.profileName`, seed, attributes, instructions and
personality. Use existing source profiles as schema examples, not speaker presets.

- Profile/scripts/take provenance:
  `assets/actor-appearances/profiles/<actor-id>/voice-audition-v1.json`.
- Source WAVs and take JSON: the selected authoring volume, not browser assets.
- Mono Opus exports: versioned
  `public/pawtrail-game/actor-studio/voices/<actor-id>/v1/` plus public manifest.
- Runtime catalog: `src/game/runtime/actor-voices.json`; update only that actor's
  entry. Keep the other actors' audio and records intact.

Publish all six completed files, not placeholder URLs. The current installer
requires actual Opus/Ogg exports and a configured 100,000-byte pack budget.
The implemented encoding is mono Opus at 24 kbps VBR; optional mono MP3 listening
copies are authoring artifacts, not duplicate runtime payloads. Keep consonants
and natural tails intact. Report measured duration/bytes for each cue and the
served audio total separately from source WAVs, listening copies, manifests and
multi-GB authoring models. Amber's first pack is 45,319 bytes; Yae's is 73,961.
These are observed examples, not promised sizes for future voices.

## Connect actions and the actor's own portrait

Reuse `src/game/runtime/actor-preview-voice.ts`, `ActorVoicePreview`,
`ActorComparisonScene`, `CharacterCreatorEditor` and `CreatorPortrait`.
Add the new model-to-actor association in `previewVoiceActorId` and register its
pack. Do not leave Amber/Yae-only conditionals that silently exclude a new actor.

The current preview rehearsals are:

| Cue | Gesture / trigger |
| --- | --- |
| Greeting | Wave; intentional greeting cue button |
| Farewell | Explicit farewell wave button; distinct recording from greeting |
| Attack | Accepted power-up, power run or rescue dash |
| Hurt | Explicit reaction rehearsal; current base uses the sick/recoil gesture |
| Thanks | Clap or give a gift |
| Encouragement | Cheer |

Adapt gestures when a character has a more fitting existing action. Start speech
only after the scene accepts the action; failed/cooldown casts stay silent with
visible failure feedback. A hurt audition is not a damage event. In actual game
bindings, hurt follows confirmed hits and thanks follows a completed interaction;
preview installation alone does not authorize promoting world gameplay bindings.

Use the single shared AudioManager, its user-gesture unlock, master/effects mute,
on-demand decode cache and bounded playback. Provide six play/stop controls with
native script, pronunciation, translation, duration and pack size. Prevent same-
actor overlap and rate-limit repeated calls. Movement, turning and looping frames
must not restart speech. Cancel stale playback on explicit action changes, reset,
pause, mute, hidden tabs, actor/scene changes and teardown.

Drive `talking` from actual buffer-source start/end/cancel events, not a guessed
timeout, text-reveal length or render loop. Select the **same actor's** authored
cue expression and speech frames, then restore its current action expression.
Retain the selected portrait angle, breathing, blinking and reduced-motion
behavior. No procedural eye/mouth repainting or new AudioContext is needed.
Return `/play?preview=actors&skin=<actor-id>&art=portrait` for voice/portrait review.

## VoxCPM2 CPU low-memory repair

Apply this section only to the matching local CPU loader, not every TTS engine.
Inspect the running package/source and existing repair before changing anything.
The observed failure was systemd-oomd terminating VoiceStudio's scope at about
8.5 GB during checkpoint loading; `/generate` disconnected before saving a take.
Available RAM alone did not prevent sustained memory-pressure kills.

The **complete** installed repair has two parts:

1. For CPU inference without training or LoRA, construct `base_lm` and
   `residual_lm` on the meta device, convert their parameter dtype to the original
   configured dtype, then allocate empty CPU storage with `to_empty`. Recreate
   the original nonpersistent RoPE buffers normally: they are absent from the
   checkpoint and cannot remain meta/uninitialized. Preserve the original final
   LM dtype conversion, AudioVAE float32 behavior and KV-cache initialization.
2. After merging the original model and AudioVAE checkpoint dictionaries, compare
   incoming tensor dtypes with the model's target state and convert only actual
   mismatches. Load with `model.load_state_dict(..., strict=False,
   assign=low_memory_cpu)` so CPU weights can retain checkpoint-backed storage
   instead of copying a second complete set into anonymous resident memory.
   Preserve the missing-`base_lm`/`residual_lm`-key guard; incomplete language-model
   checkpoints must fail before inference.

The initialization-only repair was **not sufficient** on Yae's run. Do not treat
the helper's presence or the old script's “already installed” message as evidence
that checkpoint-backed assignment is installed too. Do not change global default
dtype, quantize weights, alter the architecture or relax missing-key protection.
GPU/training/LoRA paths must retain their original behavior. This is inference
only; assigned parameter identity is not an optimizer/training recipe.

Installed target:
`data/engines/voxcpm2/voxcpm2/.venv/lib/python3.11/site-packages/voxcpm/model/voxcpm2.py`
under the VoiceStudio Drive root. Repair records/backups live in `compat/`:

- `voxcpm2-2.0.3-model.original.py`: untouched package source.
- `voxcpm2-before-mapped-assign.py`: source before the second part.
- `voxcpm2-low-memory.json`: scope, target, backups and original/active hashes.
- `apply-voxcpm2-low-memory.py`: **initialization-only** historical installer;
  it does not recreate the full second part by itself.

Keep backups and hashes before a scoped source change. After a package update,
inspect compatibility rather than blindly applying old string replacements.
Use the normal next authorized render to observe loading/inference success;
do not invent an import-only or file-presence check as audio-quality acceptance.
In Yae's successful retry, the complete loader restored the model in about seven
seconds with roughly 6 GB available; CPU synthesis remained a separate cost.

On a failed/killed run, inspect the actual service error/log, native history and
saved takes. Do not loop an unchanged memory-failing request. Restart only the
existing service/own stalled synthesis after resolving the observed cause; do
not kill unrelated applications or disable OOM safeguards. Do not duplicate model
downloads. Once the batch finishes, unload only the owned idle speech model via
the native model lifecycle API to release RAM while retaining files/profiles.

## Completion and review boundaries

Record generation, publication, listening acceptance and runtime verification as
separate outcomes. Respect the project's no-agent/no-automated-check/no-browser
instructions; required reviews not performed remain pending. When authorized,
review pronunciation, distinct character tone, same-speaker continuity, clipping/
tails, all six play/stop paths, accepted/rejected actions, portrait emotions and
speech ending, interruption, mute, actor switches and cleanup. Never claim to
have heard audio from its metadata or to have verified playback from an export.
If blocked, preserve real completed takes and name the precise missing step;
scripts, silent files or unbound assets do not substitute for a completed pack.
