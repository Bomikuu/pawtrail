# Sampaguita Care Grove — medieval reference finish and scenery pack

The owner's new village screenshot defines the selected material/detail/value
reference. Built-in ImageGen restyles the six existing map-art sources and
creates four additional transparent scenery assets: slate-roof timber cottage,
barrels/crate, wooden handcart and ivy-covered stone wall. Exact prompts and
per-image service timings are retained in `prompts.json` and `sources/*.json`.
The screenshot's UI, combat, characters and effects are not map requirements. A
half-size stone wall variant also replaces Care Grove's bright fence artwork;
its existing world ground footprint and gateway clearance are retained.

The finish uses muted daylight, deep colored recesses, fine restrained outlines,
weathered wood/stone, forest greens and desaturated blue-grey slate. Ground
remains continuous with unchanged established paths and no square seams/grid.
No global dark canvas filter is used. Reference darkness comes from generated
material shading rather than a black overlay that would obscure the actor.

## Installed entry and assets

- `/play?preview=stage&map=care-grove` → **Play map**.
- **Files → Sampaguita Care Grove map** opens the new default template.
- New items appear in **Village scenery · reference pack** in the asset library.
- Runtime images: `public/pawtrail-game/map-art/care-grove-v5/`.
- Registry: `src/game/stage-editor/grove-art.json` (existing `grove:` IDs retained).
- Canonical layout: `src/game/stage-editor/maps/care-grove-v5.json`.
- Served import: `/pawtrail-game/stages/care-grove-v5.json`.
- Scoped production command: `scripts/prepare-care-grove-v3.py --revision 5`.
- New asset definitions: `additions.json`; map authoring input: `layout-source.json`.
- Overview: `native-overview.png`; new prop sheet: `new-scenery.png`.

Existing benches, garden gate, lamps, feeding station and planters keep their
actual furniture contacts/controller, local state and visible feedback. The new
cottage/cart/supplies/wall are static scenery with solid ground footprints;
there is no new cottage interior, cart-driving mechanic, combat, inventory cost,
reward or overworld portal. All placed items remain editable. User-saved drafts
and prior artwork revisions are preserved; saving the current layout is explicit.

## Review boundaries

Native image production and artwork review do not approve actual walking or
interaction playback. No automated app tests/checks/builds, agents or browser
verification were requested; live gameplay review remains pending. The job
records concrete artwork observations and any omissions rather than treating
successful export as gameplay evidence.
