import {
  claimGameCare,
  pinGameMission,
  pinnedCareMission,
} from "@/features/neighborhood/game/companions/missions";
import { GameReactions } from "../shared/reactions";
import { scene } from "@/features/neighborhood/game/housing/client";
import { useEffect, useState } from "react";
import {
  BookHeart,
  Check,
  Flag,
  Heart,
  Home,
  Lock,
  ShieldBan,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { LayoutPicker } from "./layout-picker";
import { MarketPanel } from "./market";
import { GardenTools } from './garden-tools'
import { EXTERIORS } from "@/features/neighborhood/game/housing/community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { action, enter, live, patch } from "@/features/neighborhood/game/housing/client";
import { catalogue } from "@/features/neighborhood/game/housing/geometry";
import { audio } from "@/features/neighborhood/game/systems/audio";
import { Identity } from "./social";
import { CharacterPicker } from "@/features/neighborhood/components/game/character-picker";
import { COMMUNITY_AREAS } from "@/features/neighborhood/game/community";
import {
  MissionBoard,
  homeMissions,
} from "@/features/neighborhood/components/game/immersion/missions";
import { InventoryPanel } from "@/features/neighborhood/components/game/immersion/inventory";
import { CatSoundboard } from "@/features/neighborhood/components/game/immersion/soundboard";
import { packItem } from "@/features/neighborhood/game/immersion-data";
import type { HomesState } from "@/features/neighborhood/game/housing/types";
export type HomePanel =
  | "care-shop"
  | "garden-shop"
  | "settings"
  | "quests"
  | "guestbook"
  | "photos"
  | "emotes"
  | "person"
  | "board"
  | "inventory"
  | "soundboard"
  | null;
export function HomePanels({
  panel,
  setPanel,
  state,
}: {
  panel: HomePanel;
  setPanel: (p: HomePanel) => void;
  state: HomesState;
}) {
  const data = state.data!,
    h = data.house,
    me = data.player,
    isOwner = h.id === me.id;
  const [name, setName] = useState(h.name),
    [mapArea, setMapArea] = useState(h.mapArea ?? ""),
    [visibility, setVisibility] = useState(h.visibility),
    [opened, setOpened] = useState(h.opened),
    [yardPublic, setYardPublic] = useState(h.yardPublic),
    [permissions, setPermissions] = useState(h.permissions),
    [floor, setFloor] = useState(h.floor),
    [wallpaper, setWallpaper] = useState(h.wallpaper),
    [text, setText] = useState(""),
    [audioVersion, setAudioVersion] = useState(0),
    [confirmUpgrade, setConfirmUpgrade] = useState<string | null>(null);
  useEffect(() => {
    setName(h.name);
    setMapArea(h.mapArea ?? "");
    setVisibility(h.visibility);
    setOpened(h.opened);
    setYardPublic(h.yardPublic);
    setPermissions(h.permissions);
    setFloor(h.floor);
    setWallpaper(h.wallpaper);
  }, [h.id, h.revision]);
  const person = state.selectedPlayer
    ? state.players[state.selectedPlayer]?.person
    : null;
  const titles = {
    "care-shop": "A little care, in your backpack",
    "garden-shop": "The neighborhood workshop",
    board: "Community mission board",
    inventory: "Your discovery backpack",
    soundboard: "Cat Soundboard",
    settings: "A home at your pace",
    quests: "Kindness, together",
    guestbook: "Leave a little warmth",
    photos: "Moments worth keeping",
    emotes: "Say it your way",
    person: person?.name || "Meet a PawPal",
  };
  return (
    <Dialog
      open={!!panel}
      onOpenChange={(open) => {
        if (!open) {
          setPanel(null);
          patch({ selectedPlayer: null });
        }
      }}
    >
      <DialogContent
        className={`max-h-[85dvh] overflow-y-auto rounded-2xl ${panel === "settings" ? "w-[calc(100vw-2rem)] sm:max-w-6xl" : panel === "board" ? "sm:max-w-3xl" : "sm:max-w-xl"}`}
      >
        <DialogHeader className="pr-6 text-left">
          <DialogTitle className="font-heading text-2xl font-extrabold">
            {panel ? titles[panel] : ""}
          </DialogTitle>
          <DialogDescription>
            {panel === "settings"
              ? "Choose your house layout, arrange your space and set your visiting preferences."
              : panel === "quests"
                ? "Optional adventures. Rewards are one-time game Kibble, separate from platform rewards."
                : panel === "guestbook"
                  ? h.name
                  : panel === "emotes"
                    ? "Choose a reaction. A short cooldown keeps the room calm."
                    : "Your PawTrail home world."}
          </DialogDescription>
        </DialogHeader>
        {(panel === "care-shop" || panel === "garden-shop") && (
          <MarketPanel state={state} kind={panel} />
        )}
        {panel === "board" && (
          <MissionBoard
            missions={homeMissions(data)}
            pinned={me.facts
              .find((f) => f.startsWith("mission-pin:"))
              ?.slice(12)}
            onAccept={(target) => action({ type: "mission-accept", target })}
            onClaim={(id) =>
              claimGameCare(id, (target) => action({ type: "claim", target }))
            }
            onPin={(id) =>
              pinGameMission(id, (target) =>
                action({ type: "mission-pin", target }),
              )
            }
          />
        )}
        {panel === "inventory" && (
          <>
            <GardenTools state={state} />
            <InventoryPanel
              stock={{
                ...me.supplies,
                photo: data.photos.length,
                badge: data.quests.filter(
                  (q) => q.badge && me.claimed.includes(q.id),
                ).length,
              }}
              allowUse={!!state.selectedPet}
              useLabel="Use with selected pet"
              onUse={(id) => {
                const item = packItem(id);
                if (item?.action && state.selectedPet)
                  scene({
                    type: "care",
                    pet: state.selectedPet,
                    action: item.action,
                    supply: id,
                  });
              }}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Furniture is in Decorate. Select a resident pet and approach it
              before using a care item. Protected letters and tokens stay in
              your backpack.
            </p>
          </>
        )}
        {panel === "soundboard" && (
          <CatSoundboard
            emit={(emote) => live({ type: "player.cat-sound", emote })}
          />
        )}
        {panel === "emotes" && (
          <GameReactions
            onReact={(emote) => {
              live({ type: "player.emote", emote });
              setPanel(null);
            }}
          />
        )}
        {panel === "quests" && (
          <div className="space-y-5">
            {data.quests.map((q) => {
              const count = q.facts.filter((f) => me.facts.includes(f)).length,
                claimed = me.claimed.includes(q.id);
              return (
                <section key={q.id} className="border-b pb-5 last:border-0">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="font-bold">{q.title}</h3>
                    <Badge variant={claimed ? "secondary" : "outline"}>
                      {claimed
                        ? "Claimed"
                        : q.reward
                          ? `${q.reward} game Kibble`
                          : q.badge || "Decoration"}
                    </Badge>
                  </div>
                  <Progress
                    value={(count / q.facts.length) * 100}
                    className="mb-3 h-1.5"
                  />
                  <ul className="mb-3 space-y-1">
                    {q.facts.map((f) => (
                      <li
                        key={f}
                        className="flex gap-2 text-xs capitalize text-muted-foreground"
                      >
                        {me.facts.includes(f) ? (
                          <Check className="size-3.5 text-emerald-700" />
                        ) : (
                          <span className="size-3.5 rounded-full border" />
                        )}
                        {f.replaceAll("-", " ")}
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    disabled={claimed || count < q.facts.length || state.busy}
                    onClick={() => action({ type: "claim", target: q.id })}
                  >
                    <Sparkles className="size-3.5" />
                    {claimed ? "A good deed remembered" : "Claim reward"}
                  </Button>
                </section>
              );
            })}
          </div>
        )}
        {panel === "guestbook" && (
          <div className="space-y-4">
            {(isOwner || h.permissions.guestbook) && (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (text.trim()) {
                    action({ type: "guestbook", text });
                    setText("");
                  }
                }}
              >
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={280}
                  placeholder="A kind note for this home…"
                  aria-label="Guestbook note"
                />
                <Button type="submit" disabled={!text.trim() || state.busy}>
                  Leave note
                </Button>
              </form>
            )}
            {h.guestbook.map((e) => (
              <div key={e.id} className="space-y-2 border-b py-3">
                <div className="flex items-center justify-between">
                  <Identity person={e.author} />
                  {(isOwner || me.id === e.author.id) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remove guestbook note"
                      onClick={() =>
                        action({ type: "delete-guestbook", target: e.id })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                <p className="whitespace-pre-line break-words text-sm">
                  {e.text}
                </p>
                <time className="text-[10px] text-muted-foreground">
                  {new Date(e.at * 1000).toLocaleDateString()}
                </time>
              </div>
            ))}
            {!h.guestbook.length && (
              <div className="py-8 text-center">
                <BookHeart className="mx-auto mb-3 size-9 text-primary" />
                <p className="text-sm text-muted-foreground">
                  The first page is waiting for a kind word.
                </p>
              </div>
            )}
          </div>
        )}
        {panel === "photos" && (
          <div className="grid grid-cols-2 gap-3">
            {data.photos.map((p) => (
              <figure key={p.id} className="overflow-hidden rounded-xl border">
                <img
                  src={p.image}
                  alt={p.caption}
                  className="aspect-square w-full object-cover [image-rendering:pixelated]"
                />
                <figcaption className="p-2 text-xs">{p.caption}</figcaption>
                <Button asChild size="sm" variant="link">
                  <a href={p.image} download={"pawtrail-home-" + p.id + ".png"}>
                    Download photo
                  </a>
                </Button>
              </figure>
            ))}
            {!data.photos.length && (
              <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                No moments saved yet. Use the camera in the toolbar to take your
                first home photograph.
              </p>
            )}
          </div>
        )}
        {panel === "person" && person && (
          <div className="space-y-4">
            <Identity person={person} />
            <div className="flex flex-wrap gap-2">
              {data.friends.some((f) => f.id === person.id) && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      patch({ chatWith: person });
                      setPanel(null);
                    }}
                  >
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      action({ type: "invite", target: person.id })
                    }
                  >
                    Invite home
                  </Button>
                </>
              )}
              <Button asChild variant="outline">
                <a href={"/users/" + encodeURIComponent(person.username)}>
                  View profile
                </a>
              </Button>
              {!data.friends.some((f) => f.id === person.id) && (
                <Button
                  onClick={() => action({ type: "request", target: person.id })}
                >
                  <Users className="size-4" />
                  Add friend
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  void enter(person.id);
                  setPanel(null);
                }}
              >
                <Home className="size-4" />
                Visit home
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  live({ type: "player.emote", emote: "wave" });
                  setPanel(null);
                }}
              >
                Wave
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  action({ type: "block", target: person.id });
                  setPanel(null);
                }}
              >
                <ShieldBan className="size-4" />
                Block
              </Button>
            </div>
            <label className="block text-sm font-bold">
              Report a concern
              <Input
                className="mt-2"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={500}
                placeholder="Describe what happened…"
              />
            </label>
            <Button
              size="sm"
              variant="outline"
              disabled={!text.trim() || state.busy}
              onClick={() => {
                action({ type: "report", target: person.id, text });
                setText("");
                setPanel(null);
              }}
            >
              <Flag className="size-3.5" />
              Send report
            </Button>
          </div>
        )}
        {panel === "settings" && (
          <div className="space-y-6">
            {isOwner && <LayoutPicker state={state} />}
            <section className="space-y-3">
              <h3 className="font-bold">Your presence</h3>
              <CharacterPicker
                accountOnly
                value={me.appearance}
                disabled={state.busy}
                onSelect={(appearance) =>
                  action({
                    type: "profile",
                    appearance,
                    visible: me.visible,
                    quiet: me.quiet,
                  })
                }
              />
              <div className="flex items-center justify-between text-sm">
                <span>Show me as online</span>
                <Switch
                  aria-label="Show me as online"
                  checked={me.visible}
                  onCheckedChange={(visible) =>
                    action({
                      type: "profile",
                      appearance: me.appearance,
                      visible,
                      quiet: me.quiet,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Quiet notifications</span>
                <Switch
                  aria-label="Quiet notifications"
                  checked={me.quiet}
                  onCheckedChange={(quiet) =>
                    action({
                      type: "profile",
                      appearance: me.appearance,
                      visible: me.visible,
                      quiet,
                    })
                  }
                />
              </div>
            </section>
            <section className="space-y-3 border-t pt-5">
              {data.blocks.length > 0 && (
                <div className="mb-4 space-y-2">
                  <h3 className="text-sm font-bold">Blocked PawPals</h3>
                  {data.blocks.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span>{p.name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          action({ type: "unblock", target: p.id })
                        }
                      >
                        Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <h3 className="font-bold">Sounds of home</h3>
              {(["master", "music", "effects", "ambient"] as const).map(
                (channel) => (
                  <label
                    key={channel}
                    className="block space-y-2 text-sm capitalize"
                  >
                    {channel}
                    <Slider
                      aria-label={channel + " volume"}
                      value={[audio.settings[channel] * 100]}
                      onValueChange={(v) => {
                        audio.update({
                          ...audio.settings,
                          [channel]: v[0] / 100,
                        });
                        setAudioVersion(audioVersion + 1);
                      }}
                      max={100}
                      step={1}
                    />
                  </label>
                ),
              )}
              <div className="flex items-center justify-between text-sm">
                <span>Mute all sound</span>
                <Switch
                  aria-label="Mute all sound"
                  checked={audio.settings.muted}
                  onCheckedChange={(muted) => {
                    audio.update({ ...audio.settings, muted });
                    setAudioVersion(audioVersion + 1);
                  }}
                />
              </div>
            </section>
            {isOwner && (
              <section className="space-y-4 border-t pt-5">
                <div className="space-y-3 border-b pb-5">
                  <h3 className="font-bold">Your place on the map</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Add a neighborhood pin for your virtual home. Only visitors
                    allowed by your door settings can discover it. No home
                    address or device location is shared.
                  </p>
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="Map neighborhood"
                  >
                    <Button
                      size="sm"
                      variant={mapArea === "" ? "default" : "outline"}
                      aria-pressed={mapArea === ""}
                      onClick={() => setMapArea("")}
                    >
                      Unlisted
                    </Button>
                    {COMMUNITY_AREAS.map((area) => (
                      <Button
                        key={area.id}
                        size="sm"
                        variant={mapArea === area.id ? "default" : "outline"}
                        aria-pressed={mapArea === area.id}
                        onClick={() => setMapArea(area.id)}
                      >
                        {area.name.split(",")[0]}
                      </Button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={state.busy || mapArea === (h.mapArea ?? "")}
                    onClick={() =>
                      action({
                        type: "map-listing",
                        house: h.id,
                        area: mapArea,
                        revision: h.revision,
                      })
                    }
                  >
                    {state.busy ? "Saving…" : "Save map listing"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Closed homes stay off the map. Unlisted homes can still
                    receive permitted invitations.
                  </p>
                </div>
                <section className="space-y-3 border-b pb-5">
                  <h3 className="font-bold">Your house, from the lane</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Choose a native exterior. Your rooms and saved furniture
                    stay the same.
                  </p>
                  <div
                    className="grid grid-cols-3 gap-2"
                    role="group"
                    aria-label="House exterior"
                  >
                    {EXTERIORS.map((preset) => (
                      <Button
                        key={preset}
                        variant={
                          h.exterior === preset ? "secondary" : "outline"
                        }
                        className="h-auto flex-col gap-2 p-2"
                        aria-pressed={h.exterior === preset}
                        disabled={state.busy || state.decoration}
                        onClick={() =>
                          action({
                            type: "exterior",
                            preset,
                            revision: h.yardRevision,
                          })
                        }
                      >
                        <img
                          src={"/assets/game/community/" + preset + ".png"}
                          alt=""
                          className="h-20 w-full object-contain [image-rendering:pixelated]"
                        />
                        <span className="text-[10px] capitalize">
                          {preset.replace("-house", "")} home
                        </span>
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <label
                      htmlFor="public-yard"
                      className="text-sm font-semibold"
                    >
                      Show my committed yard in Home Lane
                    </label>
                    <Switch
                      id="public-yard"
                      checked={yardPublic}
                      onCheckedChange={setYardPublic}
                    />
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Off by default. Public previews require a public, open home
                    and visible owner. Your interior is never included. Save
                    door settings below to apply.
                  </p>
                </section>
                <h3 className="flex items-center gap-2 font-bold">
                  <Lock className="size-4" />
                  Your door, your rules
                </h3>
                <label className="block text-sm">
                  House name
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    className="mt-1"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {["public", "friends", "invite", "private"].map((value) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={value === visibility ? "default" : "outline"}
                      onClick={() => setVisibility(value)}
                    >
                      {value === "friends"
                        ? "Friends only"
                        : value === "invite"
                          ? "Invite only"
                          : value[0].toUpperCase() + value.slice(1)}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Open to new visitors</span>
                  <Switch
                    aria-label="Open to new visitors"
                    checked={opened}
                    onCheckedChange={setOpened}
                  />
                </div>
                {[
                  ["pets", "Pet interactions"],
                  ["help", "Visitor care tasks"],
                  ["furniture", "Use interactive furniture"],
                  ["guestbook", "Leave guestbook notes"],
                  ["chat", "House chat"],
                  ["invitations", "Send house invitations"],
                ].map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span>{label}</span>
                    <Switch
                      aria-label={label}
                      checked={permissions[key] === true}
                      onCheckedChange={(value) =>
                        setPermissions({ ...permissions, [key]: value })
                      }
                    />
                  </div>
                ))}
                <h4 className="text-sm font-bold">Invited decorators</h4>
                {data.friends.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>{f.name}</span>
                    <Switch
                      checked={(
                        (permissions.decorators as string[]) || []
                      ).includes(f.id)}
                      onCheckedChange={(value) =>
                        setPermissions({
                          ...permissions,
                          decorators: value
                            ? [
                                ...((permissions.decorators as string[]) || []),
                                f.id,
                              ]
                            : (
                                (permissions.decorators as string[]) || []
                              ).filter((id) => id !== f.id),
                        })
                      }
                    />
                  </div>
                ))}
                <div>
                  <h4 className="mb-2 text-sm font-bold">Flooring</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "oak-light-a",
                      "wood-dark-a",
                      "carpet-a",
                      "ceramic-a",
                      "stone",
                      "patterned",
                    ].map((value) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={floor === value ? "default" : "outline"}
                        onClick={() => setFloor(value)}
                      >
                        {value.replaceAll("-", " ")}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-bold">Wallpaper</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "cream",
                      "sage",
                      "beige",
                      "blue",
                      "wood",
                      "wallpaper",
                    ].map((value) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={wallpaper === value ? "default" : "outline"}
                        onClick={() => setWallpaper(value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button
                  disabled={state.busy}
                  onClick={() => {
                    action({
                      type: "settings",
                      yardPublic,
                      revision: h.revision,
                      name,
                      visibility,
                      opened,
                      permissions,
                      floor,
                      wallpaper,
                    });
                    setPanel(null);
                  }}
                >
                  Save home settings
                </Button>
                <div className="border-t pt-4">
                  <h4 className="mb-2 text-sm font-bold">Visitors</h4>
                  {Object.values(state.players)
                    .filter((p) => p.person.id !== me.id)
                    .map((p) => (
                      <div
                        key={p.person.id}
                        className="mb-2 flex items-center justify-between text-sm"
                      >
                        <span>{p.person.name}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            action({ type: "kick", target: p.person.id })
                          }
                        >
                          Ask to leave
                        </Button>
                      </div>
                    ))}
                </div>
                <div className="border-t pt-4">
                  <h4 className="mb-2 text-sm font-bold">
                    More decoration slots · 200 game Kibble
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {["decoration-slots"].map((value) => (
                      <Button
                        key={value}
                        size="sm"
                        variant="outline"
                        disabled={h.upgrades.includes(value) || me.wallet < 200}
                        onClick={() => setConfirmUpgrade(value)}
                      >
                        {h.upgrades.includes(value) ? "Unlocked: " : ""}
                        {value.replaceAll("-", " ")}
                      </Button>
                    ))}
                  </div>
                  {confirmUpgrade && (
                    <div className="mt-3 space-y-2 rounded-xl bg-muted p-3">
                      <p className="text-sm">
                        Unlock {confirmUpgrade.replaceAll("-", " ")} for 200
                        game Kibble?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            action({
                              type: "upgrade",
                              target: confirmUpgrade,
                              revision: h.revision,
                            });
                            setConfirmUpgrade(null);
                          }}
                        >
                          Confirm upgrade
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmUpgrade(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
