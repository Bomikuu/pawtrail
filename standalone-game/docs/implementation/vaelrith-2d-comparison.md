# Vaelrith: native 2D and live 3D comparison

Open `/play?preview=monsters&monsterView=2d` or choose **Layered 2D** in Monster
Studio, then **Load Layered 2D boss**. **Painted 3D** retains the previous textured rig.
Switching unloads the outgoing presentation, clears the local rehearsal and
requires loading the selected version. Only one renderer/presentation is mounted.

The comparison changes the creature only. Amber, the arena, sword runtime,
10 × 1,000 HP, five attacks, phase rules, fire tiles, impact sprites and damage
numbers use the existing scene and encounter. The illustrated boss uses a fixed
camera with zoom; live 3D retains orbit. This is not a zero-WebGL arena.

## Full 3D material comparison

`/play?preview=monsters&monsterView=full-3d` selects the additional **Full 3D**
mode. Load it on request. Painted textures on a mesh are already real 3D; this
mode isolates geometry, material lighting and rendering style, rather than
claiming that the old rig was a flat sprite or creating a different boss.

The same articulated creature uses solid MeshStandard materials with roughness,
metallic trim and emissive eyes/seams, without loading its painted material maps.
Skulls, necks and cones use moderately higher radial subdivision. Existing scale,
attachments, attack poses, jaw joints, throat/seal anchors and combat are shared.
Player equipment and sprite-based hit/fire VFX remain unchanged.

This mode renders directly without PixelFinish or CPU getImageData/putImageData.
The buffer is capped at 640 × 480 with antialiasing and ACES tone mapping. One
512 × 512 directional shadow map provides contact/overlap shadows; it is disposed
on unload. No environment maps, bloom pipeline, bitmap animation cache or extra
renderer was added. Pixel modes keep their previous native sizes and integer
zoom; this nonpixel 3D view fits its fixed buffer to the available viewport.

The selector now contains **Layered 2D**, **Painted 3D**, and **Full 3D**. Switching
still unloads the current mode and resets the same local encounter. No tests,
build, type check or browser review was run for the Full 3D addition under current
workspace instructions; appearance, performance and shadow quality remain pending.

## 2D artwork and motion

Built-in ImageGen created a true-alpha parts sheet from the approved concept.
Three heads each have alert, roaring and hurt/exhausted artwork; separate neck,
stone socket and crystal parts complete the twelve-cell atlas. Native export:
128 × 128 per cell, 384 × 512 atlas, 341,276 compressed bytes and 786,432 decoded
RGBA bytes. Original master and exact prompt are in
`assets/monster-studio/vaelrith-riftbound/layered-2d/`.

`layered-view.ts` uses only illustrated sprite parts for the creature. Seven
overlapping neck pieces per head follow the shared 32-sample attack timelines,
with damped movement, independent sway, recoil and restrained head squash.
The three expression poses are authored artwork, not 32 generated drawings.
Sockets stay fixed, and the lower neck sits behind the socket frame. Defeat
lowers the heads; reset restores the same resting positions. Reduced motion
suppresses secondary sway/recoil but retains actual attack positions.

Named throat/seal anchors supply weapon target positions and confirmed hit
effects. No controller or HP rules were duplicated. Presentation textures share
one atlas source and owned resources are disposed on unload. The 2D path does
not instantiate the live 3D boss or load its armor textures.

## Scope and review

The project and personal monster skills now offer native 2D, 3D-to-2D and live
3D, with a dedicated 2D authoring reference. Existing art/profile approvals are
reused for this focused revision. Full new monsters retain their artwork-first
process, and hypothetical multiplayer state is not implemented by this preview.

The generated master and native atlas were inspected as artwork. Automated tests,
type checks, builds and browser review were not run for this change under the
current workspace instructions. Live seam quality, attack/contact alignment and
the perceived smoothness comparison remain pending owner review; previous
40-test results concern the earlier contact-feedback change, not this 2D version.
