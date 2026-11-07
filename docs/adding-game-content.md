# Adding PawTrail content

## Animal

1. Add an `AnimalProfile` in `src/game/data.ts` with a stable ID, one of the supplied sprite identities (or a new compatible atlas), personality, initial trust, routine coordinates, food, story and fact.
2. Add a Tiled Objects point with type `animal`, the same ID, `sprite`, `label`, description and optional `rescuable` flag. Edit the generator if you want the placement reproducible.
3. A new art atlas also needs its animation definitions in the source animation manifest and a portrait copied by `scripts/prepare-world.mjs`. The loader discovers animal identity textures from the data definitions. Keep 32×32 cells and the existing row convention.
4. Care/trust, discovery, journal and behavior consume the profile automatically. Add prerequisite gates through quest/object configuration rather than reward logic in the scene.

## Quest

Add a `QuestDefinition` to `QUESTS` in `src/game/data.ts`. Set category, objectives, optional giver/prerequisites/relationship, reward, XP, and optional badge/unlocks. Objectives accept a type, optional exact target or target allowlist, count, and distinct-target flag. `ordered: true` requires the next objective; a repeated conversation cannot complete both initial and return objectives at once.

```ts
{ id:'park-friends', title:'Friends by the pond', category:'side',
  description:'Share a meal with two park neighbors.', giver:'maya',
  prerequisites:['welcome'], reward:40, xp:20,
  objectives:[{type:'feed',targets:['tala','domino'],count:2,unique:true,
    text:'Feed Tala and Domino.'}] }
```

Events use `talk`, `interact`, `collect`, `area`, `feed`, `pet`, `water`, `observe`, `play`, `check`, `photo`, `rescue`, `clean` and `upgrade`. `emit()` in the progress facade dispatches them; the pure quest engine does not depend on Phaser. NPC quest IDs determine their available conversation choices. Daily IDs are namespaced by game day. Claiming is idempotent and unlocks prerequisites only after the reward is claimed.

## NPC dialogue

Add a profile to `NPCS`, with name/personality, daytime paragraphs, nighttime text, and offered quest IDs. Add an `npc` point to a map with the matching ID. A blank line creates a separate typewriter page. `talkNpc()` derives accept/claim choices and advances talk events; `DialogueChoice` supports transactional actions. NPCs currently reuse the single rescuer sheet, which can be replaced with compatible authored art.

## Sound effects and music

`src/game/systems/audio.ts` owns the original procedural audio. Add a named cue to `effect()` and call it from the interaction system or notification bridge. `tone()` schedules an oscillator/envelope through a chosen channel; never connect directly to the destination and bypass volume/mute. Background variants are selected by location and phase. AudioContext is created/resumed only after a user gesture and closed when the game unmounts.

To replace synthesis with licensed recordings, load actual buffers, retain provenance/license files, preserve channel routing, and provide a visual notification for important cues. Do not add a silent file reference and describe it as finished audio.

## Maps

Maps are Tiled JSON in `public/pawtrail-game/maps`, with `Ground`, `Collision`, and point-based `Objects` layers and 32px tiles. Sprite pictures are resolved through the named world manifest. Use the same terrain GID/atlas layout. Add an area ID to `SceneId`, a map preload entry, an entry position, and a `portal` object with `destination` and optional `requires` unlock. Most new objects/quests need no new scene branches.

`npm run assets:prepare` regenerates the four authored prototype maps and copies native assets; it overwrites map edits. Keep manually edited maps separately or update the generator. Portal entry and return positions are configured in the current scene orchestration; add a return point when extending the area list.

## Interactions and improvements

Objects use types such as `pickup`, `station`, `project`, `rest`, `clue`, and `portal`. Their properties include a stable ID, sprite name, item/amount, project ID, destination or unlock requirement. Add projects to `PROJECTS`, including costs; the progress facade validates affordability and completion before spending. Add their visible changes to `refreshWorld()` or an extracted decoration renderer.

For a new animal action, extend `CareAction` and its rule in `systems/care.ts`, expose an accessible shadcn action, choose an existing compatible animation or supply new art, and dispatch its event. Maintain proximity validation in the scene and resource/reward validation in the pure system. All positive care is limited per animal/action/game day; trust never jumps straight to maximum.

## Validation and integration

Run `npm run test:game` and `npm run typecheck` for the scoped systems, when authorized. `npm run sync:app` installs current source and prefixed assets into the existing PawTrail Next app at `/play`; it does not build or publish. Keep generated feature copies in sync after editing this workspace. The standalone preview is port 5173; the application preview is port 3000.
