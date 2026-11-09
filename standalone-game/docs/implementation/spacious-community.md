# Spacious community and persistent yards

Default entry: `/play`; `/play?home=system:hub` remains an explicit alias. The exploration toolbar's **Community** action and the Homes **Outside** action enter the new shared block. `/play?home=me` retains the saved interior; **Yard** opens the property's separate outdoor room. In local sample mode append `&demo=1`. Four permanent slots form a block; the header switches between existing blocks instead of adding houses to the same lawn.

This implements the [approved spacious community prompt](../prompts/2026-11-07-spacious-community-implementation.md). The original exploration maps and their stories remain available at `/play?explore=1`; explicit shelter and animal return links retain their exploration entry.

## World and destinations

The shared world is **80 × 56 native 32px tiles** (2560 × 1792 pixels), with a four-tile greenway, three-tile cross routes, generous lawns, and four **14 × 14** plots separated by five tiles. The fountain sits beside the central greenway, leaving its four lanes clear. Ground is assembled from reusable terrain rectangles; buildings, fences and props remain independent sprites. The concept illustration is not loaded as a background.

- **Paw Plaza:** physical mission board, modest fountain, seating and care station. Approach an object and press E; clicking offers navigation/proximity guidance.
- **Care Hub:** separate shelter/vet entrances lead into the existing virtual care interior and its public animal/help/adoption flows. A fenced care courtyard has a two-tile opening. This is not a newly invented multiplayer clinic or real medical service.
- **Market Lane:** the pet shop sells game care supplies; the sari-sari store opens your discovery backpack; the workshop sells actual furniture/garden catalog pieces into your shared stock. Authoritative prices, balance deductions and idempotency receipts use the housing service.
- **Pocket Park:** pond, quiet loop, picnic seating and animal encounter anchors, without a border of props along every route.
- **Home Lane:** gate interactions enter permissioned yard rooms, whose doors enter existing interiors. Public snapshots include only permitted identity/exterior and explicitly published committed yard pieces. Private/unassigned plots have honest placeholders.
- **Jeepney Stop:** generated parked jeepney and shaded waiting stop open the existing geographic discovery/travel interface. A departure animation is not claimed.

Published platform animals appear at fictional park/care anchors when the existing bridge returns records in the current sample/real realm. They use the native animal animation manifest. Selecting one or pressing E nearby opens the existing detailed profile interface, including current help missions and eligible adoption actions. No animals are invented when that directory is empty. Sprite positions are not physical coordinates, sightings, identity matches or care evidence. Owned cats remain in their existing interior with their server-controlled care and navigation; this change does not transfer them into the yard.

The camera retains integer zoom, nearest-neighbor rendering, pixel-rounded positions and delta-time walking. Tree/plant canopies fade when they overlap the player. Weather, lighting, portraits, chat, reactions, local exploration saves and platform links remain in their existing systems.

## Editing and persistence

**Decorate** edits the current property space using the existing inventory drawer. Yard and interior have separate saved layouts/revisions, with **one owner inventory across both**. Garden pieces include a bench, banana plant, pots, lamp and feeding station; suitable existing plant/pet items can also be placed outside. Upright garden pieces do not rotate. Three fitting native house presets are available in Settings.

The editor supports pointer/touch placement, selecting placed pieces, explicit directional nudge/place buttons, arrow/R/Enter/Escape controls, storage, undo/redo and save/discard. Small-screen editing uses a nonmodal lower drawer to leave the upper canvas accessible. The grid and footprint exist only in decoration mode. Movement pauses while decorating, typing or using dialogs.

The server checks zone/item compatibility, full sprite bounds, catalog footprints, inventory totals in both spaces, the fixed house footprint, a reserved two-tile gate-to-door corridor, connected walking area, reachable item approaches, standing players, owner/decorator permissions and expected zone revision. Drafts stay local. Committed collision changes invalidate the room layout cache and broadcast refreshes; room keys separate yard/interior movement, presence, chat and pet ticks. Revision conflicts retain the draft and offer discard/reload or an explicit keep-draft action before replacing the latest saved layout.

`yardPublic` defaults off for actual households. Yard entrance access inherits house door permissions. Public preview also requires a public/open home and visible owner. Fictional fixture homes have explicit sample labels and illustrative published yards; fixture shelter rooms are not allocated residential plots. Stable slot assignment is serialized under the realm hub lock. More households receive another block.

Migration **`housing.0004_spacious_yards`** adds yard layout/revision, exterior, preview preference, stable slot, and visitor/message zone columns. Existing interior layout/revision data is retained. Existing households receive a small starter yard and matching game-only inventory grants; provisioning does the same for newly allocated households. The additive migration was applied locally with `--skip-checks`.

## Source and assets

- Spatial contract: `src/game/housing/community-layout.json`, mirrored to `backend/housing/community-layout.json`.
- World rendering/interactions: `outdoors.ts`, `encounters.ts`, and the extended `scene.ts` in `src/game/housing/`.
- Zone geometry: `src/game/housing/geometry.ts`, `backend/housing/{geometry,community}.py`.
- Save/live contracts: housing `types.ts`, `client.ts`, and backend `service.py`, `live.py`, models and migration.
- UI: existing official shadcn components composed with Tailwind in the housing app, decoration, settings and market panels. No registry sources or new CSS component layer were introduced.
- [Built-in Imagegen prompt and reference](../../assets/community-v1/generation-prompts.json).
- Original generated sheet: `assets/community-v1/transport-and-plaza-source-v1.png`.
- [Native runtime manifest](../../public/assets/game/community/manifest.json), including exact dimensions, anchors, source and proposed footprints.
- Native exports: `public/assets/game/community/`; generation masters are excluded from app sync.
- Export workflow: `python3 scripts/prepare-community-assets.py`, then `npm run sync:app`. The exporter uses the authorized nearest-neighbor resize, fixed native canvases, incumbent palette and binary-alpha production pass. If the spatial contract changes, update both copies together.

## Delivery limits

The local housing service is available on port8001 and the existing Next app on port3000. Source and runtime assets were synchronized into the isolated game feature in the social worktree; its capture/identity backend and unrelated pages were not replaced. The game service uses its existing local development database/channel configuration, not a new production deployment.

Per the owner's instruction, **no automated tests, type checks, builds, browser verification or gameplay walkthrough were run**. Asset artwork was inspected and exported, migration execution completed, and the service started; those facts do not certify rendered positioning, smooth input, mobile ergonomics, simultaneous clients or animation playback. These remain for the owner's hands-on review. Virtual supplies, play progress, photographs and game Kibble never create verified platform sightings, adoption approvals or wallet rewards.

## Community-first shell refinement

The world canvas now occupies the full available width. Both desktop drawers are floating, bounded-height, closable overlays and start closed. The header exposes My house and the public animal directory, with another Animals shortcut in the bottom toolbar. Phaser stays mounted between room requests. External room/game subscriptions are released on both SHUTDOWN and DESTROY, with guards against rendering destroyed objects; previously only SHUTDOWN was handled, leaving stale callbacks after React destroyed a game.

Chat uses compact world-space speech containers with a rounded body and tail. Each speaker has one message timer; replacement cancels the previous timer and expiration removes only the matching instance. Balloons follow the actor each frame and clear when changing rooms or when the speaker leaves. The complete message remains in chat history.

See [the Jev layout judgment](community-shell-jev.json); it favored the requested persistent canvas and floating drawers. It is not runtime verification. This refinement was synchronized without tests, builds, browser automation or visual verification.
