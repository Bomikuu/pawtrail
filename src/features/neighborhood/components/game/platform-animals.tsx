import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  Heart,
  Home,
  LoaderCircle,
  PawPrint,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { gameStore, publish, send } from "@/features/neighborhood/game/store";
import {
  adoptionHref,
  clearGameReturn,
  eligibleEncounter,
  gameHref,
  profileHref,
  rememberGameReturn,
  type PlatformAnimal,
  type PlatformAnimalDetail,
  type PlatformBridge,
} from "@/features/neighborhood/game/platform";

const DIRECTORY = "@directory";
export function openAnimalDirectory() {open(DIRECTORY)}
function open(id: string) {
  publish({ platformAnimalRequest: id, dialogue: null });
}
function checkpoint(id: string) {
  send({ type: "pause", paused: true }); // Saves the exact current position before navigation.
  rememberGameReturn(id);
}
function syncAnimals(animals: PlatformAnimal[]) {
  publish({ platformAnimals: animals });
  send({ type: "platform-sync" });
}
function ProfilePhoto({
  animal,
  className = "",
}: {
  animal: PlatformAnimal;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return animal.photo && !failed ? (
    <img
      src={animal.photo.url}
      alt={animal.photo.alt}
      loading="lazy"
      className={"object-cover " + className}
      onError={() => setFailed(true)}
    />
  ) : (
    <div className={"grid place-items-center bg-muted " + className}>
      <PawPrint
        className="size-8 text-muted-foreground"
        aria-label="No profile photograph available"
      />
    </div>
  );
}
export function PlatformAnimals({
  bridge,
  request,
}: {
  bridge?: PlatformBridge;
  request: string | null;
}) {
  const [animals, setAnimals] = useState<PlatformAnimal[]>([]);
  const [listLoading, setListLoading] = useState(!!bridge);
  const [listError, setListError] = useState("");
  const [detail, setDetail] = useState<PlatformAnimalDetail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [revision, setRevision] = useState(0);
  const listRequest = useRef<AbortController | null>(null);
  const detailRequest = useRef<AbortController | null>(null);
  const actionRequest = useRef<AbortController | null>(null);
  const actionLock = useRef(false);
  const selected = request && request !== DIRECTORY ? request : null;
  const refreshList = useCallback(async () => {
    if (!bridge) return;
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    const timeout = setTimeout(() => controller.abort("timeout"), 15000);
    setListLoading(true);
    setListError("");
    try {
      const result = await bridge.list(controller.signal);
      if (controller.signal.aborted) return;
      setAnimals(result);
      syncAnimals(result);
    } catch {
      if (controller.signal.reason !== "timeout" && controller.signal.aborted)
        return;
      setListError(
        "PawTrail animals couldn’t load. You can keep exploring and try again.",
      );
      setAnimals([]);
      syncAnimals([]);
    } finally {
      clearTimeout(timeout);
      if (listRequest.current === controller) setListLoading(false);
    }
  }, [bridge]);
  useEffect(() => {
    if (!bridge) return;
    void refreshList();
    const id = new URLSearchParams(window.location.search).get("animalId");
    if (id && id.length <= 120) {
      clearGameReturn();
      open(id);
    }
    const onFocus = () => {
      void refreshList();
      setRevision((n) => n + 1);
    };
    window.addEventListener("focus", onFocus);
    return () => {
      listRequest.current?.abort();
      detailRequest.current?.abort();
      actionRequest.current?.abort();
      window.removeEventListener("focus", onFocus);
      syncAnimals([]);
    };
  }, [bridge, refreshList]);
  useEffect(() => {
    detailRequest.current?.abort();
    actionRequest.current?.abort();
    actionRequest.current = null;
    actionLock.current = false;
    setDetail(null);
    setDetailError("");
    setFeedback("");
    setBusy(null);
    if (!bridge || !selected) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    detailRequest.current = controller;
    setLoading(true);
    const timeout = setTimeout(() => controller.abort("timeout"), 15000);
    void bridge
      .get(selected, controller.signal)
      .then((animal) => {
        if (controller.signal.aborted) return;
        setDetail(animal);
        const current = gameStore.getSnapshot().platformAnimals;
        const refreshed = eligibleEncounter(animal)
          ? current.map((a) => (a.id === animal.id ? animal : a))
          : current.filter((a) => a.id !== animal.id);
        setAnimals(refreshed);
        syncAnimals(refreshed);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted && controller.signal.reason !== "timeout")
          return;
        const unavailable =
          error &&
          typeof error === "object" &&
          "status" in error &&
          [403, 404, 410].includes(Number(error.status));
        setDetailError(
          unavailable
            ? "This animal is no longer publicly available. Browse the directory for other animals."
            : "This profile couldn’t load. Please try again before taking an action.",
        );
        if (unavailable) {
          const current = gameStore
            .getSnapshot()
            .platformAnimals.filter((a) => a.id !== selected);
          setAnimals(current);
          syncAnimals(current);
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        if (
          !controller.signal.aborted ||
          controller.signal.reason === "timeout"
        )
          setLoading(false);
      });
    return () => {
      clearTimeout(timeout);
      controller.abort();
      actionRequest.current?.abort();
    };
  }, [bridge, selected, revision]);

  async function toggle(kind: "follow" | "save") {
    if (!bridge || !detail || actionLock.current) return;
    actionLock.current = true;
    const controller = new AbortController();
    actionRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setBusy(kind);
    setFeedback("");
    const active =
      kind === "follow" ? !detail.viewer.following : !detail.viewer.saved;
    try {
      await bridge[kind](detail.id, active, controller.signal);
      if (controller.signal.aborted) return;
      setDetail((current) =>
        current && current.id === detail.id
          ? {
              ...current,
              viewer: {
                ...current.viewer,
                ...(kind === "follow"
                  ? { following: active }
                  : { saved: active }),
              },
            }
          : current,
      );
      setFeedback(
        kind === "follow"
          ? active
            ? "Following on PawTrail."
            : "Unfollowed on PawTrail."
          : active
            ? "Saved to your PawTrail account."
            : "Removed from saved animals.",
      );
    } catch {
      if (actionRequest.current === controller)
        setFeedback(
          "Your account action couldn’t be confirmed. Refresh the profile before trying again.",
        );
    } finally {
      clearTimeout(timeout);
      if (actionRequest.current === controller) {
        setBusy(null);
        actionLock.current = false;
      }
    }
  }
  async function adopt() {
    if (!bridge || !detail || actionLock.current) return;
    actionLock.current = true;
    const controller = new AbortController();
    actionRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setBusy("adopt");
    setFeedback("");
    try {
      const current = await bridge.get(detail.id, controller.signal);
      if (controller.signal.aborted) return;
      setDetail(current);
      const href = adoptionHref(current);
      if (!href) {
        setFeedback(
          "This animal is no longer accepting applications. Its current profile is shown above.",
        );
        void refreshList();
        return;
      }
      checkpoint(current.id);
      window.location.assign(
        current.viewer.authenticated ? href : bridge.loginHref(href),
      );
    } catch {
      if (actionRequest.current === controller)
        setFeedback(
          "Availability couldn’t be confirmed. Please refresh and try again.",
        );
    } finally {
      clearTimeout(timeout);
      if (actionRequest.current === controller) {
        setBusy(null);
        actionLock.current = false;
      }
    }
  }
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => open(DIRECTORY)}
        aria-label="Meet animals from PawTrail"
      >
        <PawPrint className="size-4" />
        <span className="hidden sm:inline">Meet animals</span>
        {bridge && !listLoading && !listError && (
          <span className="tabular-nums">{animals.length}</span>
        )}
      </Button>
      <Dialog
        open={!!request}
        onOpenChange={(value) => {
          if (!value) publish({ platformAnimalRequest: null });
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-2xl p-5 sm:max-w-2xl">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle className="font-heading text-2xl font-extrabold">
              {selected
                ? (detail?.name ?? "Meet a PawTrail animal")
                : "Little encounters. Real connections."}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? "Published details from the PawTrail platform."
                : "Meet adoptable shelter animals as pixel neighbors, then get to know their lives on PawTrail."}
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-xl bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Game encounters are fictional representations, placed in a themed
            world. Game care and Kibble stay in your local save; adoption and
            verified help happen on PawTrail.
          </p>
          {!bridge ? (
            <div className="space-y-2 py-6 text-center">
              <PawPrint className="mx-auto size-10 text-primary" />
              <p className="font-bold">
                Platform encounters are available in PawTrail.
              </p>
              <p className="text-sm text-muted-foreground">
                Open the community app’s /play page to meet its published
                animals. This standalone world uses fictional neighbors.
              </p>
            </div>
          ) : !selected ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold">Looking for a home</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={listLoading}
                  onClick={() => void refreshList()}
                >
                  <RefreshCw
                    className={
                      "size-4 " +
                      (listLoading ? "motion-safe:animate-spin" : "")
                    }
                  />
                  Refresh
                </Button>
              </div>
              {listLoading ? (
                <div
                  className="grid grid-cols-2 gap-3"
                  role="status"
                  aria-label="Loading PawTrail animals"
                >
                  {Array.from({ length: 4 }, (_, i) => (
                    <div
                      key={i}
                      className="space-y-3 rounded-xl border p-3 motion-safe:animate-pulse"
                    >
                      <div className="mx-auto size-20 rounded-full bg-muted" />
                      <div className="mx-auto h-4 w-24 rounded bg-muted" />
                      <div className="mx-auto h-3 w-32 max-w-full rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : listError ? (
                <p role="alert" className="py-6 text-sm">
                  {listError}
                </p>
              ) : !animals.length ? (
                <div className="py-8 text-center">
                  <Home className="mx-auto mb-3 size-9 text-primary" />
                  <h3 className="font-bold">No shelter encounters right now</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Published adoptable cats and dogs with a shelter will appear
                    here. Your fictional neighborhood is still ready to explore.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {animals.map((animal) => (
                    <Button
                      variant="ghost"
                      key={animal.id}
                      onClick={() => open(animal.id)}
                      className="group flex h-auto flex-col items-center gap-2 whitespace-normal rounded-xl border bg-card p-3 text-center transition-colors hover:border-primary hover:bg-accent"
                    >
                      <ProfilePhoto
                        key={animal.photo?.url}
                        animal={animal}
                        className="size-20 rounded-full"
                      />
                      <span className="font-extrabold">{animal.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {animal.species} · {animal.ageMonths === null ? 'Age not recorded' : animal.ageMonths + ' months'}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {animal.provenance.kind === "real"
                          ? "Platform animal"
                          : "Sample profile"}
                      </Badge>
                    </Button>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Up to 12 public shelter animals appear in the neighborhood and
                shelter. The pixel coat is a stylized representation; their
                profile photo shows their appearance.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => open(DIRECTORY)}
                >
                  <ArrowLeft className="size-4" />
                  All animals
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loading || !!busy}
                  onClick={() => setRevision((n) => n + 1)}
                >
                  <RefreshCw
                    className={
                      "size-4 " + (loading ? "motion-safe:animate-spin" : "")
                    }
                  />
                  Refresh
                </Button>
              </div>
              {loading ? (
                <div
                  className="space-y-4 motion-safe:animate-pulse"
                  role="status"
                  aria-label="Loading current animal profile"
                >
                  <div className="h-44 rounded-xl bg-muted" />
                  <div className="h-5 w-2/3 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-4/5 rounded bg-muted" />
                </div>
              ) : detailError ? (
                <p role="alert" className="py-6 text-sm">
                  {detailError}
                </p>
              ) : (
                detail && (
                  <>
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <ProfilePhoto
                        key={detail.photo?.url}
                        animal={detail}
                        className="h-48 w-full rounded-xl sm:size-40"
                      />
                      <div className="min-w-0 space-y-2">
                        <Badge variant="secondary">
                          {detail.provenance.label}
                        </Badge>
                        <p className="text-sm capitalize">
                          {detail.species} · {detail.gender} ·{" "}
                          {detail.ageMonths === null ? 'Age not recorded' : detail.ageMonths + ' months'} · {detail.size}
                        </p>
                        <p className="flex items-center gap-1.5 text-sm">
                          <Home className="size-4 shrink-0" />
                          {detail.shelter?.name ??
                            (detail.shelterId
                              ? "Shelter profile unavailable"
                              : "Community care")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {detail.neighborhood} · Approximate area only
                        </p>
                        <Badge
                          variant={adoptionHref(detail) ? "default" : "outline"}
                        >
                          {adoptionHref(detail)
                            ? "Accepting adoption applications"
                            : detail.status === "adopted"
                              ? "Adopted"
                              : "Not accepting applications"}
                        </Badge>
                      </div>
                    </div>
                    <p className="whitespace-pre-line text-sm leading-relaxed">
                      {detail.description ||
                        "No introduction has been published yet."}
                    </p>
                    {!!detail.personality.length && (
                      <div className="flex flex-wrap gap-1.5">
                        {detail.personality.map((trait, i) => (
                          <Badge key={i} variant="outline">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <section className="rounded-xl border p-3">
                        <h3 className="mb-2 font-bold">Published care needs</h3>
                        {detail.needs.length ? (
                          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                            {detail.needs.map((need, i) => (
                              <li key={i}>{need}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No home requirements have been published. Ask the
                            shelter through the adoption process.
                          </p>
                        )}
                      </section>
                      <section className="rounded-xl border p-3">
                        <h3 className="mb-2 font-bold">Observations</h3>
                        <p className="text-sm text-muted-foreground">
                          {detail.observedCondition ||
                            "No condition notes published."}
                        </p>
                        {!!detail.behavior.length && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {detail.behavior.join(" · ")}
                          </p>
                        )}
                      </section>
                    </div>
                    {detail.provenance.kind !== "real" && (
                      <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed">
                        This is an illustrative PawTrail profile. Its adoption
                        and mission activity is part of the sample community.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {adoptionHref(detail) && (
                        <Button disabled={!!busy} onClick={() => void adopt()}>
                          {busy === "adopt" ? (
                            <LoaderCircle className="size-4 motion-safe:animate-spin" />
                          ) : (
                            <Heart className="size-4" />
                          )}
                          Apply to adopt
                        </Button>
                      )}
                      <Button asChild variant="outline">
                        <a
                          href={profileHref(detail)}
                          onClick={() => checkpoint(detail.id)}
                        >
                          View profile
                          <ArrowUpRight className="size-4" />
                        </a>
                      </Button>
                      {detail.viewer.authenticated ? (
                        <>
                          <Button
                            variant="outline"
                            disabled={
                              !!busy || detail.viewer.following === null
                            }
                            aria-pressed={detail.viewer.following ?? false}
                            onClick={() => void toggle("follow")}
                          >
                            {busy === "follow" ? (
                              <LoaderCircle className="size-4 motion-safe:animate-spin" />
                            ) : detail.viewer.following ? (
                              <Check className="size-4" />
                            ) : (
                              <Users className="size-4" />
                            )}
                            {detail.viewer.following ? "Following" : "Follow"}
                          </Button>
                          <Button
                            variant="outline"
                            disabled={!!busy}
                            aria-pressed={detail.viewer.saved}
                            onClick={() => void toggle("save")}
                          >
                            {busy === "save" ? (
                              <LoaderCircle className="size-4 motion-safe:animate-spin" />
                            ) : (
                              <Bookmark
                                className={
                                  "size-4 " +
                                  (detail.viewer.saved ? "fill-current" : "")
                                }
                              />
                            )}
                            {detail.viewer.saved ? "Saved" : "Save"}
                          </Button>
                        </>
                      ) : (
                        <Button asChild variant="outline">
                          <a
                            href={bridge.loginHref(gameHref(detail.id))}
                            onClick={() => checkpoint(detail.id)}
                          >
                            Sign in to follow or save
                          </a>
                        </Button>
                      )}
                    </div>
                    {feedback && (
                      <p role="status" className="text-sm">
                        {feedback}
                      </p>
                    )}
                    {!!detail.warnings.length && (
                      <div
                        className="space-y-1 text-xs text-muted-foreground"
                        role="status"
                      >
                        {detail.warnings.map((warning) => (
                          <p key={warning}>{warning}</p>
                        ))}
                      </div>
                    )}
                    <section className="space-y-2 rounded-xl border p-3">
                      <h3 className="font-bold">Help beyond the game</h3>
                      {detail.missions.length ? (
                        detail.missions.map((mission) => (
                          <a
                            key={mission.id}
                            href={mission.href}
                            onClick={() => checkpoint(detail.id)}
                            className="flex items-center justify-between gap-3 rounded-lg p-2 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span>
                              {mission.title}
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {mission.sample ? "Sample mission · " : ""}
                                {mission.reward} platform Kibble after verified
                                approval
                              </span>
                            </span>
                            <ArrowUpRight className="size-4 shrink-0" />
                          </a>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No current linked missions. Following this animal
                          helps you keep up with new requests.
                        </p>
                      )}
                      {detail.shelter && (
                        <Button
                          asChild
                          size="sm"
                          variant="link"
                          className="px-0"
                        >
                          <a
                            href={detail.shelter.href}
                            onClick={() => checkpoint(detail.id)}
                          >
                            Visit {detail.shelter.name}
                            <ArrowUpRight className="size-4" />
                          </a>
                        </Button>
                      )}
                    </section>
                    <p className="text-[11px] text-muted-foreground">
                      Profile checked{" "}
                      {new Date(detail.checkedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      . Availability is checked again before applying. A shelter
                      reviews every application; meeting an animal in-game does
                      not reserve it.
                    </p>
                  </>
                )
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
