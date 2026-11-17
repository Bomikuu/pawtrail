# Vaelrith, the Riftbound

Local monster preview: `/play?preview=monsters`. It is also reachable from the
existing game navigation menu under **Monster studio**. This installs an authoring
rehearsal, not a live-world enemy spawn or multiplayer combat service.

## Approved identity and health

The owner approved the three-headed wall design and changed the proposed health
to **10×**. This means **10 bars × 1,000 HP = 10,000 HP**, retaining the proposed
per-bar value. The rejected 50-bar proposal remains historical authoring data.
The runtime catalog reads current health directly from the creature profile.
Visual size, stacked bars and damage multipliers are independent.

Vaelrith is an original ancient rift guardian imprisoned behind a broken sanctuary
wall. Three independent armored necks protrude through fixed sockets. Dark violet
armor, cyan seams, magenta eyes/throats and swept horns preserve the approved
identity. The central head is larger than the two flanking heads.

Authoring package: `assets/monster-studio/vaelrith-riftbound/`.
Runtime artwork: `public/pawtrail-game/monsters/vaelrith-riftbound/v1/`.
The supplied Grand Chase image is a private visual reference; its logo and scenery
are not served as game assets. Generated masters and exact prompts are retained.

## Artwork and creature volume

- Six complete portrait drawings: watchful/front, threatening/three-quarter and
  hurt/head-tilt, each with an alternate blink, roar or breathing drawing. Native
  frames are 128×128. The portrait artwork is below its 300,000-byte bundle limit.
- A separate 48×48 selection icon uses the shared wooden character-icon frame.
- Four full illustration drawings play a six-step forward/reverse breathing loop;
  native frames are 384×256. Reduced motion holds the first frame.
- Four generated 128×128 material skins wrap actual armor, throat, stone and horn
  geometry. Six original synthesized nonverbal WAV cues use the existing effects
  mixer, user-gesture unlock and abortable sample playback.
- `src/game/monsters/rig.ts` retains the editable Three geometry. Each head has
  four linked neck volumes, layered belly/crown armor, brows, horns, teeth, a
  separate jaw hinge and a named throat target. Wall root and sockets remain fixed.

The 3D model now loads only after **Load 3D preview** is selected. **Unload 3D
preview** disposes that scene; opening the page shows a static authored poster.

The actual Amber creator model and equipment factory are reused at their original
scale. Its body height is measured in world units, excluding weapon meshes, then
used to size the boss at roughly eight player heights and fifteen player heights
across the wall. The player is never shrunk. Native nearest-neighbor output uses
the existing camera setup and PixelFinish, with integer CSS zoom and a 24fps render
cap. The existing weapon session retains its fixed-step combat timing. Paused
views update only after an explicit camera, resize or control change.

## Controls

Start encounter, then focus the viewport. WASD/arrows move, Shift runs, J uses the
actual training-sword strike and K uses its projectile ultimate. On-screen move
and strike controls are also provided. Drag to inspect from nearby angles;
Restore camera returns the initial composition. Escape or Pause cancels active
attack windows. Reset restores both characters, cooldowns and all ten bars.

Leaving the tab, losing window focus or switching artwork views pauses combat.
Leaving the page disposes owned geometry, textures, renderer, input, observers,
effects and cue voices. Encounter state is memory-only and local.

## Mechanics

One canonical HP pool serves all heads and seals. The HUD derives the active bar
and remaining stack count from it. A hit may overflow several bars; exact bar
boundaries remain full and zero HP defeats once. Regions touched by the same
weapon cast/strike window are grouped before damage so overlapping heads or
seals cannot multiply one strike. The existing AbilitySession handles weapon
range, strike windows, projectiles, cooldown and hit eligibility.

The prototype assigns 120 base damage to a sword strike and 600 to the projectile
ultimate. Armored seals receive 0.5× damage. An exposed, lowered throat receives
2× base damage **instead of** the armor multiplier. A cyan floor ring marks when
that throat is physically within player reach. Seals and throats use separate
hurt regions; the huge rendered bounding rectangle is never a hurt box.

The player is blocked from the sanctuary wall while retaining an open arena.
The floor danger tiles and damage queries use the same normalized ground-space
function. Amber tiles indicate preparation; red tiles indicate active damage:

| Attack | Preparation / active / recovery | Cooldown | Damage |
| --- | --- | --- | --- |
| Rift Fang | 900 / 220 / 1,600 ms | 6 s | 30 once at the locked ground target |
| Obsidian Sweep | 1,100 / 450 / 1,800 ms | 9 s | 25 once in the near-wall band |
| Violet Exhalation | 1,400 / 1,200 / 2,500 ms | 12 s | 15 per eligible 400 ms tick, at most three |
| Seal Rupture | 2,600 / 1,400 / 3,200 ms | 24 s | 40 once in three separated lanes |

Phases are Bound above 65%, Fracturing at 65–30%, and Riftstorm at 30% or below.
Threshold skips select the final applicable phase directly. Phase transitions
cancel the current boss move and leave a warning interval. Seal Rupture is only
available in Riftstorm. Hitting a seal during its recovery staggers all heads for
2.2 seconds. Phase change takes precedence if that hit crosses a threshold.
No boss attack uses asynchronous delayed damage callbacks.

## Review status — 12 November 2026

The concept has owner approval. Native portrait/icon exports were inspected;
source implementation, generated texture skins, cues and preview bindings are
installed. This does **not** establish successful runtime behavior.

No automated tests, type checks, build, browser verification or gameplay listening
review has been run for this boss. The workspace requires an explicit request.
Pending: visual model comparison from useful angles, actual player scale/contacts,
portrait and illustration loop continuity, sound quality/timing, real sword hits,
stack overflow and boundaries, skipped phases, weakness windows, player damage,
pause/reset/exit cleanup and the shared-menu navigation. Do not advertise these
as passed until reviewed. No unrelated furniture or mobile sweep is required.

All lore, combat and rewards are fictional/local. No real animal record, account
inventory, Django reward ledger, verified Kibble or payment is read or mutated.

## Focused verification update — 12 November 2026

The owner authorized focused monster tests and Firefox review. All 12 tests in
`tests/monster-encounter.test.ts` passed: health boundaries/overflow, strike
deduplication, armor/throat rules, attack ticks and safe lanes, phase restriction
and threshold skips, cooldown, stagger, pause, reset and defeat.

Project type checking fails in existing community/housing/furniture/actor files;
there are no diagnostics in the new monster files. Evidence is retained in
`output/playwright/vaelrith/`.

The owner then requested remote browser testing because their PC was crashing.
Local browser work was stopped. No completed Firefox interaction or screenshot
review is claimed. No remote browser is attached; the available saved cloud
environment is non-runnable. Resume graphics verification only in an available
remote environment or with renewed authorization to use the local machine.

## Memory investigation and fix — 12 November 2026

Two concrete resource defects were found: the monster viewport applied a
full-frame CPU pixel transform continuously while paused, and the shared
PixelFinish cached every encountered 24-bit color in an unbounded Map. Animated
lighting and textured geometry can keep adding distinct colors. Per-pixel array
creation and fresh output buffers also caused avoidable allocation churn.

PixelFinish now uses a fixed 256 KiB direct-mapped cache. Full RGB keys are checked
on every cache hit; collisions recompute the exact nearest palette entry. Existing
actor-frame calls still return independent ImageData objects. Live viewports may
reuse an explicit output buffer. Per-pixel temporary arrays have been removed.
The monster preview uses this buffer, stops idle/paused work, caps active updates,
requests a low-power WebGL context and supports cancellation before constructing
a stale renderer. Its default page no longer initializes 3D automatically.

All 16 focused combat/memory tests passed. The browser-free color-stream test
processed 786,432 distinct colors with a fixed 262,144-byte cache; after GC,
retained heap did not grow. These tests preserve palette colors, contours, alpha
and independent cached actor frames. Evidence: memory-fix-tests.txt in
output/playwright/vaelrith. No browser was opened during this investigation.

Approximately 9.9 GiB of memory was available during the initial OS snapshot.
Current and previous boot kernel queries returned no OOM-kill record. The defects
above are proven in source, but no crash dump or live memory trace yet proves
which process caused each reported crash. Browser/model acceptance remains
pending; the memory fix is not a claim that every system crash is resolved.

## Confirmed development-server OOM — 12 November 2026

The follow-up investigation found the missing crash evidence in the user service
journal, rather than the kernel journal: systemd-oomd killed
`pawtrail-preview.service` after Vite reached **9.9G memory and 1.5G swap**.
The earlier pixel-cache fix did not address this server-side failure.

Tailwind was using implicit source detection from the workspace root. This
workspace contains over 100,000 authoring, asset, backend and verification files.
Vite watcher ignores do not restrict Tailwind's independent source scanner.
`src/index.css` now disables automatic detection and explicitly registers `src/`
and `index.html`. Vite additionally excludes generated verification outputs,
Playwright artifacts, skill documents and documentation from file watching.
No runtime artwork or game features were removed.

A capped, browser-free validation exercised the actual Tailwind compiler and
three Vite CSS transforms: **393 scanned application files**, **160,709 bytes of
generated CSS**, **152.2 MiB cgroup peak**, **zero swap**, approximately 1.26 s
service runtime. It ran with a 768 MiB cgroup limit and no TCP listener, browser
or WebGL scene. Actual layout utilities (including shadcn controls and font roles)
were asserted present. This is CSS-compilation evidence, not a claim that the
complete running game uses only 152 MiB.

Artifacts: `server-oom-evidence.txt`, `server-memory-diagnosis.json`,
`style-memory-result.json`, and `check-style-memory.mjs` under
`output/playwright/vaelrith/`. A running dev process needs restarting to discard
its previous scanner/candidates and pick up the new source configuration.

### Actual startup verification

The owner clarified that memory exhaustion begins when starting `npm run dev`.
The exact dev script was then exercised on temporary port 5175 in a capped
cgroup, without a browser: readiness **819 ms**, **307.9 MiB peak**, **zero swap**.
The main entry, App module, Tailwind stylesheet and monster UI module all returned
HTTP 200. The temporary process group was stopped after verification; no normal
application server was left running. Evidence: `dev-startup-result.json` and
`startup-check.log` under `output/playwright/vaelrith/`.

## Riftfire Rain and motion refinement — 12 November 2026

A fifth attack, **Riftfire Rain**, is available in every phase through the attack
rehearsal controls and automatic rotation. Eight distinct random 0.6-player-height
square tiles are chosen once per cast. They warn for 1.5 seconds, burn for 3.2
seconds, and leave a 1.9-second recovery. Damage is 10 HP per eligible 600 ms tick
(at most six), with a 16-second cooldown. Standing outside the actual selected
tiles is safe; multiple fires never multiply one damage tick. Pause, phase
transition, defeat and reset cancel the pending hazard.

Built-in ImageGen produced sixteen complete transparent drawings for ignition,
sustained fire and decay. Native frames are 64×96 in a 256×384 atlas. One image
source is shared by eight preallocated sprite materials; eight floor meshes
share one exact-size tile geometry. Frame UVs change without creating scene
objects or uploading a new image each frame. Reduced motion holds an authored
flame frame while preserving hazard information. Generated master, exact prompt
and animated review export are retained in
`assets/monster-studio/vaelrith-riftbound/effects/riftfire-v1/`.

Every attack now uses 32 sampled scalar poses covering windup, active contact and
recovery, interpolated during playback. Head positions and jaws damp between
poses; intermediate neck volumes carry follow-through while each wall root stays
fixed. Active presentation is capped at 30 FPS. Static/paused work, on-request
3D loading, fixed color-cache memory and restricted Tailwind source discovery
remain in place. No full-frame animation-image cache was added.

All 25 scoped combat, effect-resource, motion and pixel-memory tests passed.
Checks include the real geometry trajectory, root attachment, exact fire-tile
damage, eight-object reuse, material/map disposal, fire-frame boundaries and
cancellation. A floating-point playback-boundary defect was found and corrected.
Changed monster files have zero TypeScript diagnostics; the existing 44 unrelated
project diagnostics remain. No browser or WebGL renderer was launched. Native
artwork was inspected; final in-game appearance and complete visual loop review
remain pending owner review.

## New fire-atlas loading correction — 12 November 2026

The new atlas existed on disk but the running Vite server returned HTTP 200
**text/html** for its image URL. Vite cached the set of public files at startup,
and the public-directory watcher had been excluded. Image decoding rejected with
a DOM error event; the preview displayed its generic non-Error fallback.

Public runtime files are now watched normally. Large authoring sources, backend,
output traces and documents remain excluded; Tailwind still explicitly scans
only application sources. The fire atlas now returns HTTP 200 **image/png**,
144,422 bytes with the correct PNG signature. A new PNG copied after startup was
also discovered and served without restarting; the temporary probe was removed.
The first probe immediately after automatic config restart ran before watcher
initialization completed; the settled watcher check passed.

Image-loader rejection events are wrapped in named Error objects for the fire
animation and individual boss material skins. The focused loader/resource suite
passes. Evidence: `asset-loading-result.json` and `asset-loader-tests.txt` under
`output/playwright/vaelrith/`. No browser or additional server was launched for
this repair. Live rendered encounter review remains pending.

## Damage and outcome feedback — 12 November 2026

Confirmed boss/player damage now emits world-positioned numbers, labeled armor
and weak-point outcomes, impact cues and a visible HUD summary. Phase changes,
stagger, defeat, cooldown/busy, blocked attacks and genuine misses have distinct
receipts. Projectile casts wait for their projectile lifetime before a miss is
shown. Overkill numbers are clamped to actual HP removed. See
`docs/implementation/interaction-feedback.md` for the shared contract and bounded
queue. All 32 focused tests pass; full visual review is still pending.

## Animated contact sprites — 12 November 2026

The owner clarified that numbers and rings were insufficient: an actual animated
sprite must show contact on the affected body. The preview now plays original
generated gold slash/sparks on seal hits, cyan bursts on exposed throats, and
orange bursts on incoming fire damage. Incoming physical hits use a warm slash.
Damage numbers and HP changes remain. Only accepted positive damage events spawn
the effect, at the actual seal/throat or player body height.

One transparent 24-frame atlas supplies twelve pooled sprites with nearest-neighbor
playback and explicit pause/reset/unload cleanup. There is no per-hit geometry or
material creation, bitmap frame cache, additional renderer or continuous idle
rendering. All 40 focused tests pass. Thirteen PawTrail skill sources and the
standing project instructions now require contact sprites alongside numeric and
status feedback. The generated native sheet was inspected and its HTTP image
response verified; live browser appearance is pending owner review.
