import {getSavedCharacter} from './creator/library';
import type {
  Activity,
  DialogueChoice,
  CareAction,
  GameCommand,
  GameEvent,
  GameSnapshot,
  Progress,
  SceneId,
} from "./types";
import { ANIMALS, NPCS, PROJECTS, QUESTS } from "./data";
import {
  acceptQuest,
  advanceQuests,
  claimQuest,
  questKey,
  questState,
  reconcileFacts,
} from "./systems/quests";
import {
  careProgress,
  careReason as reason,
  CARE,
  memory,
} from "./systems/care";
import {
  freshProgress,
  parseSave,
  pruneDailyHistory,
  SAVE_KEY,
  validProgress,
} from "./systems/save";
import { advanceTime, dayPhase } from "./systems/time";
import { isCharacterId, type CharacterId } from "./characters";
import { packItem } from "./immersion-data";
export { freshProgress, validProgress };
const listeners = new Set<() => void>(),
  commands = new Set<(command: GameCommand) => void>();
let initial = freshProgress(),
  save: GameSnapshot["save"] = "saved",
  notice = "Welcome to PawTrail. Maya and Mango are just ahead.";
try {
  const raw =
    localStorage.getItem(SAVE_KEY) ??
    localStorage.getItem("pawtrail:neighborhood:v1");
  if (raw) {
    const parsed = parseSave(JSON.parse(raw));
    if (parsed) initial = parsed;
    else
      notice =
        "Your previous save could not be read. A fresh neighborhood is ready.";
  }
} catch {
  save = "unavailable";
  notice =
    "Local saving is unavailable. You can still play and export progress.";
}
let snapshot: GameSnapshot = {
  phase: "loading",
  load: 0,
  error: "",
  nearby: null,
  scene: initial.position.scene,
  progress: initial,
  save,
  notice,
  dialogue: null,
  paused: false,
  busy: false,
  panelRequest: null,
  platformAnimals: [],
  platformAnimalRequest: null,
};
export const gameStore = {
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  getSnapshot: () => snapshot,
};
export function publish(update: Partial<GameSnapshot>) {
  snapshot = { ...snapshot, ...update };
  listeners.forEach((fn) => fn());
}
export function send(command: GameCommand) {
  commands.forEach((fn) => fn(command));
}
export function chooseCharacter(appearance: CharacterId) {
  try {
    if(getSavedCharacter(appearance)?.scope!=="device")localStorage.setItem("pawtrail:appearance:pending", appearance);
    else localStorage.removeItem("pawtrail:appearance:pending");
  } catch {}
  if (!isCharacterId(appearance)) return;
  persist({ ...snapshot.progress, appearance });
  send({ type: "appearance" });
}
export function collectFind(id: string, item: string, amount = 1) {
  if (!packItem(item) || snapshot.progress.completed.includes("pickup:" + id))
    return false;
  const p = snapshot.progress;
  const next = advanceQuests(
    {
      ...p,
      completed: [
        ...new Set([...p.completed, "pickup:" + id, "found-item:" + item]),
      ],
      satchel: {
        ...p.satchel,
        [item]: Math.min(10000, (p.satchel?.[item] ?? 0) + amount),
      },
    },
    { type: "collect", target: item },
  );
  persist(next);
  publish({ notice: "Item found! " + packItem(item)!.name + " ×" + amount });
  return true;
}
export function useFoundItem(id: string) {
  const item = packItem(id),
    p = snapshot.progress;
  if (!item?.resource || !p.satchel?.[id]) return;
  persist({
    ...p,
    satchel: { ...p.satchel, [id]: p.satchel[id] - 1 },
    inventory: {
      ...p.inventory,
      [item.resource]: p.inventory[item.resource] + 1,
    },
  });
  publish({ notice: item.name + " added to your care supplies." });
}
export function onCommand(fn: (command: GameCommand) => void) {
  commands.add(fn);
  return () => {
    commands.delete(fn);
  };
}
export function persist(progress: Progress) {
  const p = pruneDailyHistory({
    ...progress,
    updatedAt: new Date().toISOString(),
  });
  let status: GameSnapshot["save"] = "saved";
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(p));
  } catch {
    status = "unavailable";
  }
  publish({ progress: p, save: status });
}
function log(
  p: Progress,
  kind: string,
  text: string,
  reward = 0,
  animalId?: string,
): Progress {
  const event: Activity = {
    id: crypto.randomUUID(),
    kind,
    text,
    reward,
    animalId,
    at: new Date().toISOString(),
  };
  return { ...p, activities: [event, ...p.activities].slice(0, 150) };
}
function achievements(p: Progress) {
  const badges = [...p.badges],
    add = (condition: boolean, name: string) => {
      if (condition && !badges.includes(name)) badges.push(name);
    };
  add(p.discovered.length > 0, "First Paw");
  add(
    Object.values(p.animals).some((a) => a.trust >= 60),
    "Animal Whisperer",
  );
  add(
    Object.keys(p.animals).filter((id) => p.completed.includes(id + ":feed"))
      .length >= 5,
    "Neighborhood Helper",
  );
  add(
    ANIMALS.filter(
      (a) => a.species === "cat" && p.completed.includes(a.id + ":pet"),
    ).length >= 3,
    "Cat Companion",
  );
  add(
    ANIMALS.filter(
      (a) => a.species === "dog" && p.completed.includes(a.id + ":pet"),
    ).length >= 3,
    "Dog’s Best Friend",
  );
  add(p.rescued.length >= 2 && p.upgrades.length >= 2, "Shelter Hero");
  add(
    Object.values(p.quests).filter((q) => q.state === "claimed").length >= 8,
    "Top PawPal",
  );
  add(
    p.photos.some((f) => f.pose === "sleep"),
    "Quiet Observer",
  );
  return { ...p, badges };
}
export function emit(event: GameEvent, p = snapshot.progress) {
  const facts = {
    ...p,
    completed: [
      ...new Set([...p.completed, `event:${event.type}:${event.target}`]),
    ],
  };
  const next = achievements(reconcileFacts(advanceQuests(facts, event)));
  persist(next);
  return next;
}
export function questDone(p: Progress, id: string) {
  const q = QUESTS.find((q) => q.id === id);
  return !!q && ["completed", "claimed"].includes(questState(p, q));
}
export function accept(id: string, fromNpc?: string) {
  let p = acceptQuest(snapshot.progress, id);
  if (p === snapshot.progress) return;
  p = log(p, "accept", "Accepted: " + QUESTS.find((q) => q.id === id)!.title);
  const definition = QUESTS.find((q) => q.id === id)!;
  if (p.position.scene === "shelter")
    p = advanceQuests(p, { type: "area", target: "shelter" });
  if (fromNpc && definition.giver === fromNpc)
    p = advanceQuests(p, { type: "talk", target: fromNpc });
  persist(reconcileFacts(p));
  publish({ notice: "Quest accepted. Your journal has the next step." });
}
export function claim(id: string) {
  const before = snapshot.progress,
    p = claimQuest(before, id);
  if (p === before) return;
  const q = QUESTS.find((q) => q.id === id)!;
  persist(
    achievements(log(p, "quest", "Quest completed: " + q.title, q.reward)),
  );
  publish({ notice: `Quest completed! ${q.title} · +${q.reward} Kibble` });
  send({ type: "refresh" });
}
export function track(id: string) {
  persist({ ...snapshot.progress, trackedQuest: id });
  if (!id) send({ type: "guide", target: "" });
}
export function careReason(
  action: CareAction,
  id: string,
  p = snapshot.progress,
) {
  return reason(action, id, p);
}
export function applyCare(
  action: CareAction,
  id: string,
  photo?: { image: string; pose: string },
) {
  const before = snapshot.progress,
    error = reason(action, id, before);
  if (error) {
    publish({ notice: error });
    return false;
  }
  let p = careProgress(before, action, id);
  const animal = ANIMALS.find((a) => a.id === id)!,
    text = {
      feed: `Shared a meal with ${animal.name}`,
      pet: `Gave ${animal.name} a gentle pet`,
      water: `Brought water to ${animal.name}`,
      rescue: `Helped ${animal.name} reach safety`,
      observe: `Quietly observed ${animal.name}`,
      play: `Played with ${animal.name}`,
      check: `Noted ${animal.name}’s current needs`,
      photo: `Photographed ${animal.name}`,
    }[action];
  if (photo)
    p = {
      ...p,
      photos: [
        {
          id: crypto.randomUUID(),
          animalId: id,
          day: p.day,
          pose: photo.pose,
          location: p.position.scene,
          image: photo.image,
        },
        ...p.photos,
      ].slice(0, 12),
    };
  emit(
    { type: action, target: id, unique: id },
    log(p, action, text, CARE[action].reward, id),
  );
  publish({ notice: `${text}. +${CARE[action].reward} Kibble` });
  return true;
}
export function discover(id: string) {
  const p = snapshot.progress;
  if (p.discovered.includes(id)) return;
  const animal = ANIMALS.find((a) => a.id === id);
  if (!animal) return;
  emit(
    { type: "discover", target: id, unique: id },
    log(
      {
        ...p,
        discovered: [...p.discovered, id],
        animals: { ...p.animals, [id]: memory(p, id) },
        kibble: p.kibble + 2,
        totalEarned: p.totalEarned + 2,
      },
      "discover",
      "New animal discovered: " + animal.name,
      2,
      id,
    ),
  );
  publish({ notice: "New animal discovered: " + animal.name });
}
export function discoverArea(id: string) {
  const p = snapshot.progress;
  const next = p.areas.includes(id) ? p : { ...p, areas: [...p.areas, id] };
  emit({ type: "area", target: id, unique: id }, next);
}
export function visitShelter() {
  emit(
    { type: "area", target: "shelter" },
    { ...snapshot.progress, visitedShelter: true },
  );
}
export function collectSupplies(id: string) {
  const p = snapshot.progress,
    key = `supplies:${id}:${p.day}`;
  if (p.completed.includes(key)) {
    publish({
      notice:
        "This care pack has been collected today. The cupboard is restocked next game day.",
    });
    return;
  }
  const next = {
    ...p,
    completed: [...p.completed.slice(-400), key],
    inventory: {
      ...p.inventory,
      food: p.inventory.food + 6,
      water: p.inventory.water + 6,
      firstAid: p.inventory.firstAid + 2,
      wood: p.inventory.wood + 4,
    },
  };
  emit(
    { type: "collect", target: id },
    log(next, "supplies", "Collected food, water, and repair supplies"),
  );
  publish({
    notice:
      "Care supplies collected: food, water, rescue kits, and repair materials.",
  });
}
export function talkNpc(id: string) {
  const npc = NPCS[id];
  if (!npc) return;
  let p = snapshot.progress;
  const key = `talk:${id}:${p.day}`;
  if (!p.completed.includes(key))
    p = {
      ...p,
      completed: [...p.completed.slice(-400), key],
      relationships: {
        ...p.relationships,
        [id]: Math.min(100, (p.relationships[id] ?? 0) + 5),
      },
    };
  p = emit({ type: "talk", target: id }, p);
  const choices: DialogueChoice[] = npc.questIds.flatMap<DialogueChoice>(
    (qid) => {
      const q = QUESTS.find((q) => q.id === qid)!,
        state = questState(p, q);
      return state === "available"
        ? [
            {
              label: "Accept: " + q.title,
              action: "accept" as const,
              target: qid,
            },
          ]
        : state === "completed"
          ? [
              {
                label: "Complete: " + q.title,
                action: "claim" as const,
                target: qid,
              },
            ]
          : [];
    },
  );
  if (id === "jo")
    choices.push({
      label: "Buy 5 food · 10 Kibble",
      action: "buy",
      target: "food",
    });
  publish({
    dialogue: {
      npcId: id,
      portrait: id,
      name: npc.name,
      text: dayPhase(p.minute) === "night" ? npc.night : npc.lines.join("\n\n"),
      choices,
    },
  });
}
export function buyFood() {
  const p = snapshot.progress;
  if (p.kibble < 10) {
    publish({ notice: "You need 10 Kibble for a food pack." });
    return;
  }
  persist(
    log(
      {
        ...p,
        kibble: p.kibble - 10,
        inventory: { ...p.inventory, food: p.inventory.food + 5 },
      },
      "buy",
      "Bought 5 animal food",
    ),
  );
  publish({ notice: "Five food packs added to your backpack." });
}
export function collectItem(
  id: string,
  item: keyof Progress["inventory"],
  amount = 1,
) {
  const p = snapshot.progress;
  if (p.completed.includes("pickup:" + id)) {
    publish({ notice: "You already collected this keepsake." });
    return;
  }
  let next = {
    ...p,
    completed: [...p.completed, "pickup:" + id],
    inventory: { ...p.inventory, [item]: p.inventory[item] + amount },
  };
  next = advanceQuests(next, { type: "collect", target: item });
  emit(
    { type: "collect", target: id },
    log(
      next,
      "collect",
      "Collected " + (item === "token" ? "a hidden paw token" : item),
    ),
  );
  publish({
    notice:
      "Collected " + (item === "foodBowl" ? "a clean food bowl" : item) + ".",
  });
}
export function improve(id: string) {
  const p = snapshot.progress,
    project = PROJECTS.find((x) => x.id === id);
  if (!project || p.upgrades.includes(id)) return;
  if (p.quests[project.requires]?.state !== "claimed") {
    publish({
      notice: "Complete Welcome to PawTrail before starting this project.",
    });
    return;
  }
  if (
    p.kibble < project.kibble ||
    p.inventory.wood < project.materials ||
    p.inventory.food < project.food
  ) {
    publish({
      notice: `Needs ${project.kibble} Kibble, ${project.materials} repair supplies, and ${project.food} food.`,
    });
    return;
  }
  emit(
    { type: "upgrade", target: id },
    log(
      {
        ...p,
        kibble: p.kibble - project.kibble,
        xp: p.xp + 20,
        inventory: {
          ...p.inventory,
          wood: p.inventory.wood - project.materials,
          food: p.inventory.food - project.food,
        },
        upgrades: [...p.upgrades, id],
      },
      "upgrade",
      "Improved: " + project.name,
    ),
  );
  publish({ notice: "Neighborhood improved: " + project.name });
  send({ type: "refresh" });
}
export function cleanStation(id: string) {
  const p = snapshot.progress,
    key = `clean:${id}:${p.day}`;
  if (p.completed.includes(key)) {
    publish({ notice: "Already clean and welcoming today." });
    return;
  }
  emit(
    { type: "clean", target: id },
    log(
      {
        ...p,
        completed: [...p.completed.slice(-400), key],
        kibble: p.kibble + 5,
        totalEarned: p.totalEarned + 5,
      },
      "clean",
      "Cleaned the feeding station",
      5,
    ),
  );
  publish({ notice: "A clean station, a happier care circle. +5 Kibble" });
}
export function stationWater(id: string) {
  const p = snapshot.progress,
    key = `water:${id}:${p.day}`;
  if (p.completed.includes(key) || p.inventory.water < 1) {
    publish({
      notice:
        p.inventory.water < 1
          ? "Pick up more fresh water."
          : "This bowl is already full today.",
    });
    return;
  }
  emit(
    { type: "water", target: id, unique: id },
    log(
      {
        ...p,
        kibble: p.kibble + 4,
        totalEarned: p.totalEarned + 4,
        completed: [...p.completed.slice(-400), key],
        inventory: { ...p.inventory, water: p.inventory.water - 1 },
      },
      "water",
      "Refilled a station water bowl",
      4,
    ),
  );
  publish({ notice: "Fresh water, ready for visitors. +4 Kibble" });
}
export function advanceClock(minutes = 1) {
  const p = snapshot.progress,
    next = advanceTime(p, minutes);
  publish({ progress: next });
  if (next.day !== p.day) {
    persist(next);
    publish({
      notice: `Day ${next.day}. New daily quests and refreshed care supplies await.`,
    });
    send({ type: "refresh" });
  }
}
export function rest(morning = false) {
  const p = snapshot.progress;
  advanceClock(morning ? 1440 - p.minute + 420 : 60);
  persist(snapshot.progress);
  publish({
    notice: morning
      ? "A new morning, with no penalty for taking your time."
      : "An hour passes peacefully.",
  });
  send({ type: "refresh" });
}
export function savePosition(x: number, y: number, scene: SceneId) {
  persist({
    ...snapshot.progress,
    position: { x: Math.round(x), y: Math.round(y), scene },
  });
}
export function resetProgress() {
  persist(freshProgress());
  publish({
    nearby: null,
    dialogue: null,
    notice: "A fresh story begins.",
    busy: false,
  });
  send({ type: "reset" });
}

export function persistStarted() {
  persist({ ...snapshot.progress, started: true });
}

export function restoreSave(value: unknown) {
  const p = parseSave(value);
  if (!p) return false;
  persist(p);
  publish({ dialogue: null, notice: "Your saved story has been restored." });
  send({ type: "reload" });
  return true;
}

/** Scene photographs are local keepsakes; they grant no care evidence, quests or currency. */
export function saveScenePhoto(image: string, location: SceneId) {
  if (!image.startsWith("data:image/png;base64,") || image.length >= 300000) {
    publish({
      notice: "This photo is too large to keep. Try a smaller game window.",
    });
    return;
  }
  const p = snapshot.progress;
  persist({
    ...p,
    photos: [
      {
        id: crypto.randomUUID(),
        animalId: "scene:" + location,
        day: p.day,
        pose: "landscape",
        location,
        image,
      },
      ...p.photos,
    ].slice(0, 12),
  });
  publish({
    notice:
      snapshot.save === "unavailable"
        ? "The photo is in your album, but device storage is full. Download it before leaving."
        : "A moment saved to your album on this device.",
  });
}

export function syncCharacterAppearance(appearance: CharacterId) {
  if (snapshot.progress.appearance === appearance) return;
  persist({ ...snapshot.progress, appearance });
  send({ type: "appearance" });
}
