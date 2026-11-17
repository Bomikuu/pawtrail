# Sieghart — painterly anime fantasy

Sieghart is a separate actor choice. Sieg and the existing pixel-art choices
remain installed. Voice creation is omitted per the owner's existing instruction.
The live game roster and saved/account characters are unchanged.

## Style and assets

The uploaded Sieghart image supplies identity and costume. The owner's video
supplies the mature painterly anime fantasy splash-art direction: adult anatomy,
smooth painted material shading, selective crisp contours and a held hero pose
with hair/scarf/coat motion. The copied 15-second video frame is a style reference,
not an identity source. Prompts, full generated sources and registration data are
retained here. Profile age/origin/biography are authored fictional interpretation.

The three portrait sheets provide six expressions and complete rest, half blink,
closed blink, small speech and open speech drawings. Offline torso-breath variants
bring the atlas to 108 complete frames. No runtime eye or mouth patches are used.
The 144×180 AVIF pack, manifest and compact PNG references total **289,411 bytes**,
under the 300,000-byte style cap. Encoding is lossy at the recorded quality;
full-quality authoring sources remain intact. Smooth display fitting applies
only to this selected style; existing pixel-art styles retain integer scaling.

The six-frame painterly illustration retains full feet, scarf/coat tips and a
fixed anatomical foot registration. Actor, subdued context and amethyst aura are
separate atlases with independent visibility. Context reuses suitable approved
art; aura artwork is newly generated with neutral matte residue removed during
export. A derived composite poster serves the reduced-motion/loading fallback.
This is authored whole-frame animation, not a Live2D deforming mesh simulation.

Twelve character-specific painted UV surfaces cover facial states, hair/fringe,
coat/lining, vest, scarf, trousers, boots and blade. The articulated gameplay model
uses curved/tapered anatomy, a shaped open-forehead hair crown with overlapping
locks, raised lapels, rounded armor and boots, a separate back coat shell, double
coat layers, and two curved scarf tails. The shared skeleton/actions and game's
native-pixel renderer remain the gameplay contract; the 2D artwork is smooth.
The held blade is a visual prop, not a newly installed combat moveset.

## Firefox review — 2026-11-14

The actual actor preview was inspected in Firefox at normal size and enlarged
front, three-quarter, side and back views, against this actor's own illustration.
Review caught and repaired a poor icon crop, symmetric straight scarf tails and
a front vest texture leaking onto the back. Scarf roots now share the reference's
wind direction; a dark back coat shell separates front/back materials. Head and
jaw proportions were adjusted for this character instead of copying Sieg's head.

All 34 available human actions were exercised through the preview controls:
idle, walk, run, care, rest, pickup/cleaning, gestures, expressive actions,
power-up/run, dash/gentle approach, flight takeoff/hover/landing and car ride.
Additional idle/walk/run/pet/sleep captures checked hair and garment movement from
the back. Care/rest prop and blade visibility were inspected. Three angles × six
portrait emotions were exercised with speech on/off. Actual live-canvas captures
show the separate resting/breathing and blinking drawings. Dialogue uses the
selected portrait angle and the existing wooden HUD.

Illustration playback, layer isolation, reduced-motion still and the old Sieg
choice were reviewed. No application exceptions or failed asset loads were
observed in the completed review. Firefox emitted nonfatal WebGL/preload warnings.
Some automated menu selections needed retry after menu dismissal/ability expiry;
these were browser-driving interruptions, not a hidden skipped action set.
No broad application tests or production build were run.

Evidence: `output/playwright/sieghart-review/`, including action, motion, angle
and portrait boards, observed live blink/breath frames, isolated illustration,
reduced-motion still, preserved Sieg choice, dialogue and final preview.
Likeness/style acceptance remains a visual judgment, not a promise of exact
one-to-one anatomy or simulated cloth. The gameplay model retains stylized world
proportions while the illustration uses the selected adult splash-art proportions.

## Open and reproduce

- `/play?preview=actors&skin=sieghart&art=illustration`
- `/play?preview=actors&skin=sieghart&art=portrait`

Use the Drive authoring Python with Pillow/AVIF support:

```
/run/media/micxsz/Drive/Blender/blender_mcp/mcp/.venv/bin/python scripts/prepare-sieghart-assets.py
```

This publishes only Sieghart's assets and portrait catalogue entry. It preserves
source artwork and does not mirror files into the separate social-app worktree.
