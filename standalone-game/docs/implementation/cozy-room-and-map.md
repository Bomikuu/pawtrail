# Cozy home reference, camera controls and resilient place discovery

The owner requested a warm walled room similar in atmosphere to the supplied reference, with a bed, aquarium and cat stands. The original [room reference](../images/pawtrail-home-room-reference-v1.png) shows a 24×18-tile conceptual home with cream-and-timber walls, walnut flooring, sage seating, sleeping nook, aquarium, cat furniture and clear routes. It guides modular assembly; the image is not a painted gameplay background.

## Implemented interface changes

- Homes uses the full viewport width. Yard grass continues behind the entire view, including beyond the fenced editable plot. The actual 14×14 yard and existing 24×18 saved interior keep their geometry and inventory constraints.
- Property views start with integer zoom chosen to fill the width, capped at4×. Controls provide zoom out/in, Fit and Fill, with1×–4× native pixel rendering. User zoom choices persist across room visits in the current game session. Fit uses an integer zoom, so on a very small screen the whole property can still require walking/panning at1×.
- Property/nameplate labels retain a small screen size across zoom. Long outdoor names are shortened for the plate; the actual saved name remains in the header/settings.
- Interior north walls now have a two-tile structural timber/plaster backing, native detailed wall faces, side trim and a cutaway south wall with a visible doorway. Existing wallpaper choices and saved furniture layouts remain available.
- Four new furniture choices appear in the workshop and Decorate → Shop: Sage quilt bed, Little reef aquarium, Basket cat stand and Cozy cat perch. Workshop search now covers the whole real furniture catalog. Buying and placing still use authoritative game stock/prices, not platform Kibble.

## Artwork

Generated using **built-in Imagegen**, with the supplied room screenshot as atmosphere/material reference, and the new original room concept as reference for the furniture pack. Layout, furniture and artwork are original.

- [Concept PNG](../images/pawtrail-home-room-reference-v1.png).
- [Exact prompt set](../../assets/room-v1/generation-prompts.json).
- Original sprite source: `assets/room-v1/furniture-source-v1.png`.
- [Native runtime manifest](../../public/assets/game/housing/furniture/cozy-room-v1/manifest.json).
- Native sprites: `public/assets/game/housing/furniture/cozy-room-v1/`.
- Exporter: `scripts/prepare-room-assets.py`.

The owner previously authorized image-processing cleanup. The exporter removes the generated translucent outer glow, fits sprites onto exact native canvases with nearest-neighbor resizing, applies a shared64-color palette and binary alpha, and updates both authoritative furniture catalogs. The bed and tall stand use64×96 cells; aquarium96×64; low perch64×64. Anchors and conservative collision footprints are in the manifest. These authored footprints have not had a gameplay verification pass. If regenerating catalogs, prepare community assets before room assets, then synchronize the game.

## Geographic map fallback

The detailed MapLibre/OpenFreeMap map remains available. A lightweight **Simple street map** renders ordinary OpenStreetMap raster tiles, React place markers and local clusters while the detailed map initializes or if its WebGL/worker/provider resources fail. Its controls support dragging, zoom, Show all places, cluster selection and place previews. It does not rely on WebGL, workers, sprite decoding or remote glyphs. Choosing the simple map keeps it active; Try detailed map reinitializes the detailed renderer.

Only tiles in the active viewport are requested. Normal browser caching, accurate browser Referer and visible OpenStreetMap attribution follow the [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/). No offline download, background prefetch, device geolocation or private home coordinate is introduced. If raster tiles also fail, approximate place markers remain visible on a clearly labeled plain background; street detail is not fabricated. The existing same-origin OpenFreeMap relay remains for the detailed mode. This fallback is a second street-tile provider, while the detailed mode retains the owner's chosen MapLibre/OpenFreeMap configuration.

Sources: `src/components/game/community/simple-map.tsx` and `map-canvas.tsx`. Physical house/shelter entry and privacy remain in existing place previews and the housing service.

## Delivery status

Native artwork was visually inspected and exported. Source/runtime files were synchronized; the housing service was restarted to load the extended catalog. No automated tests, type checks, builds, browser verification or gameplay walkthrough were run, following the owner's standing instruction. The room reference and new sprites are design/art deliverables; actual camera framing, wall rendering, touch controls and network behavior still need the owner's hands-on review.

## Community map inspection — 7 November 2026

The owner subsequently requested inspection of the gray community map. In Firefox, the map assets returned successfully, but the MapLibre host measured zero pixels high: the vendor's unlayered `.maplibregl-map { position: relative }` overrode Tailwind's `absolute` utility. The host now uses explicit `h-full w-full` sizing instead of relying on absolute positioning, and the change was synchronized to the social application.

Scoped Firefox inspection confirmed visible Davao streets, shelter pins and numbered clusters at 1440×1000 and 390×844. Selecting a cluster populated its nine places; selecting Maya's home opened its preview with the Enter home link. No test suites, type checks or builds were run. Screenshots are in `output/playwright/community-map-after-desktop.png` and `community-map-after-mobile.png`.
