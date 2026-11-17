# Amber anime 3D study

This revision applies the supplied anime RPG prompt to Amber's existing identity:
dark brown hair, red ribbon, brass goggles, red/ivory outfit and thigh boots.
The blonde ponytail and brown armor in the generic prompt are not Amber's design.

## Implemented

- Meter-scale, slender proportions, about 6.3 head heights without the ribbon.
- Continuous curved head topology with an integrated small nose and a painted
  anime face UV; the face is not a separate billboard or an opaque face patch.
- Individually curved, tapered layered hair meshes and fine silhouette wisps.
- Separate fitted jacket, bodice, cuffs, utility belt/pouches, coattails, gloves,
  soles, heels, toe/instep geometry, brass trim and framed goggles.
- Humanoid skinning through the spine, arms, wrists/fingers, legs/ankles/toes,
  with independent hair and coattail bones. Idle, walk and run are separate clips.
- UV-mapped generated cloth, embroidery, leather, hair and brass albedo;
  material-feature normals, authored roughness/metallic maps, and real geometry
  ambient occlusion baked into a separate unique UV set.
- Native 1254 × 1254 material atlas and 1024 × 1024 continuous head map. These are
  their actual sizes; no claim of native 2K detail or upsampling as new detail.
- Editable semantic source meshes retained in the Blender file. A joined skinned
  export uses five material batches and stays within the prompt's 30K–60K triangle
  range. The generated manifest contains the actual final inventory and sizes.
- On-demand standard GLB preview, orbit/zoom, cardinal views, face framing,
  animation controls, camera reset, PBR lighting, contact/self shadows and visible
  loading/failure states. One selected model, fixed 512 × 640 render target,
  maximum 30 fps, hidden/paused guards and explicit GPU-resource disposal.

## Deliberate scope

This is a hand-authored Blender interpretation, not Tripo or a trained
image-to-3D reconstruction. The new reference is a guide, not proof of a perfect
likeness. The existing React/Three.js viewer loads the standard GLB directly;
switching it to React Three Fiber/Drei would not improve mesh fidelity.

The old 3D and 2D versions stay available. This focused revision does not install
a replacement game actor, retarget the complete gameplay action library, remake
the existing portraits/voice pack, or rebake every sprite animation.

Actual source renders are reviewed during authoring. App tests, builds and
browser verification remain unrun under the current project instructions.

## Authoring

1. `uv run --no-project --with pillow python tools/actors/prepare_amber_anime_textures.py`
2. Run `tools/actors/build_amber_anime.py --root PROJECT` with the cached Blender
   in background mode, two render threads, bounded CPU and memory.
3. Inspect `renders/front.png`, `left.png`, `back.png`, `right.png`, `face.png`.
4. `uv run --no-project --with pillow python tools/actors/package_amber_anime.py`

Prompts and unmodified generated sources are retained beside the authored maps.
The build emits the GLB, .blend, parts/joint inventory, and runtime manifest.
The packaging step publishes only the actual inspected source images.
