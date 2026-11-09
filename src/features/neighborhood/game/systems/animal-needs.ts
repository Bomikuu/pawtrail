import type { Progress } from "../types";
export type LocalAnimalState = {
  companion?: boolean;
  homeRoom?: string;
  position?: { x: number; y: number };
  mode?: string;
  room?: string;
  point?: number[];
  commandAt?: number;
  needs: { food: number; water: number };
  updated: number;
  cycle: { food: number; water: number };
  active?: Partial<Record<"food" | "water", number>>;
  completed?: string[];
  claimed: string[];
};
export function advanceNeeds(
  p: Progress,
  ids: string[],
  now = Date.now(),
): Progress {
  const animals = { ...p.gameAnimals };
  let changed = false;
  for (const id of ids) {
    const a = animals[id] ?? {
        needs: { food: 75, water: 75 },
        updated: now,
        cycle: { food: 0, water: 0 },
        claimed: [],
      },
      seconds = Math.max(0, (now - a.updated) / 1000),
      floor = seconds > 120 ? 20 : 0,
      needs = {
        food: Math.max(floor, a.needs.food - Math.min(25, seconds / 30)),
        water: Math.max(floor, a.needs.water - Math.min(25, seconds / 20)),
      },
      active = { ...a.active },
      cycle = { ...a.cycle };
    for (const kind of ["food", "water"] as const)
      if (needs[kind] < 30 && !active[kind]) {
        cycle[kind]++;
        active[kind] = cycle[kind];
      }
    animals[id] = { ...a, needs, updated: now, active, cycle };
    changed = true;
  }
  return changed ? { ...p, gameAnimals: animals } : p;
}
export function satisfyLocal(
  p: Progress,
  id: string,
  kind: "food" | "water",
): Progress {
  const base = advanceNeeds(p, [id]),
    a = base.gameAnimals![id],
    needs = { ...a.needs, [kind]: Math.min(100, a.needs[kind] + 45) },
    completed = [...(a.completed ?? [])],
    cycle = a.active?.[kind];
  if (cycle && needs[kind] >= 60 && !completed.includes(kind + ":" + cycle))
    completed.push(kind + ":" + cycle);
  return {
    ...base,
    gameAnimals: { ...base.gameAnimals, [id]: { ...a, needs, completed } },
  };
}
