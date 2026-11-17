# PawTrail frontend requirements

- Use actual **shadcn/ui components installed from the official registry through the shadcn CLI**. Hand-written components that merely resemble shadcn do not satisfy this requirement.
- Keep the official shared component layer in `src/components/ui`. Compose those components for product behavior, including loading buttons, navigation actions, forms, and profile cards. Document necessary changes to registry sources.
- Use standard small-radius shadcn action buttons (rounded-md); avoid pill-shaped actions. Animal map markers, attention rings, and avatars remain circular. Keep navigation, titles, and menu text neutral; do not inherit the platform link accent into action labels.
- Use **Tailwind CSS first** for routine layout, spacing, typography, colors, borders, responsive behavior, and hover, focus, selected, disabled, and loading states.
- Reserve `.css` files for theme tokens, font declarations, browser-specific behavior, and genuinely complex animations or effects that are impractical to express clearly with utilities. Do not move ordinary component or page styling into separate stylesheets.
- Apply these requirements throughout the platform, management dashboard, authentication, and marketing interfaces. Preserve the distinct platform and management layouts.
- Follow these requirements for future work; do not reintroduce custom primitive substitutes or a parallel CSS component system.

These are the frontend requirements explicitly requested by the owner. They do not reinstate previously revoked agent instructions.

## Current game workflow

- This workspace now contains the standalone Phaser game. The social application remains in its separate worktree; do not overwrite its unrelated changes.
- Implement directly without agents. Do not run automated tests, checks, builds, or browser verification unless requested.
- Open external websites/browser links in Firefox and prefer Firefox for browser automation. Explain a tool limitation before choosing another browser.
- Keep prototype saves and Kibble clearly local. Never treat client reward totals as authoritative Django data.
- Every interactive action must visibly register its real outcome. Use animated contact sprites (slash flashes, sparks or elemental bursts) at the affected enemy/player on confirmed fictional-combat hits, alongside applied damage numbers and clear status feedback; show pending, success, failure or changed state for other interactions. A console log, sound or color alone is insufficient. Reuse bounded shared feedback and preserve reduced motion; never display unconfirmed damage, saves or rewards as successful.
- The generated native asset manifests are authoritative for frame dimensions and animation counts. Keep pixel-art rendering nearest-neighbor with integer zoom.
- Typography: use self-hosted **Saira Condensed** for primary headings, names and world labels, and **Instrument Sans** for secondary body text, controls and dialogue. Keep these roles consistent across the game, platform and management dashboard; use the existing font tokens.

- The owner now authorizes fixtures persisted in the actual database without repeated visible Sample tags. Keep stable internal seed provenance, the real API adapter and no in-browser/proximity fixtures. Never turn seeded animals or generated illustrations into identification references, verified Kibble or collected payments. See the live-social-backends guide for the real service boundaries.

## Weapon authoring

- Use `.agents/skills/pawtrail-weapons/SKILL.md` for new usable weapons: inspect the base character, create quick front/side concepts, build geometry with a generated 2D skin, then create three regular abilities and one ultimate with matching generated icons and Item Studio integration. Focused revisions can reuse approved assets. Keep existing verification permissions and local/platform boundaries.

## Monster authoring

- Use `.agents/skills/pawtrail-monsters/SKILL.md` for monsters and giant bosses,
  including wall-anchored/multi-headed creatures. Follow the artwork-first actor
  sequence with a creature profile, weaknesses, explicit HP units, a native 2D
  sprite/layer rig or selected 3D representation
  and encounter rehearsal. Preserve current verification permissions and
  fictional-combat/platform authority boundaries.


## Actor production tooling

- New actor jobs use `scripts/actor-job.py` and `docs/actor-production-tools.md`
  for durable timing, declared export inputs and resumable Firefox evidence.
- Captures and structural readiness are not visual approval. Keep the full actor
  quality checklist, explicit omissions and dependency-aware re-review.
- Preserve the existing restrictions on agents, automated tests/checks/builds and
  browser verification. Tool availability alone does not expand authorization.

## Map authoring

- Use `.agents/skills/pawtrail-floors/SKILL.md` for whole-floor concept/planning:
  themed regions with multiple stages, a shared tower lobby/local staging areas,
  ecosystem, story, quests, puzzles, materials, mobs, bosses and loot. Deliver a
  readable design and dependency-ordered implementation phases for owner review;
  planning alone does not start map, asset or encounter production.
- Include NPC decision memory and personal/faction reputation in floor plans,
  with authored branching dialogue, later callbacks and explicit state/persistence
  specifications. Scripts must cover actual choices and consequences; appearance
  production alone does not implement NPC memory or reputation.

- Use `.agents/skills/pawtrail-maps/SKILL.md` for reference-guided game maps made
  from a description or reference. Generate the envisioned map concept and wait
  for explicit owner approval before production. Then use
  `.agents/skills/pawtrail-assets/SKILL.md` for the asset packages: assess animation
  for every asset, animate cyberpunk scenery and use textured 3D for newly authored
  player-interactive map assets. Keep editable layouts and real collision/actor
  contacts; distinguish rendered 3D-source sprites from live 3D, and a local stage
  preview from a connected world installation.
- Preserve existing verification permissions and local/platform authority
  boundaries. A skill-authoring request does not itself create or replace a map.
