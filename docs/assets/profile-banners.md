# Owner-supplied profile banners

The owner supplied `codex-clipboard-6f3c040d-37e8-487c-a0d6-fb187088e66b.png` (1536 × 1024) and explicitly requested replacing the generated covers to keep PawTrail’s illustration style consistent. The application now uses only these eight supplied banners for profile covers. No AI-generated replacements or recolored variants are mixed into the picker. No external ownership or exclusive-license claim is made.

Each banner is extracted from the two-column/four-row sheet, excluding the white gutters. Sharp encodes WebP at quality 82, effort 6, with a 384px picker thumbnail and a native 752px source. No upscale is shipped. Sixteen files total 233,598 bytes (about 234 KB); individual files range from 5,700 to 26,690 bytes. The original sheet is not copied into the public directory.

| Label / stable ID                | Source crop (left, top, width, height) | Thumbnail / full-size bytes | Final asset family                                                  |
| -------------------------------- | -------------------------------------- | --------------------------: | ------------------------------------------------------------------- |
| Sunny companions / `meadow`      | 7, 49, 752, 205                        |              8,412 / 18,162 | `public/images/profile-banners/collection-meadow-{384,752}.webp`    |
| Sunset together / `sunset`       | 779, 49, 752, 206                      |              5,700 / 12,328 | `public/images/profile-banners/collection-sunset-{384,752}.webp`    |
| Campfire dreams / `garden`       | 7, 279, 752, 215                       |             10,222 / 22,668 | `public/images/profile-banners/collection-garden-{384,752}.webp`    |
| Trail explorers / `explorer`     | 779, 280, 752, 216                     |             11,664 / 26,690 | `public/images/profile-banners/collection-explorer-{384,752}.webp`  |
| Home sweet home / `home`         | 7, 518, 752, 216                       |             10,306 / 22,410 | `public/images/profile-banners/collection-home-{384,752}.webp`      |
| Hearts in the sky / `starlight`  | 779, 520, 752, 216                     |              5,786 / 12,280 | `public/images/profile-banners/collection-starlight-{384,752}.webp` |
| Neighborhood wanderers / `coast` | 7, 759, 752, 218                       |             11,060 / 23,918 | `public/images/profile-banners/collection-coast-{384,752}.webp`     |
| Little champions / `champion`    | 779, 760, 752, 217                     |             10,074 / 21,918 | `public/images/profile-banners/collection-champion-{384,752}.webp`  |

The previous `meadow`, `garden`, `coast` and `starlight` IDs remain valid as collection slots. Existing saved selections now display the corresponding supplied art, with no account reset. `sunset`, `explorer`, `home` and `champion` add the remaining four choices. The default remains `meadow` (Sunny companions). New `collection-` filenames prevent browsers from reusing the prior generated artwork.

The old generated WebP files were removed from the served asset directory. Their original generation outputs outside the repository were left untouched. Source cropping is deterministic; the public banner/picker still use the existing allowlisted focal positions, selected-state controls and save behavior. No automated tests/checks/builds/detectors or browser verification were run, per the user override.
