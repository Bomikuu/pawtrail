export type PackItem = { id: string; name: string; category: string; description: string; resource?: 'food' | 'water' | 'firstAid' | 'toy' | 'wood'; action?: 'feed' | 'water' | 'help' | 'play'; protected?: boolean }
export const PACK_ITEMS: PackItem[] = [
  { id: 'cat-food', name: 'Cat food', category: 'Food', description: 'A meal for a feline neighbor.', resource: 'food', action: 'feed' },
  { id: 'dog-food', name: 'Dog food', category: 'Food', description: 'A meal for a canine neighbor.', resource: 'food', action: 'feed' },
  { id: 'fish-treats', name: 'Fish treats', category: 'Food', description: 'A small fish-shaped snack.', resource: 'food', action: 'feed' },
  { id: 'pet-snack', name: 'Pet snack', category: 'Food', description: 'A little food for care rounds.', resource: 'food', action: 'feed' },
  { id: 'water-bottle', name: 'Fresh water', category: 'Pet Care', description: 'Refill a care station or offer water.', resource: 'water', action: 'water' },
  { id: 'grooming-brush', name: 'Grooming brush', category: 'Pet Care', description: 'A gentle grooming tool. Add it to your care supplies.', resource: 'toy', action: 'play' },
  { id: 'first-aid', name: 'First-aid pouch', category: 'Pet Care', description: 'Virtual rescue supplies. Real injuries need professional help.', resource: 'firstAid', action: 'help' },
  { id: 'cleaning-kit', name: 'Cleaning kit', category: 'Pet Care', description: 'Supplies for community care stations.', resource: 'wood' },
  ...['yarn-ball', 'feather-wand', 'toy-mouse', 'rubber-ball'].map((id) => ({ id, name: id.replaceAll('-', ' '), category: 'Toys', description: 'A playful discovery. Add it to your reusable care toys.', resource: 'toy' as const, action: 'play' as const })),
  ...['wood', 'stone', 'fabric', 'recyclables'].map((id) => ({ id, name: id[0].toUpperCase() + id.slice(1), category: 'Materials', description: 'Useful material found while exploring.', ...(id === 'wood' ? { resource: 'wood' as const } : {}) })),
  ...['lost-collar', 'letter', 'animal-tag', 'mission-supplies'].map((id) => ({ id, name: id.replaceAll('-', ' '), category: 'Quest Items', description: 'A protected keepsake used by community missions. It cannot be discarded.', protected: true })),
  ...['paw-token', 'photo', 'badge', 'rare-decoration'].map((id) => ({ id, name: id.replaceAll('-', ' '), category: 'Collectibles', description: 'A keepsake from your neighborhood adventures.' })),
]
export const packItem = (id: string) => PACK_ITEMS.find((item) => item.id === id)
export const itemArt = (id: string) => `/assets/game/inventory/items/${id}.png`
export const petPortrait = (sprite = 'orange_tabby') => `/assets/game/missions/portraits/${sprite.replace('gray_cat', 'gray_tabby')}.png`
export const CAT_EMOTES = ['happy', 'confused', 'angry', 'sleepy', 'surprised', 'crying', 'laughing', 'excited', 'silly', 'loving', 'suspicious', 'relaxed'] as const
export const CAT_NAMES = ['Meow!', 'Huh?', 'Hiss!', 'Yawn~', 'Miau!', 'Mrow…', 'Mrrp!', 'Nyaa!', 'Mlem!', 'Purr~', 'Hmm?', 'Prrr~']
export const FIND_SPOTS = [
  { id: 'lost-collar', item: 'lost-collar', scene: 'neighborhood', x: 26, y: 25 },
  { id: 'neighbor-letter', item: 'letter', scene: 'neighborhood', x: 31, y: 24 },
  { id: 'bench-toy', item: 'toy-mouse', scene: 'neighborhood', x: 34, y: 23 },
  { id: 'park-token', item: 'paw-token', scene: 'neighborhood', x: 38, y: 24 },
  { id: 'garden-fabric', item: 'fabric', scene: 'garden', x: 10, y: 12 },
  { id: 'riverside-stone', item: 'stone', scene: 'riverside', x: 14, y: 12 },
  { id: 'shelter-supplies', item: 'mission-supplies', scene: 'shelter', x: 14, y: 12 },
  ...['cat-food','dog-food','water-bottle','grooming-brush','first-aid','cleaning-kit','yarn-ball','feather-wand','rubber-ball','wood','animal-tag','pet-snack'].map((item,index)=>({id:'care-find-'+item,item,scene:index%3===0?'shelter':index%3===1?'neighborhood':'garden',x:8+(index%4)*4,y:9+Math.floor(index/4)*3})),
]
export const SHARED_FINDS = [
  { id: 'care-cache', item: 'fish-treats', name: 'Care supply cache', x: 432, y: 416, amount: 2 },
  { id: 'community-letter', item: 'letter', name: 'Community mailbox', x: 528, y: 448, amount: 1 },
  { id: 'hidden-token', item: 'paw-token', name: 'A hidden paw token', x: 624, y: 480, amount: 1 },
  { id: 'toy-basket', item: 'toy-mouse', name: 'A toy for a friend', x: 280, y: 416, amount: 1 },
  { id: 'water-crate', item: 'water-bottle', name: 'Fresh water supplies', x: 560, y: 480, amount: 2 },
  { id: 'first-aid-cache', item: 'first-aid', name: 'A first-aid pouch', x: 144, y: 352, amount: 1 },
  { id: 'material-cache', item: 'wood', name: 'A little building material', x: 400, y: 448, amount: 2 },
]
export type WorldConditions = { total: number; minute: number; day: number; weather: string; epoch: number }
export const WEATHER_SEQUENCE = ['clear', 'cloudy', 'light-rain', 'heavy-rain', 'cloudy', 'clear', 'clear', 'light-rain']
export function worldConditions(total: number, epoch = Date.now() / 1000): WorldConditions {
  return { total, minute: ((total % 1440) + 1440) % 1440, day: Math.floor(total / 1440) + 1, weather: WEATHER_SEQUENCE[Math.floor(total / 180) % 8], epoch }
}
export const weatherLabel = (weather: string) => ({ clear: 'Clear', cloudy: 'Cloudy', 'light-rain': 'Light rain', 'heavy-rain': 'Heavy rain' }[weather] ?? 'Clear')
let sharedAnchor: { world: WorldConditions; received: number } | null = null
export function receiveSharedWorld(world: WorldConditions) { sharedAnchor = { world, received: performance.now() } }
export function sharedWorld() { return sharedAnchor ? worldConditions(sharedAnchor.world.total + (performance.now()-sharedAnchor.received)/500) : null }
