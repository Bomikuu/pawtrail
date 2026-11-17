# Furniture texture editor

Open `/play?preview=furniture` or choose **Furniture editor** in the game menu. The layout follows the existing skin texture studio: a searchable asset rail, native texture canvas and live preview, bounded to the game viewport. On smaller screens, Assets / Paint / Model switches panels without unmounting the renderer.

## Actual asset coverage

The editor derives its inventory from `src/game/housing/catalog.json`, currently 110 items. `furniture/definitions.json` identifies three authored 3D models: Trail couch, Curtained opening and Little reef aquarium. The other 107 catalog items retain their actual 2D artwork. A sprite is not extruded or presented as a unique 3D model. Categories, search, item thumbnails and a 3D-model filter browse this collection. `&asset=<catalog-id>` opens a particular item.

For authored furniture, the existing shape constructor provides geometry, contacts and original material maps. Styles reuse that item's geometry and change its materials; they are not separate shapes. The editor creates a local instance and preserves UVs, native texture dimensions, alpha, sampler transforms and the documented facing cameras. Shared maps appear once and update all their mesh bindings. Solid materials get a 1 × 1 color surface. RGBA DataTextures become CanvasTextures with a copied sampler and canvas source, rather than a DataTexture instance incorrectly wrapping an HTML canvas. No shared runtime geometry, artwork or catalog definitions are modified.

## Editing

- Brush, restore-original brush, eyedropper and connected fill use the skin studio's shared native-pixel painting helpers. Hard brushes range from 1–32 pixels.
- The texture canvas supports integer fit/zoom, a pixel grid, original comparison and actual mesh UV edges. Large canvases scroll from their full extent. Downloads exclude editing overlays; the UV reference is a separate export.
- Orbit or paint directly on the 3D model. Raycast UVs select and edit the same canvases as the 2D editor. Screen strokes sample each hit without drawing UV lines across seams. Each touched surface gets one undo snapshot per stroke; undo/redo is per surface, with 24 snapshots. Animation freezes during a model stroke.
- Quarter-turn view controls, an above-item circular rotation button, orbit/pinch, zoom buttons and Ctrl/Cmd+wheel inspect the authored model. Furniture rendering uses the native frame, nearest filtering and integer CSS scale. Couch/curtain use the shared pixel finish with edited colors retained; the aquarium keeps its source-painted render path. Native actor rigs are unchanged.
- 2D entries have an editable native sprite and a live sprite preview. They do not expose unsupported 3D rotation or interaction comparison.

Shortcuts follow the skin studio: B/E/I/G for paint tools, brackets for brush size, P/V for model paint/orbit, Space+drag for temporary orbit, F for canvas fit, plus/minus for focused-area zoom, Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z for undo/redo, and Ctrl/Cmd+S for local save. Text inputs and portaled menus/dialogs retain normal behavior. A shared shadcn Sheet explains shortcuts and the selected surface's mesh bindings.

## Local drafts and files

Each item/style retains its texture canvases in memory when switching items or visiting the setup/comparison tools within this browser session. Explicit local saves use `pawtrail:furniture-textures:v1:<item>:<style>`; **Load saved item** restores one. Saving reports storage failures and leaves package export available. The old construction/definition draft key is separate.

Version 1 JSON packages contain a `pawtrail-furniture-textures` kind, catalog item/source/style and native-sized PNG surfaces. Loading requires the selected item, style, source revision, surface IDs and dimensions to match. Package text is bounded to 8 MB, 128 surfaces and four million declared pixels; image data must be inline PNG. All decoded surfaces are validated before application, and late imports cannot mutate another loaded item. Individual PNG/WebP imports are bounded to 2 MB and must match the selected surface exactly. No external texture URL, executable model data or geometry is imported.

Packages and Save locally are authoring outputs. They do not update account inventory, placements, game recipes, server balances or verified community Kibble. Installing artwork remains a source/export operation through the furniture workflow.

## Existing authoring tools

- `/play?preview=furniture-setup`: existing styles, four-facing actor contact preview, local construction rules and definition export. Available through Files → Model setup & construction for authored models.
- `/play?compare=furniture`: existing original/current comparison and local interaction field. Editor links preserve the selected authored item with `asset`. This tool uses the installed model, not unpublished editor textures; the interaction-preview tooltip explains this. Session drafts remain available when returning to the editor.

The shared shadcn registry and existing Tailwind/font tokens supply controls and layout; no primitive replacements or separate CSS component system were added.

## Source and integration

- `src/game/furniture-studio/catalog.ts`: actual catalog/model lookup.
- `src/game/furniture-studio/textures.ts`: surface/package contracts and bounded restoration.
- `src/game/furniture-studio/scene.ts`: local materials, native rendering, orbit, picking, UV edges and lifecycle.
- `src/components/game/furniture-editor-workspace.ts`: draft isolation, history, painting, save/import and load cancellation.
- `src/components/game/furniture-editor.tsx`: responsive editor and native canvas controls.

Only these modules and targeted route/menu/setup/comparison changes were mirrored to the main app worktree. Models, installed images, actor sources, backend records and other worktree changes were preserved. Rendering pauses when hidden/offscreen; cleanup cancels frames and releases listeners, observers, controls and local GPU resources. Retryable graphics failures retain the session draft for reopening.

This delivery was source-reviewed only. No agents, automated tests/checks, builds, Jev review or browser verification were run, following the owner's workspace instructions.
