# Actor production tools

Use `scripts/actor-job.py` for new actor jobs. It wraps the existing exporters and
Firefox authoring workflow; it does not generate artwork, replace the rig or run
a test suite. Keep the complete actor/portrait/illustration/icon acceptance rules.
The current Linux tooling uses Python 3, Pillow for image gates, and the existing
Playwright CLI Firefox wrapper. Use the same Pillow-enabled interpreter as the
working exporters. No new service or npm dependency is installed.

## Start once, resume the same job

`init` creates a manifest and an fsynced journal; it refuses to overwrite a job.
Paths below are project-relative except `--job`, which names the manifest.

```bash
python3 scripts/actor-job.py --job assets/actor-appearances/new-actor-v1/production.json init \
  --actor new-actor --name 'New Actor' \
  --model-file src/game/actor-rig/new-actor-rig.ts \
  --model-assets public/pawtrail-game/actor-studio/new-actor/v1 \
  --portrait-collection new-actor-refined-cel \
  --portrait-dir public/pawtrail-game/game-assets/dialogue-portraits/new-actor-refined-cel-v1 \
  --illustration-dir public/pawtrail-game/actor-studio/illustrations/new-actor/v1 \
  --icon public/pawtrail-game/actor-studio/icons/new-actor/v1/icon.png \
  --skip-voices
```

Use `--skip-voices` only for an owner-authorized omission; otherwise provide the
voice-pack dependency paths before review. `--install-in-game` records an already
authorized installation, not permission to promote the actor. For a vehicle add
`--model-kind vehicle`. A shared pilot/mech job has two actor entries, with their
own model/asset dependencies and the pilot's shared portrait where appropriate.
The Rika/Peony `production.json` is a concrete example using existing approved art;
it does not retroactively invent generation timings or mark old captures passed.

Fill the manifest's assets and export inputs as each stage is prepared. Carry
forward the requested portrait matrix and variants; do not remove rows to finish
sooner. Init supplies the standard three angles and six emotions. Read the actual
selected-style contract before changing those values. Source actions come from
`src/game/actor-rig/actions.json`; the full current human action set is retained.

## Record work, service waits and failures immediately

```bash
python3 scripts/actor-job.py --job JOB start --actor new-actor --kind stage --name illustrations
python3 scripts/actor-job.py --job JOB start --actor new-actor --kind generation --name normal
```

Save each returned event `id` as the span id. Write the generation start **before**
calling imagegen. Await the tool's actual completion; an image displayed before
completion is not a downloaded file. Import each returned local file:

```bash
python3 scripts/actor-job.py --job JOB import --asset normal --source /absolute/generated.png --run SPAN_ID
python3 scripts/actor-job.py --job JOB end --span SPAN_ID --outcome complete
```

Import copies through a temporary file and atomic rename, hashes the completed
file and persists its receipt. End the generation after its outputs are imported.
Use `failed` plus a concrete retry cause for a failed call; start a new span for
its retry. Record `work`, `wait`, `export`, `review` and enclosing `stage` spans
separately when those timings are useful. `--parent` links a child operation.

After a host/session interruption, inspect `timing`, then close abandoned spans
with `--outcome interrupted --note '...'`. Do not infer their duration from the
next morning's clock. A different boot cannot complete an old span as measured
work. Open/interrupted intervals remain unknown. Completed spans retain actual
monotonic elapsed times; parallel/enclosing spans overlap and must not be summed.

```bash
python3 scripts/actor-job.py --job JOB timing
```

The authoritative history is `JOB_DIRECTORY/.production/events.jsonl`, locked
and fsynced on each append. JSON summaries are replaceable views. An incomplete
last journal write is preserved as a separate torn-tail file on the next append;
interior corruption is reported rather than silently discarded.

## Export readiness

An asset declaration can require dimensions, transparency, content margins,
nonempty grid cells, native bundle bytes, JSON keys and nonempty extracted masks:

```json
{
  "assets": [
    {"id":"normal", "path":"assets/actor-appearances/new-actor-v1/normal-generated.png", "kind":"image", "origin":"generated", "transparent":true, "minMargin":8,
     "regions":[{"id":"hair", "polygon":[[10,10],[90,10],[90,150],[10,150]], "minPixels":1, "subtractPrevious":true}]},
    {"id":"first-sheet", "path":"assets/actor-appearances/new-actor-v1/portrait-0-generated.png", "kind":"image", "origin":"generated", "grid":{"columns":5,"rows":6}},
    {"id":"portrait-pack", "path":"public/pawtrail-game/game-assets/dialogue-portraits/new-actor-refined-cel-v1/CURRENT_REVISION", "kind":"bundle", "origin":"derived", "maxBytes":300000,"minFiles":5}
  ],
  "exports": {
    "face_check":{"requires":["first-sheet"],"produces":[]},
    "portraits":{"requires":["first-sheet"],"produces":["portrait-pack"]}
  }
}
```

The example shows fields, not a complete portrait export input list: declare all
three actual sheets and every other input the selected exporter reads. Use the
actual hashed pack folder, not the whole parent containing historical versions.
`reused` assets require explicit `provenance` and readable files. Other inputs need
an import/export receipt for their exact bytes plus a completed generation/export
span. Existing files alone do not establish completed generation.

Regions are subtracted in declared order to match extraction; an entirely
subtracted hair part blocks the export. Intentional overlap must be explicit.
The Rika adapter reads the same `illustrationParts` recipe as its readiness gate,
so polygon edits cannot silently diverge between validation and extraction.
Other exporters should likewise share their part recipe rather than duplicate it.

```bash
python3 scripts/actor-job.py --job JOB ready --stage portraits
python3 scripts/actor-job.py --job JOB export --stage portraits -- python3 scripts/ACTOR_EXPORTER.py portraits
```

The wrapper refuses to launch before all inputs are ready, records exporter
failure/interruption, checks declared outputs and byte budgets, and withholds
success receipts if inputs changed during the operation. Exporters that already
write directly to runtime folders are not transactionally rolled back by this
wrapper; their failed output remains unaccepted until repaired/re-exported.
For new exporters, stage output before publishing. No shell string is evaluated.
The Rika entrypoint also invokes the gate for direct calls once its production
manifest exists. Other legacy exporters remain unchanged; invoke them through
the wrapper. Preflight does **not** assess art quality, identity, loop smoothness,
legibility or pose correctness. Keep every visual gate.

## Resumable Firefox review

```bash
python3 scripts/actor-job.py --job JOB queue
python3 scripts/actor-job.py --job JOB capture --next --open --session actor-production
```

`--open` starts an isolated **Firefox** session. Subsequent captures reuse it.
Only local `/play?preview=actors&skin=<actor-id>` development URLs are accepted.
The adapter reads current labels from the dev app and uses the actual UI controls,
keyboard-selects Radix options, waits for the renderer/assets and saves the whole
comparison field, avoiding fixed crops that lose a dashing actor. It does not
patch action state to manufacture a result. Do not edit candidate sources during
a capture unit. No Chrome fallback is launched.

The queue includes every current action at two motion moments plus return, four
headings, every requested portrait angle/emotion with rest and three speech/blink/
breath moments, both illustration loops with layers isolated/restored, icon,
dialogue and mobile captures. Additional explicit observation units retain:
movement/action lifecycle, likeness, action SFX/shadow/circle, illustration pause/
restart/visibility/reduced motion, voices when included, real gameplay when
installed, and vehicle cockpit/collision/furniture behavior when applicable.

A capture is **captured — needs visual review**, never an automatic pass.
Inspect the saved images, animation and relevant source art. If a blink/mouth
phase was not sampled, inspect it live or capture it again; the image count alone
is not proof. Open dialogue pages and exercise manual units in Firefox. Record
only observations actually made:

```bash
python3 scripts/actor-job.py --job JOB review --case new-actor/action/idle \
  --result pass --note 'Observed planted feet, breathing, attached hair and correct neutral portrait; inspected both phases and return.' \
  --evidence PATH_FROM_THIS_CASE_CAPTURE
```

Repeat `--evidence` for the relevant images/recordings. Passing a captured unit requires
its own candidate's evidence. Fail/blocked reports can attach other real diagnostic
captures. Manual units require real evidence and a specific
observation note too. `fail` and `blocked` remain incomplete. Capture exceptions
retain partial files and a transcript, record the failure and leave the case
uncaptured. Snapshot and correct a missing locator immediately; do not repeatedly
retry a 30-second wait. A failed recapture cannot silently pass the case.

Run `queue` after a repair or restart. It recomputes fingerprints from each case's
instructions, actor contract and declared dependency groups. Local static model
imports are followed recursively (rig, gait, geometry, textures and pose helpers);
computed imports and external asset files need explicit entries. Package/lock
versions and shared preview/renderer bindings belong in dependencies too. Missing
dependencies block review. Changed files stale only the cases that depend on them;
unchanged passes remain reusable. Modified/deleted evidence also invalidates a
result. A shared rig/renderer change deliberately affects more cases than a lone
illustration revision. Check the dependency inventory before trusting reuse.

`capture --next` skips valid passes and cases already awaiting visual inspection;
manual units stay visible for direct work. `capture --case ID` repeats a specific
unit. To close only the owned review browser:

```bash
bash "$HOME/.codex/skills/playwright/scripts/playwright_cli.sh" -s=actor-production close
```

Do not alter the owner's browser profile or authoritative game/platform data.
Do not turn tooling into permission to run tests, builds, new model generation,
unrequested broad review or agents. Existing actor-skill quality and authorization
rules still govern execution.
