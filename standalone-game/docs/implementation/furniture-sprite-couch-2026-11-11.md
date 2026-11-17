# Furniture workflow choice and 2D couch pilot

The furniture skill now asks whether an unspecified request/batch should use
**3D + 2D renders** or **2D sprites only**. An accepted workflow is reused for its
agreed scope. Silence never chooses the representation. The existing 60-second
default applies only to generated artwork review. Reusing unchanged source art
needs no generated turnaround or additional art approval.

The owner accepted the proposed 2D couch workflow. Its local preview is:

`http://127.0.0.1:3000/play?compare=furniture&asset=sofa&representation=sprite`

## Installed artwork and contacts

- The original `sofa` remains the canonical 64×64 PNG with anchor `[32,60]` and
  source SHA-256 `f729133fb6df0563c4678ee43a58b8b30dd9284bf92708faa3b3feb6b7ebd43d`.
- Revision `3da32c935d98` adds an arms-only foreground mask copied from exact
  original RGBA pixels. No furniture mesh, generated reference or repaint.
- Collision/placement is `[5,43,54,17]`. Seats are `[22,57]` and `[42,57]`,
  facing down with elevation 8; their clear front exits are `[22,74]` and
  `[42,74]`. The existing cat surface metadata is preserved.
- Original IDs, price, artwork, inventory and saved placements are retained.
  The sprite is explicitly front-only. Existing `studio-couch` and the other
  eight authored models remain installed and distinct.
- The shared room renderer now loads original-sprite foreground layers, not
  only generated-model foregrounds. Client and backend sofa catalogs carry
  the same contact geometry.

`scripts/prepare-sprite-couch.py` reproduces the mask/manifest and selected sofa
records after verifying the source checksum. The manifest is under
`assets/furniture-studio/sprites/sofa/manifest.json` and the public foreground is
under `public/pawtrail-game/furniture-sprites/sofa/3da32c935d98/`.

## Interaction preview

`SpriteCouchTrial` composes original artwork, native foreground and actual creator
actors. It reuses `StagePlaytest`, `InteractionController`, collision/navigation
and shared actor sitting animations. The actor stays at its native scale; using
an existing actor rig does not require a furniture model.

The two preview actors share a local seat reservation map. An occupied seat is
rejected before cancelling the actor's current seat. Standing, cancellation,
reset and disposal release owned reservations. Walking uses the normal furniture
foot collision; seated actors dock to their seat and safe exit. The foreground
draws above seated actors and below characters standing in front of the couch.

The furniture editor's sofa Interaction preview opens this trial. The comparison
page also offers a 2D couch trial button and a return to the existing model view.
Texture editor drafts remain local and are not applied by this interaction trial.

## Firefox review performed

Focused Firefox checks covered:

- Sitting in each seat individually and both seats together.
- Occupied seat rejection while retaining both current occupants.
- Stand and E-key sit/stand releasing the correct seat.
- Reset/reload clearing local occupants.
- Keyboard and held on-screen movement stopping at `Contact: Sofa`.
- Seat action cancellation releasing its reservation.
- 320px mobile layout: document width 320px, content width 320px; both seats work.
- Sofa editor → interaction preview and return to the model comparison.

Native composition was visually inspected: two unscaled actors fit the original
seat cushions without crossing the couch arms. Review artifacts are under
`output/playwright/sprite-couch-*`. No application console errors were reported
in the focused trial session. The initial headed Firefox session stalled on
automation stability waits; the completed checks used isolated headless Firefox.

These are local contact/visual checks. They do not verify authenticated room
transactions, server seat concurrency or disconnect behavior. No database
accounts, balances or live placements were created. No general test suite,
type check or production build was run.

## Queue

The sofa is recorded as an installed interactive 2D pilot, not a new converted
3D model. The 23 remaining earlier model recommendations await representation
choice; the 20 existing sprite interaction tasks remain queued. Nine authored
models and 57 deferred sprite items are preserved. No further batch was started.

## Four-view follow-up

Revision `3917ae976060` completes front/left/back/right sprites, reusing the accepted
2D turnaround pixels for the missing directions. The front PNG is unchanged.
Per-facing contacts and foregrounds, depth ordering and the circular above-item
rotation control keep both actors seated while turning. One focused Firefox
pass reviewed every facing, standing/re-sitting and collision; a rear seat-height
correction was visually rechecked. No new mesh, generated artwork, accounts or
broad test run. See the current sprite manifest for the final review record.
