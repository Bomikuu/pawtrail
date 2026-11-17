# Sofa upholstery in the editor and live game

The original two-seat `sofa` now uses the existing indexed upholstery masks in the
furniture editor and the live housing renderer. Wood, pillows/motifs, brown contours,
alpha, contacts and seat geometry keep their source values. Other sofa IDs do not
inherit this mask. No new color-variant sprite files are generated.

## Editor

Open `/play?preview=furniture&asset=sofa`. The upholstery control supports presets,
picker, six-digit hex and original-color restoration. Four authored views are
available through quarter-turn controls and the above-item rotation button.
Color choices automatically save to `pawtrail:sofa-upholstery:v1` on this device;
newly placed sofas read this preference, while existing placements keep their own
colors. Storage failures are shown instead of reporting a successful save.

The paint surface stays independent from the palette projection. Explicit brush
edits override the projection on edited pixels. Texture packages keep the optional
`upholsteryColor` as metadata and save underlying surfaces without baking the
palette into new images. Old packages remain valid and restore original upholstery
unless they contain a supported color value. Local authoring preferences/packages
do not mutate a player's existing room.

## Live game and persistence

In Decorate, select a sofa and change Upholstery color, then Save arrangement.
Color-only edits of an existing stationary sofa enter draft/undo history immediately.
Save arrangement commits a valid outstanding preview before sending the current
layout; an invalid preview blocks saving rather than silently dropping the color.
Cancel retains the saved room. Each sofa placement has its own optional
`upholsteryColor`; original-color restore removes the override.

Housing validates `#[0-9a-fA-F]{6}` only for the original `sofa`, lowercases it,
and persists it inside the existing database JSON layout. Existing authenticated
ownership/decorator, inventory, in-use, revision and layout constraints still apply.
State refresh/reconnect/room visitors receive the saved placement data through
the existing full layout response. No schema migration is required.

Phaser allocates two reusable body/foreground GPU canvas textures per colored sofa,
with independent native palette buffers. It refreshes textures only when color or
facing changes. Ghost textures have a separate slot. Removing a sofa, restoring
original color and scene cleanup release unused textures; installed source textures
are never mutated. Body and foreground use the same palette and nearest filtering.

## Delivery scope

Only the changed frontend modules were mirrored to the main app's neighborhood
feature. The additional backend whitelist/validation was applied separately to
its standalone game backend, preserving its existing bounds implementation.
The Furniture skill now documents live persistence and local preferences.
The local housing service was started on port 8001 directly through Daphne; this
change adds no migrations and the startup did not run migrations or seed records.

## Firefox findings and regression coverage

The owner subsequently requested editor/live-game verification. The editor passed
native pixel comparisons in all four views, custom/invalid hex input and local
save/reload. A private database fixture (`qa:sofa-palette:20261111`) provides two
sofas; the account assertion is supplied by the test harness, while housing
exchange, HTTP layout saves/state refresh, WebSocket interactions and database
persistence are real. No existing member arrangement was changed.

Blue (`#376db7`) and rose (`#b86a82`) survived full Firefox reloads independently,
including rotation values. Framebuffer comparisons in identical lighting found
zero differences in protected pixels for all four views; only the indexed fabric
pixels differed (1523 / 813 / 1704 / 770 pixels). This comparison also avoids
mistaking global day/night lighting for a material change.

The live visual pass exposed and fixed two issues:

- The room render signature now includes decoration/play mode. Leaving decoration
  recreates the foreground arms/backrest even when the placement JSON stays equal.
  This fixes a seated actor drawing in front of furniture after a save/cancel.
- Authoritative contact facing is passed separately to the actor renderer and
  cleared on release. The seat heading takes priority over the last walking heading;
  ordinary movable cosmetic emotes retain their movement behavior.

Focused regression tests passed: five palette/source invariants, four real layout
API/database tests in an isolated test database, and three contact-facing tests.
After both fixes, Firefox passed eight sit/stand cases (both sofas in all four
directions), with the expected server-confirmed seat positions and headings.
The final visual board shows restored arm/backrest occlusion and matching actor
facing. A transient session reconnect obscured one capture; it was retaken after
reconnection. A direct database read confirmed blue/rose colors at revision 14,
with the two sofas independently rotated to 180° and 270°.
The server also correctly rejected rotation while the actor overlapped a placement;
walking clear allowed the save. Occupancy protection was preserved.

The repository UI registry check reports existing raw-control violations in
`actor-preview-reference.tsx`, `character-creator-editor.tsx` and
`maya-portrait-comparison.tsx`. Those unrelated files were left untouched.
No production build, mobile sweep or unrelated furniture/actor visual review ran.
Artifacts are under `output/playwright/sofa-palette-live/`.
See `verification.json`, `database-after.json`,
`rendered-materials-all-facings.json` and `sitting-all-facings.png` there.
