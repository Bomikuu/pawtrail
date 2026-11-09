import type { PlatformAnimal } from "./platform";
import type { CharacterId } from "./characters";
export type CareAction =
  "feed" | "pet" | "water" | "rescue" | "observe" | "play" | "check" | "photo";
export type Direction = "down" | "up" | "left" | "right";
export type Item =
  "food" | "water" | "firstAid" | "foodBowl" | "wood" | "toy" | "token";
export type SceneId = "neighborhood" | "shelter" | "garden" | "riverside";
export type GameCommand =
  | { type: "photo-scene" }
  | { type: "emote"; emote: string }
  | { type: "care"; action: CareAction; id: string }
  | { type: "interact" }
  | { type: "pause"; paused: boolean }
  | { type: "move"; x: number; y: number }
  | { type: "zoom"; amount: number }
  | { type: "reset" }
  | { type: "focus" }
  | { type: "refresh" }
  | { type: "appearance" }
  | { type: "cat-sound"; emote: string }
  | { type: "guide"; target: string }
  | { type: "platform-sync" }
  | { type: "reload" };
export type Nearby = {
  id: string;
  kind:
    | "animal"
    | "platform-animal"
    | "npc"
    | "building"
    | "supplies"
    | "exit"
    | "project"
    | "pickup"
    | "clue"
    | "station"
    | "portal"
    | "rest";
  findId?: string;
  name: string;
  sprite?: string;
  description?: string;
  state?: string;
  rescuable?: boolean;
  platformAnimalId?: string;
};
export type Activity = {
  id: string;
  kind: string;
  animalId?: string;
  at: string;
  reward: number;
  text: string;
};
export type GameEvent = {
  type: string;
  target: string;
  amount?: number;
  unique?: string;
};
export type QuestState =
  "locked" | "available" | "active" | "completed" | "claimed";
export type Objective = {
  text: string;
  type: string;
  target?: string;
  targets?: string[];
  count?: number;
  unique?: boolean;
};
export type QuestDefinition = {
  id: string;
  title: string;
  description: string;
  category: "main" | "daily" | "side" | "exploration" | "community" | "event";
  giver?: string;
  prerequisites?: string[];
  relationship?: { npc: string; minimum: number };
  ordered?: boolean;
  reward: number;
  xp: number;
  badge?: string;
  unlock?: string;
  unlocks?: string[];
  objectives: Objective[];
};
export type QuestProgress = {
  state: "active" | "completed" | "claimed";
  counts: number[];
  unique: string[][];
  day: number;
};
export type AnimalProfile = {
  id: string;
  name: string;
  sprite: string;
  description: string;
  species: "cat" | "dog";
  personality: "friendly" | "shy" | "curious" | "playful";
  favoriteFood: string;
  fact: string;
  story: string;
  trust: number;
  rescuable: boolean;
  routine: Record<
    "morning" | "afternoon" | "evening" | "night",
    [number, number]
  >;
};
export type AnimalMemory = {
  trust: number;
  lastCare: Partial<Record<CareAction, number>>;
  history: string[];
  metDay: number;
  location: string;
};
export type Photo = {
  id: string;
  animalId: string;
  day: number;
  pose: string;
  location: SceneId;
  image: string;
};
export type Progress = {
  gameAnimals?: Record<
    string,
    import("./systems/animal-needs").LocalAnimalState
  >;
  version: 2;
  appearance?: CharacterId;
  satchel?: Record<string, number>;
  kibble: number;
  totalEarned: number;
  xp: number;
  day: number;
  minute: number;
  inventory: Record<Item, number>;
  completed: string[];
  discovered: string[];
  rescued: string[];
  visitedShelter: boolean;
  activities: Activity[];
  position: { x: number; y: number; scene: SceneId };
  updatedAt: string;
  quests: Record<string, QuestProgress>;
  animals: Record<string, AnimalMemory>;
  relationships: Record<string, number>;
  areas: string[];
  upgrades: string[];
  unlocks: string[];
  badges: string[];
  photos: Photo[];
  trackedQuest: string;
  started: boolean;
};
export type DialogueChoice = {
  label: string;
  action:
    | "accept"
    | "claim"
    | "buy"
    | "close"
    | "upgrade"
    | "clean"
    | "water"
    | "rest";
  target: string;
};
export type Dialogue = {
  name: string;
  text: string;
  npcId?: string;
  portrait?: string;
  appearanceId?: string;
  portraitSubject?: import('./actor-rig/portrait-source').PortraitSubject;
  choices?: DialogueChoice[];
};
export type GameSnapshot = {
  phase: "loading" | "ready" | "error";
  load: number;
  error: string;
  nearby: Nearby | null;
  scene: SceneId;
  progress: Progress;
  save: "saved" | "unavailable";
  notice: string;
  dialogue: Dialogue | null;
  paused: boolean;
  busy: boolean;
  panelRequest: string | null;
  platformAnimals: PlatformAnimal[];
  platformAnimalRequest: string | null;
};
export type WorldObject = {
  id: string;
  asset?: string;
  findId?: string;
  kind: Nearby["kind"] | "prop";
  x: number;
  y: number;
  sprite?: string;
  label: string;
  description?: string;
  dialogue?: string;
  rescuable?: boolean;
  enter?: boolean;
  solid?: boolean;
  destination?: SceneId;
  requires?: string;
  project?: string;
  item?: Item;
  amount?: number;
  area?: string;
  platformAnimalId?: string;
};
export { ANIMALS, QUESTS } from "./data";
