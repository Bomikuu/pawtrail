# Furniture creator and Trail couch

The owner requested a furniture equivalent of the actor workflow: inspect existing 2D art, author a 3D model, reuse native pixel output in the game, connect sitting actors, support facing/color edits and allow build time or recipe materials. The first installed example is `studio-couch`, labeled **Trail couch**. Existing sofas and saved placements remain unchanged.

## Where to use it

- Creator: `http://127.0.0.1:3000/play?preview=furniture`, also available in the game location menu as Furniture creator.
- Live item: My house → Decorate → Shop, then search **Trail couch**. Buy now, start a timed build or use the materials recipe. Collect a completed build, then place the owned couch.
- Edit: select the couch, use Rotate left/right or R and choose Sage, Terracotta or Oat. The above-object indicator shows the current facing/angle. Save the arrangement through the existing decoration flow.
- Interact: leave decoration mode and select the placed couch → Sit down. The existing server interaction service reserves one of two seats and drives the actual player pose. Stand/move/cancel uses its normal recovery flow.

## Authoring and native assets

The original `/assets/game/housing/furniture/sofa-housing-v1.png` supplies the visual reference: sage upholstery, two cushions, rounded arms, timber base and a light pillow. The authored furniture model owns its mesh parts, materials and two named `seat-1`/`seat-2` attachment nodes. It does not create an actor appearance or modify the actor skeleton/actions.

`src/game/furniture/model.ts` owns the couch, fixed orthographic camera and projected contacts. `renderer.ts` uses the actor creator's exported `PixelFinish` with the same camera pitch and native shading treatment. The creator demonstrates the shared rescuer's real Sit/Stand pose at the couch's sockets. Its preview is a native-pixel view of the 3D authoring scene.

The production command is:

```bash
node scripts/pawtrail-furniture.mjs render --id studio-couch
node scripts/pawtrail-furniture.mjs render --id studio-couch --install
```

It uses a private Firefox/Vite authoring session on port 5184 and closes that session on completion. The exporter waits for its entry module to be ready before requesting output. `--install` merges only the matching item into the frontend/backend catalogs. It never places an item in a player's home or grants inventory.

The current revision is `bb9f444b674e`: 24 transparent PNGs, comprising base and foreground layers for four facings and three colors, with an 80×96 cell and floor anchor (40,80). The source GLB, four seated contact illustrations and manifest are in `assets/furniture-studio/exports/studio-couch/`. Runtime images/metadata live under `public/pawtrail-game/furniture-studio/studio-couch/<revision>/`; `src/game/furniture/generated.json` records the current export and reference provenance.

Seat sockets are at x=-13/+13, y=8.5, z=10.5 in authoring units. Docking uses the shared Sit pose's 5.8-unit hip height. Projected root/elevation, approaches, floor collision and facing-specific indicator height are derived together. The front approach stays outside the couch footprint; characters do not approach a seat through the backrest.

## Runtime contracts

`furnitureAt(placement)` and the server `definition(piece)` select native view-dependent dimensions, anchors and geometry before navigation or interaction. Already-projected view geometry is not rotated a second time in 2D. Artwork uses authored texture keys rather than `.setAngle` on a flat couch. A persisted, allowlisted `style` changes colors while retaining the same inventory item ID.

Front aprons/near arms and the rear backrest have separate foreground layers. Their depth follows the couch ground depth, with the reserved seated actor between base and foreground. Pixel-perfect input ignores the model canvas's transparent padding. The pose facing is passed to both local and remote actors; native and personal actor renderers keep their existing action libraries.

The layout service rejects moving, rotating, styling or removing furniture with an active server interaction. Existing seat leases, membership checks, revisions and action recovery remain authoritative. Old five-field placements still validate; a style field is optional and must name a catalog style.

## Construction

The installed example supports:

- Instant purchase: 79 Game Kibble, immediate owned inventory.
- Timed build: 79 Game Kibble and 60 seconds.
- Recipe build: 6 timber, 4 fabric and 2 stuffing, with 60 seconds.

Missing materials are purchased through the existing game supplies store, with server-priced bounded quantities. `FurnitureBuild` stores the owned job, ready time, charged cost/material snapshot and collection time. Start/claim operations run inside the existing idempotent, player-locked housing mutation transaction. Collection also locks the job and grants inventory once; client time and progress bars never grant items. Uncollected jobs are limited to ten.

The optional `construction` catalog metadata is server-owned. The creator lets the owner preview/edit build time and materials in a device-local authoring draft and export JSON; it does not change live rules through browser input. Applying a new design goes through the furniture skill and exporter. Build progress retains the bootstrap's client receipt timestamp so reopening a menu does not restart the displayed countdown.

Migration `housing.0013_furniture_builds` was applied to the actual local housing environment using its existing private process environment and `migrate --noinput --skip-checks`. No game balances or fixtures were created to exercise the feature. This service's game inventory/currency remains separate from verified social-platform rewards.

## Skill and integration

The installed skill is `/home/micxsz/.codex/skills/pawtrail-furniture/SKILL.md`, with a focused production reference and Codex UI metadata. It documents references, source modules, model/socket contracts, facings, colors, foregrounds, construction, export and scoped installation.

The main application received only the new furniture modules/assets, one merged catalog item and targeted housing/navigation changes. Existing actor, map and social work was preserved. The shared official shadcn registry was composed without adding substitute primitives or changing registry sources. Existing game typography, action shapes and palette remain the design system.

## Review scope

Furniture art was produced in Firefox and the two source seated contact illustrations were inspected. Source review covered the paired client/server geometry resolution, style ownership, actor facing, foreground depths, active-seat edit guard, resource deductions, claim idempotency and receipt-based time display. These are production-art/source observations, not a runtime game interaction result.

Under the standing workspace instruction, no automated application tests/checks, builds, game browser verification or automated skill validator were run. No end-to-end or concurrency pass is claimed. The private authoring export's module-readiness race was corrected and the export completed afterward.
