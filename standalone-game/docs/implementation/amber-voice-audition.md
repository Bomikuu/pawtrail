# Amber local voice audition

VoiceStudio v0.5.7 is installed from the official Linux x64 release. Its
267,623,923-byte AppImage matched the release SHA256SUMS.txt. The companion
`voicestudio` Codex skill is installed in `/home/micxsz/.codex/skills/voicestudio`.

Open VoiceStudio from the application menu or run
`/home/micxsz/.local/bin/voicestudio`. Mount the Drive volume first.

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
Amber's adaptation profile, voice direction and two original Japanese scripts:

- Greeting: やっほー！一緒に行こう！ — Hey! Let's go together!
- Attack: いくよ！くらえ！ — Here I go! Take this!

Use one saved original speaker identity for both, with different delivery.
The supplied gameplay reference remains a style reference, not a cloned voice.
The audition does not change existing body, portrait, icon or illustration art.

Speech-model selection is pending the owner's response:

- `k2-fsa/OmniVoice`, observed revision
  `c5fdb5ccb189668d56333f77ba2629f4cd7535f4`: 3,267,470,260 bytes including
  the tokenizer. Its model README distinguishes Apache-licensed code from
  CC-BY-NC pretrained weights; tokenizer files carry their own licence.
  Do not treat a local audition as approval to ship these assets commercially.
- `openbmb/VoxCPM2`, observed revision
  `7936080b41163874f38610f46f438e2c0757f9fd`: 4,960,731,830 bytes;
  Hugging Face metadata lists Apache-2.0. VoiceStudio documents Japanese,
  CPU operation and voice design support; CPU speed and memory fit still need
  observation during generation. Its optional engine package is not installed.

No speech-model weights or Amber audio clips have been downloaded/generated.
Once a model is selected, discover its installed API capabilities, install that
model on Drive, save a repeatable voice profile and generate the two auditions.
Use the shared runtime audio path only after the audition is selected; don't
fabricate file URLs or ship empty placeholders. Measure actual duration/bytes
and leave listening acceptance to a real audio audition. The six-cue pack aims
around 50–100 KB after compact mono export; the multi-GB authoring models are
not browser game assets.
