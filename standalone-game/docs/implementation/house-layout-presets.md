# Selectable house plans and connected floors

Open `/play` → **My house** → **Settings**. The enlarged Settings dialog shows three previews drawn from actual native room data, a larger selected-floor preview, each floor's rooms, a furnishing switch and an explicit **Use this house layout** action. Choosing a thumbnail previews the plan; applying is the separate save action. **Layout history** restores any of the five recent arrangements. The original illustrations remain available under **Original art reference**.

## Available plans

| Preset | Structure | Native floor dimensions |
| --- | --- | --- |
| Cozy Studio | Rear aquarium/bed, opposing sage loveseats, animal corners and perimeter storage |20×14, one floor |
| Connected Cottage | Left kitchen/pet-care wing, central living/dining hall with stairs beside it, right bedroom; reading/sleeping attic and animal nook |24×15 per floor |
| Companion House | Upper-left living room, upper-right stairs, central entrance hall between kitchen and pet-care rooms; lounge, two bedrooms and study upstairs |24×15 per floor |

The revised plans follow the reference's room connections, stair location and furniture groupings at a smaller native scale. Runtime rooms are assembled from tile/furniture assets and structural data, not the concept images. `room-art.ts` supplies the exact native wall, stair, fixture and furniture composition to both Phaser and the Settings canvas. The main preview filters unavailable stock in server placement order and explains missing pieces. Partition walls have actual doorway gaps; stair footprints and landing positions align between floors. Approach a landing and press **E** to change floor. The **Ground floor / Attic / Upper floor** controls provide the same destinations directly. Upstairs requires a selected plan with that floor and the existing home-visit permission.

The existing studio save is retained by the additive migration. No house is rearranged merely by opening Settings or installing this feature. Applying a preset creates a saved history entry containing both interior floors, the selected plan and floor/wall finishes. Existing interior pieces return to the same owner's inventory; the yard keeps its layout. Restoring also saves the current arrangement first.

## Furniture and authority

**Include the furniture arrangement** applies the plan's canonical native pieces. The first furnished use of each preset grants only the stock needed for its starter arrangement, recorded once on the house. Repeated applications use owned stock, count yard/ground/upstairs placements together, and omit unavailable pieces with a notice. This prevents repeatedly gifting out a starter piece and regenerating it by switching the same plan. Choosing empty rooms leaves the furniture pack available for a future furnished application.

Preset selection and restoration are owner-only and use the existing transaction/idempotency receipt mechanism. The service checks both interior revisions, refuses a structural change while other indoor visitors remain, and validates item quantities, sprite bounds, collisions, connected access, protected doorways and stair landings. Restoration cannot place furniture that is no longer owned. Yard inventory continues to count in the same total. Rewards and inventory are game-only and never credit verified platform Kibble.

The editor works on the active floor, with its dimensions, protected structure and revision. Ground, yard and upstairs keep distinct saved layouts and movement/chat/presence room keys. Live movement checks the active floor's geometry. The ground floor's owned cats retain their existing care and behavior, with preset-aware reachable paths. This feature does not move resident cats between floors.

## Persistence and files

Migration `housing.0005_house_layout_presets` adds `interior_preset`, `upstairs_layout`, `upstairs_revision`, `layout_backups` and `unlocked_presets`. Existing `layout` and `revision` remain the ground-floor fields; yard fields remain in place. Applying or restoring increments both interior revisions and reopens the ground floor at a server-chosen entrance. Stair entry uses the server's landing, while normal visits preserve a valid cached position.

- Canonical geometry/furnishings: `src/game/housing/house-presets.json`, mirrored to `backend/housing/house-presets.json`.
- Client definitions and cell geometry: housing `presets.ts`, `community.ts`, `geometry.ts`.
- Native walls, treads, landings and entry: `src/game/housing/interior.ts`, `room-shell.ts`, `scene.ts`.
- Server geometry and transactional switching: `backend/housing/presets.py`, `house_layouts.py`, extended `geometry.py`, `service.py` and `live.py`.
- Large thumbnail gallery: `src/components/game/housing/layout-picker.tsx`, composed from the installed official shadcn Button/Badge/Switch components with Tailwind. No registry primitives or CSS component layer were replaced.
- Editor/floor navigation: housing `client.ts`, `types.ts`, `decoration.tsx`, `app.tsx`.
- Small runtime images: `public/assets/game/housing/presets/`.
- Thumbnail/mirror preparation: `python3 scripts/prepare-house-presets.py`.
- Integration: `npm run sync:app` copies source, the plan contract and runtime thumbnails into the existing `/play` feature.

The original concept prompts remain in `assets/room-v1/layout-variants-prompts.json` and `layout-variants-stair-edit-prompt.json`. The subsequent browser correction generated the missing reference furniture using the prompt set at `assets/room-v2/prompts.json`.

## Delivery limits

### Browser-inspected reference correction

The owner explicitly requested Firefox inspection and generation of missing furniture. A dedicated sample home was used to apply all three furnished presets without changing the owner's custom arrangement. Headed Firefox stopped issuing animation frames in this environment; the inspection continued in headless Firefox using the installed Firefox executable.

The rendered room exposed undersized armchairs standing in for sofas, a circular rug, missing reference pieces, thin partition art, a hard-coded atmosphere lamp overlapping saved furniture, and top-left camera clamping. The correction adds ten original native assets: opposing sage loveseats, round flower table, rectangular woven rug, chaise, lantern cabinet, display cabinet, bamboo window, woven runner and feeding tray. The tray is available in the furniture catalog; preset care corners retain separate working food/water bowls. Runtime exports and their dimensions/anchors/footprints are in `public/assets/game/housing/furniture/reference-v3/manifest.json`. Masters and exact built-in Imagegen prompts are under `assets/room-v2/`; `scripts/prepare-reference-furniture.py` performs the previously authorized alpha cleanup, nearest-neighbor export and shared-palette conversion.

Indoor rendering now uses a centered FIT stage with 64 native render pixels of total allowance on each axis. Camera zoom remains integer1×–4×, while the entire canvas fits the available viewport with nearest-neighbor presentation. All exterior walls remain visible in Fit mode. Manual zoom can crop the room and retain normal following/panning. Outdoor views continue to use the available full-width host dimensions. Timber/plaster wall geometry and actual furniture placement are shared by gameplay and the Settings previews; atmosphere no longer inserts an extra lamp into the room.

Migration `0007_reference_house_furnishings` upgrades untouched v2 arrangements, records prior geometry under hidden `-v2` plans and backs up their layouts. Custom arrangements retain their geometry. Versioned furniture-pack unlocks grant new required stock once without resetting wallets, yards or existing inventory. The migration was applied with `--skip-checks`, and the updated source/runtime assets were synchronized to `/play`. The local housing service runs on8001 with its development log at `/tmp/pawtrail-housing-dev.log`.

Firefox confirmed all three preset saves, cottage/attic and Companion House floors, an actual E-key stair descent in Companion House, shared Settings previews, complete desktop wall frames at1440×1000, mobile fit at390×844 and working zoom controls. The final loaded browser page had no JavaScript errors. No automated test suites, type checks or production builds were run. These are bounded local browser observations, not production deployment or multi-user load validation.

Screenshots: `output/playwright/studio-ground-final.png`, `studio-settings-final.png`, `studio-mobile-final.png`, `cottage-ground-final.png`, `cottage-attic-final.png`, `companion-ground-final.png`, and `companion-upper-final.png`.

### Compact plan correction

The house camera now chooses the largest integer zoom fitting its floor within the viewport plus a 32px allowance per edge, rather than filling only the width and cropping large amounts vertically. Physical camera bounds extend 16 native pixels past the walls. House, yard and community zoom choices are separate. Fit/Fill and1×–4× zoom remain; a narrow phone may still require panning at the minimum1× zoom.

Migration `housing.0006_compact_house_plans` uses a frozen v1/v2 snapshot. Untouched presets and the former untouched starter arrangement receive the compact equivalent, required starter stock and an original-size history entry. Empty plans stay empty. Custom arrangements keep their original geometry under hidden `-legacy` plans until their owner explicitly applies a compact plan. Old history/unlock references retain the original geometry; legacy contracts must remain available. The yard, wallet, care records and extra inventory are preserved. New homes start in the actual compact studio arrangement.

This correction was implemented without automated tests, checks, builds or browser verification. Native furniture sprites differ from the painted reference art; the primary Settings preview now shows actual game art and placement. Final appearance and walking/stair behavior remain for the owner's hands-on review.

The compact-plan migration was applied with `--skip-checks`, the local housing service restarted on8001, and the updated game source/assets synchronized into the running `/play` app.

### Initial delivery

The additive migration was applied with `--skip-checks`; the local housing service was restarted and the game synchronized into the running social app. No automated tests, type checks, builds, browser verification or playthrough were run under the owner's standing instruction. Source includes the mechanisms described here; actual movement, saved-layout switching, stairs, mobile controls, two-account behavior and final visual matching remain for hands-on review. This is not a claim of a verified production deployment.
