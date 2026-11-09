export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type FurnitureGeometry = {
  version: 2;
  ground: number[][];
  placement: number[][];
  approaches: number[][];
  seats: {
    id: string;
    point: number[];
    facing: string;
    elevation: number;
    exit: number[];
  }[];
  surfaces: {
    id: string;
    point: number[];
    elevation: number;
    landingBounds: number[];
    approach: number[];
    descent: number[];
    species: string[];
    capacity: number;
    links: string[];
  }[];
  occlusion: "base" | "floor";
  actions: string[];
};
export type ObjectState = {
  surface?: 'soil';
  food?: number;
  water?: number;
  lit?: boolean;
  wateredAt?: number;
  cleanedAt?: number;
  open?: boolean;
  revision?: number;
};
export type ActionPhase =
  "select" | "approach" | "align" | "perform" | "complete" | "recover";
export type InteractionStatus = {
  id: string;
  target: string;
  label: string;
  phase: ActionPhase;
  held?: boolean;
} | null;
export type Placement = {
  style?: string;
  id: string;
  item: string;
  x: number;
  y: number;
  rotation: number;
};
export type Person = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  appearance: string;
  sample: boolean;
  online: boolean;
  visitable?: boolean;
  location?: string | null;
  roomId?: string | null;
};
export type Furniture = {
  reaction?: { kind: string; fps: number; sensor?: number[] };
  motion?: { file: string; frontFile: string }[];
  indicatorHeight?: number;
  defaultStyle?: string;
  frontFile?: string;
  renderedViews?: Record<string, { width: number; height: number; anchor: number[]; indicatorHeight?: number; reaction?: {kind: string; fps: number; sensor?: number[]}; footprint: number[]; geometry: FurnitureGeometry }>;
  styles?: { id: string; label: string; color: string; views: Record<string, { file: string; frontFile: string; motion?: { file: string; frontFile: string }[] }> }[];
  construction?: { seconds: number; materials: { id: string; label: string; amount: number; price: number }[] };
  geometry: FurnitureGeometry;
  id: string;
  label: string;
  file: string;
  width: number;
  height: number;
  anchor: number[];
  footprint: number[];
  supportedRotations?: number[];
  orientationVariants?: Record<string, string>;
  blocking: boolean;
  rotatable: boolean;
  category: string;
  interaction: string;
  price: number;
  zones: ("interior" | "yard")[];
};
export type Pet = {
  following?: string | null;
  owner?: string;
  needs?: { food: number; water: number };
  id: string;
  profile: {
    id: string;
    slug: string;
    name: string;
    species: string;
    gender: string;
    ageMonths: number;
    appearance: string;
    personality: string[];
    description: string;
    photo: { url: string; alt: string } | null;
    sample: boolean;
    demo?: boolean;
  };
  sprite: string;
  state: string;
  activity?: string;
  x: number;
  y: number;
  elevation?: number;
  surface?: string | null;
  transition?: {
    id: string;
    kind: string;
    from: number[];
    to: number[];
    started: number;
    duration: number;
  };
  next?: number[];
  friendship: number;
  memories: { text: string; at: number }[];
  lastCare: Record<string, number>;
  favoriteFood: string;
  favoriteToy: string;
};
export type Plot = {
  slot: number;
  name: string;
  available: boolean;
  owner?: Person;
  exterior?: string;
  yardLayout?: Placement[];
  yardPublic?: boolean;
};
export type House = {
  objectStates?: Record<string, ObjectState>;
  roomId: string;
  zone: "interior" | "yard" | "upstairs";
  interiorPreset: string;
  upstairsLayout: Placement[];
  upstairsRevision: number;
  activeRevision: number;
  floors: { id: "interior" | "upstairs"; label: string; rooms: string[] }[];
  layoutBackups: { id: string; at: number; preset: string; name: string }[];
  unlockedPresets: string[];
  activeLayout: Placement[];
  yardLayout: Placement[];
  yardRevision: number;
  exterior: string;
  yardPublic: boolean;
  blockCount: number;
  communityBlock: number;
  block: number;
  plots: Plot[];
  spawn: number[];
  mapArea?: string;
  id: string;
  name: string;
  owner: Person;
  visibility: string;
  opened: boolean;
  permissions: Record<string, boolean | string[]>;
  layout: Placement[];
  floor: string;
  wallpaper: string;
  revision: number;
  upgrades: string[];
  width: number;
  height: number;
  canDecorate: boolean;
  inventory: Record<string, number>;
  pets: Pet[];
  guestbook: { id: string; author: Person; text: string; at: number }[];
  neighbors?: Person[];
};
export type Chat = {
  id: number;
  sender: Person;
  recipient?: Person;
  text: string;
  at: number;
};
export type Boot = {
  environment?: { tool: string; wetUntil: number };
  clientReceivedAt?: number;
  builds?: { id: string; item: string; mode: string; started: number; readyAt: number }[];
  world?: import("../immersion-data").WorldConditions;
  player: Person & {
    wallet: number;
    supplies?: Record<string, number>;
    availableInventory: Record<string, number>;
    inventory: Record<string, number>;
    facts: string[];
    claimed: string[];
    favorites: string[];
    notifications: { id: string; text: string; at: number }[];
    visible: boolean;
    quiet: boolean;
  };
  house: House;
  friends: Person[];
  requests: { id: number; sender: Person; recipient: Person }[];
  invitations: {
    id: string;
    house: string;
    sender: Person;
    recipient: Person;
    state: string;
  }[];
  messages: Chat[];
  quests: {
    id: string;
    title: string;
    facts: string[];
    reward: number;
    item?: string;
    badge?: string;
  }[];
  photos: { id: string; image: string; caption: string }[];
  blocks: Person[];
  catalog: Furniture[];
  serverTime: number;
};
export type Remote = {
  environment?: { tool: string; wetUntil: number };
  pose?: {
    animation: string;
    x: number;
    y: number;
    groundY: number;
    facing: string;
    item: string;
    actionId: string;
  };
  person: Person;
  x: number;
  y: number;
  direction: string;
  walking: boolean;
};
export type HomesState = {
  rendererReady?: boolean;
  placementPreview?: Placement | null;
  interaction?: InteractionStatus;
  interactionMenu?: {
    target: string;
    label: string;
    actions: { id: string; label: string }[];
  } | null;
  assets?: { progress: number; error: string };
  debugGeometry?: boolean;
  status: "loading" | "connecting" | "online" | "reconnecting" | "error";
  data: Boot | null;
  players: Record<string, Remote>;
  pets: Pet[];
  chat: Chat[];
  people: Person[];
  selectedPet: string | null;
  selectedPlayer: string | null;
  chatWith: Person | null;
  notice: string;
  error: string;
  failure?: import("./client").HousingFailure;
  busy: boolean;
  zoom: number;
  editRevision: number;
  editConflict: boolean;
  decoration: boolean;
  draft: Placement[];
  selectedFurniture: string | null;
  photoMode: boolean;
  unread: number;
  mutedChat: boolean;
  petTick: number;
};
export type SceneCommand =
  | { type: 'dig' }
  | { type: "object-action"; target: string; action: string }
  | { type: "debug-geometry"; enabled: boolean }
  | { type: "cancel-action" }
  | { type: "focus-pet"; id: string }
  | { type: "place"; item: string; at?: Point }
  | { type: "rotate"; direction?: 1 | -1 }
  | { type: 'style'; style: string }
  | { type: "nudge"; x: number; y: number }
  | { type: "commit" }
  | { type: "select"; id: string }
  | { type: "spawn"; x: number; y: number }
  | { type: "store" }
  | { type: "cancel" }
  | { type: "photo" }
  | { type: "zoom"; mode: "in" | "out" | "fit" | "fill" }
  | { type: "interact" }
  | { type: "move"; x: number; y: number }
  | { type: "care"; action: string; pet: string; supply?: string };
