import type { AnimalProfile, Item, QuestDefinition } from './types'
const routine = (x: number, y: number) =>
  ({
    morning: [x, y],
    afternoon: [Math.min(57, x + 3), Math.min(39, y + 2)],
    evening: [17, 23],
    night: [x, y],
  }) as AnimalProfile['routine']
export const ANIMALS: AnimalProfile[] = [
  {
    id: 'mango',
    name: 'Mango',
    sprite: 'orange_tabby',
    species: 'cat',
    personality: 'friendly',
    trust: 15,
    favoriteFood: 'Fish treats',
    description: 'A sunny little explorer who greets everyone.',
    fact: 'Cats use slow blinking to communicate comfort.',
    story:
      'Mango has decided Maya’s morning rounds are his morning rounds, too.',
    rescuable: true,
    routine: routine(27, 24),
  },
  {
    id: 'sombra',
    name: 'Sombra',
    sprite: 'black_cat',
    species: 'cat',
    personality: 'shy',
    trust: 0,
    favoriteFood: 'Soft cat food',
    description: 'Prefers a slow approach and a quiet voice.',
    fact: 'A swishing tail can mean a cat needs more space.',
    story:
      'Sombra watches the sari-sari store from the shade. Leave water and let her choose the distance.',
    rescuable: false,
    routine: routine(20, 16),
  },
  {
    id: 'cloud',
    name: 'Cloud',
    sprite: 'white_cat',
    species: 'cat',
    personality: 'curious',
    trust: 8,
    favoriteFood: 'Tiny fish treats',
    description: 'A kitten exploring the abandoned garden.',
    fact: 'Kittens learn their surroundings through careful play.',
    story:
      'Jo heard a tiny voice beyond the old garden gate. The pawprints lead toward the flower pots.',
    rescuable: true,
    routine: {
      morning: [12, 9],
      afternoon: [15, 10],
      evening: [8, 8],
      night: [12, 9],
    },
  },
  {
    id: 'patch',
    name: 'Patch',
    sprite: 'calico',
    species: 'cat',
    personality: 'playful',
    trust: 10,
    favoriteFood: 'Crunchy kibble',
    description: 'A curious cat with a very loud purr.',
    fact: 'Each calico coat has its own pattern.',
    story:
      'Patch has a particular interest in lost toys. Especially toys that are not technically hers.',
    rescuable: false,
    routine: routine(42, 34),
  },
  {
    id: 'miso',
    name: 'Miso',
    sprite: 'siamese',
    species: 'cat',
    personality: 'shy',
    trust: 3,
    favoriteFood: 'Fish treats',
    description: 'A careful observer in the quiet lanes.',
    fact: 'Cats can rotate their ears toward a sound.',
    story:
      'Miso sits beside the same fence each evening. The resident there always leaves a kind word.',
    rescuable: false,
    routine: routine(12, 32),
  },
  {
    id: 'tala',
    name: 'Tala',
    sprite: 'brown_aspin',
    species: 'dog',
    personality: 'friendly',
    trust: 12,
    favoriteFood: 'Dog food',
    description: 'An Aspin keeping an eye on the park.',
    fact: 'Aspin means a native Philippine mixed-breed dog.',
    story:
      'Tala knows every shortcut to the park, and considers every visitor part of her walking group.',
    rescuable: false,
    routine: routine(51, 18),
  },
  {
    id: 'pip',
    name: 'Pip',
    sprite: 'white_puppy',
    species: 'dog',
    personality: 'shy',
    trust: 4,
    favoriteFood: 'Soft puppy food',
    description: 'A puppy learning that people can be gentle.',
    fact: 'Calm, predictable routines can help a nervous dog.',
    story:
      'Pip takes one brave step at a time. A meal today might become a wag tomorrow.',
    rescuable: true,
    routine: routine(28, 32),
  },
  {
    id: 'domino',
    name: 'Domino',
    sprite: 'spotted_dog',
    species: 'dog',
    personality: 'playful',
    trust: 10,
    favoriteFood: 'Crunchy dog food',
    description: 'Always ready to meet another friend.',
    fact: 'Dogs read body language as well as voices.',
    story:
      'Domino keeps delivering fallen leaves to Jo. He has not yet been told the shop does not sell leaves.',
    rescuable: false,
    routine: routine(40, 9),
  },
]
export const QUESTS: QuestDefinition[] = [
  {id:'lost-collar',title:'A Collar with a Story',category:'side',description:'Find a lost collar near the neighborhood trees and read the letter by the lane. These keepsakes remain protected in your backpack.',reward:75,xp:25,objectives:[{type:'collect',target:'lost-collar',text:'Find the lost collar.'},{type:'collect',target:'letter',text:'Discover a neighbor’s letter.'}]},
  {id:'care-backpack',title:'A Little Care Kit',category:'community',description:'Explore the neighborhood for a toy and a paw token. Visit bushes, benches, and quiet corners.',reward:60,xp:20,objectives:[{type:'collect',target:'toy-mouse',text:'Find the toy beside a bench.'},{type:'collect',target:'paw-token',text:'Find a hidden paw token.'}]},

  {
    id: 'welcome',
    title: 'Welcome to PawTrail',
    category: 'main',
    giver: 'maya',
    description:
      'Join Maya’s morning care round and make your first animal friend.',
    ordered: true,
    reward: 100,
    xp: 40,
    badge: 'PawPal Beginner',
    unlocks: ['journal', 'camera', 'garden'],
    objectives: [
      { type: 'talk', target: 'maya', text: 'Talk to Maya.' },
      {
        type: 'interact',
        target: 'feeding-station',
        text: 'Find the neighborhood feeding station.',
      },
      { type: 'collect', target: 'foodBowl', text: 'Collect a food bowl.' },
      { type: 'feed', target: 'mango', text: 'Share food with Mango.' },
      { type: 'talk', target: 'maya', text: 'Return to Maya.' },
    ],
  },
  {
    id: 'missing-kitten',
    title: 'The Missing Kitten',
    category: 'main',
    giver: 'jo',
    prerequisites: ['welcome'],
    description:
      'Follow Jo’s clues into the old garden and help Cloud find safety.',
    ordered: true,
    reward: 250,
    xp: 80,
    objectives: [
      { type: 'talk', target: 'jo', text: 'Ask Jo about the tiny voice.' },
      { type: 'area', target: 'garden', text: 'Explore the hidden garden.' },
      {
        type: 'interact',
        target: 'garden-clue',
        text: 'Follow the little pawprints.',
      },
      {
        type: 'observe',
        target: 'cloud',
        text: 'Locate and quietly observe Cloud.',
      },
      {
        type: 'rescue',
        target: 'cloud',
        text: 'Build trust and help Cloud reach safety.',
      },
      { type: 'talk', target: 'jo', text: 'Return to Jo.' },
    ],
  },
  {
    id: 'shelter-home',
    title: 'A Home for Every Paw',
    category: 'main',
    giver: 'lina',
    prerequisites: ['welcome'],
    description: 'Help Lina prepare a warmer, more comfortable animal shelter.',
    ordered: true,
    reward: 500,
    xp: 120,
    badge: 'Community Helper',
    unlock: 'riverside',
    objectives: [
      {
        type: 'area',
        target: 'shelter',
        text: 'Visit the neighborhood shelter.',
      },
      { type: 'talk', target: 'lina', text: 'Talk to the shelter manager.' },
      {
        type: 'collect',
        target: 'shelter-box',
        text: 'Collect shelter supplies.',
      },
      {
        type: 'upgrade',
        target: 'shelter-beds',
        text: 'Prepare the resting areas.',
      },
      {
        type: 'upgrade',
        target: 'shelter-garden',
        text: 'Finish the shelter garden.',
      },
      { type: 'talk', target: 'lina', text: 'Show Lina the improvements.' },
    ],
  },
  {
    id: 'daily-meals',
    title: 'Two little meals',
    category: 'daily',
    description: 'Feed two different neighbors today.',
    reward: 30,
    xp: 12,
    objectives: [
      {
        type: 'feed',
        text: 'Feed two hungry animals.',
        count: 2,
        unique: true,
      },
    ],
  },
  {
    id: 'daily-water',
    title: 'Water for everyone',
    category: 'daily',
    description: 'Refill three different animal or station bowls.',
    reward: 35,
    xp: 12,
    objectives: [
      { type: 'water', text: 'Refill three bowls.', count: 3, unique: true },
    ],
  },
  {
    id: 'daily-park',
    title: 'Take the scenic route',
    category: 'daily',
    description: 'Visit the pond-side park.',
    reward: 20,
    xp: 8,
    objectives: [
      { type: 'area', target: 'park', text: 'Visit the neighborhood park.' },
    ],
  },
  {
    id: 'daily-volunteer',
    title: 'A friendly check-in',
    category: 'daily',
    description: 'Ask Lina how the shelter is doing.',
    reward: 20,
    xp: 8,
    objectives: [
      { type: 'talk', target: 'lina', text: 'Talk to the shelter volunteer.' },
    ],
  },
  {
    id: 'daily-photo',
    title: 'A moment worth keeping',
    category: 'daily',
    description: 'Take a new animal photograph today.',
    reward: 25,
    xp: 10,
    objectives: [{ type: 'photo', text: 'Photograph an animal.' }],
  },
  {
    id: 'lost-toy',
    relationship: { npc: 'jo', minimum: 10 },
    title: 'A very important delivery',
    category: 'side',
    giver: 'jo',
    prerequisites: ['welcome'],
    description:
      'Find the lost toy near the park. Domino is not accepting leaves as a substitute.',
    reward: 65,
    xp: 25,
    objectives: [
      {
        type: 'collect',
        target: 'lost-toy',
        text: 'Find the lost animal toy.',
      },
      { type: 'talk', target: 'jo', text: 'Bring the good news to Jo.' },
    ],
  },
  {
    id: 'quiet-corners',
    title: 'The quiet corners',
    category: 'exploration',
    description: 'Find three peaceful animal resting locations.',
    reward: 60,
    xp: 30,
    objectives: [
      {
        type: 'area',
        targets: ['pavilion', 'alley', 'garden'],
        text: 'Discover the pavilion, alley, and garden.',
        count: 3,
        unique: true,
      },
    ],
  },
  {
    id: 'feeding-project',
    title: 'A table for every paw',
    category: 'community',
    giver: 'maya',
    prerequisites: ['welcome'],
    description:
      'Maya will organize care rounds if you help restore the feeding station.',
    reward: 90,
    xp: 35,
    objectives: [
      {
        type: 'clean',
        target: 'feeding-station',
        text: 'Clean the old feeding station.',
      },
      {
        type: 'upgrade',
        target: 'feeding-station',
        text: 'Restore the feeding station.',
      },
    ],
  },
  {
    id: 'kindness-circle',
    title: 'The kindness circle',
    category: 'event',
    giver: 'maya',
    description:
      'A weekly community gathering. Contribute a meal and a little company.',
    reward: 75,
    xp: 30,
    objectives: [
      { type: 'feed', text: 'Share a meal during the gathering.' },
      { type: 'talk', target: 'maya', text: 'Check in with Maya.' },
    ],
  },
]
export const ITEMS: Record<
  Item,
  {
    name: string
    sprite: string
    category: 'care' | 'materials' | 'collectibles'
    description: string
  }
> = {
  food: {
    name: 'Animal food',
    sprite: 'cat_food_bag',
    category: 'care',
    description: 'A meal for a hungry neighbor.',
  },
  water: {
    name: 'Fresh water',
    sprite: 'water_bottle_full',
    category: 'care',
    description: 'Refills a water bowl.',
  },
  firstAid: {
    name: 'Rescue kit',
    sprite: 'first_aid_kit',
    category: 'care',
    description: 'Helps coordinate a safe shelter transfer.',
  },
  foodBowl: {
    name: 'Food bowl',
    sprite: 'feeding_bowl',
    category: 'care',
    description: 'A clean bowl for a care round.',
  },
  wood: {
    name: 'Repair supplies',
    sprite: 'supply_box',
    category: 'materials',
    description: 'Useful for station and shelter repairs.',
  },
  toy: {
    name: 'Animal toy',
    sprite: 'mouse_toy',
    category: 'care',
    description: 'A little play goes a long way.',
  },
  token: {
    name: 'Paw token',
    sprite: 'kibble_coin_0',
    category: 'collectibles',
    description: 'A hidden keepsake from the neighborhood.',
  },
}
export const PROJECTS = [
  {
    id: 'feeding-station',
    name: 'Restore feeding station',
    description: 'A clean roof, repaired bowls, and room for everyone.',
    kibble: 30,
    materials: 2,
    food: 1,
    requires: 'welcome',
  },
  {
    id: 'shelter-beds',
    name: 'Prepare resting areas',
    description: 'Fresh beds, toys, and clean drinking bowls.',
    kibble: 35,
    materials: 2,
    food: 0,
    requires: 'welcome',
  },
  {
    id: 'shelter-garden',
    name: 'Plant a shelter garden',
    description: 'Flowers and a quiet bench for the care team.',
    kibble: 25,
    materials: 1,
    food: 0,
    requires: 'welcome',
  },
]
export const NPCS: Record<
  string,
  {
    name: string
    personality: string
    lines: string[]
    night: string
    questIds: string[]
  }
> = {
  maya: {
    name: 'Maya',
    personality: 'Patient volunteer',
    lines: [
      'Welcome to PawTrail. I’m Maya. Around here, we start with one small kindness.',
      'There’s a feeding station west of the main path. Pick up a bowl, offer Mango a meal, and come tell me how it went.',
    ],
    night:
      'Evening rounds are quiet. Leave a little space for the animals who are resting.',
    questIds: ['welcome', 'feeding-project', 'kindness-circle'],
  },
  jo: {
    name: 'Jo',
    personality: 'Shopkeeper and enthusiastic storyteller',
    lines: [
      'I heard a tiny voice beyond the old garden gate. Cloud has been exploring places a kitten probably shouldn’t.',
      'Look for the little pawprints near the flower pots. Go slowly — our missing explorer needs a gentle recovery.',
    ],
    night:
      'Domino delivered another leaf today. I’m beginning to think he’s opening a rival shop.',
    questIds: ['missing-kitten', 'lost-toy'],
  },
  lina: {
    name: 'Lina',
    personality: 'Warm-hearted shelter manager',
    lines: [
      'Welcome in. A shelter is more than a roof: it’s food, comfort, and people who keep showing up.',
      'The supply cupboard has repair materials. Prepare the beds and garden, then come see me. We’ll make this place feel like home together.',
    ],
    night:
      'The beds are quiet now. Tomorrow is another chance to make a friend.',
    questIds: ['shelter-home'],
  },
}
