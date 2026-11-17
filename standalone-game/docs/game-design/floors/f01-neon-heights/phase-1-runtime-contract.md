# Phase 1 — local floor runtime foundation

The owner approved the floor plan and first concept batch on 2026-11-15.
This phase authors isolated source foundations; it does not replace the current
Neon Heights preview or install the approved lobby/market art as a flattened map.
Runtime/visual acceptance remains a separate observed status.

The owner subsequently authorized focused tests and typecheck. All seven tests
in `tests/floor-foundation.test.ts` passed, and a strict typecheck of the six new
modules and their imported dependencies passed. See
[verification evidence](phase-1-verification.md). No browser or build was run.

## Implemented source boundaries

| Module | Responsibility and current scope |
| --- | --- |
| `src/game/floors/state.ts` | Versioned local campaign types, validation, compact facts/knowledge, signed NPC/faction scores, quest states and pure guarded outcome reduction |
| `src/game/floors/neon-foundation.ts` | First-loop event definitions: starter SC, Mara meeting, checkpoint/board, Q01 claim, Q02 acceptance, Cell, exclusive Clinic/Transit choice and report |
| `src/game/floors/store.ts` | Explicit local save-slot creation, preserved invalid/unsupported saves, expected revisions and single-snapshot outcome writes under a cross-tab Web Lock |
| `src/game/floors/travel.ts` | Approved stage adjacency/gates, install-aware travel planning, loaded-stage/arrival/disposal contract; no fake portals |
| `src/game/floors/animation-clock.ts` | Stage-owned bounded clock, deterministic per-instance offsets, pause/visibility and reduced-motion poses; no timers per object |
| `src/game/floors/prop-renderer.ts` | One shared native WebGL adapter for existing real furniture models, per-instance poses, existing projected contacts, whole/foreground passes and explicit disposal |

These modules are not imported by the current app routes. Entering an installed
floor will lazy-load the domain and prop adapter during the later playable-loop
phase. A metadata registration is not proof a destination exists: travel requires
the caller's actual installed-stage bindings.

## Local state and accepted outcomes

The save slot is keyed by `pawtrail:floor-campaign:v1:<profileId>`. No import,
constructor-free page load or map inspection creates a save. Explicit creation
is required, and an existing slot is never overwritten to recover an error.
Neighborhood and editor save formats remain independent and intact; automatic
migration of their inventory/Kibble is intentionally absent.

The reducer returns a candidate state or a blocked/invalid/already-applied result.
It does not claim persistence. The store re-reads under its exclusive lock,
validates the expected revision, applies the candidate and writes one snapshot.
Only successful storage completion authorizes a saved-success receipt. Quota,
read/parse/unsupported-version, stale-revision and lock failures have explicit
failure results. No success, SC receipt or reputation cue should precede that result.

Receipt IDs prevent the same outcome/event being spent or granted twice. Profile
and expedition scopes are distinct. Insufficient inventory rejects the candidate
without changing the original. NPC knowledge and reputation are separate: the
first allocation is a public notice; later private choices must explicitly choose
their knowledge recipients. Scores clamp to -100…100; inventory and SC use bounded
nonnegative safe integers. Unknown/oversized saves are preserved, not reset.

Outcome definitions are trusted content authored in source, not arbitrary payloads
from dialogue text or network clients. UI adapters must supply accepted game
events, not hover/preview/rehearsal events. This is local prototype integrity,
not server security or verified platform currency.

The first-loop definitions deliberately stop before Q03–Q11, shops/crafting,
enemy drops and the full narrative graph. The phase-3/4 content adapters will
connect actual authored NPC scenes and world events to this foundation. The
phase-1 source alone does not implement the full floor story.

## Travel and checkpoint handoff

Use `planTravel` with the live campaign and actually installed destination set.
The route graph allows safe reverse travel and enforces Q02's report for initial
Undergrid entry, plus authenticated keys for the market shortcut/Bastion gate.
Personal reputation does not remove essential travel. Unbuilt stages return a
clear unavailable reason, not a load-success animation.

The later controller must preload the candidate, use its real navigation and
actor-foot geometry to choose a safe arrival, persist location/checkpoint under
the local lock, then activate the stage. Failure/cancellation disposes only the
candidate and retains the current stage. Checkpoint IDs are actual layout-bound
data to author after concept approval; no unmeasured coordinate is registered here.
The persistent location commit/active-scene adapter remains integration work in
the playable-loop phase, not a completed portal hidden behind this contract.

## 3D prop composition decision

Preserve the 2D map and the current selected actor. One shared prop renderer
renders existing approved source models at their native 96 × 112 frame using
the source furniture camera and pixel finish. It does not instantiate a second
actor. Contacts come from the same existing `projectedGeometry` helper at every
supported facing. Rendering uses whole/base output under the actor, then the
appropriate foreground output over a docked actor. The later stage/controller
adapter owns docking, occupancy, safe exit and depth ordering.

Models and GPU contexts are created only when the adapter is explicitly used.
Capacity defaults to 16 instances with a hard maximum of 32. Each placement owns
its mutable model; immutable source artwork/definitions are reused. A single
scratch frame is copied immediately into the stage rather than retained as a
mutable shared image. Native compositing uses nearest filtering. Hidden/culled
props should not call draw; no model owns a RAF. Exit disposes models, renderer
and its owned context; context loss produces an explicit unavailable state.

This is actual model rendering into a 2D composition, not a prerecorded sprite
relabelled as live 3D. It is a source implementation, not evidence that actor
fit, all facings, performance or alpha/depth have passed runtime review. No new
prop meshes, source turnarounds, texture assets or 3D city have been created.

## Checked logic and pending visual acceptance

Observed automated coverage: distinct Clinic/Transit effects and public memory;
once-only claims and JSON reload; missing costs/wrong event types; independent
save slots; corrupt/unsupported/failed-write preservation; concurrent store
revision rejection; unavailable/gated travel; clock pause and reduced-motion pose.
The browser's actual Web Locks implementation and live WebGL were not exercised
by the in-memory test adapters.

Permission and observations are separate from implemented source. Before calling
the phase runtime-verified, review the first-loop outcome/store behavior, a real
actor with an existing approved 3D prop at required facings, native depth/alpha,
seat/stand/rotation, lifecycle and actual device memory. Source reading and the
concept images do not satisfy those checks. Tests/build/browser permission still
comes from the current AGENTS/user instructions.

Concepts A/B/C are separately approved for composition/style; see
[the concept review](concepts-v1.md). Their animation layers and assets are the
next production batch, not outputs of the concept images themselves.
