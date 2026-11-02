# Profile cover assets and prompts

Generated using the built-in `image_gen` tool, four independent calls, for the current PawTrail workspace. The user's attached profile reference established the requested cover/avatar composition; no screenshot controls or sample statistics were baked into the assets. The generated images depict fictional cats/dogs and scenery, not real community contributions. No external artist attribution or exclusive-license claim is made.

Final assets are saved under `public/images/profile-banners/`. Each family has `-384.webp` (picker thumbnail), `-768.webp` and `-1440.webp` responsive variants, encoded with Sharp WebP quality 78, effort 6. Sources were resized proportionally; responsive profile layout uses preset focal positions. Full original PNGs were left untouched in the generation directory, outside the repository.

| Preset            | Generated source filename                       | Final asset family                                            | Bytes at 384 / 768 / 1440 |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------------- | ------------------------: |
| Meadow companions | `exec-400e0113-7fd0-49c8-9ab7-d7f51cf40872.png` | `public/images/profile-banners/meadow-{384,768,1440}.webp`    | 14,402 / 42,200 / 100,534 |
| Garden nap        | `exec-08d93a61-b4d5-46ce-b2bc-a1d75aa8e9dc.png` | `public/images/profile-banners/garden-{384,768,1440}.webp`    | 15,092 / 49,514 / 133,168 |
| Coastal wanderers | `exec-6ead26e6-2e09-452d-82f8-ffb306875bfb.png` | `public/images/profile-banners/coast-{384,768,1440}.webp`     |  10,112 / 32,744 / 85,896 |
| Starlight friends | `exec-05cc706f-50b7-4ffd-90b1-9ead09480394.png` | `public/images/profile-banners/starlight-{384,768,1440}.webp` |  12,674 / 39,588 / 98,740 |

## Complete prompt set

Every call used the following shared prompt followed by its preset-specific scene. No reference image was transmitted; all calls used generation mode with an opaque background.

> Use case: illustration-story. Asset type: production cover banner for PawTrail, a friendly social network for animal welfare helpers. Generate an ultra-wide panoramic 6:1 illustration, composition safe to crop to 6:1. Style: polished flat children's-book illustration with confident dark warm-brown outlines, rounded friendly calico cats and floppy-eared cream/brown dogs, soft simple shading. No text, words, lettering, UI, logos, medallions, watermark, people, or typography. Pastel blue sky, warm cream and orange details, soft green leaves. Entire background filled edge to edge; no borders. Subject cluster on the RIGHT THIRD, LEFT TWO THIRDS mainly calm landscape because an avatar overlaps lower left. Keep all animal heads comfortably inside the central vertical 60% for wide cover crops.

Meadow:

> Scene: sunny green meadow with rolling hills, broad winding cream path, fluffy clouds, a smiling calico cat cuddling a brown-and-white puppy in right third, a simple wooden sign with paw symbol near far right. Warm, welcoming and closest to the supplied profile-reference spirit.

Garden:

> Scene: cozy flower garden with terracotta pots, butter-yellow daisies and sage-green leaves. A sleepy ginger cat and a gray kitten nestled on a cream picnic blanket in right third. Warm apricot sky. Quiet botanical negative space to left.

Coast:

> Scene: serene tropical seaside with pale turquoise waves, cream sand, small coconut palms and a golden-hour sky. A calico cat and friendly floppy-eared puppy walking together at right, tiny pawprints trailing through sand toward left. Airy and peaceful.

Starlight:

> Scene: moonlit blue-green neighborhood park with a soft navy/teal sky, sparse gold stars, distant small silhouettes of homes, sage bushes. A calico cat and cream puppy sleeping together on a blanket at right. Gentle, comforting, legible and delightful, no neon.

The generated native aspect ratios were approximately 2.67:1–3:1 despite the requested 6:1. Original images were inspected; no claim is made that generation exactly followed every style/framing constraint. Focal positions are maintained by the preset catalog for the application's compact cover. Rendered cover cropping and responsive layout have not been browser-verified under the user's override.
