import {
  companions,
  localCareQuests,
  combinedAnimals,
  claimCareQuest,
  patchCompanions,
} from "./store";
import type { MissionView } from "../../components/game/immersion/missions";
export const isCareQuest = (id: string) =>
  id.startsWith("care:") || id.startsWith("local-care:");
export function careMissions(): MissionView[] {
  const animals = combinedAnimals();
  return [...companions.get().quests, ...localCareQuests()].map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    pet: animals.find((a) => a.id === q.pet)?.sprite ?? "orange_tabby",
    category: q.kind === "food" ? "Feeding Requests" : "Pet Care",
    difficulty: "A little kindness",
    reward: q.reward,
    status:
      q.state === "completed"
        ? "completed"
        : q.state === "claimed"
          ? "claimed"
          : "active",
    location:
      "With " +
      (animals.find((a) => a.id === q.pet)?.profile.name ?? "your animal"),
    objectives: [
      {
        text:
          "Help this animal " +
          (q.kind === "food" ? "eat" : "drink") +
          " until comfortable",
        count: ["completed", "claimed"].includes(q.state) ? 1 : 0,
        target: 1,
      },
    ],
  }));
}
export function claimGameCare(id: string, fallback: (id: string) => void) {
  if (isCareQuest(id)) void claimCareQuest(id);
  else fallback(id);
}

export function pinGameMission(id: string, fallback: (id: string) => void) {
  if (isCareQuest(id)) {
    patchCompanions({ pinnedQuest: id });
    try {
      localStorage.setItem(
        "pawtrail:care-pin:" + (companions.get().player ?? "local"),
        id,
      );
    } catch {}
  } else {
    patchCompanions({ pinnedQuest: undefined });
    fallback(id);
  }
}
export const pinnedCareMission = () => companions.get().pinnedQuest;
