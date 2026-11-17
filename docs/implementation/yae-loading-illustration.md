# Yae Miko loading illustration — 10 November 2026

Created with `$pawtrail-illustrations` using built-in ImageGen and Yae Miko's
selected **Refined cel** pixel portrait. The original supplied artwork supplies
her identity and costume; the existing pixel portrait, also supplied at an integer
4× enlargement, is the style authority. It retains pink hair, violet eyes, gold
ornaments and white/crimson shrine clothing with a fixed closed-mouth smile and
open-palm gesture. Six complete authored drawings sway the long hair below the
shoulders and loose robe/sleeve ends. No facial animation was added.

Open `/play?preview=actors&skin=yae-miko&art=illustration` for the matching
Illustration tab alongside her existing portrait and model. It reuses the same
`IllustrationPreview` component, manifest-driven atlas playback, pause/restart,
integer zoom, reduced-motion poster and visibility cleanup as Amber. Each
catalogue entry now supplies its own style and motion description, including
accessible canvas text, so Yae is described as hair/robe rather than cape sway.

Runtime folder:
`public/pawtrail-game/actor-studio/illustrations/yae-miko/v1-3d798d294407/`

| File | Bytes |
| --- | ---: |
| `atlas.webp` | 61,814 |
| `poster.webp` | 10,894 |
| `illustration.json` | 2,312 |
| Alternative animated `sway.webp` | 109,690 |
| Complete pack | 184,710 |

The actor preview consumes only the atlas, poster and metadata: **75,020 bytes**
before transport overhead. Each frame is 160×240 native; 2× display is 320×480.
The 2.4-second loop follows `0,1,2,3,4,5,4,3,2,1`, with 320 ms at the extremes
and 220 ms at the other positions. All drawings share a 96-color RGBA palette,
no dithering and lossless WebP encoding. Runtime character backgrounds are
transparent; the authoring GIF has a warm backdrop for convenient inspection.

Authoring directory:
`assets/actor-appearances/illustrations/yae-miko/refined-cel/v1/`

It preserves both references, resting and motion generations, exact prompts in
`prompts.json`, raw/finished native drawings, the integer-enlarged contact sheet,
`preview.gif` and production metadata in `export.json`. The source sheet's
1086×1448 aspect ratio was preserved while preparing working cells; the complete
motion envelope uses one common fitting scale. Whole drawings are aligned with
integer translations; no individual face parts, per-frame stretching or runtime
deformation are used. Low-alpha fringe and disconnected gutter debris were
removed in the previously authorized production pass.

Resting artwork and native/integer-enlarged frame artwork were inspected against
the portrait. The preview binding is source-reviewed. Owner acceptance and live
playback review are pending. No agents, automated tests/checks, builds or browser
verification were used. Existing portrait art, icons, 3D models, game loading
screens, gameplay rewards and saved appearances were not replaced.
