export type Placement = {
  id: string
  item: string
  x: number
  y: number
  rotation: number
}
export type Person = {
  id: string
  username: string
  name: string
  avatar: string
  appearance: string
  sample: boolean
  online: boolean
  visitable?: boolean
  location?: string | null
  roomId?: string | null
}
export type Furniture = {
  id: string
  label: string
  file: string
  width: number
  height: number
  anchor: number[]
  footprint: number[]
  blocking: boolean
  rotatable: boolean
  category: string
  interaction: string
  price: number
}
export type Pet = {
  id: string
  profile: {
    id: string
    slug: string
    name: string
    species: string
    gender: string
    ageMonths: number
    appearance: string
    personality: string[]
    description: string
    photo: { url: string; alt: string } | null
    sample: boolean
    demo?: boolean
  }
  sprite: string
  state: string
  activity?: string
  x: number
  y: number
  next?: number[]
  friendship: number
  memories: { text: string; at: number }[]
  lastCare: Record<string, number>
  favoriteFood: string
  favoriteToy: string
}
export type House = {
  mapArea?: string
  id: string
  name: string
  owner: Person
  visibility: string
  opened: boolean
  permissions: Record<string, boolean | string[]>
  layout: Placement[]
  floor: string
  wallpaper: string
  revision: number
  upgrades: string[]
  width: number
  height: number
  canDecorate: boolean
  inventory: Record<string, number>
  pets: Pet[]
  guestbook: { id: string; author: Person; text: string; at: number }[]
  neighbors?: Person[]
}
export type Chat = {
  id: number
  sender: Person
  recipient?: Person
  text: string
  at: number
}
export type Boot = {
  world?: import('../immersion-data').WorldConditions
  player: Person & {
    wallet: number
    supplies?: Record<string, number>
    availableInventory: Record<string, number>
    inventory: Record<string, number>
    facts: string[]
    claimed: string[]
    favorites: string[]
    notifications: { id: string; text: string; at: number }[]
    visible: boolean
    quiet: boolean
  }
  house: House
  friends: Person[]
  requests: { id: number; sender: Person; recipient: Person }[]
  invitations: {
    id: string
    house: string
    sender: Person
    recipient: Person
    state: string
  }[]
  messages: Chat[]
  quests: {
    id: string
    title: string
    facts: string[]
    reward: number
    item?: string
    badge?: string
  }[]
  photos: { id: string; image: string; caption: string }[]
  blocks: Person[]
  catalog: Furniture[]
  serverTime: number
}
export type Remote = {
  person: Person
  x: number
  y: number
  direction: string
  walking: boolean
}
export type HomesState = {
  status: 'loading' | 'connecting' | 'online' | 'reconnecting' | 'error'
  data: Boot | null
  players: Record<string, Remote>
  pets: Pet[]
  chat: Chat[]
  people: Person[]
  selectedPet: string | null
  selectedPlayer: string | null
  chatWith: Person | null
  notice: string
  error: string
  busy: boolean
  editRevision: number
  decoration: boolean
  draft: Placement[]
  selectedFurniture: string | null
  photoMode: boolean
  unread: number
  mutedChat: boolean
  petTick: number
}
export type SceneCommand =
  | { type: 'focus-pet'; id: string }
  | { type: 'place'; item: string }
  | { type: 'rotate' }
  | { type: 'store' }
  | { type: 'cancel' }
  | { type: 'photo' }
  | { type: 'interact' }
  | { type: 'move'; x: number; y: number }
  | { type: 'care'; action: string; pet: string }
