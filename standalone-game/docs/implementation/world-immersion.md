# World interactions and immersion — phased delivery

This expansion extends the existing Phaser world, quests, saves, care logic, and Django/Channels rooms. It does not rebuild the game or connect virtual rewards to verified platform Kibble.

## Implementation phases

| Phase | Delivered implementation |
| --- | --- |
| 1 · Assets | Seven original Imagegen packs, 106 sprite definitions including 12 four-frame cat expressions, and 16 original synthesized WAV files. Native exports use binary alpha, nearest-neighbor sampling and the incumbent palette. |
| 2 · Community board | Physical roofed board in the neighborhood and shelter, plus a board in the multiplayer commons. E opens pet mission cards with category filters, details, objectives, status, acceptance, pinning and reward claiming. The local board has normal/available/new/nearby appearance variants. |
| 3 · Tracker | Compact collapsible right tracker, individual objective expansion, progress, pin/unpin and known-location markers. Mobile uses a mission button and bottom dialog. Homes switches its existing right rail between Pets and Missions. |
| 4 · Inventory | Categorized backpack, icons, quantities, item inspection, protected mission keepsakes, usable care supplies and actual photo/badge counts in exploration. Local finds persist with existing saves; shared discoveries use server-validated proximity and one claim per player. |
| 5 · Cat Soundboard | Twelve original synthesized cat reactions with actual WAV playback, animated faces, pop/float/shake/blink/fade, three-second cooldown, two-voice playback limit, volume, mute-other-players, reaction visibility and proximity controls. Room events transmit only approved identifiers and metadata. |
| 6 · Weather | Clear/cloudy/light/heavy rain sequence, smooth intensity changes, pooled canvas rain/splashes, visible puddles, moving clouds and faint cloud shadows. Rain is hidden indoors while ambience becomes muffled. Reduced-effects and weather-audio preferences persist. |
| 7 · Day/night | Exploration's old full-world dark rectangle was removed. Sprite/tile tinting, warm evening colors, readable light zones, night lamps/windows, moon/stars and existing music/ambient changes follow the clock. Shared room conditions come from server time. |
| 8 · Integration | New environment inspection/rustling, bench sitting, mailbox letters/invitations, extra discovery quests, pickup animations/sparkles, compact toolbar, source/asset synchronization and the additive supplies migration. |

These rows describe implemented code and authored assets. They are not a claim that all acceptance criteria have passed runtime review.

## Try the features

- **Exploration:** `/play`. The physical Community Board is placed near the starting neighborhood; approach and press E. The bottom toolbar also opens it for keyboard/touch access. Accepted quests appear on the right; the journal remains available.
- **Discoveries:** look around trees, benches, the community mailbox, the shelter, the garden and riverside. Press E by pickups or inspect a bush/bin. Once found, an item remains collected in that save. Press I to inspect the backpack. Loose food/water/tools can be converted to the existing care supplies; protected letters/collars/tags remain safe.
- **Cat sounds:** use the cat-paw soundboard control. Audio unlocks after a user gesture. The vocalizations are original procedural synth sounds, not copied meme recordings or recorded real cats.
- **Homes/demo rooms:** `/play?home=me`, or enter a sample home from the community map. The toolbar opens Backpack, Missions and Cat sounds. E near the commons board opens shared missions; E near marked discoveries claims them after the server validates proximity. After collecting its letter, the mailbox opens invitations.
- **Use shared care items:** select and approach a resident pet, then open Backpack and use a compatible item. The server checks the item stock, pet action, permissions, distance, rest state and cooldown before consuming it.
- **Weather:** exploration uses the existing saved game clock. A day lasts about twelve active minutes; menus pause that local clock. Shared room time/weather continues from the server epoch and is consistent between participants. Rain intensity and cloud cover ease toward their targets rather than switching abruptly. Animals favor cover in rain and quieter states at night; there is no automatic harm or weather penalty.

## Persistence and authority

Exploration keeps version-2 saves compatible by adding an optional `satchel` record. Existing care counters, quests, photos and activity remain unchanged. Permanent discovery facts also satisfy later accepted collection quests, including after a consumable has been used. No discard action is exposed for quest items.

Shared room supplies use `PlayerGameProfile.supplies`, added by migration `0003_playergameprofile_supplies`. The existing transaction/receipt mechanism protects `world-pickup`; the server owns item IDs, quantities and positions. Claim flags are per player and global across rooms, so hopping through demo homes cannot farm the same discovery. Care-item use is checked and consumed in the existing locked pet-interaction transaction. Supplies cannot be gifted through furniture transfers or credited to the platform wallet.

Shared `world` snapshots use server epoch-derived total game minutes and weather. Clients anchor the received total to a monotonic clock for interpolation; their wall clocks/preferences are not the authority. Cat sounds are allowlisted, rate-limited to one per three seconds, scoped to the current room and filtered for blocked players. Each receiving client plays its local audio with range, volume, mute and overlap settings.

## Source and assets

- Data/definitions: `src/game/immersion-data.ts`.
- World atmosphere and pixel tinting: `src/game/atmosphere.ts`.
- Audio/emote playback: `src/game/soundboard.ts`, `src/game/systems/audio.ts`.
- Preferences: `src/game/immersion-preferences.ts`.
- Board, tracker, backpack and soundboard controls: `src/components/game/immersion/`.
- Authoritative room conditions/pickups: `backend/housing/immersion.py`, `service.py`, `live.py`.
- [Exact final Imagegen prompts](../../assets/immersion-v1/generation-prompts.json), using built-in Imagegen.
- [Native artwork overview](../../assets/immersion-v1/native-review.png).
- [Runtime sprite/audio manifest](../../public/assets/game/immersion-manifest.json), with dimensions, frames, source rectangles, audio duration and rights.
- Original generated sources: `assets/immersion-v1/*-source.png`.
- Native assets: `public/assets/game/{missions,inventory,soundboard,weather,environment,audio}/`.

Regenerate the native exports and original audio with Pillow installed:

```sh
python3 scripts/prepare-immersion-assets.py
npm run sync:app
```

The sync script installs runtime packs and source into the separate community application. It does not copy generation masters into the application runtime. Interface controls compose the existing official shadcn components with Tailwind utilities; registry sources were not replaced and no parallel CSS component layer was introduced.

## Jev and verification limits

[Jev's recorded architecture choice](world-immersion-jev.json) selected `extend_existing`. Its input was a public technical summary, not user records or secrets. This is a model judgment, not a code check or performance certificate.

Original sheets and the native asset overview were visually inspected as artwork. The additive local migration and runtime synchronization were applied. Per owner instructions, no automated tests, typechecks, builds, browser inspection, animation playback, audio listening pass or multi-client walkthrough was run. Actual frame rate, subjective vocal quality, night readability, positioning in customized houses, and full keyboard/mobile interaction still need hands-on play review. Generated frame fit and coarse on/off light activation retain polish limits; this delivery does not claim production certification or a real recorded soundtrack.
