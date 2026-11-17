# Yae Miko Japanese voice pack

The existing pack was subsequently connected to actual game play and dialogue;
see [game voice integration](game-character-voices.md). The preview-only scope
below records the initial delivery, not a current restriction.

The owner requested six original Japanese cues in Yae's own personality-led
voice and installation in her actor preview. This reuses Amber's shared mixer,
cue controls, accepted-action binding and authored portrait playback.

## Direction and continuity

Yae's authored performance is composed, perceptive, self-assured and lightly
teasing: a smooth mid-to-low feminine register, measured pace, restrained warmth
and quiet authority. These are fictional adaptation choices. Her exact age is
not asserted; the mature-adult voice direction is not a biographical age claim.
This is an original synthetic speaker, not an imitation or clone of her official
performer. No external voice recording is uploaded.

- Local engine: existing VoiceStudio VoxCPM2 on CPU, using the installed model
  and backed-up low-memory loader repair. No new model download is required.
- Separate saved profile: `c65920a1`, named
  `Yae Miko - PawTrail original Japanese voice (VoxCPM2)`; seed `1131302`.
- Her first greeting becomes her own pinned reference through the native
  profile-lock API. The remaining five cues reuse that profile and reference,
  with cue-specific performance controls and the same 10-step inference setting.
- Scripts, voice direction, take IDs and exact measurements live in
  `assets/actor-appearances/profiles/yae-miko/voice-audition-v1.json`.
- Source WAVs and take metadata stay on Drive under
  `/run/media/micxsz/Drive/VoiceStudio/pawtrail/yae-miko-audition-v1`.

The first loading attempt ended when VoiceStudio stopped under low available
memory, before any take was saved. The existing installation was restarted
after available RAM recovered to about 9 GB. Generation reuses the persisted
Yae profile rather than creating a second speaker. This is a local CPU authoring
constraint, not browser playback overhead. A second attempt was also terminated;
the systemd-oomd log confirmed a VoiceStudio scope kill for sustained memory
pressure while loading weights (about 8.5 GB scope usage).

The backed-up CPU loader now assigns checkpoint-backed parameters directly,
avoiding a second anonymous resident copy of the complete checkpoint. Any
checkpoint tensor with a differing dtype is converted to the original target
dtype before assignment. The existing complete-language-model key guard,
regenerated RoPE buffers, architecture, weights and inference settings remain.
GPU/training/LoRA behavior is unchanged. The pre-change source is preserved at
`/run/media/micxsz/Drive/VoiceStudio/compat/voxcpm2-before-mapped-assign.py`;
the active source hash and change description are in `voxcpm2-low-memory.json`.

| Intent | Japanese | Meaning |
| --- | --- | --- |
| Greeting | あら、来たのね。待っていたわ。 | Oh, you came. I was waiting. |
| Farewell | また会いましょう。気をつけて。 | Until we meet again. Take care. |
| Attack | 逃がさないわ。覚悟なさい。 | You will not escape. Prepare yourself. |
| Hurt | うっ……油断したわ。 | Ugh… I let my guard down. |
| Thanks | ありがとう。助かったわ。 | Thank you. That helped. |
| Encouragement | 大丈夫。あなたならできるわ。 | It's all right. You can do this. |

## Reusable production and preview

The existing authoring scripts accept `--actor yae-miko`, preserving Amber as
their default. Generation resumes valid existing takes instead of duplicating
them. Publishing requires six completed, measured Opus exports under the 100 KB
pack budget; it updates only the selected actor's catalog entry.

```sh
python3 scripts/create-amber-voice-audition.py --actor yae-miko
python3 scripts/install-amber-voice-preview.py --actor yae-miko
```

The published pack lives under
`public/pawtrail-game/actor-studio/voices/yae-miko/v1`. Open
`/play?preview=actors&skin=yae-miko&art=portrait` and use the six cue buttons or
the relevant action selector. Greeting/farewell wave; attack uses an accepted
power-up; hurt uses a reaction rehearsal; thanks claps; encouragement cheers.
The automatic map also supports accepted dash, power run and give-gift events.
Hurt rehearsal does not apply real damage. Rejected casts remain silent.

The shared model-to-voice resolver selects each actor's own pack. Actual audio
start/end events drive the selected actor's authored portrait expression and
speaking frames. Walking/turning does not retrigger a line. Pause, reset, mute,
hidden tabs, action/actor changes and scene teardown cancel stale speech.
Audio remains on the shared master/effects mixer with bounded playback and
per-cue cooldowns. No separate AudioContext is created.

Scope is the actor preview; other game-world voice bindings are unchanged.
New recordings await owner listening. Automated tests, builds and browser
verification are not run under the current project instructions.

## Completed exports

| Cue | Duration | Opus bytes |
| --- | ---: | ---: |
| hi | 3.883 s | 12,156 |
| bye | 5.312 s | 16,033 |
| attack | 2.315 s | 7,403 |
| hurt | 3.520 s | 11,849 |
| thanks | 4.072 s | 13,123 |
| encouragement | 4.255 s | 13,397 |

Total served audio: **73,961 bytes**. Separate authoring MP3 listening copies: 143,688 bytes.

All six real clips and their public manifest are installed in the actor-preview catalog.
Format and duration were measured during export. Listening acceptance and runtime/browser verification remain pending; no automated tests or builds were run.
