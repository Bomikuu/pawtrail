# Amber and Yae character icons — 10 November 2026

The PawTrail Character Icons skill was applied to both actors using their
existing **Refined cel** portraits as identity/style references and the owner's
icon board for compact RPG framing. Built-in ImageGen created one source image
per character. Each was converted into a transparent 64×64 native PNG with
nearest-neighbor resizing, 64 indexed colors and no dithering. The larger native
size accommodates Amber's rabbit bow/goggles and Yae's fox ears/gold ornaments
while retaining their faces. These are static coarser-pixel head icons, separate
from the animated dialogue portraits and gameplay body thumbnails.

Original 64×64 master exports (preserved):

| Character | Native image | Bytes |
| --- | --- | ---: |
| Amber | `/pawtrail-game/actor-studio/icons/amber-outrider/v1-26a2324bf7/icon.png` | 1,640 |
| Yae Miko | `/pawtrail-game/actor-studio/icons/yae-miko/v1-6d4109e6d3/icon.png` | 1,960 |

Total icon image data is **3,600 bytes**. Authoring sources, portrait references,
exact prompts, crop bounds and export metadata are preserved under
`assets/actor-appearances/icons/<actor-id>/refined-cel/`.

`creator/character-icons.ts` binds the icons to their existing preview IDs.
The character creator now displays them as small-radius framed selection tiles
above its enlarged animated portrait. The current selector uses a 48×48 stepped pixel frame with 40×40 native
character artwork inside, at 1× on every screen size. Compact labels and
pixelated sampling are retained. The earlier desktop enlargement
was removed at the owner’s request; these are app-style icons, not portrait cards. Selecting a tile still loads the
same refined model and its existing action-driven illustrated portrait; it does
not overwrite that portrait, body thumbnail, saved appearances or account data.

Open `/play?preview=actors&skin=amber-outrider` or
`/play?preview=actors&skin=yae-miko`. Both icons appear in the same selector.
Native raster exports were visually inspected at 1× and 3× in
`output/character-icons-v1/icons-contact.png`, alongside the source portraits.
Runtime assets and scoped source were mirrored to the integrated application.
No agents, automated tests/checks/builds or browser verification were used.

The 48px variants and their actual runtime byte sizes are recorded in
`src/game/creator/character-icons.ts` and each actor's `icon-48.json` authoring
manifest. They are nearest-neighbor exports from the preserved masters; no new
image generation was needed. The icon skill records compact 48px presentation
as the selector default while keeping the separate animated portrait large.

The owner also requested the visible border and background from the icon board.
`shared/character-icon.tsx` composes the transparent art over an opaque cream
backdrop and a stepped wood bevel in `icons/pixel-frame.svg` in both states.
The selected icon adds the transparent `icons/pixel-frame-active.svg` rim over
the same wood, with a warm amber glow and gentle opacity pulse. Reduced motion
keeps a steady glow. The shared component's `active` prop follows the selection
button's `aria-pressed` state. Both states remain 48×48 without layout shifts;
keyboard focus stays on the parent shadcn button. The icon skill records this
treatment, and the actor skill includes it in the character-icon creation stage.
The artwork has a dedicated native 40px export (`icon-40.json`) to leave room
inside the unchanged total 48px tile. The subtle standard border was replaced;
no global action-button, navigation or portrait colors were changed.
