# Lightweight 2D dialogue portraits

The owner approved switching from rotatable 3D busts to original 2D illustrations on 9 November 2026. This supersedes the painted-bust and Maya GLB rebuild direction for active dialogue, player HUD and creator portraits. Gameplay models and animations remain separate.

`/play?preview=portraits` is the 2D portrait studio: original beside animated artwork, character selection, expressions, dialogue-to-idle demonstration, pause and measured artwork sizes. The old Maya 3D comparison and authoring files are retained as archival tools, outside this route and the active portrait factory.

## Assets and budget

- Existing human PNGs remain unchanged, including Maya's original 96×96 illustration. Trail rescuer uses its existing 144×144 illustrated bust.
- Seven small drawn native patches form each expression atlas: half/closed/happy eyes and smile/two speech vowels/happy mouth. Neutral draws the untouched original. Eye and mouth states compose independently; talking is an approximate visual cycle, not phoneme lip sync.
- Cats reuse the owner's existing transparent coat illustrations, exported to native 96px artwork with matching patches. These are decorative game portraits, never animal photographs or identification evidence.
- `scripts/pawtrail-portrait-layers.py` is the offline image-production exporter. It creates atlases, optional semantic color masks, per-portrait manifests and a size report in `public/pawtrail-game/game-assets/dialogue-portraits/layered-v1/`. The source metadata lives in that script. It also produces native expression contact sheets and blink/talk GIFs under `assets/portrait-2d/evidence/`; these review files are not runtime downloads.
- The exporter rejects an artwork bundle at or above **500,000 bytes**, counting base, atlas, optional mask and per-portrait manifest. The shared application code is separate. Complete human bundles are approximately 9.5–31.5 KB; all 17 shipped human/cat bundles are below that budget. Exact byte counts are in `sizes.json` / `portrait-sizes.json`.

## Runtime and boundaries

`portrait-renderer.ts` is a Canvas 2D-only factory. It fetches only the selected bundle when opened, shares decoded image/promises in bounded caches, and removes failed cache entries so later mounts can retry. Ordinary portraits do not fetch semantic masks. Custom color variants use them to preserve drawn shading and contours, including eye accents. Appearance-preference identity lookup is metadata-only in `models3d/skin-ids.ts`, preventing an indirect Three.js import.

The renderer composites at native resolution and displays at integer 3× (96px) or 2× (144px) in a transparent 288px surface. Nearest-neighbor rendering preserves pixel edges. Each instance caches at most 12 distinct eye/mouth composites and releases its canvases/cache on close.

`LivingPortrait` shares display, snapshots, pause, visibility and reduced-motion handling across dialogue, HUD and creators. It hides the fallback beneath a ready portrait, freezes offscreen/background work, and redraws expression changes without rebuilding the renderer. `GameDialogue` already drives talking from text reveal and restores the chosen/neutral mouth on completion. The portrait dialog offers expressions, with no rotation controls or misleading view presets.

Built-in portraits retain their own authored identity. Existing arbitrary saved/creator configurations use the closest available illustrated base and semantic colors. They do **not** acquire a faithful new silhouette, hat, wing or breed illustration merely from appearance data. The creator states this limitation. New distinctive characters/cats should receive their own authored 2D bust and registered patch metadata through the updated actor/cat skills. Do not restore a procedural 3D bust to hide an asset gap.

No AI calls occur when opening dialogue. No database, care, identification or reward records change. The standalone source and scoped portrait files/assets are installed into the social worktree; unrelated social/furniture changes are preserved.

## Review performed

Produced and inspected native Maya and Trail rescuer expression sheets and cat coat sheets; measured actual exported files. No automated tests, type checks, builds or running-app/browser verification were run for this change, per the owner's instructions. Runtime behavior remains unverified in the browser.
