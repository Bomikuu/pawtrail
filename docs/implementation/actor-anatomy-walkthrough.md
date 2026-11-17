# Interactive character anatomy walkthrough

Open `/play?preview=anatomy` or **Your PawTrail spaces → How characters work**. This extends the existing creator/preview tools within PawTrail’s warm studio theme. It is a local learning surface, with no account, saved-character, game-action or reward writes.

The walkthrough uses one real refined Amber model. The layout follows the owner’s sketch: a compact 300px left column (340px on wide screens) stacks the fixed-height Amber preview above Controls & stages; the large right panel contains the current explanation. The model host is 208px tall and never stretches to fill the viewport. On smaller screens the preview, controls and explanation stack in that order. Eight timeline phases cover the shared joint hierarchy, wireframe geometry, unpainted geometry, material colors/UV textures, idle/secondary animation, locomotion, a local jump recipe and the shared dance. The construction sequence is educational; an artist can iterate on modeling, painting and rigging in a different order.

The official shared shadcn Select provides stage selection, and Slider provides scrubbing. Previous/next stage, Play/Pause, playback speed and Loop phase make it possible to inspect individual motion poses. Timeline, camera, geometry highlights and action adjustments sit beneath the preview. Free mouse/touch orbit, wheel zoom, front/three-quarter/side presets, fit/zoom controls and a real joint overlay are independent of the timeline. Focus the model and use arrow keys for keyboard orbit. The camera keeps its chosen angle during playback; the view presets can be reapplied after dragging. Reduced motion starts paused, explicit playback remains available, and switching to a hidden document pauses playback.

## Rendering and examples

- Reuses `createAmberShoulderStudy`, the actor camera configuration, Three.js OrbitControls and `PixelFinish`. A single private WebGL context renders Amber into one nearest-neighbor 128×160 canvas with integer display scaling. It does not instantiate or render a second base character.
- Bone links follow the world-space transforms of the actual articulated joint groups. They are a teaching overlay, not a claim that the procedural model uses a loaded skeletal GLB.
- Original mesh/material bindings are retained and restored before disposal. Wireframe and clay phases change only preview materials. Amber’s ribbon/hair/cape can be highlighted as geometry. Texture inspection reads her actual in-memory texture canvases.
- Walking separates the shared walk pose from a small position/facing demonstration. This open field does not implement a collision room; actual collision testing remains in the stage editor.
- The jump is a preview-only recipe layered onto the shared rig: crouch, rise, airborne arm/leg pose and landing. Height changes root movement, with a grounded shrinking shadow. It does not register a new game ability.
- Dancing reuses the existing shared action and applies a local energy multiplier to selected joints. It does not replace the shared gameplay animation.

Entry UI: `src/components/game/actor-explainer.tsx`. Lesson content: `src/game/actor-explainer/lesson.ts`. Rendering: `src/game/actor-explainer/scene.ts`.

The official shadcn Slider has one accessibility adaptation: forward the caller’s `aria-label`, `aria-labelledby` and `aria-valuetext` to its interactive thumbs. Its registry behavior, styling and keyboard handling are preserved. No new bitmap assets, dependencies, server APIs or save formats are needed. Application tests, checks, builds and browser verification were not run, following the owner’s standing instruction.
