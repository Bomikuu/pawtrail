# PawTrail housing asset catalog

This catalog extends the approved housing style into the remaining asset groups in the owner's asset-generation brief. It contains artwork and metadata only. It does not implement housing gameplay, multiplayer, character customization UI, pet behavior, chat, rewards or drag-and-drop decoration.

## Asset groups

- Interior: existing 16 floor/24 architecture tiles plus 116 derived modular wall/transition pieces, native32×32. Six wall treatments, edges/corners/doorways and four material-transition families. Derived pieces reuse original generated artwork rather than claiming a separate image generation for every corner.
- Furniture: first sofa/table, nine subsequent room items, and the complete remaining living-room/bedroom/kitchen/decoration inventory. Category manifests include color variants, native dimensions, anchors and proposed collision footprints.
- Pet furniture: beds, houses, climbing/play furniture, feeders, bowls, toys, care supplies and empty/filled variants. Separate animals support occupied furniture; no animal is baked into the empty furniture sprites.
- Cats: ten separately generated variants, each with23 observed unique action groups and four frames per group. Resting sitting shares the documented sitting animation. Native48×48;920 visible frames, atlases, horizontal action strips and individual frames.
- Players: three separately generated complete appearances with32×48 native frames. Movement/idle, social, animal care and decoration poses are separated into manageable sheets. These are complete appearance sprites, not a claim that independent outfit layers already support runtime mixing.
- Social: twelve emotes and nine special effects, with actual exported frame metadata.
- Exteriors: five houses, twelve building modules and twelve garden/exterior props. World positions and collision boxes are not wired into gameplay.
- UI: thirty32×32 pixel icons covering navigation, animal actions, social and decoration actions; no text baked into icons.
- Audio: thirty planned sound entries withfile:null and pending status. No audio-generation tool is available; descriptions and planned paths are not audio files.

## Native artwork and sources

The generation mode is built-in imagegen. Exact prompt sets and high-resolution originals are retained in each category/source folder. The original six-subject style reference remains under housing/references. Sources are copied into the workspace; exported game artwork does not depend on files existing only under the tool's default output directory.

Preparation includes observed grid/row-bound extraction, nearest-neighbor native resizing, alpha-glow cleanup, fixed sprite canvases and restrained palette remapping without dithering. Transparent PNGs use binary alpha. Floors may be fully opaque. Use nearest-neighbor rendering and integer zoom. Native cell sizes, actual atlas rectangles and anchors come from each manifest; do not infer frame indexes from a requested source grid.

The catalog index is housing-catalog-v1.json. Detailed manifests, exact prompts and native sprites are included in pawtrail-housing-catalog-v1-native.zip. Large original renders stay in the project rather than inflating the native ZIP. Selected overview sheets are included; additional per-category reviews remain in the workspace.

## Honest production status

Asset-file checks cover readable PNGs, dimensions, visible pixels and binary transparency. Per-category reports document palette, spacing, baseline and source-grid observations. Native visual contact sheets were inspected. Several subtle generated animations need gait/loop/marking polish review; none is silently certified production-ready. Collision footprints are proposals, not in-engine validation. Modular wall/roof art still needs placement/occlusion review in the target engine; mathematical edge matching alone is not a visual production certificate.

The scope was explicitly asset generation and inspection. No application tests, builds or browser verification were run, and existing game/platform code was not modified by this catalog work. Previous assets were kept, with sibling/versioned names for new artwork.
