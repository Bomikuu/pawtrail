# Sampaguita Neon Heights

Open `/play?preview=stage&map=cyberpunk`, or **Files → Neon Heights cyberpunk
district**, then **Play map**. WASD/arrows move, Shift runs. The current actor,
collision controller, integer camera and local save/export workspace are reused.

This new 48 × 36 tile stage (1536 × 1152 px) adapts the owner's neon skyline
reference to the existing elevated 2D game view. Eleven tower blocks surround
connected wet-looking boulevards and a hologram plaza. A lower observation /
maintenance terrace includes rooftop fans and modular steel rails. Cyan,
blue and magenta emission is localized in the generated materials; the actor
and HUD are not darkened with a global screen filter.

Nine built-in ImageGen sources provide continuous terrain and eight transparent
placeables: cyan spire, magenta arc tower, habitat block, android hologram, koi
emitter, street kiosk, fan/duct module and railing. Exact prompts and per-image
service timings are retained in `prompts.json` and `sources/*.json`. The approved
fine-textured pixel finish is reused while the new reference overrides theme,
architecture and palette. Sources stay outside runtime imports; only bounded
native 2D exports are served, without a new 3D city renderer.
Three integer 2× tower variants build the denser northern skyline, whose upper
stories intentionally continue beyond the map edge. Ground footprints follow
the visible bases independently of the tower silhouettes.

## Editable assets and files

- Stage editor categories: **Cyberpunk · skyline**, **Cyberpunk · holograms**,
  **Cyberpunk · street props**.
- Native registry: `src/game/stage-editor/neon-art.json`.
- Editable layout: `src/game/stage-editor/maps/neon-heights-v1.json`.
- Runtime art: `public/pawtrail-game/map-art/neon-heights-v1/`.
- Importable stage: `public/pawtrail-game/stages/neon-heights-v1.json`.
- Scoped producer: `scripts/prepare-neon-heights.py`.
- Composition: `native-overview.png`; prop sheet: `asset-sheet.png`;
  arrival: `arrival-guide.png`; dependencies: `asset-inputs.json`.

Every tower/prop is an independent movable object with a registered ground
footprint, not a picture flattened onto the floor. Transparent hologram artwork
is scenery with a solid projector base; it does not add a new NPC or advertise
an unimplemented action. There are no building interiors, vehicle controls,
animated skyline simulation, combat encounters, reward/account writes or world
portals. The terrace is part of the same playable ground plane, not a new
multi-level physics/jumping system. Existing maps and explicit saved drafts
remain unchanged.

## Review

Native image export and artwork review do not prove gameplay behavior. No app
tests/checks/builds, subagents or browser verification were requested; actual
walking, actor visibility behind towers, collision clearance and asset loading
in the live game remain pending review under the owner's instructions.
