# Amber local voice pack and actor preview

The existing pack was subsequently connected to actual game play and dialogue;
see [game voice integration](game-character-voices.md). The audition and initial
preview-only scope below describe the earlier delivery, not a current restriction.

VoiceStudio v0.5.7 is installed from the official Linux x64 release. Its
267,623,923-byte AppImage matched the release SHA256SUMS.txt. The companion
`voicestudio` Codex skill is installed in `/home/micxsz/.codex/skills/voicestudio`.

Open VoiceStudio from the application menu or run
`/home/micxsz/.local/bin/voicestudio`. Mount the Drive volume first.

The owner selected VoxCPM2 on November 13, 2026 and authorized downloading it
to Drive. The existing desktop-managed backend was reused; it returned
`status: ok`, `device: cpu`, `version: 0.5.7`. The five other downloads started
by VoiceStudio setup were left running at the owner's request and completed.

## Persistent installation

- Storage root: `/run/media/micxsz/Drive/VoiceStudio`.
- Python runtime: `project/.venv`, with CPU PyTorch 2.8.0 and the release-frozen
  dependency graph. Private Python/download caches remain on Drive.
- Desktop: `desktop/squashfs-root/AppRun`, extracted from the verified AppImage
  to avoid the external-location FUSE launch error.
- Application data: `data`; speech models: `models`; temporary media: `tmp`.
- The desktop menu and lowercase `voicestudio` launcher preserve these locations
  and CPU selection. The original AppImage remains in `~/.local/bin/VoiceStudio`.
- Runtime selection is recorded in
  `~/.config/VoiceStudio/runtime-location.json`; no database or project files
  were removed to make room.

The official CTranslate2 executable-stack compatibility repair was applied to
its installed library on Ubuntu 26.04. Required runtime imports succeeded.
The app supervises its single backend at `http://127.0.0.1:3900`; `/health`
returned `status: ok`, `device: cpu`, `version: 0.5.7`.
This is installation readiness, not a PawTrail automated test or audio-quality
review. No PawTrail tests, builds or browser verification ran.

## Audition scope and current state

`assets/actor-appearances/profiles/amber-outrider/voice-audition-v1.json` holds
Amber's adaptation profile, voice direction and six original Japanese scripts.
The owner accepted the greeting/attack audition and authorized the remaining
four cues plus actor-preview integration on November 13, 2026:

- Greeting: やっほー！一緒に行こう！ — Hey! Let's go together!
- Attack: いくよ！くらえ！ — Here I go! Take this!
- Farewell: またね！気をつけて！ — See you! Take care!
- Hurt: うっ！痛っ！ — Ugh! Ow!
- Thanks: ありがとう！助かった！ — Thank you! That helped!
- Encouragement: 大丈夫！一緒に頑張ろう！ — It'll be okay! Let's do our best together!

Use one saved original speaker identity across the pack, with different delivery.
The supplied gameplay reference remains a style reference, not a cloned voice.
The audition does not change existing body, portrait, icon or illustration art.

## Selected engine and speaker continuity

- Engine: `voxcpm==2.0.3` in VoiceStudio's isolated sidecar environment on Drive,
  with CPU PyTorch 2.11.0. Native engine installation reports success. The first
  cold import exceeded its 120-second setup timeout; completing that import and
  retrying the native installer succeeded without a second installation.
- Model: `openbmb/VoxCPM2`, approximately 4.96 GB. The catalog download used
  revision `bffb3df5a29440629464e5e839f4d214c8714c3d`; actual inference resolved
  `7936080b41163874f38610f46f438e2c0757f9fd`, reusing the large cached blobs.
  Both snapshots are on Drive. Hugging Face metadata lists Apache-2.0; this
  local audition is not a separate certification of commercial rights.
- Saved original design profile: `12b7981e`, named
  `Amber - PawTrail original Japanese audition (VoxCPM2)`, seed `1131301`.
  This is an original synthetic speaker, with no uploaded actor recording.
- The completed greeting is pinned through VoiceStudio's native profile lock
  as the reference for subsequent cues. Its reference transcript contains only
  the spoken Japanese, excluding the inline performance instruction.
- The six cues use different inline VoxCPM delivery instructions
  while retaining this same profile. No hosted voice service is used.

Other completed setup downloads remain intact: OmniVoice, faster-whisper
large-v3, NLLB-200 distilled 600M, Parakeet TDT int8 and Whisper tiny. They are
not Amber's selected synthesis engine.

## CPU loader compatibility

The initial VoxCPM2 loader allocated large float32 language-model parameters
before converting them to bfloat16. This caused severe memory pressure on this
machine. The stalled synthesis sidecar was stopped without deleting models.

A backed-up local repair in
`/run/media/micxsz/Drive/VoiceStudio/compat/apply-voxcpm2-low-memory.py` creates
the CPU language-model parameter storage directly at its final precision and
then loads the original checkpoint. It regenerates the original nonpersistent
RoPE buffers and rejects missing language-model checkpoint keys. It does not
change weights, architecture or generation settings; GPU, training and LoRA
paths retain their existing behavior. Original source and hashes are recorded
beside the patch. Package updates may require reviewing/reapplying this repair.

The revised loader completed and produced a real greeting. This machine is
using CPU inference; the greeting's first request took 238.64 seconds including
model loading and output processing. This is an authoring cost, not browser
playback time. The subsequent attack request took 68.75 seconds with the model
already loaded and the greeting pinned as speaker reference.

## Audition production

`scripts/create-amber-voice-audition.py` calls the existing local API, reuses
the saved profile and valid takes, validates returned WAV containers, and
exports compact mono Opus plus MP3 listening copies. It never downloads models
or installs the audition into the game.

- Source WAVs and take metadata:
  `/run/media/micxsz/Drive/VoiceStudio/pawtrail/amber-audition-v1`.
- Compact exports and manifest:
  `assets/actor-appearances/profiles/amber-outrider/audio/audition-v1`.
- Greeting: generated, 3.036 seconds, 9,830-byte Opus and 18,812-byte MP3.
- Attack: generated, 1.513 seconds, 4,726-byte Opus and 9,740-byte MP3.
- Initial two-cue compact Opus payload: 14,556 bytes (14.6 KB); MP3 listening copies:
  28,552 bytes. Both are mono. Source WAVs are 48 kHz; MP3 copies are 24 kHz.
  Opus reports its standard 48 kHz decode rate after 24 kHz encoder input.

Completed six-cue pack:

| Cue | Duration | Opus bytes |
| --- | ---: | ---: |
| Greeting | 3.036 s | 9,830 |
| Attack | 1.513 s | 4,726 |
| Farewell | 2.770 s | 8,260 |
| Hurt | 2.332 s | 7,214 |
| Thanks | 1.600 s | 5,091 |
| Encouragement | 3.017 s | 10,198 |
| **Total** | **14.269 s** | **45,319** |

Only these six Opus clips (45.3 KB) and a small manifest are published for
playback. The authoring MP3 listening copies total 89,256 bytes and remain
separate from the served game pack.

The original greeting and attack remain unchanged. The remaining four cues use
the same locked speaker profile and 10-step inference settings. New-cue
listening acceptance remains pending. Multi-GB authoring models and source WAVs
are not browser game assets.

## Actor-preview integration

Open `/play?preview=actors&skin=amber-outrider&art=portrait`. The voice panel
offers six play/stop controls, each with a matching existing gesture, Japanese
script, romanization, translation, duration and actual compact pack size.

`scripts/install-amber-voice-preview.py` publishes only completed Opus clips
under `public/pawtrail-game/actor-studio/voices/amber-outrider/v1`, writes their
public manifest and updates `src/game/runtime/actor-voices.json`. The installer
requires all six real exports and preserves the configured 100 KB audio budget.
It does not launch the app or run verification.

| Cue | Explicit preview gesture | Automatic action selection |
| --- | --- | --- |
| Greeting | Wave | Wave |
| Farewell | Farewell wave | Explicit cue button |
| Attack | Power up | Accepted power-up, power run or rescue dash |
| Hurt | Sick/recoil reaction rehearsal | Sick reaction |
| Thanks | Clap | Clap or give a gift |
| Encouragement | Cheer | Cheer |

Speech starts only after the scene accepts the gesture. Failed/cooldown casts
remain silent and show a failure message; hurt rehearsal does not create damage
or a health receipt. Selecting a cue or a new action interrupts stale speech.
Moving with WASD, turning, or looping an action does not restart the recording.
Reset, pause, mute, hidden tabs, actor/scene changes and leaving the preview
cancel outstanding playback. Per-cue cooldowns limit repeated calls.

The existing AudioManager supplies the single shared AudioContext and master/
effects channel. Audio is loaded on demand and decoded through its existing
cache. Actual buffer-source start/end callbacks drive the portrait's authored
speech frames and cue expression, returning to the current action expression on
completion or cancellation. Blinking, breathing and selected portrait angle
continue to use the existing portrait renderer; no facial features are drawn
procedurally for this voice feature.

This installation is limited to the actor preview. Other characters, saved
appearances and world gameplay voice bindings are unchanged. Runtime/browser,
audio listening and automated checks were not performed for this integration;
format/duration measurements come from the actual export pipeline.
