# Living RPG expansion — 7 November 2026

The attached specification is preserved in `docs/requirements/cozy-rpg-brief.md`. This delivery expands the existing prototype rather than replacing it.

## Implemented first playable

- Three story chapters: Welcome to PawTrail, The Missing Kitten, and A Home for Every Paw. Explicit acceptance, ordered objectives, prerequisites, return conversations, reward claims, badges, and camera/journal/area unlocks.
- Five game-calendar daily quests, plus side, exploration, community, and weekly gathering content. Multiple active quests, unique-target counters, tracked objectives, and repeat-safe claims. Persistent earlier care/discoveries can satisfy later objectives without falsely completing a return conversation.
- Eight named animals with species, personality, food preference, story, fact, routine, trust, discovered location, and interaction history. Gradual daily-limited trust, shy avoidance, friendly approaches, following after care, resting, eating/drinking and reactions. Three volunteers have dialogue, relationships, and small phase-based walking schedules. A side quest has a friendship gate.
- Feed, pet, water, observe, play, condition notes, rescue, and photography. Photographs capture the rendered game world into a capped local album; they are not substituted profile pictures. Condition notes describe care needs without diagnosing.
- A neighborhood, shelter interior, unlockable hidden garden, and unlockable riverside. Pickup objects disappear after collection; upgraded stations and shelter areas visibly gain bowls, beds, plants, or flowers. The garden gate opens visually. A weekly kindness gathering adds flowers.
- An active-play game calendar, interpolated lighting, nighttime lamp glows, routines and ambient changes. One game minute takes roughly half a real second; menus pause the clock. Benches advance an hour and the shelter rest spot advances to morning without penalties.
- Actual procedural Web Audio: original arpeggiated music variants for neighborhood, park/garden, shelter and night; synthesized wind/water texture, birds/crickets, animal vocal cues, footsteps and action/reward sounds. This is synthesized sound design, not prerecorded instrument/animal audio or a finished studio soundtrack. It begins after user interaction, has four persisted volume channels and mute, and disposes when leaving the game.
- Journal categories, objective checklists, animal silhouettes/trust, inventory grid/categories, photo collection, map, typewriter dialogue/choices, progress notices, run, J/I/M shortcuts, and mobile joystick.
- Version-2 local saves, validated load/import/export, version-1 migration, capped photos/history, local Kibble/XP, achievements, projects and non-destructive confirmation before replacing/resetting progress.

## Application integration

`src/` in this workspace remains the editable game source and Vite development harness. `scripts/sync-game-to-app.mjs` installs it into the existing app's `src/features/neighborhood`, creates `src/app/(game)/play/page.tsx`, and copies only isolated runtime files under `public/pawtrail-game`. It does not copy the Vite shell or global stylesheet into the social app. Game theme tokens are scoped to the mounted game and reach portaled dialogs; leaving the game restores the normal app theme.

The application navigation registers `/play` and a Play PawTrail link. Client-only dynamic loading keeps Phaser and browser-only saves/audio out of server rendering. The game has a Community return link. Existing social features and unrelated pending edits were preserved.

The official shadcn layer supplies Button, Input, Dialog, Tabs, Slider, Switch, Progress, and Tooltip. Required controls were installed through CLI 4.23.0. Tailwind owns routine presentation. `phaser@3.90.0` is pinned in both applications.

## Validation and limits

The attached brief explicitly requested validation, superseding the earlier no-testing preference for the named gameplay systems. Targeted Node tests cover quest ordering, chains, simultaneous quests, reward idempotency, daily distinct targets/reset, trust/resource gates, interaction distance, movement normalization, paths/colliders, save round-trip/migration/rejection, clock/light continuity, audio settings, behavior and map data. TypeScript checks cover the standalone source and the integrated game feature; the existing app UI-boundary check covers the component boundary.

No production build or browser/playback/visual inspection was performed. These checks do not establish 60 FPS, subjective animation quality, audio mix quality, or complete hands-on quest playthroughs. Run the game in Firefox to review those. The old art packs are reused; no new NPC portrait/interior/audio recording pack is claimed. No production backend, cloud sync, multiplayer, real-world rescue verification, full-season content, outfit editor, or commercial-scale RPG campaign has been implemented. The first playable and extension systems are the scope here.

## Final check results

- `npm run test:game`: 14 tests passed.
- `npm run typecheck`: passed for the standalone source.
- Scoped TypeScript compilation of the integrated game feature and `/play` route: passed.
- Existing application `npm run check:ui`: passed.
- Development previews: existing application on port 3000, standalone harness on port 5173.
- Production builds and browser/audio/visual playthroughs: not run.
