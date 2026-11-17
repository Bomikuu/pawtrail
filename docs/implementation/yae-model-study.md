# Yae Miko body study — 10 November 2026

Open `/play?compare=yae`, or use **Yae Miko study** in the Amber study header.
This applies the updated PawTrail Actors skill to a new character, using the
owner's Yae illustration for identity and the previously supplied pixel RPG
references for the native-pixel rendering direction.

## Reference interpretation

The illustration shows long rose-pink hair with swept forelocks, sideways fox
ears, violet eyes, gold head ornaments and earrings, an ivory sleeveless shrine
top, detached embroidered sleeves, and layered crimson/white garments. The
geometry interprets those features individually. Sandals and the rear garment
construction are assumptions because the supplied crop does not fully show them.
This is not an Amber recolor: face cross-sections, bangs, ear silhouette,
shoulder proportions, sleeves, costume layers and secondary-motion amplitudes
are specific to Yae.

The initial study compared a clearly labeled **Shared-rig baseline** using
existing long hair/coat slots with Yae's palette against **Reference-built Yae**.
The current comparison instead isolates the face correction described below.
Both sides now use Yae's reference-built costume and share the
original skeleton, idle/walk functions, native 128×160 window, camera, feet anchor,
phase clock and shadows. Controls offer eight headings, front/three-quarter/side
shortcuts, pause, integer zoom, texture inspection and a native comparison export.

## Geometry and motion

- `yae-study-appearance.ts` owns preview-only colors and the baseline configuration.
- `yae-study-rig.ts` replaces visible geometry on `createRescuer`'s joints without
  changing shared movement. It adds a curved tapered face, rounded crown, swept
  fringe, pointed cheek/side/back hair layers, actual fox-ear meshes and gold/violet
  ornaments. Shoulders are curved exposed skin with fitted detached cuffs, not
  Amber's jacket sleeves. Hair and separate cloth surfaces have delayed motion.
- The ivory bodice, collar, crimson sash, side/back panels and apron follow
  torso/arm joints. Cloth flex increases toward the hem. A continuous secondary
  clock and eased locomotion weight preserve flow when switching idle/walking.
- `yae-study-textures.ts` wraps character-specific open/half/closed face patches,
  bodice/hair/sleeve artwork and a code-authored pleated crimson skirt map.
  These are body UV materials, not replacements for dialogue portrait animations.

The same comparison component/Phaser scene now accepts typed study definitions
from `model-studies.ts` and `model-study-definition.ts`. Amber retains her own
approved appearance and shoulder comparison. Model factories load on demand,
GPU rendering/cache/disposal remain shared, and each comparison cleans up its
actors, including partial creation failures.

## Artwork and scope

Built-in ImageGen generated one six-cell material atlas. The processed runtime
atlas is **192×128, 96 indexed colors, 15,392 bytes**, nearest-neighbor, no mipmaps.
Authoring source, original reference and exact prompt are retained under
`assets/yae-model-study-v1/`. Runtime materials and a reduced reference preview
are under `public/pawtrail-game/actor-studio/yae-study-v1/`.

The existing Yae dialogue portraits, saved-character schema, account data, game
roster and Amber geometry are unchanged. This preview does not claim the new
costume is selectable in the general creator or installed for gameplay. Native
sheet exports and additional action adaptations can follow owner review.
No agents, automated tests, checks or builds were used. The initial release had
artwork inspection only; the following face correction includes the specifically
requested face review in Firefox.

## Face separation correction (previous iteration)

The owner clarified that the original face proportions were correct: a missing
internal cheek/jaw outline made the face visually merge with the neck/shoulders.
The temporary narrowing experiment is superseded. Both comparison models now
restore the original 10.5-by-13.1 face, original hair fit, ears and ornaments.
The left side has no added contour; the right adds the subtle contour. Costume,
shared movement, face textures and overall outer sprite border are unchanged.

`createYaeStudy` enables the contour by default; `createYaeUnoutlinedStudy` disables
it for the comparison. The shared `face-contour.ts` helper adds a thin expanded
back-face shell plus an optional surface-bound jaw seam, using a muted warm
brown. Yae supplies cheek/jaw points derived from her actual face sections. The
seam provides separation where an inverted shell alone was too faint at native
resolution. It is depth-tested geometry attached to Head, not a screen overlay
or a replacement face atlas, and is disposed through the normal rig lifecycle.
The local edge is thinner/lighter than the renderer's bold external contour.

Scoped Firefox visual captures at front, three-quarter and side, plus walking,
are in `output/playwright/yae-face-contour/`. The first faint contour was adjusted
once to improve native-pixel visibility. Long hair still obscures much of the
exact side cheek profile. Earlier captures in `yae-face-refinement/` document the
superseded narrowing trial, not this version. No automated tests or builds ran.

The actor skill now checks missing internal separation before changing face
proportions. It retains reference-specific shape/texture/assembled-model review,
without treating every apparent wide face as a reason to narrow the geometry.

## Amber-style face trial (optional experiment)

The owner explicitly requested Amber's preferred face shape/treatment on Yae.
The two original profiles were similar but not identical: Amber's maximum cheek
width is 11 units at a 13-unit face height, while Yae's previous profile was
10.5 by 13.1. The actual cheek-to-jaw cross-sections and UV/material treatment
also differed. This trial does not describe Amber's face as simply narrower.

`anime-face-geometry.ts` now owns Amber's approved cross-sections and exact curved
face builder (including planar front UVs, rear material group and depth offset).
Amber calls that shared builder with unchanged geometry. Yae's current factory
uses it by explicit style selection, with Yae's own face textures and palette.
The face materials use Amber's unlit painted treatment rather than Yae's former
vertex-shaded face. Her cheek locks/ear fit and head scale are adjusted for that
profile, while pink hair, ornaments, violet eyes, costume and actions retain
Yae's identity. The thin contour uses a warmer brown and follows the new jaw.

The left model is now `createYaePreviousStyleStudy`, retaining Yae's earlier
profile/soft contour. The right model uses the Amber-style face. Scoped Firefox
front/three-quarter/side and walking captures are in
`output/playwright/yae-amber-face/`. The assembled faces were visually compared;
long side hair continues to obscure much of the side profile. This remains an
owner-review trial, not a change to all characters or dialogue portraits.
No automated tests or builds were run.

## Preferred face and running update

The owner retained the previous reference-specific skill implementation. Yae's
own face profile plus the soft jaw contour is the default again; an explicit
`amber` style remains available for the optional left-hand trial. The preferred
Yae appearance is on the right. See [Natural running](natural-running.md) for
shared movement changes and the Running study control. The actor skill records
per-character face adaptation and the selected natural fast-run direction.
