import fs from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  freshProgress,
  parseSave,
  validProgress,
} from '../src/game/systems/save'
import {
  acceptQuest,
  advanceQuests,
  claimQuest,
  questState,
  reconcileFacts,
} from '../src/game/systems/quests'
import {
  careProgress,
  careReason,
  interactionAllowed,
} from '../src/game/systems/care'
import { advanceTime, dayPhase, lighting } from '../src/game/systems/time'
import { audioPreferences } from '../src/game/systems/audio'
import { chooseBehavior, movementVector } from '../src/game/systems/behavior'
import { findPath } from '../src/game/pathfinding'
import { QUESTS, ANIMALS } from '../src/game/data'

test('welcome objectives advance in order, including a separate return conversation', () => {
  let p = acceptQuest(freshProgress(), 'welcome')
  p = advanceQuests(p, { type: 'feed', target: 'mango' })
  assert.deepEqual(p.quests.welcome.counts, [0, 0, 0, 0, 0])
  for (const [type, target] of [
    ['talk', 'maya'],
    ['interact', 'feeding-station'],
    ['collect', 'foodBowl'],
    ['feed', 'mango'],
  ])
    p = advanceQuests(p, { type, target })
  assert.equal(p.quests.welcome.state, 'active')
  assert.equal(p.quests.welcome.counts[4], 0)
  p = advanceQuests(p, { type: 'talk', target: 'maya' })
  assert.equal(p.quests.welcome.state, 'completed')
  const paid = claimQuest(p, 'welcome')
  assert.equal(paid.kibble, 100)
  assert.ok(paid.unlocks.includes('journal'))
  assert.ok(paid.unlocks.includes('garden'))
  assert.equal(claimQuest(paid, 'welcome'), paid)
})
test('prerequisites lock story chapters and support multiple active quests', () => {
  let p = freshProgress()
  assert.equal(acceptQuest(p, 'missing-kitten'), p)
  p.quests.welcome = {
    state: 'claimed',
    counts: [1, 1, 1, 1, 1],
    unique: [[], [], [], [], []],
    day: 1,
  }
  p = acceptQuest(p, 'missing-kitten')
  p = acceptQuest(p, 'shelter-home')
  assert.equal(p.quests['missing-kitten'].state, 'active')
  assert.equal(p.quests['shelter-home'].state, 'active')
})
test('daily objectives require distinct targets and reset by game day, not wall time', () => {
  let p = acceptQuest(freshProgress(), 'daily-meals')
  p = advanceQuests(p, { type: 'feed', target: 'mango' })
  p = advanceQuests(p, { type: 'feed', target: 'mango' })
  assert.equal(p.quests['daily-meals@1'].counts[0], 1)
  p = advanceQuests(p, { type: 'feed', target: 'pip' })
  assert.equal(p.quests['daily-meals@1'].state, 'completed')
  p = advanceTime(p, 1440)
  assert.equal(
    questState(
      p,
      QUESTS.find((q) => q.id === 'daily-meals')!,
    ),
    'available',
  )
  p = acceptQuest(p, 'daily-meals')
  assert.equal(p.quests['daily-meals@2'].counts[0], 0)
})
test('care spends resources once per game day and trust increases gradually', () => {
  const p = freshProgress(),
    fed = careProgress(p, 'feed', 'mango')
  assert.equal(fed.inventory.food, 9)
  assert.equal(fed.animals.mango.trust, 23)
  assert.equal(fed.kibble, 5)
  assert.equal(careProgress(fed, 'feed', 'mango'), fed)
  const next = careProgress(advanceTime(fed, 1440), 'feed', 'mango')
  assert.equal(next.inventory.food, 8)
  assert.equal(next.animals.mango.trust, 31)
})
test('shy animals and rescues respect trust and inventory gates', () => {
  let p = freshProgress()
  assert.match(careReason('pet', 'sombra', p)!, /shy/)
  assert.match(careReason('rescue', 'mango', p)!, /30 trust/)
  for (const action of ['feed', 'water', 'pet'] as const)
    p = careProgress(p, action, 'mango')
  assert.equal(careReason('rescue', 'mango', p), null)
  p = careProgress(p, 'rescue', 'mango')
  assert.ok(p.rescued.includes('mango'))
  assert.equal(p.inventory.firstAid, 2)
})
test('movement normalizes diagonals and interaction range is enforced', () => {
  assert.equal(
    Math.round(Math.hypot(...Object.values(movementVector(1, 1)))),
    105,
  )
  assert.equal(
    Math.round(Math.hypot(...Object.values(movementVector(1, 1, true)))),
    155,
  )
  assert.ok(interactionAllowed({ x: 0, y: 0 }, { x: 68, y: 0 }))
  assert.ok(!interactionAllowed({ x: 0, y: 0 }, { x: 69, y: 0 }))
})
test('pathfinding routes around walls and does not cross blocked cells', () => {
  const blocked = new Set(['3,1', '3,2', '3,3'])
  const route = findPath({ x: 48, y: 48 }, { x: 176, y: 48 }, 8, 8, blocked)
  assert.ok(route.length > 0)
  assert.ok(
    route.every(
      (p) => !blocked.has(Math.floor(p.x / 32) + ',' + Math.floor(p.y / 32)),
    ),
  )
  assert.ok(route.some((p) => p.y >= 144))
})
test('save round-trip and version-one migration preserve earned progress', () => {
  const p = freshProgress()
  assert.ok(validProgress(JSON.parse(JSON.stringify(p))))
  const legacy = {
    version: 1,
    kibble: 70,
    inventory: { food: 5, water: 4, firstAid: 2 },
    completed: ['quest:hello-mango', 'mango:feed'],
    discovered: ['mango'],
    rescued: [],
    visitedShelter: false,
    position: { x: 928, y: 800, scene: 'neighborhood' },
  }
  const next = parseSave(legacy)!
  assert.equal(next.version, 2)
  assert.equal(next.kibble, 70)
  assert.equal(next.quests.welcome.state, 'claimed')
  assert.ok(next.unlocks.includes('camera'))
  assert.equal(parseSave({ version: 2, kibble: -1 }), null)
})
test('save validation rejects broken quests and invalid resources', () => {
  const p = freshProgress()
  assert.equal(
    validProgress({ ...p, inventory: { ...p.inventory, food: -1 } }),
    false,
  )
  assert.equal(
    validProgress({
      ...p,
      quests: { bad: { state: 'active', counts: ['bad'], unique: [], day: 1 } },
    }),
    false,
  )
})
test('clock crosses midnight safely and light changes continuously', () => {
  const p = advanceTime({ ...freshProgress(), minute: 1439 }, 2)
  assert.equal(p.day, 2)
  assert.equal(p.minute, 1)
  assert.equal(dayPhase(1300), 'night')
  assert.ok(Math.abs(lighting(1110).alpha - lighting(1111).alpha) < 0.01)
})
test('audio preferences clamp channels and reject malformed values', () => {
  const p = audioPreferences({
    master: 9,
    music: -2,
    effects: NaN,
    ambient: 0.3,
    muted: true,
  })
  assert.equal(p.master, 1)
  assert.equal(p.music, 0)
  assert.equal(p.effects, 0.45)
  assert.equal(p.muted, true)
})
test('personalities distinguish avoiding, following, and nighttime rest', () => {
  assert.equal(
    chooseBehavior(ANIMALS[1], 0, 'morning', 40, true, false),
    'avoid',
  )
  assert.equal(
    chooseBehavior(ANIMALS[5], 30, 'morning', 90, false, true),
    'follow',
  )
  assert.equal(
    chooseBehavior(ANIMALS[0], 20, 'night', 140, false, false),
    'sleep',
  )
})

test('earlier care does not trap an ordered quest, but returning still needs a fresh conversation', () => {
  let p = acceptQuest(freshProgress(), 'welcome')
  p = { ...p, completed: ['mango:feed'] }
  for (const [type, target] of [
    ['talk', 'maya'],
    ['interact', 'feeding-station'],
  ])
    p = advanceQuests(p, { type, target })
  p = { ...p, inventory: { ...p.inventory, foodBowl: 1 } }
  p = reconcileFacts(p)
  assert.deepEqual(p.quests.welcome.counts, [1, 1, 1, 1, 0])
  assert.equal(p.quests.welcome.state, 'active')
})

test('all four Tiled maps have consistent layers, colliders and existing object art', () => {
  const manifest = JSON.parse(
    fs.readFileSync('assets/pixel-art-v1/manifest.json', 'utf8'),
  )
  for (const area of ['neighborhood', 'shelter', 'garden', 'riverside']) {
    const map = JSON.parse(
      fs.readFileSync('public/pawtrail-game/maps/' + area + '.json', 'utf8'),
    )
    assert.equal(map.layers[0].data.length, map.width * map.height)
    assert.equal(map.layers[1].data.length, map.width * map.height)
    for (const o of map.layers[2].objects) {
      const props = Object.fromEntries(
        o.properties.map((p: { name: string; value: unknown }) => [
          p.name,
          p.value,
        ]),
      )
      if (props.sprite && o.type !== 'animal')
        assert.ok(
          ['environment', 'buildings', 'items'].some(
            (sheet) => manifest.sprites[sheet + '/' + props.sprite],
          ),
          String(props.sprite),
        )
    }
  }
})
