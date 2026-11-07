# Blonde, violet, and redhead character variants

The selectable cast now includes seven appearances. Three new hair-color variants of the glasses rescuer retain the same clothing, backpack, glasses, and 27-action layout: blonde, violet, and copper red. Each has 108 native 32×48 frames and a matching 96×96 portrait. Existing appearances and saves are preserved.

Choose them in **Pause → Your character** for exploration, or **Homes → Settings → Your presence** for an account-linked home. The shared picker, save validator, world loader, and backend appearance catalog use the same IDs. This changes game appearance, not the member's platform avatar.

## Artwork and generation

- Mode: built-in Imagegen, one image edit per color. No CLI fallback or external API runner.
- Exact final prompts and hair palettes: [generation-prompts.json](../../assets/character-colors-v1/generation-prompts.json).
- Edit reference: [reference-contact.png](../../assets/character-colors-v1/reference-contact.png), assembled from the incumbent glasses rescuer and portrait.
- Original generated color sheets: `assets/character-colors-v1/{blonde,violet,red}-rescuer-source.png`.
- Runtime atlases, individual strips, and frame manifests: `public/assets/game/characters/animations/{blonde,violet,red}-rescuer/`.
- Matching portraits: `public/pawtrail-game/game-assets/dialogue-portraits/{blonde,violet,red}-rescuer.png`.
- [Native artwork preview](../../assets/character-colors-v1/preview.png).

The export pass slices the actual generated row bands, uses nearest-neighbor sampling and binary alpha, and adds a small color ramp per hair color to the existing game palette. Imagegen supplies the hair edits; the export script does not programmatically recolor the original character. As with the existing catalog, generated edits can introduce small pose/pixel differences. Fine rigging and seamless loops are not playback-certified.

To export again from the saved generated sources with Pillow installed:

```sh
python3 scripts/prepare-character-colors.py
python3 scripts/prepare-housing-runtime.py
```

Runtime catalog preparation now reads the character manifest instead of a hardcoded appearance list. Restart an already-running Homes service after changing its catalog. Existing source synchronization includes all registered runtime atlases; generation sources remain in this workspace.

No automated tests, typechecks, builds, browser verification, or animation playback were run for this addition, per the owner's instructions. The generated artwork and native exports were visually inspected as assets.
