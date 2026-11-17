# Spectral swordsman and reusable weapon workflow

The owner supplied a short idle/rotation recording of a character carrying
swords, with a larger spectral swordsman behind them. The implementation uses
the existing Phaser world, live native-pixel Three.js actors, Item Studio and
stage rehearsal controller. The recording did not show attacks; the strikes,
wave and ultimate below are original moves designed for this weapon.

## What is installed

Item Studio now opens the Spectral swordsman preset. Sword, Chain and Ruby
hammer remain in the dropdown with their current-session drafts. Amber and
Yae retain their shared body rig, collision size and movement controls. The
generated sword skin wraps editable 3D parts. A matching secondary blade,
articulated ghost torso/arms, angular helmet, shoulder spikes and twin large
swords provide the companion composition. Texture-driven energy, rising wisps,
orbiting seals, a fixed ground shadow and a special-only gold halo add motion.

The guardian follows the equipped actor's position and interpolated facing. Its
idle phase is independent of the breathing body and its attacks have delayed
follow-through. It is a visual rig, not an AI navigation follower or a player
collider. Guardian scale, opacity and local offset are editable in Equip. The
front/side concept opens there too. Bounds are enlarged/measured without
changing the base character scale or tile size; the spectral pixel finish
preserves alpha while the other presets keep their existing finish.

## Three regular skills and one ultimate

| Slot | Key | Action |
| --- | --- | --- |
| Skill 1 | J | Twin-blade strike; J chains into crosscut and finisher |
| Skill 2 | R | Pursuing slash with a short, collision-respecting advance |
| Skill 3 | L | Spectral wave with projectile range, lifetime and wall behavior |
| Ultimate | K | Guardian circle, a wider follow-up area, gold halo and 4.2 s cooldown |

Every move uses the existing pose/keyframe, cooldown, area, release-event,
sound and local hit-window controller. Separate named hit windows coordinate
the player's first strike and the guardian follow-up. Unlocked attacks keep
walking/running legs when the player moves; the ultimate locks movement for
its authored sequence. Scrubbing stays silent. Generated 64 px skill icons
appear in the action list and four-skill hotbar with active/cooldown states.
The icon data and guardian settings survive item save/export/import.

Ability descriptions now appear on hover and keyboard focus in the action list
and hotbar using the installed shadcn Tooltip. They include the binding,
cooldown and movement restriction, and remain accessible during cooldown.
Spectral actions have authored descriptions; older items have a mechanics-based
fallback. Actions → Skill description edits the text, and the portable reader
preserves validated descriptions (up to 600 characters) through save/import/export.

Ability hovers reuse the dialogue-v2 panel's wood/parchment nine-slice artwork
through `shared/dialogue-frame.ts` and `shared/game-tooltip.tsx`, retaining compact
tooltip dimensions and warm brown text. DialogueHud uses the same extracted
frame helper with its existing slices and dimensions. The registry Tooltip source
adds an optional `showArrow` prop (true by default); the framed game tooltip hides
the stock dark arrow. Existing non-game tooltip behavior remains the default.

Local saves can be equipped in Stage editor play mode. This task does not
install a weapon into a real online inventory or grant Kibble. No real animal,
welfare record or payment behavior is connected to combat rehearsal.

## Reference idle

The shared human idle keeps the fixed ankle targets and flat soles. Its
2.5-second breath now follows authored timing points, with a faster inhale and
longer release, more readable knee flexion, shoulder rise and delayed arms/head.
The authoring/weapon action `referenceStance` option keeps authored leg angles
on their neutral base instead of applying them over the relaxed idle IK pose.
Amber/Yae footwear and body-width adjustments remain character-specific.

## Assets and skill

Native textures, concept and four icons are under
`public/assets/game/items/spectral-guardian/`; `manifest.json` records sources,
native dimensions, methods and bytes. The four 64 px material tiles also have
an embedded portable native representation in `spectral-art.json`. The
ability icons are embedded in `spectral-icons.json` for item exports. Original
generated source files remain in the recorded generated_images location;
runtime assets are installed in the project.

The reusable `$pawtrail-weapons` skill is in
`.agents/skills/pawtrail-weapons/SKILL.md` and the personal skill directory. It
requires the base-character/reference inspection, fast front/side concept,
textured geometry, three regular abilities plus one ultimate, four matching
icons and actual Item Studio installation. Its reference guide documents the
existing runtime contracts, portable format and permission-aware review.

Implementation and manual source/art inspection only. No agents, automated
tests, checks, builds or browser verification were run. Visual acceptance of
the body loop, guardian, all angles, attacks and transitions remains pending;
90% similarity is a review target, not a verified score.
