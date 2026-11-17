# Amber head and hair revision — 10 November 2026

This records the approved head pass. The comparison now uses this head on both
sides to isolate the [shoulder revision](amber-shoulder-study.md).

Open `/play?compare=amber`. **Previous head** uses the earlier Amber study;
**Refined head** uses the new head on the same body, outfit and cape. The front,
three-quarter and side buttons are shortcuts for the shared camera direction.
Both models receive the same idle/walking phase and continuous cloth clock.
This remains an isolated study; installed characters, saves and portraits are
unchanged.

## Head and hair

`amber-anime-head.ts` replaces the extruded face slab with curved cross-sections,
narrower cheeks and a tapered chin. There is no modeled nose. The face uses
whole open, half-blink and closed-eye UV patches generated together from Amber's
reference and the pixel RPG reference. Original meshes remain hidden and owned
by the shared resource disposer.

The hair has a rounded crown, swept fringe, pointed temple and cheek locks,
separate long side tails and staggered back locks. Crown, fringe and long locks
have separate code-authored directional pixel maps, clustered highlights, dark
strand seams and fixed three-level surface shading. Strand tips change the
actual silhouette. Delayed movement follows the existing cloth clock. The
goggle lenses and rabbit ribbon are retained; a fitted curved strap replaces
the rectangular headband which exposed a flat box behind the hair.

The new indexed face atlas is **192×64, 64 colors, 1,267 bytes**. Rendering uses
nearest-neighbor filtering and no mipmaps. Authoring source and prompt:

- `assets/amber-study-v3/anime-face-generated.png`
- `assets/amber-study-v3/face-prompt.txt`
- `public/pawtrail-game/actor-studio/amber-study-v3/anime-face.png`

The inspector includes the new crown/fringe/lock/face surfaces. Native comparison
downloads preserve transparency and both models' identical scale and feet anchor.
Scoped Firefox art captures are in `output/amber-head-v3`: idle and walking
front/three-quarter/side images, a walking sequence and enlarged comparisons.
The first art review identified the box-shaped goggle strap and prompted the
curved replacement. No automated tests, checks or builds were run.

Only these scoped source/assets are mirrored to the integrated app and its
archived standalone source. Reference fidelity still needs owner approval
before expanding this approach to other characters.
