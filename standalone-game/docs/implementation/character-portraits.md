# Selectable characters and conversation portraits

Added 7 November 2026 using the built-in Imagegen tool and the existing PawTrail art as a reference. Existing character artwork was preserved. No external API or CLI image-generation fallback was used.

## Where to find it

- Exploration: Pause → Your character. Four visual choices update the player in place and persist with the local save, including save export/import. Older version-2 saves without an appearance remain valid and use the original rescuer.
- Homes: Settings → Your presence. The same picker sends the existing account-linked profile action. Django accepts the added appearance through its runtime catalog; this does not change platform avatars or identities.
- Talk to Maya, Jo, or Lina to see their own portrait and role. Text reveal, skip, continue, choices, pause, and keyboard dialog controls are retained. Animal care notes retain their animal artwork; non-speaking locations use the PawTrail paw icon instead of a misleading human portrait.

## Saved artwork and exact prompts

| Asset | Location |
| --- | --- |
| Native glasses character atlas | `public/assets/game/characters/animations/glasses-rescuer/complete-v2.png` |
| Per-action strips and manifest | `public/assets/game/characters/animations/glasses-rescuer/` |
| Movement prompt/source | `movement-prompt-v2.json` / `movement-source-v2.png` in that directory |
| Social prompt/source | `social-prompt-v2.json` / `social-source-v2.png` in that directory |
| Care and decoration prompt/source | `care-decoration-prompt-v2.json` / `care-decoration-source-v2.png` in that directory |
| Four original portrait renders and prompt | `assets/character-portraits-v1/source.png` / `prompt.json` |
| Native dialogue portraits | `public/pawtrail-game/game-assets/dialogue-portraits/{maya,jo,lina,glasses-rescuer}.png` |
| Combined artwork preview | `public/assets/game/characters/animations/glasses-rescuer/character-portraits-preview-v1.png` |

The glasses character has 27 animation rows, four frames each, with native 32×48 cells in a 128×1296 atlas. Dialogue portraits are 96×96; the interface displays them at 1× on small screens and 2× on larger screens. Exports use the incumbent palette, binary transparency, and nearest-neighbor sampling. Source row bounds and export scales are recorded in the manifests. Original high-resolution generation sources and full final prompts are retained above.

## Source and regeneration

`src/game/characters.ts` owns selectable IDs and portrait paths. `CharacterPicker` composes the official shared shadcn Button; `DialoguePortrait` provides the speaker image and a missing-art fallback. Routine presentation uses Tailwind utilities. No shared registry components were modified.

To regenerate exports from the saved sources with Pillow installed:

```sh
python3 scripts/prepare-glasses-character.py
python3 scripts/prepare-housing-runtime.py
```

The second command updates both frontend and backend runtime catalogs. Restart an already-running Homes service after changing that catalog, since it loads on process startup. The existing app synchronization script installs the character atlases and dialogue images alongside the updated source.

The generated source art and native overview were inspected. No automated tests, typechecks, builds, browser verification, or animation playback were run for this change, per the owner's instructions. Wide actions use a shared fit scale and still have the existing catalog's fine rigging/loop-polish limitations; this delivery does not claim production-certified animation.
