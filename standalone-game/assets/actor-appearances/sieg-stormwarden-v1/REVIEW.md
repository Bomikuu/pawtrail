# Sieg — original Stormwarden

Reference inspiration: the owner's dark fantasy male character image. Sieg changes
the hairstyle, palette, cape length, armor, garments, blade silhouette and pose.
His age, fictional origin, biography and personality are authored design choices.
Voice creation was explicitly omitted by the owner; no borrowed voice is assigned.

## Installed preview

- `/play?preview=actors&skin=sieg` — shared rig, movement, actions and portrait.
- `/play?preview=actors&skin=sieg&art=illustration` — independently animated actor,
  coastal waystation background and wind aura, with layer toggles.
- Dialogue reuses the selected portrait angle and the existing compact wooden HUD.
- The 40 px selection icon reuses the shared wood frame and active glow.
- All assets are preview-only; the live player roster is unchanged.

## Artwork and exports

The portrait uses 90 authored complete drawings across three angles and six
expressions. Resting frames have pre-exported, one-pixel torso breath variants.
Blinking and speech select complete assets; runtime facial patches are not used.
The final portable, lossless WebP portrait package is 278,121 bytes including its
manifest and three reference images, within the 300,000-byte cap.

The illustration retains six full-body drawings, four background drawings and
six aura drawings in separate atlases. Hair/cape poses play forward and backward
with fixed feet/bust registration. The composited poster is a fallback, not the
source of animation. Public illustration assets total 350,121 bytes, separately
budgeted from dialogue portraits. Model surfaces total 12,762 bytes; the icon is
2,204 bytes. Generated high-resolution sources stay in this authoring folder.

The model uses the existing articulated skeleton, continuous secondary-motion
clock, natural gait, action poses, care props, action sounds and shadows. Sieg's
hair locks, short cape, tapered clothes, curved pauldron and short saber are new
geometry; his face maps derive from his generated portrait. Garment UV surfaces
are authored pixel textures matched to the generated illustration palette.
The blade is a visual prop; no new combat abilities or hit claims are installed.

## Initial delivery review status

Native portrait emotion rests and the composed illustration were visually
inspected. Background alpha is hardened during export to remove near-transparent
generation residue without color-keying away dark hair or clothes.

Browser, animation/action acceptance and model-angle review remain pending.
No automated tests, checks or builds were run, following the workspace workflow.
The assets and source must not be described as fully visually verified.

Owner review targets: idle, walking, running, front/three-quarter/side rotation,
feeding, petting, water, pickups, sitting, sleeping, expressive actions and
portrait transitions. Check cape/armor clearance and held-versus-holstered saber
visibility; compare each blink/speech state against its generated full drawing.

## Re-export

Use the Drive Blender MCP virtual environment's Python (its Pillow installation
supports nearest-neighbor resampling on this machine), from the project root:

```
/run/media/micxsz/Drive/Blender/blender_mcp/mcp/.venv/bin/python scripts/prepare-sieg-assets.py
/run/media/micxsz/Drive/Blender/blender_mcp/mcp/.venv/bin/python scripts/prepare-sieg-surfaces.py
/run/media/micxsz/Drive/Blender/blender_mcp/mcp/.venv/bin/python scripts/refine-sieg-v2.py
```

These scoped authoring scripts retain sources and publish only Sieg's assets and
portrait catalogue entry. They do not mirror files to the social app worktree.

## V2 — adult presentation and live Firefox review, 2026-11-14

The owner's 21.844-second video guided adult illustration proportions and
restrained idle presentation, while Sieg retains his original Refined cel pixel
identity. The new six-frame illustration has a smaller head and longer torso and
legs. Its full drawings share a fixed foot pivot/baseline; cape motion no longer
recenters the entire body. The independent background and aura now use muted
opacity over a slate backdrop. The model keeps the established stylized game
scale and shared skeleton; its mantle now drapes over the front shoulders,
rounded crown has separate swept points, fringe clears the eyes, and hair UVs
use broader, quieter clusters. No other actor's proportions were changed.

Portrait framing now uses actual visible bounds `[3,14,90,105]`, enabling 3×
integer enlargement in the creator instead of a small bust beneath empty padding.
The compact icon has a character-specific head crop with visible eyes and chin.
The game preview's busy grass is replaced by a neutral low-contrast stage during
creator review, and floating ability controls no longer cover the character.

Firefox review exercised all 34 available human actions through the actual
selector: idle, walk, run, feed, water, pet, play, pickup, cleaning, sitting,
sleeping, wave/clap/cheer, held supplies/gift/inspection, sad/happy/angry,
surprise/laugh/sick/tired, dance, car ride, float, power-up/run, dash/gentle
approach, and jetpack takeoff/hover/landing. Entry/representative states and return
to idle were observed; care props and blade holstering were checked. The final
hair adjustment received a focused front/three-quarter/side/back check and
walk/run/pet/sleep recheck, rather than repeating unrelated passed artwork.

The portrait inspector exercised all six emotions at all three angles, with
speech on/off. Actual live canvas captures show open, half-blink, closed eyes
and the separate torso-breath drawings; no runtime facial patches were added.
Dialogue uses the selected portrait angle and existing compact wooden HUD.
Illustration playback, independent layer toggles and reduced-motion still were
reviewed. The voice omission remains in place.

Evidence is in `output/playwright/sieg-review/`: updated/final preview, action and
emote boards, accepted angle captures, portrait-speaking board, observed live
blink/breath capture, illustration frames/isolated/reduced still, and dialogue.
One synthetic pointer event in the browser tooling produced an invalid pointer
ID; real mouse down/up movement was used for the final check. It was not a normal
user-input failure. Nonfatal Firefox WebGL/preload warnings were observed.
No broad application tests or production build were run. Visual matching remains
an art judgment; this is a completed focused review, not a claim of exact likeness
or physical cloth simulation. Final style preference belongs to the owner.

Current served artwork/textures total 582,423 bytes, excluding source artwork and
JavaScript. The portrait package is 278,116 bytes, below the 300 KB limit.
