# Phase 1 verification — 2026-11-15

**Authorization:** the owner replied **“Yes—run focused tests and typecheck”**
to the scoped request covering the new floor foundations. This did not authorize
a browser session, build, broad regression run or new asset generation.

## Observed results

- `node --import tsx --test tests/floor-foundation.test.ts`: **7 passed, 0 failed**.
- Strict TypeScript check of `state.ts`, `neon-foundation.ts`, `store.ts`,
  `travel.ts`, `animation-clock.ts`, `prop-renderer.ts` and imported dependencies:
  **exit 0** after the fixes below.

Typecheck command:

```bash
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --resolveJsonModule --esModuleInterop --skipLibCheck --types vite/client,node src/game/floors/state.ts src/game/floors/neon-foundation.ts src/game/floors/store.ts src/game/floors/travel.ts src/game/floors/animation-clock.ts src/game/floors/prop-renderer.ts
```

The tests cover exclusive allocation, public memory and signed scores, reload
and repeat rewards, failed costs/event mismatches, concurrent stores with stale
revisions, invalid/unsupported/failed saves, slot isolation, installed/gated
travel and paused/reduced-motion clocks. Concurrent tests use an injected
serialized lock, not a real browser/Web Locks observation.

## Fixes from the scoped check

The new store's Web Locks wrapper needed explicit promise flattening for the DOM
library's generic callback signature. The final wrapper awaits the browser's
lock request and preserves the `Promise<T>` contract.

Two existing direct furniture dependencies surfaced strict type errors:

- `src/game/furniture/aquarium.ts`: validate the texture image's width/height
  before using the formerly unknown image shape for UV dimensions.
- `src/game/furniture/model.ts`: use the existing fallback power of 4 when a
  calibration exposes an optional undefined `blendPower`.

These edits change no artwork, native dimensions or approved furniture geometry.
No type-error suppression was added. The affected foundation tests passed again;
the final scoped typecheck passed. No unrelated test suite was run.

## Remaining observations

No build or browser verification was requested/run. Actor fit, live prop
whole/foreground depth, native alpha, all facing/seat/rotation interactions,
real browser locking/storage behavior and actual memory/performance remain
pending. The floor source modules are isolated from existing routes; the current
Neon Heights preview is not replaced or presented as the new playable floor.
Concepts A/B/C are approved art-direction evidence, not proof of animation or
gameplay. Asset/layout production is the next distinct phase.
