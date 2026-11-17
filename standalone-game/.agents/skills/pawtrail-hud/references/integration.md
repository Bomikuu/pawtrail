# PawTrail HUD integration

Inspect these files in the active workspace before changing a live surface:

- `src/components/game/shared/dialogue-hud.tsx`: bottom-centered parchment layout,
  framed portrait, red speaker ribbon, speech panel/pointer,
  page/footer slots, close button and shared shadcn dialog. It also exports
  `DialogueNextButton` (real registry Button with texture) and
  `DialoguePageProgress` (live diamond markers and count).
  Its current compact presentation is capped at 52rem with a 96×120 mobile / 192×240 desktop portrait,
  smaller text/actions, Pixelify Sans via `--font-dialogue` and no visible role badge.
  The framed boxes are 112×136 / 208×256, including an 8px border. The outer
  panel is capped at 65dvh and scrolls when needed; keep compact name/action sizes.
- `src/components/game/dialogue.tsx`: `GameDialogue` owns paragraph progression,
  typewriter text, choices and callbacks. Presentation lives in `DialogueHud`.
- `src/components/game/dialogue-portrait.tsx`: resolves the actual speaker and
  passes an explicit `portraitCollection` or identity/subject to `LivingPortrait`.
  `frameless` suppresses nested frames and inspection controls inside the HUD.
- `src/components/game/shared/living-portrait.tsx`: shared authored portrait
  playback, speaking/resting state, loading/failure fallback and visibility cleanup.
- `src/game/types.ts`: `Dialogue` includes speaker, text and choices, with optional
  `subtitle`, `portraitCollection`, identity and portrait-subject metadata.
- `src/components/game/actor-dialogue-preview.tsx`: demonstration using the same
  production dialogue component and selected actor. It pauses the comparison
  locally and restores its prior paused state. It has no reward/quest callbacks.
- `src/components/game/actor-comparison.tsx`: the actor creator's Dialogue button.
- `src/components/game/shared/portrait-angle-select.tsx`: selects only authored
  collection angles. Creator portrait and dialogue share `actorComparison.portraitPose`;
  `Dialogue.portraitPose` forwards it to the portrait renderer. The body-facing
  selector is labeled Model angle and stays independent of portrait pose.
  The enlarged inspector propagates its selection through `onPoseChange` too.
  Read the shared selection on dialogue open/reopen; do not reset the angle or
  pass an angle selector into the dialogue's optional portrait-control slot.
- `src/components/game/panels.tsx`: real game conversations and existing callbacks.

Use `/play?preview=actors&skin=amber-outrider&dialogue=1` or
`/play?preview=actors&skin=yae-miko&dialogue=1` for the direct HUD preview.
The current examples use Amber/Yae's Refined cel collections explicitly. Other
actors resolve their own appearance through the established portrait pipeline;
don't hardcode one actor's face for every entry.

## Texture contract

The current skin is
`public/pawtrail-game/game-assets/hud/dialogue-v2/`:

| Surface | Native size | Source slice |
| --- | --- | --- |
| `panel.png` | 128×128 | 24 |
| `portrait.png` | 128×192 | 16 |
| `speech.png` | 240×128 | 16 |
| `ribbon.png` | 240×76 | Full blank background |
| `action.png` | 192×64 | 16 |
| `close.png` | 48×48 | 8 |

Border-image fills the parchment centers while preserving corners; the ribbon
uses a full blank background. Speech pointer geometry is a small code-native
stepped SVG so there is exactly one tail, not one repeated along the edge.
Paw/diamond/close icons come from the existing icon library. The former compass
role badge is omitted. Portraits retain their existing authored runtime artwork.
The compact HUD uses 96×120 at 1× on mobile or 192×240 at 2× from `sm`;
the larger portrait inspector retains its own integer fit.
The panel can scroll within its viewport bound. Its dialogue contains no angle selector. Choose angles in the portrait preview
or enlarged inspector; dialogue uses that shared choice.

Pixelify Sans is self-hosted at
`public/fonts/pawtrail/pixelify-sans-400-700-latin.woff2` (12,016 bytes), with its
OFL license/provenance alongside. Scope it to the dialogue container; do not
replace the platform, editor or world-label fonts. Font declarations live in the
existing font stylesheet and the integrated app's global font declarations.

All six texture images total 35,828 bytes. Source, exact prompt, owner reference
and export metadata live under `assets/game-hud/dialogue-v2/`; keep originals
separate from the runtime payload. Skill asset copies are references rather than
app-served URLs. The older V1 simple wood frame is historical.

Names/text/actions remain DOM content. The frame does not determine the entire
panel's width, crop portraits, contain label art or supply an interaction layer.
Use nearest-neighbor for texture/portrait sampling and preserve character-native
integer display where feasible. Frame, portrait and controls should load/reuse
independently rather than decoding a large per-character UI image.

## Shared component adjustment

The official `src/components/ui/dialog.tsx` keeps its registry implementation and
adds one optional `DialogContent.overlayClassName` prop forwarded to
`DialogOverlay`. `DialogueHud` uses it for a light backdrop; other dialogs retain
their current default. Document this local source adjustment when porting or
refreshing the registry component. Do not overwrite unrelated changes in the
social worktree's shared UI file.

The standalone game currently mirrors scoped game sources into
`/home/micxsz/projects/pawtrail/.worktrees/implementation/src/features/neighborhood/`
and its archived `standalone-game/` copy. Public art is copied into the app's
`public/`; the archive uses a public symlink. Apply shared UI modifications as
focused patches in each version rather than replacing the whole app component.

## Scope and acceptance

A dialogue skin changes presentation, not transaction rules. Keep real choices,
NPC text, page order, quest/shop callbacks and game-store closure behavior intact.
Keep other interaction modals and HUDs on their existing components unless they
are explicitly in scope. A dialogue preview does not add Amber/Yae as world NPCs.
Capture pending motion/viewport/focus review when live verification is not
authorized; do not label source-only integration visually verified.
