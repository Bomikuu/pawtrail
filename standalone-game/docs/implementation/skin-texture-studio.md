# Character studio

Open `/play?preview=skin` or choose **Paint a skin** in the actor creator.
This is a local authoring tool; saving here does not install an account or
multiplayer skin.

## Geometry and pose authoring

The studio has three workspaces: **Paint textures**, **Geometry**, and
**Pose & motion**. The latter two expand the live model into the main work area
with a bounded tool inspector alongside it. The existing texture canvas stays
mounted and retains its sheets/history when switching workspaces.

Geometry supports up to 24 added boxes, spheres, cylinders, cones or transparent
planes. Attach each shape to a named shared joint; translate, rotate and scale
with a Three.js TransformControls gizmo or numeric local transforms. Rename,
duplicate, hide and delete attachments. Solid colors use the same stepped vertex
shading and pixel finish as the actors. Optional uploaded PNG/WebP artwork is
decoded and converted into a native PNG at up to 128px per edge; alpha-tested
planes provide painted silhouette extensions. Attachment images are edited via
replacement uploads, separately from the original character surface canvases.
The base skeleton and original source assets remain unchanged. Vertex editing,
described below, changes studio-local geometry clones.

Pose editing exposes 14 existing rig joints with selection markers, local
rotation rings and XYZ rotation sliders. Presets include Neutral, **T-pose**,
Arms up and Sit. The pose is applied after a stable neutral shared-rig pose, so
idle animation does not overwrite the edited limbs. Whole-body XYZ offsets
support movement such as jumping. This is joint rotation/position authoring,
not inverse kinematics. Shape editing lives separately in Geometry → Vertices.

Record the current pose at the playhead, change the time and limbs, and record
another pose. Two or more keyframes enable custom motion preview; duration,
looping, scrubbing, keyframe replacement/deletion and a motion JSON export are
available. Rotation uses shortest-path quaternion interpolation with eased
timing; root movement is interpolated separately. Pausing captures the pose at
the current time. Studio motion remains local and does not register a gameplay
ability or replace an existing shared action.

Geometry and motion have a separate 24-step document undo/redo stack. A gizmo
drag or rotation-slider gesture records a starting snapshot. Ctrl/Cmd+Z/Y follows
the active workspace; texture history remains per surface. W/E/R chooses Move,
Rotate or Scale for added geometry; T applies T-pose in Pose & motion; Delete
removes a selected attachment. Right-drag or Space+drag temporarily orbits.

Skin package **version 4** includes the data-only model document (attachments,
current pose, duration/loop and keyframes) alongside the existing native texture
sheets. Local Save and package export/import retain it. Versions 1–3 still load
with an empty model document. Imports validate joint/shape identifiers, finite
bounded transforms, unique keyframes, image payloads and dimensions. No external
model URLs or executable assets are accepted. Changing character presets resets
unsaved model authoring; export/save first to retain it.

Implementation: `model-document.ts` defines the format and presets;
`model-editor.ts` adds optional transforms/pose sampling to the existing scene;
`studio-model-tools.tsx` composes official shadcn controls. Gizmos and markers
render in a separate raw overlay pass over the finished pixel actor, preserving
their axis colors. Cleanup detaches/disposes added geometry and controls before
the original rig is released. No new dependencies or bitmap generation were
needed. No agents, automated tests/checks, builds or browser verification ran.

## Vertex editing

In **Geometry → Vertices**, choose a mesh from the searchable selector or click
its visible surface. Original body/head/hair/clothing meshes and added shapes
are available. Select and drag a green point in the camera plane, drag the
translation gizmo for axis constraints, or enter mesh-local XYZ coordinates.
Previous/next controls and a point slider also select vertices, including points
on the back of a mesh. Focus the model and use Left/Right to select point indices.
Right-drag/Space+drag preserves orbit; Ctrl/Cmd+scroll and the existing zoom
controls remain available. Editing uses a stable neutral pose; switch back to
Objects to preview the existing library animations with the edited shape.

The visible point groups weld coincident positions, including duplicated vertices
at UV seams. Moving a point updates all members of its group. Reset point,
Reset mesh, Reset all vertex edits and the existing model undo/redo are available.
Each direct point/gizmo drag records one starting undo snapshot. Pull up provides
a small one-unit spike-building operation; numeric controls support head/cheek
reshaping and clothing extensions. This preserves topology; it does not extrude,
subdivide, remesh or add polygons. Large pulls can stretch the unchanged UV map.

`vertex-editor.ts` gives each editable mesh a stable hierarchy-derived identifier.
Added geometry uses its attachment ID. On the first edit it clones geometry and
preserves its UV/index/groups/attributes, then stores sparse vertex offsets.
Original/source geometry is temporarily restored while the actor pose function
runs; edited geometry is restored immediately afterward and receives the current
animated positions plus the saved offsets. This supports procedural cloth/cape
deformation as well as rigid joint attachments, without changing cached game
geometry or accumulating deformation. Normals and bounds are recomputed after
changes. Equivalent face meshes sharing geometry are edited together so open,
half-blink and closed-eye states keep the same face shape.

The overlay draws a depth-only selected mesh, its wireframe, vertex points,
selected point and existing gizmo. Direct pointer dragging freezes the actor
clock and disables orbit until release/cancel/blur. Cleanup restores original
geometry before releasing model resources.

Skin package **version 5** includes model-document **version 2** with `meshEdits`.
Versions 1–4 remain readable; version-1 model documents migrate with no vertex
edits. Mesh identifiers, vertex counts, unique indices, finite bounded offsets
and payload sizes are validated. Source-topology mismatches produce a recoverable
message instead of applying offsets to the wrong mesh. Changing geometry presets
clears old vertex edits; color-only changes retain them. Removing an attachment
also removes its offsets, and undo restores both. The import ceiling is 12 MB
to accommodate native textures and sparse geometry edits. Local storage limits
still apply; file export remains available. No gameplay character installation
or shared animation replacement occurs.

The app dev server was started for this work. No agents, automated tests,
type checks, production builds or browser verification were requested or run.

## Consistent actor rendering

The texture viewport and actor preview share `actor-rig/pixel-stage.ts` for
orthographic camera setup, framing and renderer color configuration:

- 128 × 160 native character output (creator density 2).
- Orthographic world bounds: 64 × 80 units.
- Camera `(0, 56, 90)` looking at `(0, 21.5, 0)`.
- sRGB, no tone mapping, transparent rendering, no antialiasing.
- The same `PixelFinish` palette and two-native-pixel contour pass.
- Integer CSS enlargement with nearest-neighbor display.

Drag to orbit; scroll/pinch or use the zoom buttons. **Actor view** restores the
exact shared default camera and zoom. View buttons preserve orthographic
projection while rotating around the same target. The surrounding editor
background is independent of the character pass. Animation uses the shared rig,
action frame counts/FPS and stepped secondary motion. Painted colors are added
to the finishing palette (up to 128 extra colors) so custom pixels remain visible.
The initial, unedited character uses the same appearance palette as the actor
preview.

## Original materials and UVs

The dropdown reuses `creatorTemplates` and `prepareCreatorModel`, including
Amber's refined shoulder/head rig and Yae's refined rig. Their shaped geometry,
mesh UVs, vertex shading and animation remain intact. Each mapped material gets
an editable canvas at its original dimensions, generally 64 × 96. Its texture
sampler/UV transform settings are cloned. There is no square upscaling and no
new UV projection for these refined models. Their original illustrations,
portraits and icon artwork remain separate.

Open, half-blink and closed-eye facial maps are distinct. Update all relevant
face sheets for a consistent facial edit. Permanently hidden earlier Amber head
study maps are excluded. Solid-color accessories remain procedural materials;
painting a hair map cannot change hair geometry.

The shared base still has three 256 × 256 authoring atlases: shirt, pants and
shoes. Geometry clones receive the `rescuer-uv-v1` six-face mapping. Original
procedural garment materials remain visible until the associated sheet changes;
reset/undo back to baseline restores the original material. The base model's
raised geometry is retained. Geometry and palette presets reset unsaved sheets;
export first to retain edits. Shared cached game geometry is never modified.

## Editing workflow

1. Choose a character. For interchangeable hair/outfit/face/headwear/leg/wing/
   held-item geometry use **Hair, outfit & face presets** on a shared-base actor.
   Amber and Yae keep their character-specific shapes.
2. Browse **Painted surfaces** using Face, Hair, Clothing or Accessories filters.
   Thumbnails and dimensions identify each sheet. Click a mapped part of the
   model to select its sheet and corresponding pixel.
3. Paint with the brush or flood fill, pick an existing color, or restore pixels
   from the original. Hex entry, brush sizes and color presets are available.
   Recolor presets start from the original sheet and preserve brightness detail;
   they affect the entire selected sheet, including facial details if selected.
4. Toggle the pixel grid, UV wireframe or base face labels. Use integer 1×, 2×,
   4×, 6×, 8× or 12× zoom. The read-only **Original** view helps compare edits.
   **Where this texture is used** lists the actual mesh bindings. Repeated meshes
   sharing a texture update together.
5. Import an exactly matching native-size PNG/WebP under 2 MB or download the
   original template to draw elsewhere. Transparent imported pixels retain the
   original artwork. PNG exports exclude guides/grid; **UV reference** includes
   mesh UV edges and applicable base face labels. Overlay guides are cached.
6. Undo/redo retains 24 steps per surface. Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z work
   while focused in the editor outside text inputs. Save explicitly or export
   the complete character package.

## Save format and compatibility

Version 3 JSON packages include character ID, validated `ActorAppearance` and
native-sized PNG sheets. Dimensions and surface IDs are validated against the
loaded character before applying the package. Version 1 base packages and
version 2 square-upscaled packages remain importable; older sheets resample to
native dimensions with nearest-neighbor filtering, and retired legacy materials
are ignored. Export again to save the updated native format.

**Save locally** uses the existing browser storage key; **Load saved** restores
that package. Storage failures are reported with export still available. File
imports enforce bounded package size, sheet count, IDs, image dimensions and
image data. No external texture URLs or executable model data are accepted.
The editor does not upload user artwork or modify Django/account progress.

## Source and lifecycle

- `src/game/actor-rig/pixel-stage.ts`: shared camera/render contract.
- `src/game/actor-rig/pixel-renderer.ts`: existing actor rendering and pixel finish.
- `src/game/skin-studio/scene.ts`: local rig/material copies, UV guides, ray picking,
  fixed-resolution rendering, orbit/zoom and lifecycle.
- `src/game/skin-studio/textures.ts`: atlas regions, surface descriptions and helpers.
- `src/components/game/skin-studio.tsx`: actual shared shadcn/Tailwind editor UI,
  native-sized painting/history, imports and local persistence.

Rendering pauses offscreen and in hidden documents. Cleanup releases controls,
listeners, observers, local model/material/texture resources and the renderer.
This change was source-reviewed only. No agents, automated tests/checks, builds
or browser verification were run under the owner's standing instructions.

## Viewport workspace layout

The editor is an Operate surface. Its primary path is select surface → paint →
inspect the live model. On desktop (1024px and wider), an independent surface
rail is on the left, a flexing canvas occupies the center, and a live model
inspector sits on the right. The page is bounded by the existing full-height
PlayShell. Panels use `min-h-0` and bounded scrolling rather than content-driven
page height. The surface list scrolls without moving the palette or canvas;
the canvas scrolls only when its zoom exceeds the available drawing space.

Character selection and Save stay in a compact top command bar. Files contains
package operations. The selected surface's action menu contains import/export,
original/UV downloads and reset. Details and character presets live in the
shared shadcn Sheet; technical prose no longer takes space above the canvas.
The paint toolbar keeps tools, color, brush size and undo together. Grid, UVs,
Fit and zoom stay at the bottom of the canvas; status occupies a short footer.

Fit is enabled on load and surface selection. A ResizeObserver chooses the
largest supported integer zoom that fits the canvas area (allowing 16px padding
on each side). Manual zoom turns Fit off. Fit can be restored at any time.
Native texture dimensions, camera settings, painting history and save format
remain unchanged.

On narrower screens, Surfaces / Paint / Model navigation switches full-height
panels without unmounting the canvas or renderer. Selecting a surface or picking
a mapped model part opens Paint. Hidden-model visibility still pauses rendering.
Search and category filtering apply only to the independent surface rail.
This layout update was source-reviewed against the supplied screenshot; no
browser verification, automated checks, tests or builds were run.

## Painting directly on the model

The live preview has **Orbit (V)** and **Paint (P)** modes. In Paint, left-drag
paints through raycast mesh UVs into the same offscreen canvases used by the 2D
editor. Brush, original-pixel restoration, connected fill and eyedropper are
shared. Editing either view updates the same CanvasTexture, surface thumbnails
and export/save data. Procedural solid-color pieces have no paint map and are
left to the character's existing preset/color controls.

The animation clock freezes during an active model stroke and resumes after
release. Pointer capture handles dragging off the model, cancellation and focus
loss. Right-drag or Space+drag orbits without painting. Screen strokes are
sampled through visible surfaces; UV coordinates across separate charts are not
joined by an interpolated line. A stroke snapshots each touched sheet once,
with per-surface undo retained. If one stroke crosses several sheets, undo the
selected sheet independently. This intentionally preserves the editor's
existing history model.

Brushes are hard circular native-pixel stamps, 1–32 pixels. The 2D cursor shows
the exact texture-space radius; the model cursor projects the same circle using
the hit triangle's UV-to-screen derivative, appearing elliptical on sloped
surfaces. Cursor outlines remain overlays and are excluded from texture exports.
Shared source material maps remain shared among their mesh bindings: painting
one mapped hair strand can update other strands using the same texture.

Ctrl/Cmd + scroll over the texture canvas zooms through integer steps, anchored
to the pointer when scroll bounds allow. Over the model it changes orthographic
camera zoom. Native non-passive wheel handlers prevent browser page zoom in
these two work areas. Ordinary texture scrolling pans the canvas; model wheel
zoom requires the modifier or the zoom buttons. Zooming ends a pending paint
stroke. The keyboard-help button (or `?`) opens the shared shadcn Sheet.

Shortcuts while the workspace has focus:

| Key | Action |
| --- | --- |
| B / E / I / G | Brush / restore original pixels / pick color / connected fill |
| [ / ] | Smaller / larger brush |
| P / V | Paint model / orbit model |
| Space+drag or right-drag | Temporarily orbit model |
| Ctrl/Cmd+scroll | Zoom the work area under the pointer |
| + / − | Zoom focused model or texture canvas |
| F | Fit the texture canvas |
| Ctrl/Cmd+Z | Undo selected surface |
| Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y | Redo selected surface |
| Ctrl/Cmd+S | Save locally |
| Esc | End painting / release temporary orbit |
| ? | Open shortcut help |

Text fields, selectors, dialogs and menus retain normal keyboard behavior.
Added source `src/game/skin-studio/painting.ts` owns the common hard brush and
flood fill. This addition was source-reviewed only; no automated tests/checks,
builds, agents or browser verification were run.
