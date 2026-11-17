# Mira Adler · Glasshouse Guardian

Adult reference-guided actor, using the owner's current PawTrail Actors workflow.
Voices are explicitly omitted. No game roster or saved characters are replaced.

## Current artwork

- `normal-generated.png`, `enraged-generated.png`: immutable generated sources.
- `blink-generated.png`: Mira's two variant-specific half/closed-eye drawings.
- `normal-motion-v2.gif`, `enraged-motion-v2.gif`: current 320×448, 4.2-second
  performances, 60 frames, stronger hair travel and a 140 ms closed-eye hold.
- Runtime illustration layers: `public/pawtrail-game/actor-studio/illustrations/mira-adler/v2/`.
- Original five-second GIFs and runtime `v1` are retained as the previous version.
- `icon-crop-rejected.png`: first small icon failed eye readability; do not use.
- `icon-generated.png`, `icon-review.png`: dedicated replacement and its inspected
  40px export; live wood-frame/selection review remains pending.
- `*-prompt.txt`: exact built-in image-generation prompts.
- `profile.json`: authored fictional identity and explicit voice omission.

Run `scripts/prepare-mira-assets.py illustrations` with the project's existing
Pillow interpreter to reproduce the complete native frames and separate layers.
It reuses the working painted-cutout helpers, WebP settings and reusable moonlit
garden/sigil artwork. Hair roots, body, face and prop grip stay fixed; only the
selected outside locks move. Eye drawings are registered per illustration and
baked offline. There is no generic runtime blink or face morph.

The owner approved both illustration designs and explicitly selected **Refined
cel** after seeing the actual Amber/Sieghart examples. The three-angle, six-emotion
portrait pack is `279067` bytes including metadata and reference images, below
the complete-style 300 KB budget. It uses Mira's own 90 generated drawings and
180 complete exported frames for rest, half/closed blink, small/open speech and
restrained torso breathing. Playback does not draw common eyes or mouths.

The model uses the canonical `createRescuer` body, face, hands, feet, skeleton and
actions. The costume paints the original UVs. Volumetric hair extensions and
ear/cuff/bow accessories follow the existing joints. The reference prop is visual
only and appears in the hand during Hold supplies; it has no weapon abilities.
The small material keeper has no body geometry and only preserves disposal of
displaced materials. There is no hidden duplicate body or full-body billboard.

Open `/play?preview=actors&skin=mira-adler`. The Portrait tab includes **Preview
speaking** even without voice audio. Choose front/three-quarter/head tilt there;
the Dialogue button uses the selected angle. The Illustration tab contains
normal/attack-ready variants with separate background and aura controls. Her
three-quarter 40px icon uses the existing wood frame/selected glow, and her
model uses the existing contact shadow and detailed ground sigil.

## Quality state

Reference/style/source, all resting portrait angles/emotions, exported blink
drawings and compact icon inspected as static artwork. The first icon crop was
rejected and replaced. Runtime loops, transitions, all actor actions,
shadows/sigil, compact framed icon, dialogue and model likeness remain pending.
No automated tests, project checks, builds or browser verification were run.
Current AGENTS.md restrictions take precedence over the skill's live-review
checklist. Production timing is durable in `.production/events.jsonl`; overlapping
stage and child intervals must not be added together.
