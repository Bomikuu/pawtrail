# Selectable male rescuers

Three additional male characters expand the shared picker to ten appearances:

| Character | Hair and face | Outfit |
| --- | --- | --- |
| Blonde scout | Short tousled blonde hair, no glasses | Denim jacket, cream T-shirt, charcoal shorts, brown hiking shoes, sage backpack |
| Violet volunteer | Short curly violet hair, round glasses, deep warm-brown skin | Mustard hoodie, navy trousers, cream canvas shoes, rust backpack |
| Copper gardener | Short side-swept copper-red hair, no glasses | Terracotta T-shirt, green overalls, cream work shoes, navy backpack |

Choose them in **Pause → Your character** or **Homes → Settings → Your presence**. The picker displays the selected appearance's matching portrait and outfit description. Existing choices remain available. Exploration saves use the existing optional appearance field; Homes uses its existing account-linked profile action and catalog validation. Platform member avatars are unaffected.

## Saved artwork

- [Exact Imagegen prompts](../../assets/male-characters-v1/generation-prompts.json).
- [Artwork preview](../../assets/male-characters-v1/preview.png).
- Original generated sheets: `assets/male-characters-v1/{male-blonde-scout,male-violet-volunteer,male-red-gardener}-source.png`.
- Native atlases, action strips, and frame manifests: `public/assets/game/characters/animations/<character-id>/`.
- Matching portraits: `public/pawtrail-game/game-assets/dialogue-portraits/<character-id>.png`.

Each male character has 27 action rows with four frames each (108 frames), native 32×48 cells, and one 96×96 portrait. The action layout matches the incumbent walking, idle, social, animal-care, and furniture interactions. Original generated sheets were produced with the built-in Imagegen tool, one call per male character; no CLI fallback was used. A small set of hair and outfit ramps extends the existing warm palette.

The exact-export production pass detects actual source rows, slices animation cells, and uses nearest-neighbor sampling with binary alpha. It does not create/recolor character art in code. Regenerate the saved exports with Pillow installed:

```sh
python3 scripts/prepare-character-colors.py --collection assets/male-characters-v1
python3 scripts/prepare-housing-runtime.py
```

The second command updates the frontend and Django appearance catalogs. Restart an already-running Homes service after catalog changes. The community app receives only the relevant feature files and runtime artwork; unrelated routes are preserved.

Generated sheets and native artwork were visually inspected. No automated tests, typechecks, builds, browser verification, or animation playback were run for this change, per the owner's instructions. Generated pose/pixel consistency and wide-action scale retain the existing catalog's fine rigging limitations; animation loops are not production-certified.
