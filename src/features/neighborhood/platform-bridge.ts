import { getBrowserApi } from "@/lib/api/client";
import { loginPath } from "@/features/auth/return-path";
import { demoClock, systemClock } from "@/lib/api/clock";
import type { AnimalSummary } from "@/features/animals/types";
import type {
  PlatformAnimal,
  PlatformAnimalDetail,
  PlatformBridge,
} from "@/features/neighborhood/game/platform";
import { animalSprite, eligibleEncounter } from "@/features/neighborhood/game/platform";

async function publicAnimal(id: string, signal: AbortSignal) {
  const api = getBrowserApi();
  // The normal detail endpoint also serves an owner's unpublished drafts. A public
  // listing gate keeps those drafts out of game deep links, even for that owner.
  const page = await api.animals.list(
    { scope: "public", ids: [id], limit: 1 },
    { signal },
  );
  const summary = page.items.find((animal) => animal.id === id);
  if (!summary)
    throw Object.assign(new Error("Animal is no longer public."), {
      status: 404,
    });
  const animal = await api.animals.get(summary.slug, { signal });
  if (
    animal.id !== id ||
    (animal.reviewState && animal.reviewState !== "published")
  )
    throw Object.assign(new Error("Animal is no longer public."), {
      status: 404,
    });
  return animal;
}

/** Explicit projection: never pass location coordinates, private notes or evidence into Phaser. */
function project(animal: AnimalSummary, appearance = ""): PlatformAnimal {
  if (animal.species !== "cat" && animal.species !== "dog")
    throw new Error("This animal has no game representation yet.");
  return {
    id: animal.id,
    slug: animal.slug,
    name: animal.name,
    species: animal.species,
    sprite: animalSprite(animal.species, appearance),
    ageMonths: animal.ageMonths,
    gender: animal.gender,
    size: animal.size,
    status: animal.status,
    adoptable: animal.adoptable,
    shelterId: animal.shelterId,
    neighborhood: animal.location.neighborhood,
    photo:
      animal.photo && !animal.photo.sensitive
        ? { url: animal.photo.url, alt: animal.photo.alt }
        : null,
    provenance: {
      kind: animal.provenance.kind,
      label: animal.provenance.label,
    },
  };
}
async function following(id: string, signal: AbortSignal) {
  const seen = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await getBrowserApi().follows.list(
      { kind: "animal", limit: 50, ...(cursor ? { cursor } : {}) },
      { signal },
    );
    if (
      page.items.some(
        (edge) => edge.target.kind === "animal" && edge.target.id === id,
      )
    )
      return true;
    cursor = page.nextCursor ?? undefined;
    if (cursor && seen.has(cursor))
      throw new Error("Following could not finish loading.");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return false;
}
export const platformBridge: PlatformBridge = {
  async places(signal) {
    const items: import('@/features/neighborhood/game/community').CommunityPlace[] = []
    const seen = new Set<string>()
    let cursor: string | undefined
    do {
      const page = await getBrowserApi().shelters.list({ limit: 50, ...(cursor ? { cursor } : {}) }, { signal })
      for (const shelter of page.items) {
        items.push({
          id: 'shelter:' + shelter.id, kind: 'shelter', name: shelter.name,
          description: shelter.description, area: shelter.location.neighborhood,
          coordinates: [shelter.location.longitude, shelter.location.latitude],
          locationLabel: `Published approximate location · about ${Math.round(shelter.location.approximateRadiusMeters)} m radius`,
          sample: shelter.provenance.kind !== 'real',
          photo: shelter.photo && !shelter.photo.sensitive ? { url: shelter.photo.url, alt: shelter.photo.alt } : null,
          entry: { kind: 'shelter', shelterId: shelter.id },
          profileHref: '/shelters/' + encodeURIComponent(shelter.slug),
        })
      }
      cursor = page.nextCursor ?? undefined
      if (cursor && seen.has(cursor)) throw new Error('The shelter directory could not finish loading.')
      if (cursor) seen.add(cursor)
    } while (cursor)
    return items
  },
  loginHref: loginPath,
  async list(signal) {
    const animals: PlatformAnimal[] = [],
      seen = new Set<string>();
    let cursor: string | undefined;
    do {
      const page = await getBrowserApi().animals.list(
        {
          scope: "public",
          adoptable: true,
          limit: 50,
          ...(cursor ? { cursor } : {}),
        },
        { signal },
      );
      for (const animal of page.items) {
        if (
          (animal.species === "cat" || animal.species === "dog") &&
          animal.shelterId &&
          (animal.reviewState === undefined ||
            animal.reviewState === "published")
        ) {
          const publicAnimal = project(animal);
          if (
            eligibleEncounter(publicAnimal) &&
            !animals.some((a) => a.id === animal.id)
          )
            animals.push(publicAnimal);
        }
        if (animals.length === 12) return animals;
      }
      cursor = page.nextCursor ?? undefined;
      if (cursor && seen.has(cursor))
        throw new Error("The animal directory could not finish loading.");
      if (cursor) seen.add(cursor);
    } while (cursor);
    return animals;
  },
  async get(id, signal) {
    const api = getBrowserApi(),
      animal = await publicAnimal(id, signal);
    if (animal.id !== id)
      throw new Error(
        "This animal profile changed. Please reopen the directory.",
      );
    const detail: PlatformAnimalDetail = {
      ...project(animal, animal.appearance),
      description: animal.description,
      appearance: animal.appearance,
      personality: [...animal.personality],
      behavior: [...animal.behavior],
      observedCondition: animal.observedCondition,
      needs: [],
      checkedAt: new Date().toISOString(),
      shelter: null,
      missions: [],
      warnings: [],
      viewer: {
        authenticated: false,
        following: null,
        saved: animal.viewerSaved,
      },
    };
    const n = animal.needs;
    if (n.suitableHomeTypes?.length)
      detail.needs.push("Suitable homes: " + n.suitableHomeTypes.join(", "));
    if (n.energy) detail.needs.push("Energy level: " + n.energy);
    if (n.requiresExperiencedHandler)
      detail.needs.push("Needs an experienced handler");
    if (n.compatiblePetTypes?.length)
      detail.needs.push("Can live with: " + n.compatiblePetTypes.join(", "));
    if (n.incompatiblePetTypes?.length)
      detail.needs.push("Separate from: " + n.incompatiblePetTypes.join(", "));
    // Related sections fail independently; the animal's public profile remains readable.
    const [session, shelter, missions] = await Promise.allSettled([
      api.auth.session({ signal }),
      animal.shelterId
        ? api.shelters.get(animal.shelterId, { signal })
        : Promise.resolve(null),
      Promise.allSettled(
        animal.missionIds
          .slice(0, 6)
          .map((missionId) => api.missions.get(missionId, { signal })),
      ),
    ]);
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    if (session.status === "fulfilled") {
      detail.viewer.authenticated = !!session.value.actor;
      if (session.value.actor) {
        try {
          detail.viewer.following = await following(id, signal);
        } catch {
          detail.warnings.push(
            "Following could not load. Refresh to try again.",
          );
        }
      }
    } else
      detail.warnings.push(
        "Your sign-in status could not load. Refresh before using account actions.",
      );
    if (shelter.status === "fulfilled" && shelter.value)
      detail.shelter = {
        name: shelter.value.name,
        href: "/shelters/" + encodeURIComponent(shelter.value.slug),
      };
    else if (animal.shelterId)
      detail.warnings.push("The shelter details are temporarily unavailable.");
    if (missions.status === "fulfilled") {
      for (const result of missions.value) {
        if (result.status !== "fulfilled") {
          detail.warnings.push("Some linked missions could not load.");
          continue;
        }
        const m = result.value;
        const now = (m.provenance.kind === "real" ? systemClock : demoClock)
          .now()
          .getTime();
        if (
          m.state === "open" &&
          new Date(m.deadline).getTime() > now &&
          (!m.animalId || m.animalId === animal.id)
        )
          detail.missions.push({
            id: m.id,
            title: m.title,
            href: "/missions/" + encodeURIComponent(m.slug),
            reward: m.rewardKibble,
            sample: m.provenance.kind !== "real",
          });
      }
    }
    detail.warnings = [...new Set(detail.warnings)];
    return detail;
  },
  async follow(id, active, signal) {
    // Resolve public visibility again; the normal API owns auth, CSRF and permissions.
    const animal = await publicAnimal(id, signal);
    if (animal.id !== id) throw new Error("Animal unavailable.");
    await getBrowserApi().follows.set({ kind: "animal", id }, active, {
      signal,
    });
  },
  async save(id, active, signal) {
    const animal = await publicAnimal(id, signal);
    if (animal.id !== id) throw new Error("Animal unavailable.");
    await getBrowserApi().animals.setSaved(id, active, { signal });
  },
};
