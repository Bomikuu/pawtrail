> Superseded by [the all-angle refinement](couch-all-angle-refinement-2026-11-09.md), including rounded arm profiles and explicit profile-camera calibration.

# Couch: multi-angle furniture workflow

The previous relief model copied the front but did not establish satisfactory side/rear construction. Request furniture now generates and reviews a coherent six-angle 2D reference set before modeling. The unchanged original front remains canonical; generated views establish a proposed hidden design.

## Art and source

- Original: `public/assets/game/housing/furniture/sofa-housing-v1.png`, SHA256 `f729133fb6df0563c4678ee43a58b8b30dd9284bf92708faa3b3feb6b7ebd43d`.
- Built-in image_gen generated the turnaround and a transparency cleanup. Untouched sheets, exact prompts, cell mapping, checksums and review decisions are in `assets/furniture-studio/references/studio-couch/`.
- Native imports remove the generated halo with alpha cutoff 224, retain the largest 8-connected object per cell, use one uniform scale and the original palette. Original source pixels are not replaced with the generated front.
- `prepare-couch-turnaround.py` saves matching native angle references and material patches in `references/couch-turnaround.json` and the versioned public reference folder. Profile mapping follows the observed facing, not the generator's left/right labels.

## Implemented model

`couch.ts` now builds real shared volumes instead of front-camera-ray reliefs: two padded cushions rounded in all dimensions, a continuous upholstered rear shell, closed base, filled arm sides, angled flower pillows and four timber feet. Original paint identifies the front components; generated upholstery patches finish their real side/rear surfaces. Front material completion avoids alpha holes in solid furniture. Local pillow UVs make embroidery rotate with the pillow.

Installed revision: **e83ceff633c0**. The export contains 24 native style/facing/base/foreground images, the embedded-texture GLB, camera/reference metadata, and projected contacts. Runtime still supports 0/90/180/270. Additional 45/135 review images are authoring evidence. The creator/comparison shows the matching original/generated reference at each supported angle.

The model and contacts share a centered pivot, native 96×112 frame and (48,96) game anchor. Original front reference anchor is (32,55). Unscaled shared Sit rigs use sockets (±9.3,10.4,6). Generated collision, approach and foreground metadata were refreshed with the catalog. No actor files, inventory grants, construction recipes or database records were changed.

## Review

Visual art production inspected front, left, rear, right and front/rear three-quarter boards at nearest-neighbor scale. Firefox at `/play?preview=furniture` inspected the actual above-item rotate action, each seat, both seats, stand, all quarter turns, Oat and custom blue fabric. The exported shared actor's minimum measured clearances through four breathing phases are 2.50 units from arms, 1.43 from pillows, 3.40 between actors, and 2.45 pelvis-to-seat-front support.

Evidence: `output/playwright/couch-turnaround-review.png`, `couch-three-quarter-review.png`, `couch-firefox-review.png`, and individual creator screenshots. The local housing service was reloaded with the new catalog; a restart log-directory error was recovered and the existing service/data configuration restored. The source and single couch catalog records were mirrored to the social worktree without a blanket game sync.

Generated illustrations have approximate camera geometry; the game uses one fixed camera and shared volumes. This is a coherent interpretation, not an exact multi-view reconstruction or the earlier front-only pixel-perfect result. Firefox preview and fit measurements do not establish authenticated live seat-lease/construction transactions or fit for every oversized costume. No automated tests/checks/builds were run.
