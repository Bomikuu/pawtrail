# PawTrail Furniture Implementation Plan

**Goal:** Create a reusable furniture skill and a working reference-led couch with 3D authoring, native pixel game views, actor seating, rotation/style controls and optional construction rules.

**Architecture:** Keep furniture separate from actor rigs, sharing camera/pixel finishing and connecting through explicit seat sockets. A couch definition generates four views per color, matching geometry and foreground occlusion. The furniture creator previews the same model and actor sit pose. Housing consumes the generated views through its existing placement/navigation/interaction transaction boundary.

**Tech Stack:** Three.js authoring, shared pixel finishing, Phaser housing, React/Tailwind/official shadcn controls, Django housing services.

**Spec:** The owner's current request and existing `pawtrail-actors` production workflow. Start with the existing two-seat `sofa-housing-v1.png` as the visual reference; preserve old furniture and unrelated actor work.

## Global constraints

- Implement directly without agents. Do not run automated tests/checks, application builds or browser verification. Requested furniture asset rendering is production artwork, not game verification.
- Use Firefox for the isolated art export. Keep the development preview running.
- Native dimensions/anchors and projected geometry come from generated metadata. Use integer nearest-neighbor display; render real model facings rather than rotating a flat sprite.
- Use shared official shadcn controls, Tailwind layout and existing heading/body font tokens.
- All construction resources and currency belong to the game service; they never credit verified community Kibble.

## Delivery steps

1. Author the couch model and shared rendering/projection contract. Export opaque furniture pixels on transparent native canvases, one foreground occlusion layer per facing, and geometry for two actor seat sockets.
2. Add a furniture creator at `?preview=furniture` with live model/color/facing controls, an above-object rotation indicator, actor Sit/Stand preview and construction option controls.
3. Install one couch catalog item with generated styles/views. Resolve view-dependent geometry in frontend/backend, preserve seat leases and hook editor rotation/style indicators into the existing draft/save workflow.
4. Add server-owned instant/timed/recipe construction using existing game supplies and idempotent mutations. Present available choices and jobs through the furniture editor; keep shortages and pending completion explicit.
5. Write `~/.codex/skills/pawtrail-furniture/SKILL.md` and focused workflow reference with the actual scripts, definitions, sockets, construction contract and scoped installation boundaries.
6. Source-review and document the result; mirror only touched game modules/assets to the main application. No runtime/test/visual pass is claimed under the standing workspace restriction.

## Review focus

Rotated seats/exit paths must follow the rendered facing; foreground layers must cover the appropriate parts of seated actors; styling must persist without changing inventory ownership; construction consumes resources once and completion grants inventory once; old placements/catalog entries remain valid.
