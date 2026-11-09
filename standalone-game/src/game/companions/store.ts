import { companionRequest, homes, patch as patchHome } from "../housing/client";
import { gameStore, publish, persist, applyCare } from "../store";
import { advanceNeeds } from "../systems/animal-needs";
import { ANIMALS } from "../data";
export type Needs = { food: number; water: number; virtual?: boolean };
export type Companion = {
  id: string;
  profile: {
    id?: string;
    name: string;
    slug?: string;
    species: string;
    photo?: { url: string; alt?: string } | null;
    description?: string;
  };
  sprite: string;
  owner: string;
  following: string | null;
  room: string;
  command: { mode?: string; point?: number[]; at?: number };
  position?: { x: number; y: number; room?: string };
  needs: Needs;
  friendship: number;
  source?: "local" | "server";
};
type CompanionSnapshot = {
  player: string;
  animals: Companion[];
  quests: CareQuest[];
  room: string;
  order: string[];
  maximum: number;
  wallet: number;
  supplies: Record<string, number>;
};
export type CareQuest = {
  id: string;
  title: string;
  pet: string;
  kind: string;
  cycle: number;
  state: string;
  reward: number;
  description: string;
  progress: number;
  target: number;
};
type State = {
  player?: string;
  pinnedQuest?: string;
  supplies?: Record<string, number>;
  animals: Companion[];
  quests: CareQuest[];
  room: string;
  selected: string | null;
  moveTarget: string | null;
  order: string[];
  status: "loading" | "ready" | "offline";
  error: string;
  busy: boolean;
  maximum: number;
  wallet?: number;
};
let state: State = {
  animals: [],
  quests: [],
  room: "story:neighborhood",
  selected: null,
  moveTarget: null,
  order: [],
  status: "loading",
  error: "",
  busy: false,
  maximum: 3,
};
let visibleLocals = new Set<string>();
export function setVisibleLocalAnimals(ids: string[]) {
  visibleLocals = new Set(ids);
  patchCompanions({});
}
const listeners = new Set<() => void>();
export const companions = {
  get: () => state,
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
export const companionPositions = new Map<string, { x: number; y: number }>();
export function patchCompanions(value: Partial<State>) {
  state = { ...state, ...value };
  const home = homes.get();
  if (
    home.data &&
    state.player === home.data.player.id &&
    (value.wallet !== undefined || value.supplies !== undefined)
  )
    patchHome({
      data: {
        ...home.data,
        player: {
          ...home.data.player,
          wallet: value.wallet ?? home.data.player.wallet,
          supplies: value.supplies ?? home.data.player.supplies,
        },
      },
    });
  listeners.forEach((fn) => fn());
  publish({});
}
export function localAnimals(): Companion[] {
  const p = gameStore.getSnapshot().progress,
    extra = p.gameAnimals ?? {};
  return ANIMALS.filter(
    (a) => a.species === "cat" && !p.rescued.includes(a.id),
  ).map((a) => {
    const data = extra[a.id];
    return {
      id: "local:" + a.id,
      profile: {
        name: a.name,
        species: a.species,
        description: "A fictional neighbor in your local story.",
      },
      sprite: a.sprite,
      owner: "local",
      following: data?.companion ? "local" : null,
      room: data?.room ?? "story:" + p.position.scene,
      command: {
        mode: data?.mode ?? "idle",
        point: data?.point,
        at: data?.commandAt,
      },
      position: data?.position,
      needs: data?.needs ?? { food: 75, water: 75 },
      friendship: p.animals[a.id]?.trust ?? a.trust,
      source: "local",
    };
  });
}
export async function refreshCompanions(
  room = state.room,
  signal?: AbortSignal,
) {
  try {
    const data = await companionRequest<CompanionSnapshot>(
      undefined,
      room,
      signal,
    );
    if (signal?.aborted) return;
    patchCompanions({
      ...data,
      order:
        state.player === data.player && state.order.length
          ? state.order
          : [
              ...data.order,
              ...(() => {
                try {
                  return JSON.parse(
                    localStorage.getItem("pawtrail:animal-order") ?? "[]",
                  ).filter(
                    (id: unknown) =>
                      typeof id === "string" && id.startsWith("local:"),
                  );
                } catch {
                  return [];
                }
              })(),
            ],
      animals: data.animals.map((a) => ({ ...a, source: "server" as const })),
      status: "ready",
      error: "",
    });
  } catch (error) {
    if (signal?.aborted) return;
    patchCompanions({
      status: "offline",
      error: state.animals.length
        ? "Account animals could not refresh. Reconnect to give commands."
        : "",
    });
  }
}
export function combinedAnimals() {
  const locals = state.room.startsWith("story:")
    ? localAnimals().filter(
        (a) => visibleLocals.has(a.id.slice(6)) || a.following === "local",
      )
    : localAnimals().filter((a) => a.following === "local");
  return [...state.animals, ...locals];
}
export async function animalCommand(
  action: string,
  id?: string,
  point?: number[],
) {
  patchCompanions({ error: "" });
  if (action === "follow") {
    const all = combinedAnimals(),
      active = all.filter(
        (a) =>
          a.following === "local" ||
          (!!state.player && a.following === state.player),
      );
    if (active.length >= 3 && !active.some((a) => a.id === id)) {
      patchCompanions({
        error:
          "Three companions are already accompanying you. Return one home first.",
      });
      return false;
    }
  }
  if (id?.startsWith("local:")) {
    if (action === "feed" || action === "water" || action === "pet") {
      const ok = applyCare(action, id.slice(6));
      if (!ok) patchCompanions({ error: gameStore.getSnapshot().notice });
      return ok;
    }
    const p = gameStore.getSnapshot().progress,
      key = id.slice(6),
      a = localAnimals().find((a) => a.id === id);
    if (!a) return;
    if (["follow", "stay", "move"].includes(action) && a.friendship < 20) {
      patchCompanions({
        error: "Build 20 trust with this cat before inviting it along.",
      });
      return;
    }
    const current = p.gameAnimals?.[key] ?? {
      needs: { food: 75, water: 75 },
      updated: Date.now(),
      cycle: { food: 0, water: 0 },
      claimed: [],
    };
    if (
      action === "follow" &&
      localAnimals().filter((a) => a.following === "local").length >= 3 &&
      !current.companion
    ) {
      patchCompanions({ error: "Three cats are already accompanying you." });
      return;
    }
    persist({
      ...p,
      gameAnimals: {
        ...p.gameAnimals,
        [key]: {
          ...current,
          companion:
            action === "home"
              ? false
              : action === "follow"
                ? true
                : current.companion,
          mode: action === "home" ? "idle" : action,
          room:
            action === "home"
              ? (current.homeRoom ?? "story:neighborhood")
              : state.room,
          homeRoom: current.homeRoom ?? state.room,
          point,
          commandAt: Date.now(),
        },
      },
    });
    patchCompanions({ selected: id, moveTarget: null });
    return true;
  }
  if (action === "move-mode") {
    patchCompanions({ moveTarget: id ?? null, selected: id ?? null });
    return;
  }
  const requestedRoom = state.room;
  patchCompanions({ busy: true });
  try {
    const data = await companionRequest<CompanionSnapshot>({
      action,
      pet: id,
      point,
      room: state.room,
    });
    if (state.room !== requestedRoom) {
      patchCompanions({ wallet: data.wallet, supplies: data.supplies });
      void refreshCompanions(state.room);
      return true;
    }
    patchCompanions({
      ...data,
      animals: data.animals.map((a) => ({ ...a, source: "server" as const })),
      status: "ready",
      moveTarget: null,
    });
    return true;
  } catch (error) {
    patchCompanions({
      error:
        error instanceof Error
          ? error.message
          : "This animal action could not finish.",
    });
  } finally {
    patchCompanions({ busy: false });
  }
}
export function startMove(id: string) {
  patchCompanions({ moveTarget: id, selected: id });
}
export async function claimCareQuest(id: string) {
  if (id.startsWith("local-care:")) {
    const [, animal, kind, cycle] = id.split(":"),
      p = gameStore.getSnapshot().progress,
      a = p.gameAnimals?.[animal],
      key = kind + ":" + cycle;
    if (!a || !a.completed?.includes(key) || a.claimed.includes(key)) return;
    const active = { ...a.active };
    delete active[kind as "food" | "water"];
    persist({
      ...p,
      kibble: p.kibble + 5,
      totalEarned: p.totalEarned + 5,
      gameAnimals: {
        ...p.gameAnimals,
        [animal]: { ...a, active, claimed: [...a.claimed, key] },
      },
    });
    patchCompanions({});
    return;
  }
  try {
    const data = await companionRequest<Partial<State>>({
      action: "claim",
      quest: id,
      room: state.room,
    });
    patchCompanions(data);
  } catch (error) {
    patchCompanions({ error: String(error) });
  }
}
export async function reorderAnimals(order: string[]) {
  patchCompanions({ order });
  try {
    const ids = order.filter((id) =>
      state.animals.some((a) => a.id === id && a.owner === state.player),
    );
    if (state.status === "ready")
      await companionRequest({ action: "order", order: ids, room: state.room });
    localStorage.setItem("pawtrail:animal-order", JSON.stringify(order));
  } catch (error) {
    patchCompanions({ error: "The order could not be saved. Try again." });
  }
}

export function tickLocalNeeds() {
  const p = gameStore.getSnapshot().progress,
    ids = combinedAnimals()
      .filter((a) => a.source === "local")
      .map((a) => a.id.slice(6));
  if (ids.length) persist(advanceNeeds(p, ids));
  patchCompanions({});
}
export function localCareQuests(): CareQuest[] {
  const p = gameStore.getSnapshot().progress;
  return Object.entries(p.gameAnimals ?? {}).flatMap(([id, a]) =>
    (Object.entries(a.active ?? {}) as ["food" | "water", number][]).map(
      ([kind, cycle]) => ({
        id: "local-care:" + id + ":" + kind + ":" + cycle,
        title:
          (kind === "food" ? "Feed " : "Bring water to ") +
          (ANIMALS.find((x) => x.id === id)?.name ?? id),
        pet: "local:" + id,
        kind,
        cycle,
        state: a.claimed.includes(kind + ":" + cycle)
          ? "claimed"
          : a.completed?.includes(kind + ":" + cycle)
            ? "completed"
            : "active",
        reward: 5,
        description:
          "A care need in your local story. Offer a successful serving.",
        progress: Math.round(a.needs[kind]),
        target: 60,
      }),
    ),
  );
}
export function travelLocalCompanions(room: string) {
  const p = gameStore.getSnapshot().progress,
    animals = { ...p.gameAnimals };
  let changed = false;
  for (const [id, a] of Object.entries(animals))
    if (a.companion && a.mode !== "stay" && a.room !== room) {
      animals[id] = {
        ...a,
        room,
        mode: "follow",
        point: undefined,
        position: undefined,
        commandAt: Date.now(),
      };
      changed = true;
    }
  if (changed) persist({ ...p, gameAnimals: animals });
}

export function saveLocalCompanionPositions(
  positions: Record<string, { x: number; y: number }>,
) {
  const p = gameStore.getSnapshot().progress,
    animals = { ...p.gameAnimals };
  let changed = false;
  for (const [id, position] of Object.entries(positions)) {
    const key = id.replace("local:", ""),
      a = animals[key];
    if (a) {
      animals[key] = { ...a, position };
      changed = true;
    }
  }
  if (changed) persist({ ...p, gameAnimals: animals });
}
