# Bottom-centered dialogue HUD — 10 November 2026

## Compact HUD and portrait angles

The owner reduced the V2 presentation: a 52rem maximum-width panel replaces the
72rem layout; portrait content is 96×120 on small screens and 192×240 at the
small desktop/tablet breakpoint after the owner requested a larger portrait;
speaker ribbon, borders, speech panel, page markers and actions are smaller.
The visible role/subtitle badge is removed, including Exploration guide.
Accessible dialogue descriptions remain screen-reader-only.

The HUD uses locally served Pixelify Sans for a pixel-game appearance, scoped to
the dialogue only through `--font-dialogue`. The 400–700 Latin variable WOFF2 is
12,016 bytes; OFL license and source metadata are beside it under
`public/fonts/pawtrail/`. Existing platform/editor/world typography is preserved.

`shared/portrait-angle-select.tsx` offers only each collection's authored angles.
The creator portrait and actor dialogue preview share the ephemeral
`actorComparison.portraitPose`; `Dialogue.portraitPose` reaches `LivingPortrait`.
The selector is available in the normal portrait preview and enlarged inspector.
It is omitted from the dialogue HUD, which uses the shared selected angle. Switching
angles keeps ongoing dialogue progress. The enlarged portrait inspector also
forwards its selection through `LivingPortrait.onPoseChange` to the shared
preview choice, so opening/reopening dialogue uses that selected angle. The former Facing selector is now
explicitly labeled Model angle for the independent 3D orientation.

Amber has Front, Three-quarter and Head tilt. Yae's existing pack also retains
Side profile. Unsupported angles fall back to a supported view and are not
offered in its menu. No portrait art, rig geometry or animations were regenerated.
The direct preview URLs below still apply. Changes are source-reviewed; no
automated tests/checks, builds, agents or browser verification were run.

## V2 — parchment reference skin

The owner supplied a more specific dialogue reference. The shared HUD now follows
its larger framed portrait, rust-red speaker-name ribbon with paw, outlined role
badge, parchment speech panel with one stepped pointer, faded paw decoration,
diamond progress markers/count, textured orange Next action and parchment close
control. Names, text, role labels, icons, choices and controls remain live DOM;
the speaker portrait keeps its original authored blink/speech/rest artwork.

The outer cream parchment panel has a fine wood/copper edge and leaf corners.
ImageGen generated a six-part blank texture atlas from the supplied reference.
Native extracted textures are in
`public/pawtrail-game/game-assets/hud/dialogue-v2/`:

| File | Bytes |
| --- | ---: |
| `panel.png` | 8,608 |
| `portrait.png` | 8,657 |
| `speech.png` | 4,745 |
| `ribbon.png` | 8,964 |
| `action.png` | 3,213 |
| `close.png` | 1,641 |
| Texture total | 35,828 |

Source, exact prompt, supplied reference, crop/slice metadata and native contact
sheet are preserved in `assets/game-hud/dialogue-v2/`. Native preparation used
previously authorized image processing, measured crop regions, nearest-neighbor
resizing and a 64-color palette per texture without dithering. The same template
is recorded in `$pawtrail-hud`; no per-actor frame generation is required.

`DialogueHud` now also exports `DialogueNextButton` and `DialoguePageProgress`.
`GameDialogue` passes dynamic progress into the footer and retains its page,
reveal, choice and close behavior. The portrait has exactly 96×120, 192×240 or
288×360 content space at its responsive sizes, preserving integer enlargement.
The selected dialogue fonts remain Saira Condensed for names and Instrument Sans
for words/controls. The actor demonstration has three paragraphs so page markers
can be tried; only its preview copy changed. Amber's preview role follows the
owner's reference label, Exploration guide. Real NPC text/callbacks are preserved.

The same direct preview URLs below apply. V2 artwork and implementation are
source-reviewed; live viewport, focus and speech-motion review remain pending.
No automated checks/tests, builds, agents or browser verification were used.

## V1 — original simple wood frame

Character conversations now use a shared bottom-centered HUD with the existing
authored portrait on the left and speaker name, words and actions on the right.
The cream reading surface is surrounded by a restrained generated pixel-wood
frame. A light backdrop keeps the world visible while the official shadcn Dialog
manages modal interaction, Escape and focus. Closing restores the previously
focused control/canvas when it is still connected.

The portrait uses its own existing speech/rest drawings while text reveals.
Reduced motion shows complete text immediately and uses the portrait renderer's
existing reduced-motion path. Real NPC dialogue and choice callbacks are retained.
Quest/shop/care interactions are not converted into preview actions. The larger
`InteractionDialog` remains available for other object/care interaction menus.

## Source and preview

- `src/components/game/shared/dialogue-hud.tsx`: layout, texture, title, portrait,
  light backdrop, focus restoration and close action.
- `src/components/game/dialogue.tsx`: existing dialogue progression, paragraphs,
  choices and typewriter text, now composed with the HUD.
- `src/components/game/dialogue-portrait.tsx`: explicit portrait collection support
  and frameless portrait display inside the HUD.
- `src/components/game/actor-dialogue-preview.tsx`: the actor preview's Dialogue
  button and direct-entry preview. It restores the comparison's prior paused state.
- `src/game/types.ts`: optional cosmetic dialogue subtitle and portrait collection.

Open `/play?preview=actors&skin=amber-outrider&dialogue=1` or
`/play?preview=actors&skin=yae-miko&dialogue=1`. The Dialogue button remains beside
the other actor-preview controls. The two preview paragraphs exercise revealing,
speech/rest, Show text, Continue and Done. Preview text is demonstrative dialogue;
it cannot grant Kibble, accept missions, change welfare records or add world NPCs.

## Frame artwork

Built-in ImageGen produced the wood-frame source. The runtime export is
`public/pawtrail-game/game-assets/hud/dialogue-v1/wood-frame.png`, **1,930 bytes**,
96×96 pixels with 32 colors and a transparent center. It uses a 16-pixel source
slice, a 12px CSS border and repeating edges. The cream center is DOM background,
not baked text or UI. Source, exact prompt and native export metadata are retained
in `assets/game-hud/dialogue-v1/`; native preparation used previously authorized
image processing, nearest-neighbor sizing and no dithering.

## Registry source adjustment

The official shadcn `DialogContent` gains one optional `overlayClassName` prop,
forwarded to its existing `DialogOverlay`. This enables a light dialogue backdrop
without changing other dialogs. The app worktree received only this focused
registry patch; its existing close-button modifications were preserved. No new
primitive or separate CSS component system was introduced.

The new `$pawtrail-hud` skill records material, dialogue behavior, portrait,
accessibility, lifecycle, integration and review conventions. The actor skill
links it for dialogue presentation and character acceptance; the shared HUD/frame
are reused rather than regenerated for every character.

Implementation is source-reviewed. Browser, viewport, speech-motion and focus
acceptance remain pending under the owner's current verification preferences.
No agents, automated tests/checks, builds or browser verification were used.
