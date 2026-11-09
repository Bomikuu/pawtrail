import {enterAbilities,activateLocalAbility,cancelLocalAbility,movementProfile,activeAbility,isAbility} from './abilities/state';
import {gameAppearance,headingVector} from './abilities/appearance';
import {allowsMovingAction} from './actor-rig/action-layers';
import { worldZoom, setWorldZoom } from "./runtime/camera";
import { installMemeAnchors } from "./runtime/meme-anchor";
import { CompanionRuntime } from "./companions/runtime";
import { setVisibleLocalAnimals, companionPositions } from "./companions/store";
import { InteractionController } from "./housing/interactions";
import { patch as patchInteraction } from "./housing/client";
import {
  preloadActors,
  registerActors,
  playerTexture,
  configurePlayer,
  configureAnimal,
  moveActor,
  playPlayer,
  playAnimal,
  faceActor,
} from "./runtime/actors";
import { reactionEffect, reactionAnimation, reactionDuration, richReaction } from "./reactions";
import Phaser from "phaser";
import {
  applyCare,
  careReason,
  collectSupplies,
  discover,
  gameStore,
  onCommand,
  publish,
  savePosition,
  visitShelter,
  persistStarted,
  advanceClock,
  discoverArea,
  emit,
  talkNpc,
  collectItem,
  collectFind,
  improve,
  cleanStation,
  stationWater,
  rest,
  saveScenePhoto,
} from "./store";
import {
  ANIMALS,
  type CareAction,
  type Direction,
  type GameCommand,
  type SceneId,
  type WorldObject,
} from "./types";
import {
  findPath,
  registerWorldGeometry,
  worldNavigation,
} from "./pathfinding";
import { memory, interactionAllowed } from "./systems/care";
import { chooseBehavior, movementVector } from "./systems/behavior";
import { dayPhase, lighting } from "./systems/time";
import { audio } from "./systems/audio";
import { PROJECTS, QUESTS } from "./data";
import { questState } from "./systems/quests";
import { eligibleEncounter, encounterId } from "./platform";
import { CHARACTER_OPTIONS, characterId, characterSheet } from "./characters";
import characterCatalog from "./housing/catalog.json";
import { PACK_ITEMS, FIND_SPOTS, worldConditions } from "./immersion-data";
import { Atmosphere, preloadAtmosphere } from "./atmosphere";
import { preloadCatFaces, catReaction } from "./soundboard";
type Actor = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
type Animal = {
  object: WorldObject;
  sprite: Actor;
  home: { x: number; y: number };
  state: string;
  until: number;
  route: { x: number; y: number }[];
  facing: Direction;
  label: Phaser.GameObjects.Text;
};
type SpriteFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
  sheet: string;
};
type WorldManifest = { sprites: Record<string, SpriteFrame> };
type AnimationManifest = {
  sheets: Record<
    string,
    { file: string; frameWidth: number; frameHeight: number; columns: number }
  >;
  animations: Record<
    string,
    {
      sheet: string;
      row: number;
      fps: number;
      frames: { x: number; y: number }[];
    }
  >;
};
export class WorldScene extends Phaser.Scene {
  private companionRuntime?: CompanionRuntime;
  private worldInteractions?: InteractionController;
  private player!: Actor;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private objects: WorldObject[] = [];
  private animals: Animal[] = [];
  private platformActors: {
    object: WorldObject;
    sprite: Actor;
    label: Phaser.GameObjects.Text;
  }[] = [];
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private blocked = new Set<string>();
  private geometryRects: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[] = [];
  private mapWidth = 64;
  private mapHeight = 44;
  private location: SceneId = "neighborhood";
  private virtual = { x: 0, y: 0 };
  private route: { x: number; y: number }[] = [];
  private facing: Direction = "down";
  private get playerAppearance() {
    return playerTexture(
      characterId(gameStore.getSnapshot().progress.appearance),
    );
  }
  private playerAction(action: string, repeat?: number) {
    playPlayer(this, this.player, characterId(gameStore.getSnapshot().progress.appearance), action, repeat);
  }
  private animalAction(animal: Animal, action: string) {
    playAnimal(this, animal.sprite, animal.object.sprite!, action);
  }
  private busyUntil = 0;
  private paused = false;
  private nearest: WorldObject | null = null;
  private lastNearby = "";
  private nextProximity = 0;
  private nextSave = 0;
  private marker!: Phaser.GameObjects.Image;
  private markerTarget: WorldObject | null = null;
  private clockAccumulator = 0;
  private nextStep = 0;
  private nextVoice = 0;
  private lastArea = "";
  private atmosphere?: Atmosphere;
  private soundUntil = 0;
  private nextSplash = 0;
  private guideMarker?: Phaser.GameObjects.Image;
  private objectImages = new Map<string, Phaser.GameObjects.Image>();
  private additions: Phaser.GameObjects.GameObject[] = [];
  private lamps: Phaser.GameObjects.Rectangle[] = [];
  private npcs: {
    object: WorldObject;
    sprite: Actor;
    label: Phaser.GameObjects.Text;
    home: { x: number; y: number };
    route: { x: number; y: number }[];
    phase: string;
  }[] = [];
  private zoom = 2;
  private reactionSprite?: Phaser.GameObjects.Sprite;
  private reactionUntil = 0;
  private lastReaction = -Infinity;
  private takingScenePhoto = false;
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    .matches;
  constructor() {
    super("World");
  }
  preload() {
    preloadActors(this);
    for (const [id, effect] of Object.entries(characterCatalog.effects))
      this.load.spritesheet("reaction:" + id, effect.file, {
        frameWidth: 32,
        frameHeight: 32,
      });
    preloadAtmosphere(this);
    preloadCatFaces(this);
    for (const id of ["normal", "available", "new", "nearby"])
      this.load.image(
        "mission-board-" + id,
        "/assets/game/missions/board/board-" + id + ".png",
      );
    for (const item of PACK_ITEMS)
      this.load.image(
        "find:" + item.id,
        "/assets/game/inventory/items/" + item.id + ".png",
      );
    for (const id of [
      "bench",
      "bush",
      "bush-rustle",
      "tree",
      "mailbox",
      "mailbox-open",
      "bin",
      "bin-open",
      "covered-rest",
    ])
      this.load.image(
        "env:" + id,
        "/assets/game/environment/interactive/" + id + ".png",
      );
    publish({ phase: "loading", load: 0, error: "" });
    this.load.on("progress", (load: number) => publish({ load }));
    this.load.on("loaderror", (file: Phaser.Loader.File) =>
      publish({
        phase: "error",
        error:
          "A game asset could not load. Check your connection and try again. (" +
          file.key +
          ")",
      }),
    );
    this.load.json(
      "worldManifest",
      "/pawtrail-game/game-assets/world-manifest.json",
    );
    this.load.json(
      "animationManifest",
      "/pawtrail-game/game-assets/animation-manifest.json",
    );
    for (const key of ["terrain", "buildings", "environment", "items"])
      this.load.image(key, "/pawtrail-game/game-assets/" + key + ".png");
    for (const id of ["rescuer", ...new Set(ANIMALS.map((a) => a.sprite))])
      this.load.spritesheet(id, "/pawtrail-game/game-assets/" + id + ".png", {
        frameWidth: 32,
        frameHeight: id === "rescuer" ? 48 : 32,
      });
    this.load.tilemapTiledJSON(
      "neighborhood",
      "/pawtrail-game/maps/neighborhood.json",
    );
    this.load.tilemapTiledJSON("shelter", "/pawtrail-game/maps/shelter.json");
    this.load.tilemapTiledJSON("garden", "/pawtrail-game/maps/garden.json");
    this.load.tilemapTiledJSON(
      "riverside",
      "/pawtrail-game/maps/riverside.json",
    );
  }
  create(data: { location?: SceneId; entrance?: boolean } = {}) {
    this.reactionSprite = undefined;
    this.reactionUntil = 0;
    this.lastReaction = -Infinity;
    this.takingScenePhoto = false;
    installMemeAnchors(this, id => id === 'me' ? this.player : undefined);
    try {
      if (
        !data.location &&
        new URLSearchParams(window.location.search).get("scene") === "shelter"
      )
        data = { location: "shelter", entrance: true };
      this.buildWorld(data);
    } catch (error) {
      publish({
        phase: "error",
        error:
          "The neighborhood could not be prepared. Please try again. " +
          (error instanceof Error ? error.message : ""),
      });
    }
  }
  private buildWorld(data: { location?: SceneId; entrance?: boolean }) {
    if (gameStore.getSnapshot().phase === "error") return;
    this.location =
      data.location ?? gameStore.getSnapshot().progress.position.scene;
    this.animals = [];
    this.platformActors = [];
    this.npcs = [];
    this.objectImages = new Map();
    this.additions = [];
    this.lamps = [];
    this.clockAccumulator = 0;
    this.lastArea = "";
    this.objects = [];
    this.blocked = new Set();
    this.geometryRects = [];
    this.route = [];
    this.virtual = { x: 0, y: 0 };
    this.busyUntil = 0;
    this.nearest = null;
    this.lastNearby = "";
    this.paused = gameStore.getSnapshot().paused;
    this.registerFrames();
    this.solids = this.physics.add.staticGroup();
    const map = this.make.tilemap({ key: this.location }),
      tiles = map.addTilesetImage("PawTrail terrain", "terrain", 32, 32, 0, 0)!;
    map.createLayer("Ground", tiles, 0, 0)!.setDepth(-100);
    const collision = map.createLayer("Collision", tiles, 0, 0)!;
    collision.setVisible(false).setCollisionByExclusion([-1]);
    this.mapWidth = map.width;
    this.mapHeight = map.height;
    registerWorldGeometry(
      this.blocked,
      map.width * 32,
      map.height * 32,
      this.geometryRects,
    );
    collision.forEachTile((t) => {
      if (t.index >= 0) {
        this.blocked.add(t.x + "," + t.y);
        this.geometryRects.push({
          x: t.x * 32,
          y: t.y * 32,
          width: 32,
          height: 32,
        });
      }
    });
    const objectLayer = map.getObjectLayer("Objects")!;
    for (const raw of objectLayer.objects) {
      const props = Object.fromEntries(
        (raw.properties ?? []).map((p: { name: string; value: unknown }) => [
          p.name,
          p.value,
        ]),
      );
      const object = {
        ...props,
        kind: raw.type,
        x: raw.x ?? 0,
        y: raw.y ?? 0,
        id: props.id ?? String(raw.id),
        label: props.label ?? raw.name,
      } as WorldObject;
      this.objects.push(object);
      this.placeObject(object);
    }
    const extra: WorldObject[] = [];
    if (["neighborhood", "shelter"].includes(this.location))
      extra.push({
        id: "immersion:board",
        kind: "station",
        x: (this.location === "shelter" ? 12 : 27) * 32,
        y: (this.location === "shelter" ? 5 : 22) * 32,
        label: "Community Board · E",
        asset: "mission-board-new",
      });
    for (const find of FIND_SPOTS)
      if (find.scene === this.location)
        extra.push({
          id: "immersion-find:" + find.id,
          findId: find.item,
          kind: "pickup",
          x: find.x * 32,
          y: find.y * 32,
          label:
            "Pick up " +
            (PACK_ITEMS.find((i) => i.id === find.item)?.name ?? "item"),
          asset: "find:" + find.item,
        });
    if (this.location === "neighborhood")
      for (const [name, x, y] of [
        ["bush", 24, 26],
        ["bench", 30, 28],
        ["mailbox", 32, 24],
        ["bin", 35, 24],
        ["tree", 23, 27],
        ["covered-rest", 25, 28],
      ] as const)
        extra.push({
          id: "immersion-env:" + name,
          kind: "station",
          x: x * 32,
          y: y * 32,
          label:
            name === "bench"
              ? "Sit on the bench"
              : name === "mailbox"
                ? "Community mailbox"
                : "Inspect " + name,
          asset: "env:" + name,
        });
    for (const object of extra) {
      const cx = object.x / 32,
        cy = object.y / 32;
      for (let radius = 0; radius < 5; radius++) {
        let found = false;
        for (let dy = -radius; dy <= radius && !found; dy++)
          for (let dx = -radius; dx <= radius && !found; dx++)
            if (
              !this.blocked.has(cx + dx + "," + (cy + dy)) &&
              !this.objects.some(
                (o) =>
                  Math.hypot(o.x - (cx + dx) * 32, o.y - (cy + dy) * 32) < 28,
              )
            ) {
              object.x = (cx + dx) * 32;
              object.y = (cy + dy) * 32;
              found = true;
            }
        if (found) break;
      }
      this.objects.push(object);
      this.placeObject(object);
    }
    const progress = gameStore.getSnapshot().progress;
    this.syncPlatformAnimals();
    if (this.location === "shelter")
      for (const [i, id] of progress.rescued.entries()) {
        const a = ANIMALS.find((a) => a.id === id)!;
        this.addAnimal({
          id,
          kind: "animal",
          x: (i ? 18 : 6) * 32,
          y: (i ? 12 : 9) * 32,
          sprite: a.sprite,
          label: a.name,
          description: "Safe and resting with the shelter care team.",
        });
      }
    const saved = progress.position;
    let spawn = data.entrance
      ? this.location !== "neighborhood"
        ? { x: 12 * 32 + 16, y: 14 * 32 }
        : { x: saved.x, y: saved.y }
      : saved.scene === this.location
        ? { x: saved.x, y: saved.y }
        : { x: 29 * 32, y: 25 * 32 };
    spawn = {
      x: Phaser.Math.Clamp(spawn.x, 48, map.widthInPixels - 48),
      y: Phaser.Math.Clamp(spawn.y, 96, map.heightInPixels - 48),
    };
    if (
      this.blocked.has(
        Math.floor(spawn.x / 32) + "," + Math.floor(spawn.y / 32),
      )
    ) {
      let found = false;
      for (let radius = 1; radius < 12 && !found; radius++)
        for (let dy = -radius; dy <= radius && !found; dy++)
          for (let dx = -radius; dx <= radius && !found; dx++) {
            const x = Math.floor(spawn.x / 32) + dx,
              y = Math.floor(spawn.y / 32) + dy;
            if (
              x > 0 &&
              y > 2 &&
              x < map.width - 1 &&
              y < map.height - 1 &&
              !this.blocked.has(x + "," + y)
            ) {
              spawn = { x: x * 32 + 16, y: y * 32 + 16 };
              found = true;
            }
          }
    }
    this.player = this.physics.add
      .sprite(spawn.x, spawn.y, this.playerAppearance, 0)
      .setOrigin(0.5, 1)
      .setDepth(spawn.y) as Actor;
    configurePlayer(
      this.player,
      characterId(gameStore.getSnapshot().progress.appearance),
    );
    this.player.setData('actorLocalAudio', true);
    this.data.set('actorAudioListener', this.player);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(
      32,
      32,
      map.widthInPixels - 64,
      map.heightInPixels - 64,
    );
    this.physics.add.collider(this.player, collision);
    this.physics.add.collider(this.player, this.solids);
    for (const a of this.animals) {
      this.physics.add.collider(a.sprite, collision);
      this.physics.add.collider(a.sprite, this.solids);
    }
    this.marker = this.add
      .image(0, 0, "items", "paw_indicator_0")
      .setScale(1)
      .setDepth(10000)
      .setVisible(false);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,E,SPACE,SHIFT,ONE,TWO,THREE,FOUR",
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture(["UP", "DOWN", "LEFT", "RIGHT"]);
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.paused || this.time.now < this.busyUntil) return;
      const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (this.companionRuntime?.click(world)) return;
      this.worldInteractions?.cancel();
      this.route = findPath(
        this.player,
        world,
        this.mapWidth,
        this.mapHeight,
        this.blocked,
      );
      if (!this.route.length)
        publish({ notice: "Try a clear spot on the path." });
    });
    const unsubscribe = onCommand((command) => this.command(command));
    const onBlur = () => {
      this.virtual = { x: 0, y: 0 };
      this.route = [];
      this.input.keyboard?.resetKeys();
      this.player?.setVelocity(0, 0);
      if (this.player)
        savePosition(this.player.x, this.player.y, this.location);
    };
    window.addEventListener("blur", onBlur);
    this.worldInteractions = new InteractionController({
      now: () => this.time.now,
      status: (interaction) => patchInteraction({ interaction }),
      send: () => {},
      path: (path) => {
        this.route = path;
      },
      face: (point) => {
        faceActor(this.player, point);
        this.facing = this.direction(
          point.x - this.player.x,
          point.y - this.player.y,
        );
      },
      pose: (name) => {
        this.busyUntil = Infinity;
        playPlayer(
          this,
          this.player,
          characterId(gameStore.getSnapshot().progress.appearance),
          name,
        );
      },
      recover: () => {
        this.busyUntil = 0;
      },
      message: (notice) => publish({ notice }),
    });
    setVisibleLocalAnimals(this.animals.map((a) => a.object.id));
    this.companionRuntime = new CompanionRuntime(
      this,
      () => this.player,
      () => worldNavigation(this.blocked),
      () =>
        new Map(this.animals.map((a) => ["local:" + a.object.id, a.sprite])),
    );
    this.companionRuntime.setRoom("story:" + this.location);
    const locate = (event: Event) =>
        this.companionRuntime?.locate((event as CustomEvent<string>).detail),
      care = (event: Event) => {
        const d = (
          event as CustomEvent<{ id: string; action: "feed" | "water" | "pet" }>
        ).detail;
        if (this.worldInteractions)
          this.companionRuntime?.care(d.id, d.action, this.worldInteractions);
      };
    const come = () => {
      const q = worldNavigation(this.blocked)?.nearest({
        x: this.player.x + 28,
        y: this.player.y + 28,
      });
      if (q) this.companionRuntime?.click(q);
    };
    window.addEventListener("pawtrail:animal-come", come);
    window.addEventListener("pawtrail:locate-animal", locate);
    window.addEventListener("pawtrail:animal-care", care);
    const leaveAbilities=enterAbilities('local');
    const abilityEnded=(event:Event)=>{const id=(event as CustomEvent).detail?.id;if(this.player.getData('modelEmoteAction')===id){this.player.setData('modelEmoteUntil',0).setData('modelEmoteAction','');if(this.player.getData('modelAction')===id)this.player.setData('modelAction','idle_'+this.facing)}};
    window.addEventListener('pawtrail:ability-ended',abilityEnded);
    const cleanup = () => {
      leaveAbilities();window.removeEventListener('pawtrail:ability-ended',abilityEnded);
      savePosition(this.player.x, this.player.y, this.location);
      this.worldInteractions?.cancel();
      this.companionRuntime?.destroy();
      window.removeEventListener("pawtrail:animal-come", come);
      window.removeEventListener("pawtrail:locate-animal", locate);
      window.removeEventListener("pawtrail:animal-care", care);
      unsubscribe();
      window.removeEventListener("blur", onBlur);
      this.input.off("pointerdown");
      this.scale.off("resize", this.resize, this);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      cleanup();
      this.events.off(Phaser.Scenes.Events.DESTROY, cleanup);
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
    this.scale.on("resize", this.resize, this);
    for (const npc of this.npcs) {
      this.physics.add.collider(this.player, npc.sprite);
      this.physics.add.collider(npc.sprite, collision);
      this.physics.add.collider(npc.sprite, this.solids);
    }
    this.atmosphere = new Atmosphere(
      this,
      map.widthInPixels,
      map.heightInPixels,
      [
        ...this.objects
          .filter((o) => o.sprite === "street_lamp")
          .map((o) => ({ x: o.x, y: o.y, kind: "lamp" as const })),
        ...this.objects
          .filter((o) => o.kind === "building")
          .map((o) => ({ x: o.x, y: o.y, kind: "window" as const })),
      ],
    );
    this.refreshWorld();
    this.zoom = worldZoom(this.scale.width);
    this.cameras.main
      .setBounds(0, 0, map.widthInPixels, map.heightInPixels)
      .setZoom(this.zoom)
      .startFollow(
        this.player,
        true,
        this.reduced ? 1 : 0.12,
        this.reduced ? 1 : 0.12,
      )
      .setRoundPixels(true);
    if (this.paused) this.physics.world.pause();
    if (this.location === "shelter") visitShelter();
    discoverArea(this.location);
    if (!gameStore.getSnapshot().progress.started) {
      persistStarted();
      this.time.delayedCall(700, () => {
        if (!gameStore.getSnapshot().platformAnimalRequest)
          talkNpc(this.location === "shelter" ? "lina" : "maya");
      });
    }
    publish({
      phase: "ready",
      load: 1,
      scene: this.location,
      nearby: null,
      busy: false,
    });
    this.nextSave = this.time.now + 4000;
  }
  private resize() {
    this.cameras.main.setRoundPixels(true);
  }
  private registerFrames() {
    registerActors(this);
    for (const [id, effect] of Object.entries(characterCatalog.effects)) {
      const key = "reaction:" + id;
      if (!this.anims.exists(key))
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(key, {
            start: 0,
            end: effect.frames - 1,
          }),
          frameRate: 7,
          repeat: 1,
        });
    }
    const world = this.cache.json.get("worldManifest") as WorldManifest;
    for (const [path, frame] of Object.entries(world.sprites)) {
      const [sheet, id] = path.split("/");
      if (this.textures.exists(sheet) && !this.textures.get(sheet).has(id))
        this.textures
          .get(sheet)
          .add(id, 0, frame.x, frame.y, frame.width, frame.height);
    }
    const manifest = this.cache.json.get(
      "animationManifest",
    ) as AnimationManifest;
    for (const [key, animation] of Object.entries(manifest.animations)) {
      if (!this.textures.exists(animation.sheet) || this.anims.exists(key))
        continue;
      const sheet = manifest.sheets[animation.sheet],
        h = sheet.frameHeight;
      this.anims.create({
        key,
        frames: animation.frames.map((f) => ({
          key: animation.sheet,
          frame: (f.y / h) * sheet.columns + f.x / sheet.frameWidth,
        })),
        frameRate: animation.fps,
        repeat: -1,
      });
    }
  }
  private block(x: number, y: number, width: number, height: number) {
    this.geometryRects.push({
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
    });
    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    this.solids.add(zone);
    for (
      let ty = Math.floor((y - height / 2) / 32);
      ty < Math.ceil((y + height / 2) / 32);
      ty++
    )
      for (
        let tx = Math.floor((x - width / 2) / 32);
        tx < Math.ceil((x + width / 2) / 32);
        tx++
      )
        this.blocked.add(tx + "," + ty);
  }
  private placeObject(o: WorldObject) {
    if (o.asset) {
      const image = this.add
        .image(o.x, o.y, o.asset)
        .setOrigin(0.5, 1)
        .setDepth(o.y);
      this.objectImages.set(o.id, image);
      if (o.kind !== "pickup")
        this.block(o.x, o.y - 6, o.id === "immersion:board" ? 44 : 24, 12);
      return;
    }
    if (o.kind === "animal") {
      if (!gameStore.getSnapshot().progress.rescued.includes(o.id))
        this.addAnimal(o);
      return;
    }
    if (o.kind === "npc") {
      const sprite = this.physics.add
        .sprite(o.x, o.y, "rescuer")
        .setOrigin(0.5, 1)
        .setDepth(o.y) as Actor;
      configurePlayer(sprite, o.id === "maya" || o.id === "jo" ? o.id : "lina");
      sprite.setImmovable(true);
      sprite.play("rescuer/idle_down");
      if (o.id !== "maya") sprite.setTint(0xe5efda);
      const label = this.nameLabel(o.x, o.y + 6, o.label);
      this.npcs.push({
        object: o,
        sprite,
        label,
        home: { x: o.x, y: o.y },
        route: [],
        phase: "",
      });
      return;
    }
    if (o.kind === "exit") {
      this.add
        .text(o.x, o.y, "↓ Outside", {
          fontFamily: "Saira Condensed",
          fontSize: "12px",
          color: "#fae8ce",
          backgroundColor: "#442628",
          padding: { x: 8, y: 5 },
        })
        .setOrigin(0.5)
        .setDepth(100);
      return;
    }
    if (!o.sprite) return;
    const sheet =
      o.kind === "building"
        ? "buildings"
        : this.textures.get("environment").has(o.sprite)
          ? "environment"
          : "items";
    const image = this.add
      .image(o.x, o.y, sheet, o.sprite)
      .setOrigin(0.5, 1)
      .setDepth(o.y);
    this.objectImages.set(o.id, image);
    if (o.sprite === "street_lamp")
      for (const [size, alpha] of [
        [30, 0.04],
        [18, 0.1],
        [6, 0.35],
      ]) {
        const glow = this.add
          .rectangle(o.x, o.y - 43, size, size, 0xffd485, 0)
          .setDepth(9500);
        glow.setData("strength", alpha);
        this.lamps.push(glow);
      }
    if (o.kind === "building") {
      this.block(o.x, o.y - 23, 94, 42);
      this.nameLabel(o.x, o.y + 5, o.label);
    } else if (o.solid)
      this.block(
        o.x,
        o.y - 7,
        o.sprite.includes("tree")
          ? 18
          : Math.min(36, o.sprite.includes("bench") ? 36 : 22),
        12,
      );
  }
  private nameLabel(x: number, y: number, text: string) {
    return this.add
      .text(x, y, text, {
        fontFamily: "Saira Condensed",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#fae8ce",
        backgroundColor: "#442628",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 0)
      .setDepth(y + 1);
  }
  private addAnimal(object: WorldObject) {
    const sprite = this.physics.add
      .sprite(object.x, object.y, object.sprite!)
      .setOrigin(0.5, 1)
      .setDepth(object.y) as Actor;
    configureAnimal(sprite, object.sprite!);
    sprite.setCollideWorldBounds(true);
    sprite.play(object.sprite + "/idle");
    const label = this.nameLabel(object.x, object.y + 5, object.label);
    label.setVisible(false);
    this.animals.push({
      object,
      sprite,
      home: { x: object.x, y: object.y },
      state: "idle",
      until: this.time.now + Phaser.Math.Between(1800, 5000),
      route: [],
      facing: "down",
      label,
    });
  }
  /** Themed, walkable placements; deliberately unrelated to platform location coordinates. */
  private syncPlatformAnimals() {
    for (const animal of this.platformActors) {
      animal.sprite.destroy();
      animal.label.destroy();
    }
    this.platformActors = [];
    if (!["neighborhood", "shelter"].includes(this.location)) return;
    const occupied = new Set<string>();
    const animals = gameStore
      .getSnapshot()
      .platformAnimals.filter(eligibleEncounter)
      .filter((animal) => {
        const id = new URLSearchParams(window.location.search).get("shelterId");
        return this.location !== "shelter" || !id || animal.shelterId === id;
      })
      .slice(0, 12);
    for (const [index, animal] of animals.entries()) {
      const anchor =
        this.location === "shelter"
          ? { x: 5 + (index % 4) * 4, y: 7 + Math.floor(index / 4) * 3 }
          : { x: 27 + (index % 4) * 3, y: 27 + Math.floor(index / 4) * 3 };
      let point: { x: number; y: number } | null = null;
      for (let radius = 0; radius < 6 && !point; radius++)
        for (let dy = -radius; dy <= radius && !point; dy++)
          for (let dx = -radius; dx <= radius && !point; dx++) {
            const x = anchor.x + dx,
              y = anchor.y + dy,
              key = x + "," + y;
            if (
              x > 1 &&
              y > 2 &&
              x < this.mapWidth - 1 &&
              y < this.mapHeight - 1 &&
              !this.blocked.has(key) &&
              !occupied.has(key)
            ) {
              occupied.add(key);
              point = { x: x * 32 + 16, y: y * 32 + 24 };
            }
          }
      if (!point) continue;
      const object: WorldObject = {
        id: encounterId(animal.id),
        platformAnimalId: animal.id,
        kind: "platform-animal",
        label: animal.name,
        sprite: animal.sprite,
        ...point,
      };
      const sprite = this.physics.add
        .sprite(point.x, point.y, animal.sprite)
        .setOrigin(0.5, 1)
        .setDepth(point.y) as Actor;
      sprite.body.setSize(10, 6).setOffset(11, 26);
      sprite.setImmovable(true).play(animal.sprite + "/idle");
      configureAnimal(sprite, animal.sprite);
      const label = this.nameLabel(
        point.x,
        point.y + 4,
        animal.name +
          (animal.provenance.kind === "real" ? " · PawTrail" : " · Sample"),
      );
      label.setVisible(false);
      this.platformActors.push({ object, sprite, label });
    }
    this.lastNearby = "";
    // A refresh can remove the animal that was previously under the interaction marker.
    this.nearest = null;
    this.markerTarget = null;
    if (this.marker) this.marker.setVisible(false);
    publish({ nearby: null });
  }
  private command(command: GameCommand) {
    if (command.type === "photo-scene") {
      if (this.takingScenePhoto || !this.player?.scene) return;
      this.takingScenePhoto = true;
      this.game.renderer.snapshot((image) => {
        this.takingScenePhoto = false;
        if (!("src" in image)) {
          publish({
            notice: "This photo could not be taken. Please try again.",
          });
          return;
        }
        const canvas = document.createElement("canvas"),
          divisor = Math.max(
            1,
            Math.ceil(image.width / 800),
            Math.ceil(image.height / 600),
          );
        canvas.width = Math.max(1, Math.floor(image.width / divisor));
        canvas.height = Math.max(1, Math.floor(image.height / divisor));
        const context = canvas.getContext("2d");
        if (!context) {
          publish({ notice: "Photo export is unavailable in this browser." });
          return;
        }
        context.imageSmoothingEnabled = false;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        try {
          saveScenePhoto(canvas.toDataURL("image/png"), this.location);
          audio.effect("photo");
        } catch {
          publish({
            notice: "This photo could not be saved. Please try again.",
          });
        }
      });
      return;
    }
    if (command.type === "emote") {
      if (this.time.now - this.lastReaction < 2000 && !isAbility(command.emote)) return;
      this.lastReaction = this.time.now;
      const id = command.emote;
      if(isAbility(id)){
        if(this.worldInteractions?.locksMovement){publish({notice:'Finish the current interaction before using an ability.'});return}
        if(!activateLocalAbility(id,gameAppearance(gameStore.getSnapshot().progress.appearance)))return;
      }else cancelLocalAbility();
      const effect =
          reactionEffect(id) in characterCatalog.effects
            ? reactionEffect(id)
            : "happy";
      if (!(effect in characterCatalog.effects)) return;
      if (!richReaction(id)) {
        if (!this.reactionSprite?.scene)
          this.reactionSprite = this.add
            .sprite(this.player.x, this.player.y - 52, "reaction:" + effect)
            .setDepth(20000);
        this.reactionSprite.setTexture("reaction:" + effect).setVisible(true);
        if (this.reduced) this.reactionSprite.anims.stop();
        else this.reactionSprite.play("reaction:" + effect, true);
        this.reactionUntil = this.time.now + 1800;
      } else {
        this.reactionSprite?.setVisible(false);
        this.reactionUntil = 0;
      }
      const name = reactionAnimation(id);
      const mobile=allowsMovingAction(name);
      this.player.setData('modelEmoteAction',name).setData('modelEmoteUntil',mobile?this.time.now+reactionDuration(id):0);
      this.busyUntil = mobile ? 0 : this.time.now + reactionDuration(id);
      if(!mobile)this.player.setVelocity(0, 0);
      this.playerAction(name);
      audio.effect("ui");
      return;
    }

    if (command.type === "cat-sound") {
      if (this.time.now < this.soundUntil) return;
      this.soundUntil = this.time.now + 3000;
      catReaction(this, this.player, command.emote);
      return;
    }
    if (command.type === "guide") {
      if (!command.target) {
        this.guideMarker?.destroy();
        this.guideMarker = undefined;
        return;
      }
      const target = this.objects.find((o) => o.id === command.target);
      this.guideMarker?.destroy();
      if (target)
        this.guideMarker = this.add
          .image(target.x, target.y - 65, "items", "paw_indicator_0")
          .setDepth(20000)
          .setData("noTint", true);
      publish({
        notice: target
          ? "A marker shows the location your volunteer shared."
          : "Visit the appropriate area and ask your volunteer for directions.",
      });
      return;
    }
    if (command.type === "platform-sync") {
      this.syncPlatformAnimals();
      return;
    }
    if (command.type === "pause") {
      if (command.paused)
        savePosition(this.player.x, this.player.y, this.location);
      this.paused = command.paused;
      publish({ paused: this.paused });
      this.virtual = { x: 0, y: 0 };
      this.route = [];
      this.input.keyboard?.resetKeys();
      this.player.setVelocity(0, 0);
      this.physics.world[this.paused ? "pause" : "resume"]();
      return;
    }
    if (command.type === "move") {
      this.virtual = { x: command.x, y: command.y };
      this.route = [];
      return;
    }
    if (command.type === "zoom") {
      this.zoom = setWorldZoom(this.zoom + command.amount);
      this.cameras.main.setZoom(this.zoom);
      return;
    }
    if (command.type === "reload") {
      this.scene.restart({
        location: gameStore.getSnapshot().progress.position.scene,
        entrance: false,
      });
      return;
    }
    if (command.type === "refresh") {
      this.refreshWorld();
      return;
    }
    if (command.type === "appearance") {
      cancelLocalAbility();
      this.player.anims.stop();
      this.player.setTexture(this.playerAppearance);
      configurePlayer(
        this.player,
        characterId(gameStore.getSnapshot().progress.appearance),
      );
      this.playerAction("idle_" + this.facing);
      return;
    }
    if (command.type === "focus") {
      (this.game.canvas as HTMLCanvasElement).focus();
      return;
    }
    if (command.type === "reset") {
      this.paused = false;
      publish({ paused: false });
      this.scene.restart({ location: "neighborhood", entrance: false });
      return;
    }
    if (this.paused || this.time.now < this.busyUntil) return;
    if (command.type === "care") {
      if (
        ["feed", "water", "pet"].includes(command.action) &&
        this.worldInteractions
      )
        this.companionRuntime?.care(
          "local:" + command.id,
          command.action as "feed" | "water" | "pet",
          this.worldInteractions,
        );
      else this.care(command.action, command.id);
      return;
    }
    if (command.type === "interact") this.interact();
  }
  private interact() {
    const o = this.nearest;
    if (o?.id === "immersion:board") {
      this.route = [];
      this.player.setVelocity(0, 0);
      emit({ type: "interact", target: o.id });
      publish({ panelRequest: "board" });
      void audio.playSample("/assets/game/audio/missions/board.wav");
      return;
    }
    if (o?.id.startsWith("immersion-env:")) {
      this.route = [];
      this.player.setVelocity(0, 0);
      const name = o.id.split(":")[1];
      if (name === "bench") {
        this.playerAction("sit", 0);
        this.busyUntil = this.time.now + 2000;
        publish({ notice: "A quiet moment on the neighborhood bench." });
      } else {
        const item =
          name === "bush"
            ? "fish-treats"
            : name === "bin"
              ? "recyclables"
              : name === "mailbox"
                ? "letter"
                : name === "tree"
                  ? "rare-decoration"
                  : null;
        if (item && !collectFind(o.id, item))
          publish({
            notice:
              "You have already found the keepsake here. Enjoy a little quiet exploration.",
          });
        if (!item)
          publish({
            notice: "A shaded, dry resting place for the neighborhood animals.",
          });
        const image = this.objectImages.get(o.id);
        if (image && ["bush", "bin", "mailbox"].includes(name))
          image.setTexture(
            "env:" + name + (name === "bush" ? "-rustle" : "-open"),
          );
        if (image && !this.reduced)
          this.tweens.add({
            targets: image,
            angle: 3,
            yoyo: true,
            repeat: 2,
            duration: 80,
            onComplete: () => image.setAngle(0),
          });
      }
      emit({ type: "interact", target: o.id });
      void audio.playSample("/assets/game/audio/inventory/rustle.wav");
      return;
    }
    if (!o) {
      publish({
        notice: "Walk closer to an animal, volunteer, doorway, or supply box.",
      });
      return;
    }
    if (o.kind === "platform-animal") {
      publish({
        platformAnimalRequest: o.platformAnimalId ?? null,
        dialogue: null,
      });
      audio.effect("ui");
      return;
    }
    if (o.kind === "animal") {
      this.care("pet", o.id);
      return;
    }
    if (o.kind === "npc") {
      talkNpc(o.id);
      audio.effect("ui");
      return;
    }
    if (o.kind === "supplies") {
      collectSupplies(o.id);
      this.playerAction("pick_up", 0);
      this.busyUntil = this.time.now + 750;
      return;
    }
    if (o.kind === "exit") {
      const exit =
        this.location === "garden"
          ? { x: 12 * 32, y: 33 * 32 }
          : this.location === "riverside"
            ? { x: 55 * 32, y: 25 * 32 }
            : { x: 46 * 32, y: 13 * 32 };
      savePosition(exit.x, exit.y, "neighborhood");
      audio.effect("door");
      this.scene.restart({ location: "neighborhood", entrance: true });
      return;
    }
    if (o.kind === "portal") {
      if (
        o.requires &&
        !gameStore.getSnapshot().progress.unlocks.includes(o.requires)
      ) {
        publish({
          notice:
            o.destination === "garden"
              ? "Complete Welcome to PawTrail to receive the garden key."
              : "Help restore the shelter to unlock the riverside trail.",
        });
        return;
      }
      savePosition(12 * 32 + 16, 14 * 32, o.destination!);
      audio.effect("door");
      this.scene.restart({ location: o.destination, entrance: true });
      return;
    }
    if (o.kind === "pickup") {
      if (o.findId) {
        collectFind(o.id, o.findId);
        const sparkle = this.add
          .image(o.x, o.y - 15, "pickup-sparkle")
          .setDepth(20000);
        this.tweens.add({
          targets: sparkle,
          y: sparkle.y - 18,
          alpha: 0,
          duration: 500,
          onComplete: () => sparkle.destroy(),
        });
        this.playerAction("pick_up", 0);
        this.busyUntil = this.time.now + 650;
        void audio.playSample("/assets/game/audio/inventory/pickup.wav");
        this.refreshWorld();
        return;
      }
      collectItem(o.id, o.item!, o.amount ?? 1);
      audio.effect("pickup");
      this.refreshWorld();
      return;
    }
    if (o.kind === "clue") {
      emit({ type: "interact", target: o.id });
      publish({
        notice:
          "Tiny pawprints lead toward a white kitten among the flower pots.",
      });
      audio.effect("ui");
      return;
    }
    if (o.kind === "station") {
      emit({ type: "interact", target: o.id });
      publish({
        dialogue: {
          name: o.label,
          text: "A little care station for everyone in the neighborhood.",
          choices: [
            { label: "Refill water · 1 bottle", action: "water", target: o.id },
            ...(o.id === "feeding-station"
              ? [
                  {
                    label: "Clean the station",
                    action: "clean" as const,
                    target: o.id,
                  },
                  {
                    label: "Restore station · 30 Kibble + 2 supplies",
                    action: "upgrade" as const,
                    target: o.id,
                  },
                ]
              : []),
          ],
        },
      });
      return;
    }
    if (o.kind === "project") {
      const project = PROJECTS.find((p) => p.id === o.project)!;
      publish({
        dialogue: {
          name: project.name,
          text: project.description,
          choices: gameStore
            .getSnapshot()
            .progress.upgrades.includes(project.id)
            ? []
            : [
                {
                  label: `Improve · ${project.kibble} Kibble + ${project.materials} supplies`,
                  action: "upgrade",
                  target: project.id,
                },
              ],
        },
      });
      return;
    }
    if (o.kind === "rest") {
      publish({
        dialogue: {
          name: "A peaceful moment",
          text: "Take your time. There is no penalty for a quiet pause.",
          choices: [
            { label: "Wait one game hour", action: "rest", target: "hour" },
            ...(this.location === "shelter"
              ? [
                  {
                    label: "Rest until the next morning",
                    action: "rest" as const,
                    target: "morning",
                  },
                ]
              : []),
          ],
        },
      });
      return;
    }
    if (o.kind === "building") {
      if (o.enter) {
        audio.effect("door");
        savePosition(12 * 32 + 16, 14 * 32, "shelter");
        this.scene.restart({ location: "shelter", entrance: true });
      } else
        publish({
          dialogue: {
            name: o.label,
            text:
              o.sprite === "veterinary_clinic"
                ? "The vet team works with the shelter to arrange professional care. Maya can help you coordinate a safe care visit."
                : o.sprite === "pet_supply_shop" ||
                    o.sprite === "sari_sari_store"
                  ? "The neighbors keep care supplies at the marked boxes near Maya and inside the shelter. Take what you need for your care rounds."
                  : "A neighbor’s home. There are more animals to meet along the public paths.",
          },
        });
    }
  }
  private care(action: CareAction, id: string) {
    if (this.time.now < this.busyUntil) return;
    const animal = this.animals.find((a) => a.object.id === id);
    if (!animal || !interactionAllowed(this.player, animal.sprite)) {
      publish({ notice: "Move closer before helping." });
      return;
    }
    const reason = careReason(action, id);
    if (reason) {
      publish({ notice: reason });
      return;
    }
    if (action === "photo") {
      this.photograph(animal);
      return;
    }
    this.route = [];
    this.player.setVelocity(0, 0);
    animal.sprite.setVelocity(0, 0);
    animal.route = [];
    animal.state = "care";
    animal.until = this.time.now + 2000;
    publish({ busy: true, notice: "Helping " + animal.object.label + "…" });
    this.busyUntil = this.time.now + 1100;
    faceActor(this.player, animal.sprite);
    this.playerAction(action === "rescue" ? "pick_up" :
      action === "observe" || action === "check" ? "inspect" : action, 0);
    this.animalAction(animal, action === "feed" ? "eat" :
      action === "water" ? "drink" : action === "pet" ? "pet" : "happy");
    this.time.delayedCall(1050, () => {
      publish({ busy: false });
      if (!applyCare(action, id)) return;
      audio.effect(action);
      if (action === "check") {
        const p = gameStore.getSnapshot().progress,
          m = memory(p, id);
        publish({
          dialogue: {
            name: animal.object.label + " — care notes",
            portrait: animal.object.sprite,
            text: `${m.lastCare.feed === p.day ? "Has received food today." : "Could use a meal today."} ${m.lastCare.water === p.day ? "Has fresh water." : "Could use fresh water."} Trust: ${m.trust}/100. Move gently and let them choose the pace. These observations are not a medical diagnosis.`,
          },
        });
      }
      if (
        action === "pet" &&
        ANIMALS.find((a) => a.id === id)?.species === "cat"
      )
        audio.effect("purr");
      animal.state = "rest";
      animal.until = this.time.now + 6000;
      const rewardPosition = { x: animal.sprite.x, y: animal.sprite.y - 30 };
      if (action === "rescue") {
        const effect = () => {
          animal.sprite.destroy();
          animal.label.destroy();
          this.animals = this.animals.filter((a) => a !== animal);
          this.nearest = null;
          publish({ nearby: null });
        };
        if (this.reduced) effect();
        else
          this.tweens.add({
            targets: [animal.sprite, animal.label],
            alpha: 0,
            duration: 250,
            onComplete: effect,
          });
      } else this.animalAction(animal, "happy");
      this.rewardEffect(rewardPosition.x, rewardPosition.y);
    });
  }
  private rewardEffect(x: number, y: number) {
    if (this.reduced) return;
    const coin = this.add
      .image(x, y, "items", "kibble_coin_0")
      .setDepth(10001)
      .setScale(1);
    this.tweens.add({
      targets: coin,
      y: y - 20,
      alpha: 0,
      duration: 850,
      ease: "Sine.easeOut",
      onComplete: () => coin.destroy(),
    });
  }
  private move(actor: Actor, route: { x: number; y: number }[], speed: number) {
    if (!route.length) {
      actor.setVelocity(0, 0);
      return false;
    }
    const point = route[0],
      dx = point.x - actor.x,
      dy = point.y - actor.y,
      distance = Math.hypot(dx, dy);
    if (distance < 5) {
      route.shift();
      if (!route.length) actor.setVelocity(0, 0);
      return route.length > 0;
    }
    actor.setVelocity((dx / distance) * speed, (dy / distance) * speed);
    return true;
  }
  private direction(x: number, y: number): Direction {
    return Math.abs(x) > Math.abs(y)
      ? x < 0
        ? "left"
        : "right"
      : y < 0
        ? "up"
        : "down";
  }
  update(time: number, delta: number) {
    if (
      !this.player ||
      this.paused ||
      gameStore.getSnapshot().phase !== "ready"
    )
      return;
    if (document.querySelector("[role=dialog],[role=menu]")) {
      this.player.setVelocity(0, 0);
      return;
    }
    this.cameras.main.setLerp(
      this.reduced ? 1 : 1 - Math.exp(-Math.min(delta, 100) / 140),
    );
    this.companionRuntime?.step(time, delta);
    this.worldInteractions?.step(time, this.player, this.route.length === 0);
    const active=activeAbility();
    const timed=String(this.player.getData('modelEmoteAction')??'');
    if(isAbility(timed)&&active?.id!==timed){this.player.setData('modelEmoteUntil',0).setData('modelEmoteAction','');if(this.player.getData('modelAction')===timed)this.player.setData('modelAction','idle_'+this.facing)}
    const busy = time < this.busyUntil;
    this.clockAccumulator += Math.min(delta, 100);
    if (this.clockAccumulator >= 500) {
      advanceClock(Math.floor(this.clockAccumulator / 500));
      this.clockAccumulator %= 500;
    }
    this.updateWorld(time, delta);
    const x =
      (this.cursors.right.isDown || this.keys.D.isDown ? 1 : 0) -
      (this.cursors.left.isDown || this.keys.A.isDown ? 1 : 0) +
      this.virtual.x;
    const y =
      (this.cursors.down.isDown || this.keys.S.isDown ? 1 : 0) -
      (this.cursors.up.isDown || this.keys.W.isDown ? 1 : 0) +
      this.virtual.y;
    if (x || y) this.worldInteractions?.cancel();
    if (busy && !this.worldInteractions?.active) this.player.setVelocity(0, 0);
    else if (this.worldInteractions?.locksMovement)
      this.player.setVelocity(0, 0);
    else {
      const motion=movementProfile(gameAppearance(gameStore.getSnapshot().progress.appearance),this.keys.SHIFT.isDown);
      const input=motion.dash&&!x&&!y&&!this.route.length?headingVector(this.facing):{x,y};
      moveActor(
        this.player,
        input,
        this.route,
        delta,
        worldNavigation(this.blocked)??undefined,
        this.keys.SHIFT.isDown,
        motion.speed,
      );
      const velocity = this.player.body.velocity;
      if (velocity.length() > 1) {
        this.facing = this.direction(velocity.x, velocity.y);
        this.playerAction((motion.running?"run_":"walk_") + this.facing);
      } else
        this.playerAction("idle_" + this.facing);
      this.player.anims.timeScale = 1;
      if (
        this.atmosphere?.raining &&
        time > this.nextSplash &&
        velocity.length() > 1 &&
        this.atmosphere.puddleLocations.some(
          (p) => Math.hypot(p.x - this.player.x, p.y - this.player.y) < 28,
        )
      ) {
        this.atmosphere.splash(this.player.x, this.player.y);
        this.nextSplash = time + 300;
      }
      if (
        Phaser.Input.Keyboard.JustDown(this.keys.E) ||
        (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) &&
          document.activeElement?.tagName !== "BUTTON")
      )
        this.interact();
      if (this.nearest?.kind === "animal")
        for (const [key, action] of [
          ["ONE", "feed"],
          ["TWO", "pet"],
          ["THREE", "water"],
          ["FOUR", "rescue"],
        ] as const)
          if (Phaser.Input.Keyboard.JustDown(this.keys[key]))
            this.care(action, this.nearest.id);
    }
    this.player.setDepth(this.player.y);
    if (this.reactionSprite?.scene)
      this.reactionSprite
        .setPosition(this.player.x, this.player.y - 52)
        .setVisible(time < this.reactionUntil);
    for (const animal of this.animals) {
      companionPositions.set("local:" + animal.object.id, {
        x: animal.sprite.x,
        y: animal.sprite.y,
      });
      if (
        animal.sprite.visible &&
        !this.companionRuntime?.controls("local:" + animal.object.id)
      )
        this.updateAnimal(animal, time);
    }
    if (time >= this.nextProximity) {
      this.nextProximity = time + 120;
      this.proximity();
    }
    if (this.markerTarget) {
      this.marker.setPosition(
        this.markerTarget.x,
        this.markerTarget.y -
          55 +
          (this.reduced ? 0 : Math.sin(time / 280) * 2),
      );
      this.marker.setFrame("paw_indicator_" + (Math.floor(time / 160) % 8));
    }
    if (time >= this.nextSave && !busy) {
      this.nextSave = time + 5000;
      savePosition(this.player.x, this.player.y, this.location);
    }
  }
  private updateAnimal(a: Animal, time: number) {
    const p = gameStore.getSnapshot().progress,
      profile = ANIMALS.find((n) => n.id === a.object.id)!,
      trust = memory(p, a.object.id).trust;
    const distance = Phaser.Math.Distance.Between(
        a.sprite.x,
        a.sprite.y,
        this.player.x,
        this.player.y,
      ),
      phase = dayPhase(p.minute);
    if (a.state === "care" && time < a.until) return;
    if (a.state === "rest" && time < a.until) {
      a.sprite.setVelocity(0, 0);
      this.animalAction(a, "sit");
      return;
    }
    if (
      profile.personality === "shy" &&
      !movementProfile(gameAppearance(gameStore.getSnapshot().progress.appearance)).gentle &&
      trust < 20 &&
      distance < 70 &&
      this.player.body.velocity.length() > 120 &&
      a.state !== "avoid"
    )
      a.until = 0;
    if(a.state==='avoid'&&movementProfile(gameAppearance(gameStore.getSnapshot().progress.appearance)).gentle&&distance>22)a.until=0;
    if (time >= a.until) {
      a.until = time + Phaser.Math.Between(2500, 5000);
      a.state = chooseBehavior(
        profile,
        trust,
        phase,
        distance,
        this.player.body.velocity.length() > 120,
        p.animals[a.object.id]?.lastCare.feed === p.day,
        Math.random(),
        movementProfile(gameAppearance(gameStore.getSnapshot().progress.appearance)).gentle,
      );
      let goal: { x: number; y: number } | null = null;
      if (["approach", "follow", "avoid"].includes(a.state)) {
        const dx = a.sprite.x - this.player.x,
          dy = a.sprite.y - this.player.y,
          length = Math.hypot(dx, dy) || 1;
        const extent = a.state === "avoid" ? 150 : 40;
        goal = {
          x: this.player.x + (dx / length) * extent,
          y: this.player.y + (dy / length) * extent,
        };
      } else if (a.state === "wander") {
        const [x, y] = profile.routine[phase];
        goal = {
          x: x * 32 + Phaser.Math.Between(-45, 45),
          y: y * 32 + Phaser.Math.Between(-35, 35),
        };
        if (this.location === "shelter")
          goal = {
            x: a.home.x + Phaser.Math.Between(-30, 30),
            y: a.home.y + Phaser.Math.Between(-30, 30),
          };
      }
      if (this.atmosphere?.raining && this.location === "neighborhood") {
        goal = { x: 17 * 32, y: 23 * 32 };
        a.state = "wander";
      }
      a.route = goal
        ? findPath(a.sprite, goal, this.mapWidth, this.mapHeight, this.blocked)
        : [];
    }
    const moving =
      ["wander", "approach", "follow", "avoid"].includes(a.state) &&
      this.move(a.sprite, a.route, a.state === "avoid" ? 55 : 30);
    if (moving) {
      a.facing = this.direction(
        a.sprite.body.velocity.x,
        a.sprite.body.velocity.y,
      );
      this.animalAction(a, "walk_" + a.facing);
    } else {
      a.sprite.setVelocity(0, 0);
      this.animalAction(a, a.state === "sleep" ? "sleep" : "idle");
    }
    a.sprite.setDepth(a.sprite.y);
    a.label
      .setPosition(a.sprite.x, a.sprite.y + 4)
      .setDepth(a.sprite.y + 1)
      .setVisible(distance < 100);
  }
  private photograph(a: Animal) {
    this.route = [];
    this.player.setVelocity(0, 0);
    this.busyUntil = this.time.now + 1200;
    publish({ busy: true });
    const camera = this.cameras.main,
      size = Math.min(128, this.game.canvas.width, this.game.canvas.height),
      x = Phaser.Math.Clamp(
        Math.round((a.sprite.x - camera.scrollX) * camera.zoom - size / 2),
        0,
        this.game.canvas.width - size,
      ),
      y = Phaser.Math.Clamp(
        Math.round((a.sprite.y - camera.scrollY) * camera.zoom - size / 2 - 18),
        0,
        this.game.canvas.height - size,
      );
    this.game.renderer.snapshotArea(x, y, size, size, (image) => {
      if ("src" in image) {
        applyCare("photo", a.object.id, { image: image.src, pose: a.state });
        audio.effect("photo");
      } else publish({ notice: "The photo could not be saved. Try again." });
      publish({ busy: false });
    });
  }
  private refreshWorld() {
    this.additions.forEach((o) => o.destroy());
    this.additions = [];
    const p = gameStore.getSnapshot().progress;
    for (const o of this.objects) {
      const image = this.objectImages.get(o.id);
      if (!image) continue;
      if (o.kind === "pickup")
        image.setVisible(!p.completed.includes("pickup:" + o.id));
      if (o.kind === "portal") {
        const open = !o.requires || p.unlocks.includes(o.requires);
        image.setData("baseTint", open ? 0xffffff : 0x9b978b);
        if (open) image.clearTint();
        else image.setTint(0x9b978b);
        if (o.sprite === "fence_gate")
          image
            .setFrame(open ? "fence_end" : "fence_gate")
            .setX(o.x - (open ? 18 : 0));
      }
    }
    const add = (sprite: string, x: number, y: number) => {
      const image = this.add
        .image(x, y, "environment", sprite)
        .setOrigin(0.5, 1)
        .setDepth(y);
      this.additions.push(image);
    };
    if (p.day % 7 === 0 && this.location === "neighborhood")
      for (let i = 27; i < 33; i++)
        add(i % 2 ? "pink_flowers" : "yellow_flowers", i * 32, 21 * 32);
    if (
      p.upgrades.includes("feeding-station") &&
      this.location === "neighborhood"
    ) {
      add("yellow_flowers", 16 * 32, 24 * 32);
      add("garden_pot", 18 * 32, 24 * 32);
      add("food_bowl", 17 * 32, 24 * 32);
    }
    if (this.location === "shelter") {
      if (p.upgrades.includes("shelter-beds")) {
        add("round_bed", 8 * 32, 11 * 32);
        add("rectangular_bed", 16 * 32, 11 * 32);
        add("food_bowl", 15 * 32, 11 * 32);
      }
      if (p.upgrades.includes("shelter-garden"))
        for (let i = 4; i < 20; i += 3)
          add(i % 2 ? "pink_flowers" : "yellow_flowers", i * 32, 4 * 32);
    }
    for (const o of this.objects)
      if (o.kind === "pickup" && p.completed.includes("pickup:" + o.id))
        o.description = "Collected";
  }
  private updateWorld(time: number, delta: number) {
    const p = gameStore.getSnapshot().progress,
      phase = dayPhase(p.minute),
      condition = worldConditions(p.day * 1440 + p.minute);
    this.atmosphere?.step(time, delta, condition, this.location === "shelter");
    const board = this.objectImages.get("immersion:board");
    if (board)
      board.setTexture(
        "mission-board-" +
          (this.nearest?.id === "immersion:board"
            ? "nearby"
            : p.completed.includes("event:interact:immersion:board")
              ? QUESTS.some((q) =>
                  ["available", "active", "completed"].includes(
                    questState(p, q),
                  ),
                )
                ? "available"
                : "normal"
              : "new"),
      );
    for (const object of this.objects) {
      const image = this.objectImages.get(object.id);
      if (image && object.kind === "pickup" && object.findId && image.visible)
        image.y =
          object.y + (this.reduced ? 0 : Math.sin(time / 550 + object.x) * 1.5);
      if (image && object.asset === "env:tree" && !this.reduced)
        image.setAngle(
          condition.weather.includes("rain") ? Math.sin(time / 1800) : 0,
        );
    }
    this.lamps.forEach((l) =>
      l.setAlpha(
        phase === "night" || phase === "evening"
          ? Number(l.getData("strength"))
          : 0,
      ),
    );
    let area: string = this.location;
    if (this.location === "neighborhood")
      area =
        this.player.x > 49 * 32 &&
        this.player.y > 20 * 32 &&
        this.player.y < 26 * 32
          ? "pavilion"
          : this.player.x > 39 * 32 && this.player.y > 21 * 32
            ? "park"
            : this.player.x < 18 * 32 && this.player.y > 28 * 32
              ? "alley"
              : this.player.y < 15 * 32
                ? "market"
                : "neighborhood";
    if (area !== this.lastArea) {
      this.lastArea = area;
      discoverArea(area);
    }
    audio.setScene(
      area,
      phase,
      this.location === "riverside" || area === "park" || area === "pavilion",
    );
    if (this.player.body.velocity.length() > 5 && time > this.nextStep) {
      const motion=movementProfile(gameAppearance(gameStore.getSnapshot().progress.appearance),this.keys.SHIFT.isDown);
      this.nextStep=time+Math.max(90,Math.round(320*105/motion.speed));
      if(!motion.gentle)audio.effect(area === "park" ? "step-grass" : "step-path");
    }
    if (time > this.nextVoice) {
      this.nextVoice = time + 12000 + Math.random() * 15000;
      const near = this.animals.find(
        (a) =>
          Phaser.Math.Distance.Between(
            a.sprite.x,
            a.sprite.y,
            this.player.x,
            this.player.y,
          ) < 110,
      );
      if (near)
        audio.effect(
          ANIMALS.find((a) => a.id === near.object.id)?.species === "dog"
            ? "bark"
            : "meow",
        );
    }
    for (const npc of this.npcs) {
      const routinePhase = phase + (this.atmosphere?.raining ? ":rain" : "");
      if (npc.phase !== routinePhase) {
        npc.phase = routinePhase;
        const offset =
          this.atmosphere?.raining || phase === "morning"
            ? 0
            : phase === "afternoon"
              ? 32
              : phase === "evening"
                ? -32
                : 16;
        npc.route = findPath(
          npc.sprite,
          { x: npc.home.x + offset, y: npc.home.y },
          this.mapWidth,
          this.mapHeight,
          this.blocked,
        );
      }
      const moving = this.move(npc.sprite, npc.route, 22);
      npc.sprite.play(
        "rescuer/" +
          (moving
            ? "walk_" +
              this.direction(
                npc.sprite.body.velocity.x,
                npc.sprite.body.velocity.y,
              )
            : "idle_down"),
        true,
      );
      npc.sprite.setDepth(npc.sprite.y);
      npc.object.x = npc.sprite.x;
      npc.object.y = npc.sprite.y;
      npc.label
        .setPosition(npc.sprite.x, npc.sprite.y + 6)
        .setDepth(npc.sprite.y + 1);
    }
  }
  private proximity() {
    for (const animal of this.platformActors)
      animal.label.setVisible(
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          animal.sprite.x,
          animal.sprite.y,
        ) < 120,
      );
    for (const a of this.animals.filter((a) => a.sprite.visible))
      if (
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          a.sprite.x,
          a.sprite.y,
        ) < 120 &&
        this.location !== "shelter"
      )
        discover(a.object.id);
    const candidates = [
      ...this.objects.filter((o) => o.kind !== "prop" && o.kind !== "animal"),
      ...this.animals
        .filter((a) => a.sprite.visible)
        .map((a) => ({
          ...a.object,
          x: a.sprite.x,
          y: a.sprite.y,
          state: a.state,
        })),
      ...this.platformActors.map((a) => a.object),
    ];
    const closest =
      candidates
        .map((o) => ({
          o,
          d: Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            o.x,
            o.y + (o.kind === "building" ? 12 : 0),
          ),
        }))
        .filter((a) => a.d < 64)
        .sort((a, b) => a.d - b.d)[0]?.o ?? null;
    this.nearest = closest;
    this.markerTarget = closest;
    this.marker.setVisible(!!closest);
    const signature = closest
      ? closest.id + ":" + ("state" in closest ? closest.state : "")
      : "";
    if (signature !== this.lastNearby) {
      this.lastNearby = signature;
      publish({
        nearby: closest
          ? {
              id: closest.id,
              kind: closest.kind as "animal",
              name: closest.label,
              sprite: closest.sprite,
              description: closest.description,
              state: "state" in closest ? String(closest.state) : undefined,
              rescuable: closest.rescuable,
              platformAnimalId: closest.platformAnimalId,
            }
          : null,
      });
    }
  }
}
