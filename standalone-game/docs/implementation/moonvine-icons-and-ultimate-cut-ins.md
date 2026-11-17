# Moonvine icons and ultimate illustration cut-ins

The existing chain mechanics retain their timings, reach, hit windows and
procedural body/chain geometry. Four generated 64 px pixel icons now cover its
Mooncut combo, running sweep, reaching chain and Moonvine circle ultimate.
Native files and source provenance are under
`public/assets/game/items/moonvine-chain/`; the compact embedded icon package is
`items/chain-icons.json`. Every action, including combo follow-ups, now has an
authored description matching its actual behavior. Existing parchment hover
cards, local item exports and the shared cooldown/active-state hotbar are reused.
The movement restriction label says manual movement is locked where the skill
still supplies its own collision-respecting advance.

Successful ultimate casts show the actual selected character's existing animated
illustration briefly on the left in Item Studio and Stage editor play mode.
This applies to every equipped weapon's special action, not only the chain.
Amber and Yae resolve to their own approved illustration catalogue entries.
The display is click-through, does not pause gameplay, and lasts roughly 900 ms
plus a short exit. Reduced-motion preferences retain still artwork and remove
the entrance/exit slide. The caption reuses the dialogue's wood/parchment frame.

The shared `ultimateCutIn` store identifies each presentation by instance source
and accepted cast ID. It does not activate from hover, selection, failed input,
cooldowns or silent timeline scrubbing. Natural completion ends it; reset,
item/character changes and scene disposal clear it. Existing illustrated frame
playback is reused in a control-free mode, with one shared bounded asset cache
and preloading when equipped play mode is created. No new actor artwork is
generated or replaced, and no different-character illustration is substituted.

The PawTrail Weapons skill now carries this ultimate-presentation requirement
forward alongside its existing generated icons and authored hover descriptions.
All combat rehearsal remains local; it grants no verified Kibble or welfare data.

Implementation and native source/art inspection only. No agents, automated tests,
checks, builds or browser/gameplay verification were run. Visual acceptance of
the cut-in, lifecycle and illustration playback remains pending.

## Separate equipment icon

Moonvine also has its own generated 64 px `weapon-icon.png`, distinct from its
four action icons. The portable `weaponIcon` field is validated and preserved
through local saves and item JSON. A shared WeaponIcon shows it in selection,
the equipped header, the saved library and Stage equipment selection. Built-in
ID fallbacks display the icon for older saved chains without rewriting edits.
