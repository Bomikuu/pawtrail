# Furniture outlines and batch authoring

Furniture now uses the character's thin dark-brown pixel contour. Source-painted
models preserve their interior RGB; the contour adds one native pixel in
`#2a1c17` / `#3a261d`. The table, side table and bookshelf also have physical
structural edge lines separating their tops, legs, shelves and book volumes.
The aquarium keeps its painted internal edges and receives the shared contour.
Couch and curtain already use the actor-style PixelFinish and do not receive a
second outer pass. Actors retain their own finisher.

The texture editor and production renderer use the same finish. Final exports
include refreshed opaque visible bounds; collision, seat/perch contracts,
rotation controls, source PNGs, prices and construction rules are retained.

| Item | New installed revision | Native PNGs |
| --- | --- | --- |
| Table | `4e917d0781de` | 24 |
| Side Table | `290c80d6dd7f` | 24 |
| Bookshelf | `78c316434804` | 24 |
| Aquarium | `b4a3203453bd` | 240 |

These are installed in the standalone game catalogs, housing service catalog
file and scoped main-app furniture records/assets. No running service restart,
inventory mutation or account operation was performed.

## Batch mode in the existing skill

The existing `pawtrail-furniture` skill now documents small reviewable batches,
valid shape/reference reuse, one reference review per batch, canonical-material
preview first, then a single final-material pass for changed items. It keeps the
owner's 2D review and actor-fit requirements.

Implemented commands:

```bash
node scripts/pawtrail-furniture.mjs render --ids table,side-table,bookshelf --preview
node scripts/pawtrail-furniture.mjs render --ids table,side-table,bookshelf --install
```

One Firefox/Vite session serves all IDs in a pass. The preview writes four facings
and two review angles for the first material, skipping extra colors, motion,
actor evidence and GLB. It never replaces final assets or catalogs. Full export
retains those outputs. Source-painted timber recoloring is memoized per style;
projected contacts are computed once per facing and reused across colors.

The CLI renders every supplied ID. Dependency-aware automatic cache skipping and
a contacts-only command are not implemented. The skill instructs selecting only
changed IDs, retaining valid versioned outputs and implementing a narrow metadata
operation when needed rather than repeatedly rendering unchanged pixels.

## Review scope

An isolated Firefox authoring session produced a four-item canonical preview,
followed by one full four-item export/install pass including source GLBs. Native
before/after artwork was inspected at integer zoom; see
`output/furniture/outline-2026-11-10/before-after.png`. Batch 1 facing, corner and
actor-scale boards were refreshed from the final exports.

No application tests, checks, builds or live browser/game verification were run.
The work does not establish a measured end-to-end speed improvement. There are
still 104 queued catalog IDs; this finish change does not convert another batch.
