import {
  claimGameCare,
  pinGameMission,
  pinnedCareMission,
} from "@/game/companions/missions";
import { GameReactions } from "./shared/reactions";
import { useState } from "react";
import {
  Backpack,
  BookOpen,
  Check,
  Compass,
  Download,
  Heart,
  Map,
  Music,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseSave } from "@/game/systems/save";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ANIMALS, QUESTS, ITEMS, PROJECTS } from "@/game/data";
import {
  accept,
  buyFood,
  chooseCharacter,
  claim,
  cleanStation,
  improve,
  publish,
  resetProgress,
  restoreSave,
  rest,
  stationWater,
  track,
} from "@/game/store";
import { memory } from "@/game/systems/care";
import { questKey, questState } from "@/game/systems/quests";
import { audio, type AudioPreferences } from "@/game/systems/audio";
import type { GameSnapshot } from "@/game/types";
import { WorldMap } from "./map-panel";
import { CharacterPicker } from "./character-picker";
import { GameDialogue } from "./dialogue";
import { InventoryPanel } from "./immersion/inventory";
import { CatSoundboard } from "./immersion/soundboard";
import { MissionBoard, localMissions } from "./immersion/missions";
import { useFoundItem, send } from "@/game/store";
export type Panel =
  | "journal"
  | "bag"
  | "help"
  | "pause"
  | "pause-confirm"
  | "map"
  | "photos"
  | "board"
  | "reactions"
  | "soundboard"
  | null;
const art = (id: string) =>
  "/pawtrail-game/game-assets/portraits/" + id + ".png";
export function GamePanels({
  panel,
  setPanel,
  state,
  closeDialogue,
}: {
  panel: Panel;
  setPanel: (p: Panel) => void;
  state: GameSnapshot;
  closeDialogue: () => void;
}) {
  const [pendingSave, setPendingSave] = useState<unknown>(null),
    [importMessage, setImportMessage] = useState("");
  const p = state.progress,
    [prefs, setPrefs] = useState<AudioPreferences>(audio.settings),
    [category, setCategory] = useState("main");
  const exportSave = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(p, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "pawtrail-progress.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const updateAudio = (patch: Partial<AudioPreferences>) => {
    void audio.unlock();
    setPrefs(audio.update(patch));
  };
  const title =
    panel === "reactions"
      ? "Share a little joy"
      : panel === "board"
        ? "Community mission board"
        : panel === "soundboard"
          ? "Cat Soundboard"
          : panel === "bag"
            ? "Your care backpack"
            : panel === "journal"
              ? "The care journal"
              : panel === "map"
                ? "Around the neighborhood"
                : panel === "photos"
                  ? "Moments worth keeping"
                  : panel === "help"
                    ? "A little field guide"
                    : panel === "pause-confirm"
                      ? "Start a fresh story?"
                      : "Take a breather";
  return (
    <>
      <Dialog
        open={!!panel}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-2xl font-extrabold">
              {panel === "bag" ? (
                <Backpack />
              ) : panel === "map" ? (
                <Map />
              ) : panel === "journal" ? (
                <BookOpen />
              ) : (
                <Heart />
              )}
              {title}
            </DialogTitle>
            <DialogDescription>
              Day {p.day} · {p.kibble} Kibble · Level{" "}
              {1 + Math.floor(p.xp / 100)} PawPal
            </DialogDescription>
          </DialogHeader>
          {panel === "bag" && (
            <InventoryPanel
              stock={{
                ...p.satchel,
                photo: p.photos.length,
                badge: p.badges.length,
              }}
              legacy={p.inventory}
              onUse={useFoundItem}
            />
          )}
          {panel === "board" && (
            <MissionBoard
              missions={localMissions(p)}
              onAccept={accept}
              onClaim={(id) => claimGameCare(id, claim)}
              pinned={pinnedCareMission() ?? p.trackedQuest}
              onPin={(id) => pinGameMission(id, track)}
              onGuide={(target) => {
                send({ type: "guide", target });
                setPanel(null);
              }}
            />
          )}
          {panel === "reactions" && (
            <GameReactions
              onReact={(emote) => {
                setPanel(null);
                send({ type: "emote", emote });
              }}
            />
          )}
          {panel === "soundboard" && (
            <CatSoundboard
              emit={(emote) => send({ type: "cat-sound", emote })}
            />
          )}
          {panel === "journal" && (
            <Tabs defaultValue="quests">
              <TabsList className="w-full">
                <TabsTrigger value="quests" className="flex-1">
                  Quests
                </TabsTrigger>
                <TabsTrigger
                  value="animals"
                  disabled={!p.unlocks.includes("journal")}
                  className="flex-1"
                >
                  Animals
                </TabsTrigger>
                <TabsTrigger value="community" className="flex-1">
                  Community
                </TabsTrigger>
              </TabsList>
              <TabsContent value="quests" className="space-y-4 pt-3">
                <div className="flex flex-wrap gap-1">
                  {[
                    "main",
                    "daily",
                    "side",
                    "exploration",
                    "community",
                    "event",
                    "completed",
                  ].map((cat) => (
                    <Button
                      key={cat}
                      variant={category === cat ? "secondary" : "ghost"}
                      size="sm"
                      className="capitalize"
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
                {QUESTS.filter((q) =>
                  category === "completed"
                    ? ["completed", "claimed"].includes(questState(p, q))
                    : q.category === category,
                ).map((q) => {
                  const status = questState(p, q),
                    qp = p.quests[questKey(q, p)],
                    done = q.objectives.filter(
                      (o, i) => (qp?.counts[i] ?? 0) >= (o.count ?? 1),
                    ).length;
                  return (
                    <section key={q.id} className="space-y-3 border-b pb-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-heading text-lg font-extrabold">
                            {q.title}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {q.description}
                          </p>
                        </div>
                        <span className="rounded bg-secondary px-2 py-1 text-[10px] capitalize">
                          {status}
                        </span>
                      </div>
                      <ProgressBar
                        value={(done / q.objectives.length) * 100}
                        className="h-1.5"
                      />
                      <ul className="space-y-2">
                        {q.objectives.map((o, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
                            {(qp?.counts[i] ?? 0) >= (o.count ?? 1) ? (
                              <Check className="mt-0.5 size-4 shrink-0 text-[#456746]" />
                            ) : (
                              <span className="mt-1 size-3.5 shrink-0 rounded-full border" />
                            )}
                            <span>
                              {o.text}
                              {(o.count ?? 1) > 1 &&
                                ` (${qp?.counts[i] ?? 0}/${o.count})`}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="mr-auto text-xs text-primary">
                          {q.reward} Kibble · {q.xp} XP
                        </strong>
                        {status === "available" && (
                          <Button size="sm" onClick={() => accept(q.id)}>
                            Accept quest
                          </Button>
                        )}
                        {status === "completed" && (
                          <Button size="sm" onClick={() => claim(q.id)}>
                            Claim reward
                          </Button>
                        )}
                        {status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => track(q.id)}
                          >
                            {p.trackedQuest === q.id ? "Tracking" : "Track"}
                          </Button>
                        )}
                        {status === "locked" && (
                          <small className="text-muted-foreground">
                            {q.category === "event"
                              ? "Available on every seventh game day"
                              : q.relationship
                                ? `${q.relationship.npc} friendship: ${p.relationships[q.relationship.npc] ?? 0}/${q.relationship.minimum}`
                                : "Complete the previous story chapter"}
                          </small>
                        )}
                      </div>
                    </section>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  Dailies reset on the game calendar. Missing a day carries no
                  penalty.
                </p>
              </TabsContent>
              <TabsContent value="animals" className="space-y-4 pt-4">
                {ANIMALS.map((a) => {
                  const met = p.discovered.includes(a.id),
                    m = memory(p, a.id);
                  return (
                    <section key={a.id} className="flex gap-4 border-b pb-4">
                      <img
                        src={art(a.sprite)}
                        className={
                          "size-16 shrink-0 [image-rendering:pixelated] " +
                          (!met ? "brightness-0 opacity-25" : "")
                        }
                        alt=""
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading text-lg font-extrabold">
                          {met ? a.name : "An undiscovered neighbor"}
                        </h3>
                        {met ? (
                          <>
                            <p className="text-xs capitalize text-muted-foreground">
                              {a.species} · {a.personality} · favorite:{" "}
                              {a.favoriteFood}
                            </p>
                            <p className="my-2 text-sm">{a.story}</p>
                            <div className="mb-1 flex justify-between text-xs">
                              <span>Trust</span>
                              <span>{m.trust}/100</span>
                            </div>
                            <ProgressBar value={m.trust} className="h-1.5" />
                            <p className="mt-2 text-xs text-muted-foreground">
                              Met on day {m.metDay} · {m.location}
                              {p.rescued.includes(a.id)
                                ? " · Safe at the shelter"
                                : ""}
                            </p>
                            <p className="mt-2 text-xs italic text-muted-foreground">
                              {a.fact}
                            </p>
                            <details className="mt-2 text-xs">
                              <summary>Recent care</summary>
                              {m.history.map((h, i) => (
                                <p
                                  key={i}
                                  className="mt-1 text-muted-foreground"
                                >
                                  {h}
                                </p>
                              ))}
                            </details>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Explore the lanes and resting spots.
                          </p>
                        )}
                      </div>
                    </section>
                  );
                })}
              </TabsContent>
              <TabsContent value="community" className="space-y-5 pt-4">
                <h3 className="font-heading text-lg font-extrabold">
                  Kindness leaves a mark
                </h3>
                <p className="text-sm">
                  {p.discovered.length} animals discovered · {p.rescued.length}{" "}
                  sheltered · {p.totalEarned} lifetime Kibble
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.badges.length ? (
                    p.badges.map((b) => (
                      <span
                        key={b}
                        className="inline-flex items-center gap-1 rounded-full border bg-secondary px-3 py-1.5 text-xs"
                      >
                        <Heart className="size-3 text-primary" />
                        {b}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your first badge starts with meeting a neighbor.
                    </p>
                  )}
                </div>
                {PROJECTS.map((project) => (
                  <div key={project.id} className="border-t pt-4">
                    <h4 className="font-bold">
                      {p.upgrades.includes(project.id) ? "✓ " : ""}
                      {project.name}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {project.description}
                    </p>
                    <p className="mt-2 text-xs">
                      {p.upgrades.includes(project.id)
                        ? "Completed — visible in the world"
                        : `${project.kibble} Kibble + ${project.materials} repair supplies. Visit the station or shelter to help.`}
                    </p>
                  </div>
                ))}
                <h3 className="font-heading text-lg font-extrabold">
                  Your neighbors
                </h3>
                {Object.entries(p.relationships).map(([name, trust]) => (
                  <p key={name} className="text-sm capitalize">
                    {name}: {trust}/100 friendship
                  </p>
                ))}
              </TabsContent>
            </Tabs>
          )}
          {panel === "map" && <WorldMap progress={p} />}
          {panel === "photos" && (
            <div className="grid grid-cols-2 gap-3">
              {!p.photos.length ? (
                <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                  Use Photo in the footer to keep a view of your neighborhood.
                  Animal photographs also appear here.
                </p>
              ) : (
                p.photos.map((photo) => (
                  <figure key={photo.id} className="rounded-xl border p-2">
                    <img
                      src={photo.image}
                      alt={
                        (ANIMALS.find((a) => a.id === photo.animalId)?.name ??
                          "Neighborhood moment") +
                        " in " +
                        photo.location
                      }
                      className="aspect-square w-full rounded-lg [image-rendering:pixelated]"
                    />
                    <figcaption className="mt-2 text-xs">
                      {ANIMALS.find((a) => a.id === photo.animalId)?.name ??
                        "Neighborhood moment"}{" "}
                      · day {photo.day} · {photo.pose}
                    </figcaption>
                    <Button asChild variant="link" size="sm" className="px-0">
                      <a
                        href={photo.image}
                        download={"pawtrail-" + photo.animalId + ".png"}
                      >
                        Save photograph
                      </a>
                    </Button>
                  </figure>
                ))
              )}
            </div>
          )}
          {panel === "help" && (
            <div className="space-y-4 text-sm leading-relaxed">
              <p>
                <strong>Walk:</strong> WASD / arrows. Hold Shift to run. Click
                or tap clear ground to walk around obstacles.
              </p>
              <p>
                <strong>Interact:</strong> E or Space. Near animals, 1 feeds, 2
                pets, 3 waters, 4 offers rescue. Other actions appear in the
                care panel.
              </p>
              <p>
                <strong>Menus:</strong> J journal, I inventory, M map, Escape
                pause/close. On phones use the joystick and hand button.
              </p>
              <p>
                <strong>Trust:</strong> Observe shy animals and avoid rushing
                toward them. Care builds gradually, once per action each game
                day. Dogs may follow after a meal and enough trust.
              </p>
              <p>
                <strong>Time:</strong> A full day lasts around twelve
                active-play minutes. Menus pause the clock. Rest at a bench to
                wait an hour, or at the shelter to start a fresh morning.
              </p>
              <p>
                <strong>Story:</strong> Accept Maya’s welcome quest, find the
                feeding station west of the main path, collect a bowl, feed
                Mango, and return. Claim rewards to unlock the animal journal,
                camera and garden.
              </p>
              <p>
                Game progress and Kibble are local, fictional, and have no
                monetary value. No real-world rescue claim is rewarded.
              </p>
            </div>
          )}
          {panel === "pause" && (
            <div className="space-y-5">
              <Button className="w-full" onClick={() => setPanel(null)}>
                Back to the neighborhood
              </Button>
              <section className="space-y-3">
                <h3 className="font-heading font-extrabold">Your character</h3>
                <p className="text-sm text-muted-foreground">
                  Choose who you explore as. Your choice stays in this game
                  save.
                </p>
                <CharacterPicker
                  value={p.appearance}
                  onSelect={chooseCharacter}
                />
              </section>
              <section className="space-y-4 rounded-xl border p-4">
                <h3 className="flex items-center gap-2 font-heading font-extrabold">
                  <Music className="size-4" />
                  Sounds of Sampaguita
                </h3>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="mute-audio" className="text-sm">
                    Mute all audio
                  </label>
                  <Switch
                    id="mute-audio"
                    checked={prefs.muted}
                    onCheckedChange={(muted) => updateAudio({ muted })}
                  />
                </div>
                {(["master", "music", "effects", "ambient"] as const).map(
                  (channel) => (
                    <div key={channel} className="space-y-2">
                      <div className="flex justify-between text-xs capitalize">
                        <label id={"volume-" + channel}>{channel}</label>
                        <span>{Math.round(prefs[channel] * 100)}%</span>
                      </div>
                      <Slider
                        aria-labelledby={"volume-" + channel}
                        min={0}
                        max={1}
                        step={0.05}
                        value={[prefs[channel]]}
                        onValueChange={([value]) =>
                          updateAudio({ [channel]: value })
                        }
                      />
                    </div>
                  ),
                )}
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Original synthesized music, ambience and sounds. Audio begins
                  after your first key press or tap, subject to your browser’s
                  autoplay settings.
                </p>
              </section>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={exportSave}>
                  <Download className="size-4" />
                  Export save
                </Button>
                <Button variant="outline" onClick={() => setPanel("help")}>
                  Field guide
                </Button>
                <Button variant="outline" onClick={() => setPanel("photos")}>
                  Photo album
                </Button>
                <Button variant="outline" onClick={() => setPanel("map")}>
                  Story map
                </Button>
              </div>
              <section className="space-y-2 rounded-xl border p-3">
                <label htmlFor="load-game-save" className="text-sm font-bold">
                  Load an exported save
                </label>
                <Input
                  id="load-game-save"
                  type="file"
                  accept="application/json,.json"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    setPendingSave(null);
                    if (!file) return;
                    if (file.size > 3_000_000) {
                      setImportMessage("This save is too large.");
                      return;
                    }
                    try {
                      const value = JSON.parse(await file.text()),
                        valid = parseSave(value);
                      if (!valid) {
                        setImportMessage(
                          "This file is not a valid PawTrail save.",
                        );
                        return;
                      }
                      setPendingSave(valid);
                      setImportMessage(
                        `Day ${valid.day} · ${valid.kibble} Kibble. Loading replaces your current local progress.`,
                      );
                    } catch {
                      setImportMessage("This file could not be read.");
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground" role="status">
                  {importMessage}
                </p>
                {!!pendingSave && (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (restoreSave(pendingSave)) {
                        setPendingSave(null);
                        setPanel(null);
                      }
                    }}
                  >
                    Load this save
                  </Button>
                )}
              </section>
              <Button variant="ghost" onClick={() => setPanel("pause-confirm")}>
                <RotateCcw className="size-4" />
                Start a fresh save
              </Button>
              <p className="text-xs text-muted-foreground">
                Saved locally. No cloud account or Django service is connected.
              </p>
            </div>
          )}
          {panel === "pause-confirm" && (
            <div className="space-y-4">
              <p className="text-sm">
                Reset this device’s story, quests, Kibble, trust and
                photographs? Export your save first if you want a record.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={() => {
                    resetProgress();
                    setPanel(null);
                  }}
                >
                  Start again
                </Button>
                <Button variant="outline" onClick={() => setPanel("pause")}>
                  Keep my story
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {state.dialogue && (
        <GameDialogue
          key={JSON.stringify(state.dialogue)}
          dialogue={state.dialogue}
          onClose={closeDialogue}
          onChoice={(choice) => {
            if (choice.action === "accept")
              accept(choice.target, state.dialogue?.npcId);
            else if (choice.action === "claim") claim(choice.target);
            else if (choice.action === "buy") buyFood();
            else if (choice.action === "upgrade") improve(choice.target);
            else if (choice.action === "clean") cleanStation(choice.target);
            else if (choice.action === "water") stationWater(choice.target);
            else if (choice.action === "rest")
              rest(choice.target === "morning");
            closeDialogue();
          }}
        />
      )}
    </>
  );
}
