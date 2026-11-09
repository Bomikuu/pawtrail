import fs from 'node:fs/promises'
import path from 'node:path'
const root = process.cwd(),
  out = path.join(root, 'public/pawtrail-game/game-assets')
await fs.mkdir(out, { recursive: true })
for (const [source, dest] of [
  ['assets/pixel-art-v1/manifest.json', 'world-manifest.json'],
  ['assets/animation-pack-v1/manifest.json', 'animation-manifest.json'],
])
  await fs.copyFile(source, path.join(out, dest))
for (const name of ['terrain', 'buildings', 'environment', 'items'])
  await fs.copyFile(
    `assets/pixel-art-v1/native/${name}.png`,
    path.join(out, name + '.png'),
  )
for (const name of [
  'rescuer',
  'orange_tabby',
  'black_cat',
  'white_cat',
  'calico',
  'siamese',
  'brown_aspin',
  'white_puppy',
  'spotted_dog',
])
  await fs.copyFile(
    `assets/animation-pack-v1/native/${name}.png`,
    path.join(out, name + '.png'),
  )
const manifest = JSON.parse(
  await fs.readFile('assets/pixel-art-v1/manifest.json', 'utf8'),
)
const tile = (id) => {
  const f = manifest.sprites['terrain/' + id]
  return (f.y / 32) * 16 + f.x / 32 + 1
}
function makeMap(width, height, inside = false) {
  const ground = [],
    blocked = new Set(),
    paths = new Set(),
    pond = new Set(),
    objects = []
  const key = (x, y) => x + ',' + y
  const object = (type, x, y, properties = {}) =>
    objects.push({
      id: objects.length + 1,
      name: properties.id || type,
      type,
      x: x * 32,
      y: y * 32,
      width: 0,
      height: 0,
      rotation: 0,
      visible: true,
      point: true,
      properties: Object.entries(properties).map(([name, value]) => ({
        name,
        type:
          typeof value === 'boolean'
            ? 'bool'
            : typeof value === 'number'
              ? 'float'
              : 'string',
        value,
      })),
    })
  if (!inside) {
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        if ((y >= 18 && y <= 20) || (x >= 30 && x <= 32)) paths.add(key(x, y))
        if (x >= 43 && x <= 51 && y >= 26 && y <= 31) pond.add(key(x, y))
        if (
          x === 0 ||
          y === 0 ||
          x === width - 1 ||
          y === height - 1 ||
          pond.has(key(x, y))
        )
          blocked.add(key(x, y))
      }
    for (const [sprite, x, y, label, enter] of [
      ['cozy_house', 9, 11, 'Tala’s home', false],
      ['veterinary_clinic', 20, 11, 'Neighborhood vet', false],
      ['pet_supply_shop', 32, 11, 'Pet supplies', false],
      ['rescue_shelter', 46, 11, 'PawTrail shelter', true],
      ['sari_sari_store', 9, 27, 'Sari-sari store', false],
      ['mint_house', 23, 34, 'Mint house', false],
      ['coral_house', 39, 37, 'Coral house', false],
      ['resting_pavilion', 52, 23, 'Quiet pavilion', false],
      ['bamboo_house', 55, 37, 'Bamboo house', false],
    ]) {
      object('building', x, y, { sprite, label, enter })
      for (let yy = y; yy <= 18; yy++) paths.add(key(x, yy))
    }
    const animals = [
      [
        'mango',
        'orange_tabby',
        27,
        24,
        'Mango',
        'A hungry little explorer. A meal and a gentle hello will help.',
        true,
      ],
      [
        'sombra',
        'black_cat',
        20,
        16,
        'Sombra',
        'Prefers a slow approach and a quiet corner.',
        false,
      ],
      [
        'cloud',
        'white_cat',
        37,
        23,
        'Cloud',
        'Watching the neighborhood go by.',
        false,
      ],
      [
        'patch',
        'calico',
        42,
        34,
        'Patch',
        'A curious cat with a loud purr.',
        false,
      ],
      [
        'miso',
        'siamese',
        12,
        32,
        'Miso',
        'A careful observer who appreciates company.',
        false,
      ],
      [
        'tala',
        'brown_aspin',
        51,
        18,
        'Tala',
        'A friendly Aspin keeping an eye on the park.',
        false,
      ],
      [
        'pip',
        'white_puppy',
        28,
        32,
        'Pip',
        'Needs a safe place to rest. Build trust before helping.',
        true,
      ],
      [
        'domino',
        'spotted_dog',
        40,
        9,
        'Domino',
        'Ready to meet another friend.',
        false,
      ],
    ]
    for (const [id, sprite, x, y, name, description, rescuable] of animals)
      if (id !== 'cloud')
        object('animal', x, y, {
          id,
          sprite,
          label: name,
          description,
          rescuable,
        })
    object('npc', 29, 22, {
      id: 'maya',
      label: 'Maya',
      dialogue:
        'Welcome to Sampaguita! Mango is near the path. Offer some food, say hello, then help him reach the shelter. There’s no rush — kindness works best at their pace.',
    })
    object('npc', 46, 14, {
      id: 'jo',
      label: 'Jo',
      dialogue:
        'The shelter is just behind me. We have a quiet resting area and supplies inside. Visit whenever you need a hand.',
    })
    object('supplies', 31, 23, {
      id: 'starter-box',
      sprite: 'supply_box',
      label: 'Care supplies',
    })
    for (let y = 2; y < height - 2; y += 3)
      for (let x = 2; x < width - 2; x += 3) {
        if (
          paths.has(key(x, y)) ||
          pond.has(key(x, y)) ||
          (x > 24 && x < 35 && y > 20 && y < 27)
        )
          continue
        if (objects.some((o) => Math.hypot(o.x - x * 32, o.y - y * 32) < 135))
          continue
        const seed = (x * 73 + y * 97) % 17
        const sprite =
          seed < 7
            ? ['small_tree', 'large_tree', 'palm', 'flowering_tree'][seed % 4]
            : seed < 11
              ? ['round_bush', 'leafy_shrub'][seed % 2]
              : [
                  'pink_flowers',
                  'yellow_flowers',
                  'white_flowers',
                  'rocks',
                  'garden_pot',
                ][seed % 5]
        object('prop', x, y, { sprite, solid: seed < 11 || sprite === 'rocks' })
      }
    for (const [sprite, x, y] of [
      ['wooden_bench', 40, 24],
      ['wooden_bench', 54, 26],
      ['street_lamp', 29, 17],
      ['street_lamp', 34, 22],
      ['cat_feeding_station', 17, 23],
      ['water_bowl', 18, 24],
      ['dog_house', 49, 35],
      ['wooden_sign', 26, 22],
      ['mailbox', 10, 12],
      ['trash_bin', 11, 27],
      ['flowering_tree', 24, 26],
      ['large_tree', 35, 26],
    ])
      object('prop', x, y, { sprite, solid: !sprite.includes('bowl') })
  } else {
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        if (x < 1 || y < 3 || x >= width - 1 || y >= height - 1)
          blocked.add(key(x, y))
    object('exit', 12, 15, {
      id: 'shelter-exit',
      label: 'Return to the neighborhood',
    })
    object('npc', 9, 7, {
      id: 'lina',
      label: 'Lina',
      dialogue:
        'You made it! Every animal deserves time, food, and a safe place to rest. If you helped Mango or Pip, they can settle in here. Take a breath — you’re part of their story now.',
    })
    object('supplies', 17, 7, {
      id: 'shelter-box',
      sprite: 'supply_box',
      label: 'Shelter supply cupboard',
    })
    for (const [sprite, x, y] of [
      ['round_bed', 5, 7],
      ['rectangular_bed', 5, 10],
      ['round_bed', 19, 10],
      ['rectangular_bed', 19, 13],
      ['water_bowl', 7, 7],
      ['food_bowl', 7, 10],
      ['wooden_bench', 13, 5],
      ['garden_pot', 3, 5],
      ['garden_pot', 21, 5],
      ['cat_feeding_station', 3, 12],
      ['dog_kennel', 21, 7],
    ])
      object('prop', x, y, {
        sprite,
        solid: !sprite.includes('bowl') && !sprite.includes('bed'),
      })
  }
  const extras = inside
    ? [
        [
          'project',
          5,
          10,
          {
            id: 'shelter-beds',
            label: 'Prepare resting areas',
            sprite: 'rectangular_bed',
            project: 'shelter-beds',
          },
        ],
        [
          'project',
          18,
          13,
          {
            id: 'shelter-garden',
            label: 'Shelter garden',
            sprite: 'garden_pot',
            project: 'shelter-garden',
          },
        ],
        [
          'rest',
          12,
          6,
          {
            id: 'shelter-rest',
            label: 'Rest until morning',
            sprite: 'round_bed',
          },
        ],
      ]
    : [
        [
          'station',
          17,
          23,
          {
            id: 'feeding-station',
            label: 'Neighborhood feeding station',
            sprite: 'cat_feeding_station',
          },
        ],
        [
          'pickup',
          18,
          23,
          {
            id: 'first-bowl',
            label: 'A clean food bowl',
            sprite: 'food_bowl',
            item: 'foodBowl',
            amount: 1,
          },
        ],
        [
          'station',
          40,
          24,
          { id: 'park-water', label: 'Park water bowl', sprite: 'water_bowl' },
        ],
        [
          'station',
          11,
          28,
          {
            id: 'market-water',
            label: 'Market water bowl',
            sprite: 'water_bowl',
          },
        ],
        [
          'pickup',
          53,
          24,
          {
            id: 'lost-toy',
            label: 'A lost toy',
            sprite: 'mouse_toy',
            item: 'toy',
            amount: 1,
          },
        ],
        [
          'pickup',
          15,
          31,
          {
            id: 'alley-token',
            label: 'A hidden paw token',
            sprite: 'kibble_coin_0',
            item: 'token',
            amount: 1,
          },
        ],
        [
          'portal',
          12,
          34,
          {
            id: 'garden-gate',
            label: 'The hidden garden',
            sprite: 'fence_gate',
            destination: 'garden',
            requires: 'garden',
          },
        ],
        [
          'portal',
          56,
          25,
          {
            id: 'river-gate',
            label: 'Riverside walking trail',
            sprite: 'wooden_sign',
            destination: 'riverside',
            requires: 'riverside',
          },
        ],
        [
          'rest',
          54,
          25,
          {
            id: 'park-rest',
            label: 'Wait an hour on the bench',
            sprite: 'wooden_bench',
          },
        ],
      ]
  for (const [kind, x, y, properties] of extras) object(kind, x, y, properties)
  const connection = (set, x, y) =>
    [
      [0, -1, 1],
      [1, 0, 2],
      [0, 1, 4],
      [-1, 0, 8],
    ].reduce(
      (mask, [dx, dy, bit]) => mask | (set.has(key(x + dx, y + dy)) ? bit : 0),
      0,
    )
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const k = key(x, y)
      ground.push(
        tile(
          inside
            ? blocked.has(k)
              ? 'stone'
              : 'brick'
            : pond.has(k)
              ? 'water_shore_' + connection(pond, x, y)
              : paths.has(k)
                ? 'dirt_path_' + connection(paths, x, y)
                : 'grass_' + ((x * 37 + y * 19) % 8),
        ),
      )
    }
  return {
    compressionlevel: -1,
    height,
    width,
    infinite: false,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tileheight: 32,
    tilewidth: 32,
    type: 'map',
    version: '1.10',
    tiledversion: '1.11.2',
    nextlayerid: 4,
    nextobjectid: objects.length + 1,
    layers: [
      {
        id: 1,
        name: 'Ground',
        type: 'tilelayer',
        x: 0,
        y: 0,
        width,
        height,
        opacity: 1,
        visible: true,
        data: ground,
      },
      {
        id: 2,
        name: 'Collision',
        type: 'tilelayer',
        x: 0,
        y: 0,
        width,
        height,
        opacity: 0,
        visible: false,
        data: Array.from({ length: width * height }, (_, i) =>
          blocked.has(key(i % width, Math.floor(i / width)))
            ? tile('stone')
            : 0,
        ),
      },
      {
        id: 3,
        name: 'Objects',
        type: 'objectgroup',
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
        draworder: 'topdown',
        objects,
      },
    ],
    tilesets: [
      {
        firstgid: 1,
        name: 'PawTrail terrain',
        image: '../game-assets/terrain.png',
        imagewidth: 512,
        imageheight: 256,
        tilewidth: 32,
        tileheight: 32,
        margin: 0,
        spacing: 0,
        columns: 16,
        tilecount: 128,
      },
    ],
  }
}
await fs.mkdir('public/pawtrail-game/maps', { recursive: true })
await fs.writeFile(
  'public/pawtrail-game/maps/neighborhood.json',
  JSON.stringify(makeMap(64, 44)),
)
await fs.writeFile(
  'public/pawtrail-game/maps/shelter.json',
  JSON.stringify(makeMap(25, 18, true)),
)
console.log('Prepared native assets and two Tiled-compatible maps.')
await fs.mkdir(path.join(out, 'portraits'), { recursive: true })
for (const id of [
  'orange_tabby',
  'black_cat',
  'white_cat',
  'calico',
  'siamese',
  'brown_aspin',
  'white_puppy',
  'spotted_dog',
])
  await fs.copyFile(
    `assets/animation-pack-v1/frames/${id}/idle/00.png`,
    path.join(out, 'portraits', id + '.png'),
  )
await fs.copyFile(
  'assets/animation-pack-v1/frames/rescuer/idle_down/00.png',
  path.join(out, 'portraits/rescuer.png'),
)
for (const id of [
  'cat_food_bag',
  'water_bottle_full',
  'first_aid_kit',
  'kibble_coin_0',
  'paw_indicator_0',
])
  await fs.copyFile(
    `assets/pixel-art-v1/native/items/${id}.png`,
    path.join(out, 'portraits', id + '.png'),
  )

function sideMap(id) {
  const map = makeMap(25, 18, true),
    ground = map.layers[0],
    collision = map.layers[1]
  ground.data = []
  collision.data = []
  map.layers[2].objects = []
  for (let y = 0; y < 18; y++)
    for (let x = 0; x < 25; x++) {
      const edge = x === 0 || y === 0 || x === 24 || y === 17,
        water = id === 'riverside' && x > 17
      ground.data.push(tile(water ? 'water' : 'grass_' + ((x + y) % 8)))
      collision.data.push(edge || water ? tile('stone') : 0)
    }
  const add = (type, x, y, props) =>
    map.layers[2].objects.push({
      id: map.layers[2].objects.length + 1,
      type,
      name: props.id,
      x: x * 32,
      y: y * 32,
      width: 0,
      height: 0,
      rotation: 0,
      visible: true,
      point: true,
      properties: Object.entries(props).map(([name, value]) => ({
        name,
        type:
          typeof value === 'boolean'
            ? 'bool'
            : typeof value === 'number'
              ? 'float'
              : 'string',
        value,
      })),
    })
  add('exit', 12, 15, { id: id + '-exit', label: 'Return to the neighborhood' })
  for (const [sprite, x, y] of [
    ['flowering_tree', 5, 6],
    ['large_tree', 20, 6],
    ['wooden_bench', 15, 11],
    ['garden_pot', 9, 8],
    ['yellow_flowers', 17, 7],
    ['pink_flowers', 8, 12],
    ['small_tree', 4, 13],
  ])
    add('prop', x, y, {
      id: sprite + x,
      sprite,
      label: sprite,
      solid: sprite.includes('tree'),
    })
  if (id === 'garden') {
    add('animal', 12, 9, {
      id: 'cloud',
      label: 'Cloud',
      sprite: 'white_cat',
      description: 'A kitten hiding among the flower pots.',
      rescuable: true,
    })
    add('clue', 10, 11, {
      id: 'garden-clue',
      label: 'Tiny pawprints',
      sprite: 'paw_indicator_0',
    })
    add('pickup', 18, 12, {
      id: 'garden-token',
      label: 'A garden keepsake',
      sprite: 'kibble_coin_0',
      item: 'token',
      amount: 1,
    })
  } else {
    add('pickup', 12, 7, {
      id: 'river-token',
      label: 'A riverside keepsake',
      sprite: 'kibble_coin_0',
      item: 'token',
      amount: 1,
    })
    add('rest', 14, 12, {
      id: 'river-rest',
      label: 'Rest beside the water',
      sprite: 'wooden_bench',
    })
  }
  return map
}
for (const id of ['garden', 'riverside'])
  await fs.writeFile(
    'public/pawtrail-game/maps/' + id + '.json',
    JSON.stringify(sideMap(id)),
  )
for (const id of ['feeding_bowl', 'supply_box', 'mouse_toy'])
  await fs.copyFile(
    'assets/pixel-art-v1/native/items/' + id + '.png',
    path.join(out, 'portraits', id + '.png'),
  )
