/** Public game-facing projection. Coordinates, care evidence and private records never enter this model. */
export type PlatformAnimal = {
  id: string;
  slug: string;
  name: string;
  species: "cat" | "dog";
  sprite: string;
  ageMonths: number;
  gender: string;
  size: string;
  status: string;
  adoptable: boolean;
  shelterId: string | null;
  neighborhood: string;
  photo: { url: string; alt: string } | null;
  provenance: { kind: "sample" | "demo" | "real"; label: string };
};
export type PlatformAnimalDetail = PlatformAnimal & {
  description: string;
  appearance: string;
  personality: string[];
  behavior: string[];
  observedCondition: string;
  needs: string[];
  checkedAt: string;
  shelter: { name: string; href: string } | null;
  missions: {
    id: string;
    title: string;
    href: string;
    reward: number;
    sample: boolean;
  }[];
  warnings: string[];
  viewer: { authenticated: boolean; following: boolean | null; saved: boolean };
};
export interface PlatformBridge {
  places?(signal: AbortSignal): Promise<import('./community').CommunityPlace[]>;
  list(signal: AbortSignal): Promise<PlatformAnimal[]>;
  get(id: string, signal: AbortSignal): Promise<PlatformAnimalDetail>;
  follow(id: string, active: boolean, signal: AbortSignal): Promise<void>;
  save(id: string, active: boolean, signal: AbortSignal): Promise<void>;
  loginHref(returnTo: string): string;
}
export const encounterId = (id: string) => "platform:" + id;
export const profileHref = (animal: PlatformAnimal) =>
  "/pets/" + encodeURIComponent(animal.slug);
export const gameHref = (id: string) =>
  "/play?animalId=" + encodeURIComponent(id);
export function adoptionHref(animal: PlatformAnimal) {
  return eligibleEncounter(animal)
    ? "/adopt/applications/new?animalId=" + encodeURIComponent(animal.id)
    : null;
}
export function eligibleEncounter(animal: PlatformAnimal) {
  return (
    animal.adoptable &&
    !!animal.shelterId &&
    ["community", "sheltered"].includes(animal.status)
  );
}
export function animalSprite(species: "cat" | "dog", appearance = "") {
  const coat = appearance.toLowerCase();
  if (species === "dog")
    return /spot|patch/.test(coat)
      ? "spotted_dog"
      : /white/.test(coat)
        ? "white_puppy"
        : "brown_aspin";
  if (/calico|tortoiseshell|tri.colou?r/.test(coat)) return "calico_cat";
  if (/siamese|point/.test(coat)) return "siamese_cat";
  if (/black/.test(coat)) return "black_cat";
  if (/white/.test(coat)) return "white_cat";
  return "orange_tabby";
}

const RETURN_KEY = "pawtrail:game-return:v1";
export function rememberGameReturn(id: string) {
  try {
    sessionStorage.setItem(RETURN_KEY, JSON.stringify({ id, at: Date.now() }));
  } catch {
    /* Position still persists through the game save. */
  }
}
export function readGameReturn(): string | null {
  try {
    const value: unknown = JSON.parse(
      sessionStorage.getItem(RETURN_KEY) ?? "null",
    );
    if (
      !value ||
      typeof value !== "object" ||
      !("id" in value) ||
      !("at" in value) ||
      typeof value.id !== "string" ||
      !value.id ||
      value.id.length > 120 ||
      typeof value.at !== "number" ||
      Date.now() - value.at > 24 * 60 * 60 * 1000
    )
      return null;
    return value.id;
  } catch {
    return null;
  }
}
export function clearGameReturn() {
  try {
    sessionStorage.removeItem(RETURN_KEY);
  } catch {
    /* Storage can be blocked. */
  }
}
