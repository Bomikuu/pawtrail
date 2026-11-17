# Reuse PawTrail infrastructure honestly

Inspect the current game before implementing a monster. Skill documentation is
not evidence that a monster editor, exporter, combat service or preview already
exists. At this skill's creation, existing reusable pieces include:

- `src/game/actor-rig/`: articulated authoring, material/part helpers, pixel
  rendering, pose/playback and source finishing. Existing player rigs are not
  arbitrary monster anatomy. Inspect current interfaces before extending them.
- `assets/actor-appearances/catalog.json` and existing actor-preview bindings:
  a reference for versioned assets and companion-art/profile registration.
  Do not put an arbitrary creature into a rescuer/cat kind it cannot support.
- `src/game/items/{document,runtime,spatial,preview,scene}.ts`: actual weapon
  documents, hit regions, cooldown/timing and rehearsal conventions.
- `src/game/stage-editor/playtest.ts`: actual local player movement, collision
  and action rehearsal. Reuse it as the opponent/scale reference where suitable.
- `src/game/abilities/` and `src/game/runtime/`: existing behavior, effect and
  actor lifecycle boundaries; inspect supported capabilities before promising one.
- `src/components/ui` and existing game HUD components: official shadcn controls,
  primary Saira Condensed and secondary Instrument Sans, with Tailwind-first layout.

These paths are inspection starting points, not instructions to edit them all.
Add only the minimal creature-specific rig/profile/encounter binding needed for
an authorized creation. A separate monster data type can reuse infrastructure
without overwriting existing actor, cat, item or furniture catalogues.

## Durable package and delivery

Keep the model source, editable textures, source references/prompts, authored
artwork, cues and native manifests under the project's selected monster authoring
location. Choose/register actual paths during implementation; do not print a
nonexistent `pawtrail-monsters` CLI or preview URL as if it worked already.

Record a stable ID, package/version, provenance, native dimensions/anchors,
part hierarchy/attachment, art/profile/cue bindings, stats, weaknesses, actions,
phase rules and actual install/review status. A single record should connect the
same monster throughout previews, bestiary and gameplay.

For a full new monster, reuse the available companion-art skills with creature
briefs. If a required tool or stage is unavailable, preserve its pending status.
Do not silently substitute a player portrait or call a static image animated.
Any genuinely new tool/editor work belongs to the scoped creation and should
be explained; do not rebuild the whole authoring platform for one creature.

Preview drafts and training damage are local. Live multiplayer installation
requires an actual server contract for encounter state, damage events, HP, phases,
cooldowns, participation and idempotent rewards. Never turn real community pets
into adversaries or use local combat totals as Django welfare/verified Kibble data.

## Focused acceptance when authorized

Review the changed scope once as a coherent package, with a bounded correction
pass for observed defects. Follow workspace permissions; do not run tests,
builds or Firefox simply because an acceptance list exists.

- **Presentation:** follow [boss feedback and layered effects](feedback-and-effects.md).
  Inspect separate animated creature/context-background/aura layers, independent
  playback and their combined loop. Check tactile click/open response, animated
  2D normal/skill/item impact effects and ground-anchored magic circles, including
  reduced motion and cleanup. Boss enrage must briefly use its own special portrait
  in the screen center, trigger once from the actual phase transition and restore
  the HUD; tinting the default portrait does not pass.
- **Identity/art:** original reference, portrait, icon, illustration and model agree;
  selected style/alpha/native size remain intact. Review all promised visible angles.
- **Scale/attachment:** actual player size unchanged; wall root/seam stable through
  idle, maximum head reach, attacks, stagger and defeat. No cropped defining parts.
- **Combat:** actual supported weapon hits meet the named hurt areas; weakness
  conditions matter mechanically; preparation, hit and recovery match cues/telegraphs.
  A single hit is not multiplied by overlapping head/body regions accidentally.
- **Health:** full HP, exact bar boundary, multi-bar overflow, zero/defeat, allowed
  healing and phase-threshold skips. The HUD derives from the same canonical HP.
- **Lifecycle:** busy/cooldown rejection, phase changes, cancellation, stagger,
  death, reset and scene exit clean up pending hits, effects, sounds and camera state.
- **Sound:** cues match the authored creature/timing and respect existing volume,
  user-gesture unlock and cleanup. Missing/unheard audio is not a passed review.
- **Authority:** distinguish local rehearsal from real server behavior; shared
  rewards/damage and reconnect/concurrency need their own authorized evidence.

A stats-only edit does not require rebuilding geometry or regenerating artwork.
A changed shared hit/health/lifecycle system needs checks of affected users of that
system; a new boss alone does not authorize unrelated mobile/app audits.

Return the package's real paths/preview, defined controls, health units and
remaining work. Source review, generated art, installation and runtime acceptance
are separate outcomes. A pending review is never recorded as a pass.
