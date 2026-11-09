import { ANIMALS } from "../data";
import type { Progress, QuestProgress } from "../types";
import { isCharacterId } from "../characters";
import { packItem } from "../immersion-data";
export const SAVE_KEY = "pawtrail:neighborhood:v2";
export function freshProgress(): Progress {
  return {
    version: 2,
    appearance: "rescuer",
    satchel: {},
    kibble: 0,
    totalEarned: 0,
    xp: 0,
    day: 1,
    minute: 450,
    inventory: {
      food: 10,
      water: 10,
      firstAid: 3,
      foodBowl: 0,
      wood: 0,
      toy: 1,
      token: 0,
    },
    completed: [],
    discovered: [],
    rescued: [],
    visitedShelter: false,
    activities: [],
    position: { x: 29 * 32, y: 25 * 32, scene: "neighborhood" },
    updatedAt: new Date().toISOString(),
    quests: {},
    animals: {},
    relationships: {},
    areas: [],
    upgrades: [],
    unlocks: [],
    badges: [],
    photos: [],
    trackedQuest: "welcome",
    started: false,
  };
}
const count = (n: unknown, max = 10000000) =>
  typeof n === "number" && Number.isSafeInteger(n) && n >= 0 && n <= max;
const record = (value: unknown) =>
  !!value && typeof value === "object" && !Array.isArray(value);
const strings = (v: unknown, max = 500) =>
  Array.isArray(v) &&
  v.length <= max &&
  v.every((n) => typeof n === "string" && n.length < 150);
function validGameAnimals(value: Progress["gameAnimals"]) {
  if (value === undefined) return true;
  if (!record(value) || Object.keys(value).length > 100) return false;
  return Object.entries(value).every(([id, a]) => {
    if (
      !ANIMALS.some((n) => n.id === id) ||
      !record(a) ||
      !record(a.needs) ||
      !record(a.cycle) ||
      !strings(a.claimed)
    )
      return false;
    if (typeof a.updated !== "number" || !Number.isFinite(a.updated))
      return false;
    if (
      !(["food", "water"] as const).every(
        (k) =>
          typeof a.needs[k] === "number" &&
          Number.isFinite(a.needs[k]) &&
          a.needs[k] >= 0 &&
          a.needs[k] <= 100 &&
          count(a.cycle[k], 100000),
      )
    )
      return false;
    if (a.companion !== undefined && typeof a.companion !== "boolean")
      return false;
    if (
      a.mode !== undefined &&
      !["idle", "follow", "stay", "move", "home"].includes(a.mode)
    )
      return false;
    if (
      a.point !== undefined &&
      (!Array.isArray(a.point) ||
        a.point.length !== 2 ||
        a.point.some(
          (v) =>
            typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 4096,
        ))
    )
      return false;
    return a.completed === undefined || strings(a.completed);
  });
}
export function validProgress(v: unknown): v is Progress {
  if (!v || typeof v !== "object") return false;
  const p = v as Progress;
  return (
    p.version === 2 &&
    (p.appearance === undefined || isCharacterId(p.appearance)) &&
    (p.satchel === undefined ||
      (record(p.satchel) &&
        Object.entries(p.satchel).every(
          ([id, value]) => !!packItem(id) && count(value, 10000),
        ))) &&
    validGameAnimals(p.gameAnimals) &&
    count(p.kibble) &&
    count(p.totalEarned) &&
    count(p.xp) &&
    count(p.day, 100000) &&
    p.day > 0 &&
    count(p.minute, 1439) &&
    record(p.inventory) &&
    ["food", "water", "firstAid", "foodBowl", "wood", "toy", "token"].every(
      (k) => count(p.inventory[k as keyof typeof p.inventory], 10000),
    ) &&
    [
      "completed",
      "discovered",
      "rescued",
      "areas",
      "upgrades",
      "unlocks",
      "badges",
    ].every((k) => strings(p[k as keyof Progress])) &&
    p.discovered.every((id) => ANIMALS.some((a) => a.id === id)) &&
    p.rescued.every((id) => ANIMALS.some((a) => a.id === id)) &&
    typeof p.visitedShelter === "boolean" &&
    typeof p.started === "boolean" &&
    typeof p.trackedQuest === "string" &&
    !!p.position &&
    Number.isFinite(p.position.x) &&
    Number.isFinite(p.position.y) &&
    ["neighborhood", "shelter", "garden", "riverside"].includes(
      p.position.scene,
    ) &&
    Array.isArray(p.activities) &&
    p.activities.length <= 150 &&
    p.activities.every(
      (a) =>
        a &&
        typeof a.id === "string" &&
        typeof a.kind === "string" &&
        typeof a.text === "string" &&
        typeof a.at === "string" &&
        count(a.reward),
    ) &&
    record(p.quests) &&
    Object.keys(p.quests).length <= 2000 &&
    Object.values(p.quests).every(
      (q) =>
        q &&
        ["active", "completed", "claimed"].includes(q.state) &&
        Array.isArray(q.counts) &&
        q.counts.length < 30 &&
        q.counts.every((n) => count(n, 1000)) &&
        Array.isArray(q.unique) &&
        q.unique.length === q.counts.length &&
        q.unique.every((a) => strings(a, 1000)) &&
        count(q.day),
    ) &&
    record(p.animals) &&
    Object.entries(p.animals).every(
      ([id, a]) =>
        ANIMALS.some((n) => n.id === id) &&
        a &&
        count(a.trust, 100) &&
        !!a.lastCare &&
        Object.values(a.lastCare).every((n) => count(n)) &&
        strings(a.history, 20) &&
        count(a.metDay) &&
        typeof a.location === "string",
    ) &&
    record(p.relationships) &&
    Object.values(p.relationships).every((n) => count(n, 100)) &&
    Array.isArray(p.photos) &&
    p.photos.length <= 12 &&
    p.photos.every(
      (f) =>
        f &&
        typeof f.id === "string" &&
        (ANIMALS.some((a) => a.id === f.animalId) ||
          [
            "scene:neighborhood",
            "scene:shelter",
            "scene:garden",
            "scene:riverside",
          ].includes(f.animalId)) &&
        count(f.day) &&
        typeof f.pose === "string" &&
        typeof f.location === "string" &&
        typeof f.image === "string" &&
        f.image.startsWith("data:image/png;base64,") &&
        f.image.length < 300000,
    ) &&
    typeof p.updatedAt === "string"
  );
}
export function parseSave(value: unknown): Progress | null {
  if (validProgress(value)) return value;
  if (!value || typeof value !== "object") return null;
  const old = value as Record<string, any>;
  if (
    old.version !== 1 ||
    !count(old.kibble) ||
    !old.inventory ||
    !["food", "water", "firstAid"].every((k) =>
      count(old.inventory[k], 10000),
    ) ||
    !strings(old.completed) ||
    !strings(old.discovered) ||
    !strings(old.rescued) ||
    !old.position ||
    !Number.isFinite(old.position.x) ||
    !Number.isFinite(old.position.y)
  )
    return null;
  const p = freshProgress();
  p.kibble = old.kibble;
  p.totalEarned = old.kibble;
  p.inventory = { ...p.inventory, ...old.inventory };
  p.completed = old.completed;
  p.discovered = old.discovered.filter((id: string) =>
    ANIMALS.some((a) => a.id === id),
  );
  p.rescued = old.rescued.filter((id: string) =>
    ANIMALS.some((a) => a.id === id),
  );
  p.visitedShelter = !!old.visitedShelter;
  p.position = { ...p.position, ...old.position };
  p.started = true;
  for (const id of p.discovered) {
    const profile = ANIMALS.find((a) => a.id === id)!;
    p.animals[id] = {
      trust: Math.min(
        60,
        profile.trust +
          (p.completed.includes(id + ":feed") ? 8 : 0) +
          (p.completed.includes(id + ":pet") ? 6 : 0),
      ),
      lastCare: {},
      history: ["Care carried over from the first prototype."],
      metDay: 1,
      location: "neighborhood",
    };
  }
  if (p.completed.includes("quest:hello-mango")) {
    p.quests.welcome = {
      state: "claimed",
      counts: [1, 1, 1, 1, 1],
      unique: [[], [], [], [], []],
      day: 1,
    };
    p.unlocks = ["journal", "garden", "camera"];
    p.badges = ["PawPal Beginner"];
  }
  return validProgress(p) ? p : null;
}
export function pruneDailyHistory(p: Progress) {
  return {
    ...p,
    quests: Object.fromEntries(
      Object.entries(p.quests).filter(
        ([key, q]) => !key.includes("@") || q.day >= p.day - 14,
      ),
    ) as Record<string, QuestProgress>,
  };
}
