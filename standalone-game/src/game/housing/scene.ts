import { furnitureStateView } from '../furniture/state-view';
import {enterAbilities,movementProfile,activeAbility,isAbility,cancelLocalAbility} from '../abilities/state';
import {gameAppearance,headingVector} from '../abilities/appearance';
import {allowsMovingAction} from '../actor-rig/action-layers';
import { worldZoom, setWorldZoom } from "../runtime/camera";
import { installMemeAnchors } from "../runtime/meme-anchor";
import { showCatMeme } from "../cat-memes";
import { CompanionRuntime } from "../companions/runtime";
import { companions, companionPositions } from "../companions/store";
import {
  preloadActors,
  registerActors,
  playerTexture,
  animalTexture,
  configurePlayer,
  configureAnimal,
  playPlayer,
  playAnimal,
  moveActor,
  faceActor,
} from "../runtime/actors";
import { reactionEffect, reactionAnimation, reactionDuration, richReaction } from "../reactions";
import Phaser from "phaser";
import { drawInterior, nearStair, changeFloor } from "./interior";
import { floorPlan } from "./presets";
import { furnitureArt, ROOM_WINDOW } from "./room-art";
import { SpeechBubble } from "./speech-bubble";
import {
  homes,
  movement,
  patch,
  onScene,
  onLive,
  live,
  edit,
  selectPet,
  action,
} from "./client";
import {
  catalogue,
  furniture,
  furnitureAt,
  previewValid as valid,
  placementReason,
} from "./geometry";
import { CommunityEncounters, preloadEncounters } from "./encounters";
import { immersionPreferences } from "../immersion-preferences";
import { gameStore } from "../store";
import { Outdoors, preloadCommunity } from "./outdoors";
import {
  Navigation,
  worldPoint,
  worldRect,
  visualBounds,
  footRect,
} from "./spatial";
import { InteractionController, ACTION_LABELS } from "./interactions";
import { audio } from "../systems/audio";
import { dayPhase } from "../systems/time";
import type { Placement, SceneCommand, Point, Remote } from "./types";
import { Atmosphere, preloadAtmosphere } from "../atmosphere";
import { preloadCatFaces, catReaction } from "../soundboard";
import { SHARED_FINDS, sharedWorld } from "../immersion-data";
import { ContactMotor } from '../furniture/contacts'
import { RoomReactions } from '../furniture/room-reactions'
import { gameVoice } from '../runtime/game-voice'
import { FurnitureRotationControl } from '../furniture/rotation-control'
import { SofaPaletteTextures } from '../furniture/sofa-palette-textures'
import { readSofaColor } from '../furniture/sofa-color-preference'
import { SOFA_DEFAULT_COLOR } from '../furniture/palette-color'
type Actor = Phaser.GameObjects.Sprite;
export class HomeScene extends Phaser.Scene {
  private contactMotor = new ContactMotor()
  private roomReactions!: RoomReactions
  private furnitureFronts = new Map<string, Phaser.GameObjects.Image>();
  private rotationControl!: FurnitureRotationControl;
  private sofaColors!: SofaPaletteTextures
  private companionRuntime?: CompanionRuntime;
  private encounters!: CommunityEncounters;
  private outdoors!: Outdoors;
  private navigation?: Navigation;
  private interactions!: InteractionController;
  private petShadows!: Phaser.GameObjects.Graphics;
  private poses = new Map<string, NonNullable<Remote["pose"]>>();
  private localPose: Remote["pose"];
  private velocity = { x: 0, y: 0 };
  private nextActionTarget = 0;
  private objectVersion = "";
  private debug!: Phaser.GameObjects.Graphics;
  private outdoorVersion = "";
  private get room() {
    return homes.get().data?.house;
  }
  private player!: Actor;
  private actors = new Map<string, Actor>();
  private petActors = new Map<string, Actor>();
  private labels = new Map<string, Phaser.GameObjects.Text>();
  private props = new Map<string, Phaser.GameObjects.Image>();
  private bubbles = new Map<string, SpeechBubble>();
  private disposed = false;
  private zoomChoices = new Map<
    string,
    { mode: "manual" | "fit" | "fill"; zoom?: number }
  >();
  private fittingStage = false;
  private backdrop!: Phaser.GameObjects.TileSprite;
  private floor!: Phaser.GameObjects.TileSprite;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private path: { x: number; y: number }[] = [];
  private joystick = { x: 0, y: 0 };
  private direction = "down";
  private lastSend = 0;
  private sent = { x: 0, y: 0, direction: "down", walking: false };
  private version = "";
  private lastHouse = "";
  private shadow!: Phaser.GameObjects.Graphics;
  private ghost: Phaser.GameObjects.Image | null = null;
  private candidate: Placement | null = null;
  private drag = false;
  private rotate = 0;
  private queueCare: { pet: string; action: string } | null = null;
  private nextVoice = 12000;
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    .matches;
  private lastStep = 0;
  private actionUntil = 0;
  private actionName = "";
  private lastCareVoice = '';
  private atmosphere?: Atmosphere;
  private discoveries = new Map<string, Phaser.GameObjects.Image>();
  private interactionHint?: Phaser.GameObjects.Text;
  private photoPending = false;
  constructor() {
    super("Home");
  }
  preload() {
    preloadActors(this);
    this.load.image("room-window", ROOM_WINDOW);
    this.load.image(
      "door:open",
      "/assets/game/housing/tilesets/door-open-housing-v1.png",
    );
    preloadCommunity(this);
    preloadEncounters(this);
    preloadAtmosphere(this);
    preloadCatFaces(this);
    this.load.image(
      "community-board",
      "/assets/game/missions/board/board-available.png",
    );
    for (const find of SHARED_FINDS)
      this.load.image(
        "discovery:" + find.id,
        find.id === "community-letter"
          ? "/assets/game/environment/interactive/mailbox.png"
          : "/assets/game/inventory/items/" + find.item + ".png",
      );
    for (const i of catalogue.items) {
      this.load.image("f:" + i.id, i.file);
      if (i.stateViews?.open) this.load.image(`f:${i.id}:open`,i.stateViews.open.file);
      if (i.stateViews?.unlit) this.load.image(`f:${i.id}:unlit`,i.stateViews.unlit.file);
      if (i.frontFile) this.load.image(`f:${i.id}:front`, i.frontFile);
      for (const style of i.styles ?? []) for (const [rotation, view] of Object.entries(style.views)) {
        this.load.image(`f:${i.id}:${style.id}:${rotation}`, view.file);
        this.load.image(`f:${i.id}:${style.id}:${rotation}:front`, view.frontFile);
        for (const [index, frame] of (view.motion ?? []).entries()) { this.load.image(`f:${i.id}:${style.id}:${rotation}:motion:${index}`, frame.file); this.load.image(`f:${i.id}:${style.id}:${rotation}:motion:${index}:front`, frame.frontFile) }
      }
    }
    for (const [id, p] of Object.entries(catalogue.effects))
      this.load.spritesheet("e:" + id, p.file, {
        frameWidth: 32,
        frameHeight: 32,
      });
    for (const name of [
      "oak-light-a",
      "wood-dark-a",
      "carpet-a",
      "ceramic-a",
      "stone",
      "patterned",
    ])
      this.load.image(
        "floor:" + name,
        "/assets/game/housing/tilesets/" + name + "-housing-v1.png",
      );
    for (const style of ["cream", "sage", "beige", "blue", "wood", "wallpaper"])
      for (const part of ["north", "west", "east", "south"])
        this.load.image(
          "wall:" + style + ":" + part,
          "/assets/game/housing/tilesets/" +
            style +
            "-" +
            part +
            "-modular-v2.png",
        );
    this.load.image(
      "mailbox",
      "/assets/game/housing/exteriors/mailbox-catalog-v1.png",
    );
    this.load.image(
      "flowerpot",
      "/assets/game/housing/exteriors/flowerpot-catalog-v1.png",
    );
    this.load.image(
      "house",
      "/assets/game/housing/exteriors/starter-house-catalog-v1.png",
    );
    this.load.spritesheet("grass", "/pawtrail-game/game-assets/terrain.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    patch({ assets: { progress: 0, error: "" } });
    this.load.off("progress");
    this.load.off("loaderror");
    this.load.on("progress", (progress: number) =>
      patch({ assets: { progress, error: "" } }),
    );
    this.load.on("loaderror", (file: Phaser.Loader.File) =>
      patch({
        assets: {
          progress: 0,
          error: "A home asset could not load: " + file.key,
        },
        error:
          "A home asset could not load: " + file.key + ". Reload to retry.",
      }),
    );
  }
  create() {
    this.version = "";
    this.lastHouse = "";
    this.objectVersion = "";
    this.outdoorVersion = "";
    this.path = [];
    this.actionUntil = 0;
    this.lastCareVoice = '';
    const leaveAbilities=enterAbilities('room');
    const abilityEnded=(event:Event)=>{const id=(event as CustomEvent).detail?.id;if(this.player?.getData('modelEmoteAction')===id){this.player.setData('modelEmoteUntil',0).setData('modelEmoteAction','').setData('modelAction','idle_'+this.direction);this.actionUntil=0}};
    window.addEventListener('pawtrail:ability-ended',abilityEnded);this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{leaveAbilities();window.removeEventListener('pawtrail:ability-ended',abilityEnded)});
    this.localPose = undefined;
    this.actors.clear();
    this.petActors.clear();
    this.props.clear();
    this.labels.clear();
    this.discoveries.clear();
    this.poses.clear();
    this.bubbles.clear();
    this.ghost = null;
    this.candidate = null;

    this.disposed = false;
    this.outdoors = new Outdoors(this);
    this.sofaColors = new SofaPaletteTextures(this)
    this.roomReactions = new RoomReactions(this)
    this.rotationControl = new FurnitureRotationControl(this, () => this.command({ type: 'rotate' }))
    this.encounters = new CommunityEncounters(this);
    this.debug = this.add.graphics().setDepth(30000);
    this.petShadows = this.add.graphics().setDepth(-1);
    this.interactions = new InteractionController({
      now: () => this.time.now,
      status: (interaction) => {
        patch({ interaction });
        const active=this.interactions?.active;
        if(interaction?.phase==='complete'&&interaction.id!==this.lastCareVoice&&active&&['feed','water','pet','play','fill_food','fill_water'].includes(active.action)){
          this.lastCareVoice=interaction.id;
          void gameVoice.speak(homes.get().data?.player.appearance??'rescuer','encouragement','home');
        }
      },
      send: (event) => live(event),
      path: (path) => {
        this.path = path;
      },
      face: (p) => {
        const a = this.interactions.active;
        if (!a) return;
        const target = this.room?.activeLayout.find((x) => x.id === a.target);
        const q = target ? { x: target.x * 32 + 16, y: target.y * 32 + 32 } : p;
        faceActor(this.player, q);
        this.direction =
          Math.abs(q.x - this.player.x) > Math.abs(q.y - this.player.y)
            ? q.x < this.player.x
              ? "left"
              : "right"
            : q.y < this.player.y
              ? "up"
              : "down";
      },
      pose: (name) => {
        this.actionName = name;
        this.actionUntil = Infinity;
      },
      recover: (exit) => {
        this.localPose = undefined;
        this.actionUntil = 0;
        this.velocity = { x: 0, y: 0 };
        if (exit && this.navigation) {
          const q = this.navigation.nearest(exit);
          if (q) this.player.setPosition(q.x, q.y);
        }
      },
      message: (notice) => patch({ notice }),
    });
    const unsubscribeEncounters = gameStore.subscribe(() =>
      this.encounters.sync(),
    );

    const resting = () => {
      this.path = [];
      this.actionName = "sit";
      this.actionUntil = this.time.now + 8000;
      patch({ notice: "A quiet moment. Walk when you are ready." });
    };
    window.addEventListener("pawtrail:community-rest", resting);
    const approach = (event: Event) => {
      const d = (
        event as CustomEvent<{
          x: number;
          y: number;
          label: string;
          run: () => void;
        }>
      ).detail;
      if (!this.navigation) return;
      const point = this.navigation.nearest(d, 48);
      if (!point) return;
      this.interactions.start(
        {
          target: "local:" + d.label,
          label: d.label,
          action: "inspect",
          point,
          path: this.navigation.path(this.player, point),
          duration: 160,
          local: true,
          onComplete: d.run,
        },
        this.time.now,
      );
    };
    window.addEventListener("pawtrail:approach-target", approach);

    for (const find of SHARED_FINDS)
      this.discoveries.set(
        find.id,
        this.add
          .image(find.x, find.y, "discovery:" + find.id)
          .setOrigin(0.5, 1)
          .setDepth(find.y),
      );
    this.interactionHint = this.add
      .text(0, 0, "", {
        fontFamily: "Instrument Sans",
        fontSize: "11px",
        color: "#38271e",
        backgroundColor: "#fff8ed",
        padding: { x: 7, y: 5 },
      })
      .setOrigin(0.5, 1)
      .setDepth(19000)
      .setVisible(false);
    this.atmosphere = new Atmosphere(this, 768, 576, [
      { x: 145, y: 240 },
      { x: 605, y: 210 },
    ]);
    registerActors(this);
    for (const [id, e] of Object.entries(catalogue.effects))
      this.anims.create({
        key: "e:" + id,
        frames: this.anims.generateFrameNumbers("e:" + id, {
          start: 0,
          end: e.frames - 1,
        }),
        frameRate: 7,
        repeat: 2,
      });
    this.backdrop = this.add
      .tileSprite(0, 0, 1024, 1024, "grass", 0)
      .setDepth(-200);
    this.floor = this.add
      .tileSprite(384, 288, 768, 576, "floor:oak-light-a")
      .setDepth(-100);
    this.player = this.add
      .sprite(400, 528, playerTexture("rescuer"))
      .setOrigin(0.5, 46 / 48);
    configurePlayer(this.player, "rescuer");
    this.player.setData('actorLocalAudio', true);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,gameVoice.enterScene('home'));
    const releaseVoiceState=homes.subscribe(()=>{const current=homes.get();if(current.status!=='online'||current.decoration)gameVoice.stop()});
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,releaseVoiceState);
    this.data.set('actorAudioListener', this.player);
    installMemeAnchors(this, id => id === 'me' ? this.player : this.actors.get(id));
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ESC,R,ENTER,SHIFT",
      false,
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    this.companionRuntime = new CompanionRuntime(
      this,
      () => this.player,
      () => this.navigation,
      () => this.petActors,
    );
    const locate = (event: Event) =>
        this.companionRuntime?.locate((event as CustomEvent<string>).detail),
      care = (event: Event) => {
        const d = (
          event as CustomEvent<{ id: string; action: "feed" | "water" | "pet" }>
        ).detail;
        this.companionRuntime?.care(d.id, d.action, this.interactions);
      };
    const come = () => {
      const q = this.navigation?.nearest({
        x: this.player.x + 28,
        y: this.player.y + 28,
      });
      if (q) this.companionRuntime?.click(q);
    };
    window.addEventListener("pawtrail:animal-come", come);
    window.addEventListener("pawtrail:locate-animal", locate);
    window.addEventListener("pawtrail:animal-care", care);
    const uncompanions = companions.subscribe(() => this.renderState());
    this.shadow = this.add.graphics().setDepth(10000);
    this.input.mouse?.disableContextMenu();
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.game.canvas.focus();
      if (p.rightButtonDown()) {
        this.clearGhost();
        return;
      }
      if (
        homes.get().decoration ||
        homes.get().status !== "online" ||
        document.querySelector("[role=dialog],[role=menu]")
      )
        return;
      const world = this.cameras.main.getWorldPoint(p.x, p.y);
      if (this.companionRuntime?.click(world)) return;
      if (this.interactions.active) this.interactions.cancel();
      patch({ interactionMenu: null });
      this.path = this.navigation?.path(this.player, world) ?? [];
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (this.candidate && (this.drag || p.isDown)) this.preview(p);
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.candidate || !this.drag) return;
      this.preview(p);
      this.commit();
      this.drag = false;
    });
    const unsubscribe = onScene((c) => this.command(c)),
      unlive = onLive((e) => this.event(e)),
      unstate = homes.subscribe(() => this.renderState());
    const cleanup = () => {
      if (this.disposed) return;
      this.interactions.cancel();
      this.poses.clear();
      this.props.forEach(image => image.destroy()); this.props.clear()
      this.furnitureFronts.forEach(image => image.destroy()); this.furnitureFronts.clear()
      this.ghost?.destroy(); this.ghost = null
      this.sofaColors.dispose()
      this.rotationControl.destroy()
      this.roomReactions.destroy()
      this.contactMotor.reset()
      this.disposed = true;
      unsubscribe();
      unlive();
      unstate();
      unsubscribeEncounters();
      window.removeEventListener("pawtrail:community-rest", resting);
      window.removeEventListener("pawtrail:approach-target", approach);
      this.bubbles.forEach((b) => b.destroy());
      this.bubbles.clear();
      this.companionRuntime?.destroy();
      uncompanions();
      window.removeEventListener("pawtrail:animal-come", come);
      window.removeEventListener("pawtrail:locate-animal", locate);
      window.removeEventListener("pawtrail:animal-care", care);
      this.encounters.destroy();
      this.outdoors.destroy();
      this.atmosphere?.destroy();
      this.input?.off("pointerdown");
      this.input?.off("pointerup");
      this.input?.off("pointermove");
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
    this.cameras.main
      .setBounds(0, 0, 768, 576)
      .setZoom(this.scale.width > 900 ? 2 : 1)
      .startFollow(
        this.player,
        true,
        this.reduced ? 1 : 0.15,
        this.reduced ? 1 : 0.15,
      )
      .setRoundPixels(true);
    const resize = () => this.applyZoom();
    this.scale.on("resize", resize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.scale.off("resize", resize),
    );
    this.renderState();
    this.game.canvas.tabIndex = 0;
    this.game.canvas.setAttribute("role", "application");
    this.game.canvas.setAttribute(
      "aria-label",
      "PawTrail home world. WASD or arrows to walk, E to interact, Enter to chat, Q for reactions.",
    );
    this.game.events.emit("homes-ready");
    void audio.unlock();
    audio.setScene("shelter", "afternoon", false);
  }
  private renderState() {
    if (this.disposed || !this.floor?.scene) return;
    const s = homes.get(),
      h = s.data?.house;
    if (!h) return;
    this.companionRuntime?.setRoom(h.roomId);
    this.encounters.sync();
    const version =
      h.roomId +
      ":" +
      (s.decoration ? "decorating" : "playing") +
      ":" +
      h.revision +
      ":" +
      h.upstairsRevision +
      ":" +
      h.interiorPreset +
      ":" +
      h.yardRevision +
      ":" +
      h.exterior +
      ":" +
      JSON.stringify(h.plots) +
      ":" +
      JSON.stringify(s.decoration ? s.draft : h.activeLayout) +
      ":" +
      h.floor +
      ":" +
      h.wallpaper;
    if (this.version !== version) {
      if (this.lastHouse !== h.roomId + ':' + h.interiorPreset) { this.roomReactions.reset(); this.contactMotor.reset() }
      this.version = version;
      for (const image of this.props.values()) image.destroy();
      this.props.clear();
      this.children.list
        .filter((x) => x.getData("wall"))
        .forEach((x) => x.destroy());
      const hub = h.id.startsWith("system:hub"),
        outside = hub || h.zone === "yard";
      this.interactions.cancel();
      this.path = [];
      this.localPose = undefined;
      this.navigation = new Navigation(
        h.activeLayout,
        hub,
        h.zone,
        h.interiorPreset,
        h.objectStates,
      );
      if (
        this.lastHouse === h.roomId + ":" + h.interiorPreset &&
        !this.navigation.clear(this.player)
      ) {
        const safe = this.navigation.nearest(this.player, 128);
        if (safe) this.player.setPosition(safe.x, safe.y);
      }
      this.floor
        .setPosition(h.width * 16, h.height * 16)
        .setSize(h.width * 32, h.height * 32)
        .setTexture(outside ? "grass" : "floor:" + h.floor, 0);
      this.cameras.main.setBounds(
        outside ? 0 : -16,
        outside ? 0 : -16,
        h.width * 32 + (outside ? 0 : 32),
        h.height * 32 + (outside ? 0 : 32),
      );
      this.cameras.main.setBackgroundColor(outside ? "#ead7b5" : "#332219");
      const outdoorVersion =
        h.roomId +
        ":" +
        h.exterior +
        ":" +
        h.yardRevision +
        ":" +
        JSON.stringify(h.plots);
      if (this.outdoorVersion !== outdoorVersion) {
        this.outdoorVersion = outdoorVersion;
        if (outside) this.outdoors.render(h);
        else this.outdoors.destroy();
      }
      if (!outside) drawInterior(this, h);
      for (const image of this.furnitureFronts.values()) image.destroy();
      this.furnitureFronts.clear();
      for (const p of s.decoration ? s.draft : h.activeLayout) {
        const def = furnitureAt(p);
        if (!def || !this.textures.exists("f:" + p.item)) continue;
        const art = this.sofaColors.resolve(p, furnitureArt(p)!);
        const image = this.add
          .image(art.x, art.y, art.texture)
          .setOrigin(...art.origin)
          .setAngle(art.rotation || 0)
          .setDepth(art.depth)
          .setInteractive({ useHandCursor: true, pixelPerfect: !!def.renderedViews, alphaTolerance: 128 });
        this.props.set(p.id, image);
        if (art.foreground && !s.decoration) this.furnitureFronts.set(p.id, this.add.image(art.x, art.y, art.foreground.texture).setOrigin(...art.origin).setDepth(art.depth + 2));
        image.on(
          "pointerdown",
          (
            _: unknown,
            __: unknown,
            ___: unknown,
            event: Phaser.Types.Input.EventData,
          ) => {
            event.stopPropagation();
            if (homes.get().decoration) {
              this.clearGhost();
              event.stopPropagation();
              this.actionName = "pick_up_furniture";
              this.actionUntil = this.time.now + 500;
              this.candidate = { ...p };
              this.rotate = p.rotation;
              this.drag = true;
              patch({ selectedFurniture: p.id });
              image.setAlpha(0.35);
              this.ghost = this.add
                .image(image.x, image.y, image.texture.key)
                .setOrigin(image.originX, image.originY)
                .setAngle(art.rotation ?? 0)
                .setAlpha(0.7)
                .setDepth(9999);
            } else {
              this.objectMenu(p.id);
            }
          },
        );
      }
      this.sofaColors.retain(new Set(['ghost', ...(s.decoration ? s.draft : h.activeLayout)
        .filter(p => p.item === 'sofa' && p.upholsteryColor && p.upholsteryColor !== SOFA_DEFAULT_COLOR)
        .map(p => `placed:${p.id}`)]))
      this.roomReactions.sync(s.decoration ? [] : h.activeLayout, this.props, this.furnitureFronts)
      if (this.lastHouse !== h.roomId + ":" + h.interiorPreset) {
        this.lastHouse = h.roomId + ":" + h.interiorPreset;
        this.bubbles.forEach((b) => b.destroy());
        this.bubbles.clear();
        this.clearGhost();
        this.atmosphere?.destroy();
        // Interior lamps are furniture in the saved plan, not extra props at a
        // hard-coded coordinate that can overlap the kitchen or bedroom.
        this.atmosphere = new Atmosphere(
          this,
          h.width * 32,
          h.height * 32,
          hub
            ? [
                { x: 960, y: 800 },
                { x: 1472, y: 896 },
                { x: 256, y: 1600 },
              ]
            : outside
              ? [{ x: 145, y: 240 }]
              : [],
        );
        this.player.setPosition(h.spawn[0], h.spawn[1]);
        this.applyZoom();
        this.path = [];
      }
    }
    this.rotationControl.sync(s.decoration ? this.candidate ?? s.draft.find(p => p.id === s.selectedFurniture) : undefined)
    const stateVersion = JSON.stringify(
      Object.entries(h.objectStates ?? {})
        .filter(([, v]) => "open" in v)
        .map(([k, v]) => [k, v.open]),
    );
    if (this.objectVersion !== stateVersion) {
      this.objectVersion = stateVersion;
      this.navigation = new Navigation(
        h.activeLayout,
        h.id.startsWith("system:hub"),
        h.zone,
        h.interiorPreset,
        h.objectStates,
      );
    }
    for (const p of h.activeLayout) {
      const image = this.props.get(p.id);
      if (!image) continue;
      const state = h.objectStates?.[p.id] ?? {},
        d = furnitureAt(p);
      if (d.geometry.actions.includes("toggle_light"))
        image.setTint(state.lit === false && !d.stateViews?.unlit ? 0x888893 : 0xffffff);
      if (d.geometry.actions.includes("water_plant"))
        image.setTint(
          state.wateredAt && Date.now() / 1000 - state.wateredAt < 3600
            ? 0xe1ffd1
            : 0xffffff,
        );
      if (d.geometry.actions.includes("care_aquarium"))
        image.setTint(
          state.cleanedAt && Date.now() / 1000 - state.cleanedAt < 3600
            ? 0xd7f6ff
            : 0xffffff,
        );
      if (d.stateViews)
        image.setTexture("f:" + p.item + furnitureStateView(d,state).suffix);
      const kind = d.geometry.actions.includes("fill_water")
        ? "water"
        : d.geometry.actions.includes("fill_food")
          ? "food"
          : null;
      if (kind) {
        const n = state[kind] ?? 0,
          key =
            "f:" +
            kind +
            "-bowl-" +
            (n >= 3 ? "full" : n > 0 ? "half" : "empty");
        if (p.item.includes("bowl") && this.textures.exists(key))
          image.setTexture(key);
      }
    }
    const mine = s.data!.player,
      texture = playerTexture(mine.appearance);
    if (this.player.texture.key !== texture) {
      this.player.setTexture(texture);
      configurePlayer(this.player, mine.appearance);
    }
    for (const [id, remote] of Object.entries(s.players)) {
      if (id === mine.id) continue;
      let sprite = this.actors.get(id);
      if (!sprite) {
        sprite = this.add
          .sprite(remote.x, remote.y, playerTexture(remote.person.appearance))
          .setOrigin(0.5, 46 / 48)
          .setInteractive({ useHandCursor: true });
        configurePlayer(sprite, remote.person.appearance);
        sprite.setData('actorRemoteAudio', true);
        this.actors.set(id, sprite);
        this.labels.set(id, this.label(remote.x, remote.y, remote.person.name));
        sprite.on(
          "pointerdown",
          (
            _: unknown,
            __: unknown,
            ___: unknown,
            e: Phaser.Types.Input.EventData,
          ) => {
            e.stopPropagation();
            patch({ selectedPlayer: id, selectedPet: null });
          },
        );
      }
    }
    for (const [id, sprite] of this.actors)
      if (!s.players[id]) {
        sprite.destroy();
        this.actors.delete(id);
        this.labels.get(id)?.destroy();
        this.labels.delete(id);
      }
    for (const pet of s.pets.filter(
      (p) =>
        p.following !== s.data?.player.id &&
        !companions
          .get()
          .animals.some(
            (a) => a.id === p.id && a.following === s.data?.player.id,
          ),
    )) {
      let sprite = this.petActors.get(pet.id);
      if (!sprite) {
        sprite = this.add
          .sprite(pet.x, pet.y, animalTexture(pet.sprite))
          .setOrigin(0.5, 46 / 48)
          .setInteractive({ useHandCursor: true });
        configureAnimal(sprite, pet.sprite);
        this.petActors.set(pet.id, sprite);
        this.labels.set(pet.id, this.label(pet.x, pet.y, pet.profile.name));
        sprite.on(
          "pointerdown",
          (
            _: unknown,
            __: unknown,
            ___: unknown,
            e: Phaser.Types.Input.EventData,
          ) => {
            e.stopPropagation();
            this.petMenu(pet.id);
          },
        );
      }
      if (sprite.texture.key !== animalTexture(pet.sprite))
        sprite.setTexture(animalTexture(pet.sprite));
    }
    for (const [id, sprite] of this.petActors)
      if (
        !s.pets.some((p) => p.id === id && p.following !== s.data?.player.id) ||
        companions
          .get()
          .animals.some((a) => a.id === id && a.following === s.data?.player.id)
      ) {
        sprite.destroy();
        this.petActors.delete(id);
        this.labels.get(id)?.destroy();
        this.labels.delete(id);
      }
  }
  private label(x: number, y: number, text: string) {
    return this.add
      .text(x, y + 3, text, {
        fontFamily: "Saira Condensed",
        fontSize: "10px",
        color: "#fff5df",
        backgroundColor: "#563e2e",
        padding: { x: 3, y: 2 },
      })
      .setOrigin(0.5, 0)
      .setDepth(y + 1)
      .setScale(1 / this.cameras.main.zoom);
  }
  private preview(pointer: Phaser.Input.Pointer) {
    if (!this.candidate) return;
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.candidate.x = Math.floor(world.x / 32);
    this.candidate.y = Math.floor(world.y / 32);
    this.candidate.rotation = this.rotate;
    this.drawGhost();
  }
  private drawGhost() {
    if (!this.candidate) return;
    const def = furnitureAt(this.candidate);
    patch({
      placementPreview: { ...this.candidate },
      selectedFurniture: this.candidate.id,
    });
    if (!this.ghost)
      this.ghost = this.add
        .image(0, 0, "f:" + def.id)
        .setOrigin(def.anchor[0] / def.width, def.anchor[1] / def.height)
        .setDepth(9999)
        .setAlpha(0.75);
    const art = this.sofaColors.resolve(this.candidate, furnitureArt(this.candidate)!, 'ghost');
    this.ghost.setTexture(art.texture).setOrigin(...art.origin);
    this.rotationControl.sync(this.candidate)
    this.ghost
      .setPosition(this.candidate.x * 32 + 16, this.candidate.y * 32 + 32)
      .setAngle(art.rotation ?? 0)
      .setTint(
        valid(
          this.candidate,
          homes.get().draft,
          this.room?.zone,
          this.room?.interiorPreset,
        )
          ? 0x96d99c
          : 0xef8e7f,
      );
    this.shadow.clear();
    const color = valid(
      this.candidate,
      homes.get().draft,
      this.room?.zone,
      this.room?.interiorPreset,
    )
      ? 0x36875b
      : 0xce594a;
    for (const r of def.geometry.placement) {
      const b = worldRect(this.candidate, r);
      this.shadow.fillStyle(color, 0.28).fillRect(b.x, b.y, b.width, b.height);
    }
    patch({
      notice:
        placementReason(
          this.candidate,
          homes.get().draft,
          this.room?.zone,
          this.room?.interiorPreset,
        ) || "Clear spot · Enter or Place selected to confirm.",
    });
  }
  private clearGhost() {
    this.rotationControl.sync()
    patch({ placementPreview: null });
    this.ghost?.destroy();
    this.ghost = null;
    this.sofaColors.release('ghost')
    this.candidate = null;
    this.shadow.clear();
    this.props.forEach((p) => p.setAlpha(1));
    const state = homes.get(); this.rotationControl.sync(state.decoration ? state.draft.find(p => p.id === state.selectedFurniture) : undefined)
  }
  private commit() {
    const candidate = this.candidate,
      s = homes.get();
    if (!candidate) return;
    const reason = placementReason(
      candidate,
      s.draft,
      s.data?.house.zone,
      s.data?.house.interiorPreset,
    );
    if (reason) {
      patch({ error: reason });
      return;
    }
    const h = s.data?.house,
      d = furnitureAt(candidate);
    if (h) {
      const other =
        h.zone === "yard"
          ? [...h.layout, ...h.upstairsLayout]
          : [
              ...h.yardLayout,
              ...(h.zone === "upstairs" ? h.layout : h.upstairsLayout),
            ];
      if (
        s.draft.filter(
          (p) => p.item === candidate.item && p.id !== candidate.id,
        ).length +
          other.filter((p) => p.item === candidate.item).length >=
        (h.inventory[candidate.item] || 0)
      ) {
        patch({ error: "Every owned copy is already placed." });
        return;
      }
    }
    if (d)
      edit([...s.draft.filter((p) => p.id !== candidate.id), { ...candidate }]);
    this.actionName = "place_object";
    this.actionUntil = this.time.now + 650;
    this.clearGhost();
  }
  private applyZoom(mode?: "in" | "out" | "fit" | "fill") {
    const h = this.room;
    if (!h || this.fittingStage) return;
    const camera = this.cameras.main,
      w = h.width * 32,
      ht = h.height * 32;
    const hub = h.id.startsWith("system:hub"),
      outside = hub || h.zone === "yard",
      key = hub ? "community" : outside ? "yard" : "house";
    const physicalWidth = this.scale.parentSize.width || camera.width,
      physicalHeight = this.scale.parentSize.height || camera.height;
    const stageWidth = Math.max(1, Math.round(physicalWidth)),
      stageHeight = Math.max(1, Math.round(physicalHeight));
    if (
      this.scale.gameSize.width !== stageWidth ||
      this.scale.gameSize.height !== stageHeight
    ) {
      this.fittingStage = true;
      try {
        this.scale.setGameSize(stageWidth, stageHeight);
      } finally {
        this.fittingStage = false;
      }
    }
    camera.setSize(stageWidth, stageHeight);
    const fill = Math.ceil(camera.width / w),
      fit = Math.floor(
        Math.min((camera.width - 64) / w, (camera.height - 64) / ht),
      );
    const requested =
      mode === "in"
        ? camera.zoom + 1
        : mode === "out"
          ? camera.zoom - 1
          : mode === "fit"
            ? fit
            : mode === "fill"
              ? fill
              : worldZoom(physicalWidth);
    const zoom = mode ? setWorldZoom(requested) : worldZoom(physicalWidth);
    camera.setZoom(zoom).setRoundPixels(true);
    if (!outside) {
      // Phaser clamps small bounds to their top-left; center expanded bounds
      // instead so a fitted room stays centered along either axis.
      const bw = Math.max(w + 32, camera.width / zoom),
        bh = Math.max(ht + 32, camera.height / zoom);
      camera.setBounds((w - bw) / 2, (ht - bh) / 2, bw, bh);
      const nearFit = w * zoom <= camera.width && ht * zoom <= camera.height;
      if (nearFit) {
        camera.setDeadzone(
          Math.max(32, camera.width / zoom - 64),
          Math.max(32, camera.height / zoom - 64),
        );
        camera.centerOn(w / 2, ht / 2);
      } else {
        camera.setDeadzone();
        camera.centerOn(this.player.x, this.player.y);
      }
    } else camera.setDeadzone();
    this.outdoors.setZoom(zoom);
    this.children.list.forEach((object) => {
      if (
        object.getData("nameplate") &&
        object instanceof Phaser.GameObjects.Text
      )
        object.setScale(1 / zoom);
    });
    this.labels.forEach((label) => label.setScale(1 / zoom));
    patch({ zoom });
  }
  private command(c: SceneCommand) {
    if (this.disposed || !this.player?.scene) return;
    if (c.type === "debug-geometry") {
      patch({ debugGeometry: c.enabled });
      return;
    }
    if (c.type === "cancel-action") {
      this.interactions.cancel();
      patch({ interactionMenu: null });
      return;
    }
    if (c.type === "object-action") {
      this.startAction(c.target, c.action);
      return;
    }
    if (this.disposed || !this.player?.scene) return;
    if (c.type === "zoom") {
      this.applyZoom(c.mode);
      return;
    }
    if (c.type === "spawn") {
      this.player.setPosition(c.x, c.y);
      this.sent = { x: c.x, y: c.y, direction: "down", walking: false };
      return;
    }
    if (c.type === "commit") {
      this.commit();
      return;
    }
    if (c.type === "select") {
      const p = homes.get().draft.find((p) => p.id === c.id);
      if (!p) return;
      this.clearGhost();
      this.candidate = { ...p };
      this.rotate = p.rotation;
      patch({ selectedFurniture: p.id });
      this.drawGhost();
      return;
    }
    if (c.type === "nudge") {
      if (!this.candidate) {
        const p = homes
          .get()
          .draft.find((p) => p.id === homes.get().selectedFurniture);
        if (p) {
          this.candidate = { ...p };
          this.rotate = p.rotation;
        }
      }
      if (this.candidate) {
        this.candidate.x += c.x;
        this.candidate.y += c.y;
        this.drawGhost();
      }
      return;
    }

    if (c.type === 'dig') { this.digGround(); return }
    if (c.type === "move") {
      this.joystick = { x: c.x, y: c.y };
      return;
    }
    if (c.type === "focus-pet") {
      const a = this.petActors.get(c.id);
      if (a) {
        this.cameras.main.stopFollow();
        this.cameras.main.pan(a.x, a.y, 300);
        this.time.delayedCall(1800, () =>
          this.cameras.main.startFollow(
            this.player,
            true,
            this.reduced ? 1 : 0.15,
            this.reduced ? 1 : 0.15,
          ),
        );
      }
      return;
    }
    if (c.type === "cancel") {
      this.clearGhost();
      return;
    }
    if (c.type === "place") {
      this.clearGhost();
      this.candidate = {
        id: crypto.randomUUID(),
        item: c.item,
        x: 12,
        y: 10,
        rotation: 0,
        ...(c.item === 'sofa' && readSofaColor() !== SOFA_DEFAULT_COLOR ? { upholsteryColor: readSofaColor() } : {}),
      };
      this.rotate = 0;
      this.candidate.x = c.at
        ? Math.floor(c.at.x / 32)
        : Math.floor(this.player.x / 32);
      this.candidate.y = c.at
        ? Math.floor(c.at.y / 32)
        : Math.floor(this.player.y / 32) - 2;
      this.drawGhost();
      this.drag = true;
      return;
    }
    if (c.type === 'upholstery-color') {
      const state = homes.get()
      if (!state.decoration || !/^#[0-9a-f]{6}$/i.test(c.color)) return
      const current = this.candidate ?? state.draft.find(p => p.id === state.selectedFurniture)
      if (current?.item !== 'sofa') return
      const next: Placement = { ...current, upholsteryColor: c.color.toLowerCase() }
      if (next.upholsteryColor === SOFA_DEFAULT_COLOR) delete next.upholsteryColor
      if (this.candidate) {
        this.candidate = next; this.drawGhost()
        const placed = state.draft.find(p => p.id === next.id)
        // A color-only edit is ready immediately; moved/new pieces retain their placement preview.
        if (placed && placed.x === next.x && placed.y === next.y && placed.rotation === next.rotation) this.commit()
      }
      else {
        edit(state.draft.map(p => p.id === next.id ? next : p))
        patch({ notice: 'Upholstery updated. Save arrangement to keep this sofa’s color.' })
      }
      return
    }
    if (c.type === 'style') {
      const current = this.candidate ?? homes.get().draft.find(p => p.id === homes.get().selectedFurniture);
      if (current && furniture[current.item].styles?.some(style => style.id === c.style)) {
        this.candidate = { ...current, style: c.style }; this.rotate = current.rotation; this.drawGhost();
      }
      return;
    }
    if (c.type === "rotate") {
      if (!this.candidate) {
        const p = homes
          .get()
          .draft.find((p) => p.id === homes.get().selectedFurniture);
        if (p) {
          this.candidate = { ...p };
          this.rotate = p.rotation;
        }
      }
      if (this.candidate) {
        const d = furnitureAt(this.candidate),
          allowed =
            d.supportedRotations ?? (d.rotatable ? [0, 90, 180, 270] : [0]);
        if (allowed.length > 1) {
          const i = Math.max(0, allowed.indexOf(this.rotate));
          this.rotate =
            allowed[(i + (c.direction ?? 1) + allowed.length) % allowed.length];
          this.candidate.rotation = this.rotate;
          this.drawGhost();
        }
      }
      return;
    }
    if (c.type === "store") {
      const id = homes.get().selectedFurniture;
      if (id) edit(homes.get().draft.filter((p) => p.id !== id));
      this.clearGhost();
      return;
    }
    if (c.type === "care") {
      const p = homes.get().pets.find((p) => p.id === c.pet);
      if (!p) return;
      this.startAction("pet:" + p.id, c.action, c.supply);
      return;
    }
    if (c.type === "photo") {
      this.photoPending = true;
      this.game.renderer.snapshot((image) => {
        if ("src" in image)
          action({
            type: "photo",
            image: image.src,
            caption: "A moment at " + homes.get().data?.house.name,
          });
        patch({ photoMode: false });
        this.photoPending = false;
      });
      return;
    }
    if (c.type === "interact") this.interact();
  }
  private objectMenu(id: string) {
    const p = this.room?.activeLayout.find((p) => p.id === id);
    if (!p) return;
    const d = furnitureAt(p);
    this.interactions.cancel();
    this.path = [];
    patch({
      interactionMenu: {
        target: id,
        label: d.label,
        actions: d.geometry.actions.map((id) => ({
          id,
          label: ACTION_LABELS[id] ?? id,
        })),
      },
    });
  }
  private petMenu(id: string) {
    const pet = homes.get().pets.find((p) => p.id === id);
    if (!pet) return;
    this.interactions.cancel();
    this.path = [];
    patch({
      interactionMenu: {
        target: "pet:" + id,
        label: pet.profile.name,
        actions: ["pet", "feed", "water", "play", "profile"].map((id) => ({
          id,
          label: ACTION_LABELS[id],
        })),
      },
    });
  }
  private startAction(target: string, action: string, supply?: string) {
    patch({ interactionMenu: null });
    if (
      !this.navigation ||
      homes.get().status !== "online" ||
      homes.get().decoration
    )
      return;
    if (target.startsWith("encounter:")) {
      const id = target.slice(10),
        a = this.encounters.target(id);
      if (!a) return;
      if (action === "profile") {
        this.encounters.open(id);
        return;
      }
      if (a.elevation > 0) {
        patch({
          notice:
            "Let this animal enjoy its perch. Try again when it comes down.",
        });
        return;
      }
      const point = this.navigation.nearest(
        { x: a.sprite.x, y: a.sprite.y + 30 },
        24,
      );
      if (!point) return;
      this.interactions.start(
        {
          target,
          action,
          label: ACTION_LABELS[action] + " · " + a.animal.name,
          point,
          lookAt: a.sprite,
          path: this.navigation.path(this.player, point),
          duration: 1200,
          local: true,
          onComplete: () => {
            this.encounters.react(id, action);
            audio.effect(action === "pet" ? "pet" : "ui");
          },
        },
        this.time.now,
      );
      return;
    }
    if (target.startsWith("pet:")) {
      const pet = homes.get().pets.find((p) => p.id === target.slice(4));
      if (!pet) return;
      if (["feed", "water", "pet"].includes(action)) {
        this.companionRuntime?.care(
          pet.id,
          action as "feed" | "water" | "pet",
          this.interactions,
        );
        return;
      }
      if ((pet.elevation ?? 0) > 12) {
        patch({
          notice:
            "Let this pet enjoy its perch. Offer care when it comes down.",
        });
        return;
      }
      if (action === "profile") {
        selectPet(pet.id);
        return;
      }
      const candidates = [
        [0, 34],
        [34, 0],
        [-34, 0],
        [0, -24],
      ].map(([x, y]) => ({ x: pet.x + x, y: pet.y + y }));
      const q = candidates.find(
        (p) =>
          this.navigation!.clear(p) &&
          this.navigation!.path(this.player, p).length,
      );
      if (!q) {
        patch({
          notice: "There is no open path to this pet. Try again when it moves.",
        });
        return;
      }
      this.interactions.start(
        {
          target,
          action,
          label: ACTION_LABELS[action] + " · " + pet.profile.name,
          point: q,
          lookAt: pet,
          path: this.navigation.path(this.player, q),
          duration: 1200,
          supply,
        },
        this.time.now,
      );
      return;
    }
    const p = this.room?.activeLayout.find((p) => p.id === target);
    if (!p) return;
    const approach = this.navigation.approach(p, this.player);
    if (!approach) {
      patch({
        notice:
          "This object needs an open approach. Move another piece or choose a different side.",
      });
      return;
    }
    this.interactions.start(
      {
        target,
        action,
        label: ACTION_LABELS[action] + " · " + furnitureAt(p).label,
        point: approach.point,
        path: approach.path,
        duration: 1500,
      },
      this.time.now,
    );
  }
  private digGround() {
    const s = homes.get()
    if (s.status !== 'online' || s.decoration || this.interactions.active || s.data?.environment?.tool !== 'shovel') return
    const direction = headingVector(this.direction)
    live({ type: 'terrain.work', x: Math.floor((this.player.x + direction.x * 25) / 32), y: Math.floor((this.player.y + direction.y * 25) / 32) })
  }
  private interact() {
    const s = homes.get();
    if (s.data?.house.zone === 'yard' && s.data.environment?.tool === 'shovel' && !s.decoration) { this.digGround(); return }
    const animal = this.encounters.near(this.player.x, this.player.y);
    if (animal) {
      this.path = [];
      this.encounters.menu(animal.animal.id);
      return;
    }
    const target = this.outdoors.near(this.player.x, this.player.y);
    if (target && !s.decoration) {
      this.path = [];
      target.run();
      return;
    }
    const h = s.data?.house;
    if (h) {
      const stair = nearStair(h, this.player.x, this.player.y);
      if (stair) {
        this.path = [];
        changeFloor(h, stair.to);
        return;
      }
      const f = floorPlan(h.interiorPreset, h.zone);
      if (
        h.zone === "interior" &&
        !h.id.startsWith("system:hub") &&
        f?.door &&
        Math.hypot(
          this.player.x - (f.door[0] * 32 + 16),
          this.player.y - ((f.height - 2) * 32 + 16),
        ) < 45
      ) {
        window.dispatchEvent(
          new CustomEvent("pawtrail:home-visit", { detail: h.id + "|yard" }),
        );
        return;
      }
    }
    const board =
      !!s.data?.house.id.startsWith("system:hub") &&
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        30 * 32,
        25 * 32,
      ) < 75;
    if (board) {
      this.path = [];
      window.dispatchEvent(
        new CustomEvent("pawtrail:home-panel", { detail: "board" }),
      );
      void audio.playSample("/assets/game/audio/missions/board.wav");
      return;
    }
    const found =
      s.data?.house.id.startsWith("system:hub") &&
      SHARED_FINDS.find(
        (find) =>
          !s.data?.player.facts.includes("world-find:" + find.id) &&
          Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            find.x,
            find.y,
          ) < 70,
      );
    if (found) {
      this.path = [];
      action({ type: "world-pickup", target: found.id });
      this.actionName = "pick_up_furniture";
      this.actionUntil = this.time.now + 700;
      void audio.playSample("/assets/game/audio/inventory/pickup.wav");
      return;
    }
    const pet = s.pets.find(
      (p) =>
        Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y) <
        70,
    );
    if (pet) {
      this.petMenu(pet.id);
      return;
    }
    const p = [...(s.data?.house.activeLayout ?? [])]
      .sort(
        (a, b) =>
          Math.hypot(
            a.x * 32 + 16 - this.player.x,
            a.y * 32 + 32 - this.player.y,
          ) -
          Math.hypot(
            b.x * 32 + 16 - this.player.x,
            b.y * 32 + 32 - this.player.y,
          ),
      )
      .find(
        (p) =>
          Phaser.Math.Distance.Between(
            p.x * 32 + 16,
            p.y * 32 + 32,
            this.player.x,
            this.player.y,
          ) < 100,
      );
    if (p) this.objectMenu(p.id);
  }
  private event(e: Record<string, unknown>) {
    if (this.disposed || !this.player?.scene) return;
    this.interactions.receive(e, this.time.now);
    if (
      (e.type === "interaction.started" ||
        e.type === "interaction.completed") &&
      e.pose &&
      (e.id !== homes.get().data?.player.id ||
        this.interactions.active?.id === e.actionId)
    ) {
      const pose = e.pose as NonNullable<Remote["pose"]>;
      const id = String(e.id);
      if (id === homes.get().data?.player.id) {
        this.localPose = pose;
        this.player.setPosition(pose.x, pose.y);
        this.direction = pose.facing;
      } else this.poses.set(id, pose);
    }
    if (e.type === "interaction.released") {
      if (this.poses.get(String(e.id))?.actionId === e.actionId)
        this.poses.delete(String(e.id));
      if (
        e.id === homes.get().data?.player.id &&
        this.localPose?.actionId === e.actionId
      )
        this.localPose = undefined;
    }
    if (
      e.type === "interaction.completed" &&
      !["sit", "rest"].includes(String(e.action)) &&
      this.poses.get(String(e.id))?.actionId === e.actionId
    )
      this.poses.delete(String(e.id));
    const s = homes.get(),
      id = String(e.id || e.actor || ""),
      actor = id === s.data?.player.id ? this.player : this.actors.get(id);
    if (e.type === 'player.meme' && actor && id !== s.data?.player.id) {
      showCatMeme(String(e.meme), id, false, Phaser.Math.Distance.Between(this.player.x, this.player.y, actor.x, actor.y));
    }
    if (e.type === "player.cat-sound") {
      const point = actor ?? { x: Number(e.x), y: Number(e.y) };
      catReaction(
        this,
        point,
        String(e.emote),
        id === s.data?.player.id,
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          point.x,
          point.y,
        ),
      );
    }
    if (e.type === "player.join" && !s.data?.player.quiet) {
      const p = e.player as { id: string };
      if (p.id !== s.data?.player.id) {
        const a = this.actors.get(p.id);
        if (a && !this.reduced) {
          a.setAlpha(0);
          this.tweens.add({ targets: a, alpha: 1, duration: 300 });
        }
        audio.effect("door");
      }
    }
    if (e.type === "reward") {
      audio.effect("quest");
    }
    if (e.type === "ready") {
      this.poses = new Map(
        Object.entries(
          (e.poses ?? {}) as Record<string, NonNullable<Remote["pose"]>>,
        ),
      );
      this.poses.delete(s.data?.player.id ?? "");
      const me = s.data && s.players[s.data.player.id];
      if (me) this.player.setPosition(me.x, me.y);
    }
    if (e.type === "correction") {
      this.interactions.cancel();
      this.player.setPosition(Number(e.x), Number(e.y));
      this.path = [];
    }
    if (e.type === "player.chat" && !s.mutedChat) {
      const person = e.player as { id: string },
        target =
          person.id === s.data?.player.id
            ? this.player
            : this.actors.get(person.id);
      if (target) {
        this.bubbles.get(person.id)?.destroy();
        const bubble = new SpeechBubble(this, String(e.text), () => {
          if (this.bubbles.get(person.id) === bubble)
            this.bubbles.delete(person.id);
        });
        bubble.follow(target.x, target.y);
        this.bubbles.set(person.id, bubble);
      }
      audio.effect("ui");
    }
    if(e.type==='player.ability-stop'&&actor){actor.setData('modelEmoteUntil',0).setData('modelAction','idle_down');if(id===s.data?.player.id)this.actionUntil=0}
    if (e.type === "player.emote" && actor) {
      const emote = String(e.emote),
        effect = catalogue.effects[reactionEffect(emote)]
          ? reactionEffect(emote)
          : "happy";
      if (!richReaction(emote)) {
        const icon = this.add
          .sprite(actor.x, actor.y - 65, "e:" + effect)
          .setDepth(20000)
          .play("e:" + effect);
        this.time.delayedCall(1800, () => icon.destroy());
      }
      const animation = reactionAnimation(emote);
      const duration=typeof e.durationMs==='number'&&Number.isFinite(e.durationMs)?Math.max(0,Math.min(60000,e.durationMs)):reactionDuration(emote);
      actor.setData("modelEmoteAction", animation).setData("modelEmoteUntil", this.time.now + duration);
      if (id === s.data?.player.id) {
        this.actionName = animation;
        this.actionUntil = this.time.now + duration;
        gameVoice.accepted(s.data?.player.appearance??'rescuer',animation,'home');
      }
      audio.effect("ui");
    }
    if (e.type === "interaction.completed" && actor) {
      const name = String(e.action);
      if (!["sit", "rest", "inspect"].includes(name)) {
        audio.effect(
          name.includes("water") || name === "care_aquarium"
            ? "water"
            : name === "fill_food"
              ? "feed"
              : name === "toggle_door"
                ? "door"
                : "ui",
        );
        if (!this.reduced) {
          const effect = this.add
            .sprite(actor.x, actor.y - 52, "e:happy")
            .setDepth(20000)
            .play("e:happy");
          this.time.delayedCall(900, () => effect.destroy());
        }
      }
    }
    if (e.type === 'terrain.changed' && e.id === s.data?.player.id && e.tool === 'shovel') { this.actionName = 'pick_up_furniture'; this.actionUntil = this.time.now + 700 }
    if (e.type === "pet.updated" && e.actor === s.data?.player.id) {
      this.actionName =
        e.action === "feed"
          ? "feed"
          : e.action === "water"
            ? "refill_water"
            : e.action === "play"
              ? "play"
              : "pet";
      this.actionUntil = this.time.now + 1500;
      audio.effect(
        e.action === "feed" ? "feed" : e.action === "water" ? "water" : "pet",
      );
      if (e.action === "pet") audio.effect("purr");
    }
  }
  update(time: number, delta: number) {
    const s = homes.get();
    if (!s.data || !this.player) return;
    this.reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      immersionPreferences.get().reducedEffects;
    this.cameras.main.setLerp(
      this.reduced ? 1 : 1 - Math.exp(-Math.min(delta, 40) / 110),
    );
    const world = sharedWorld(),
      outside =
        s.data.house.id.startsWith("system:hub") ||
        s.data.house.zone === "yard";
    const camera = this.cameras.main,
      view = camera.worldView;
    this.backdrop
      .setVisible(outside)
      .setPosition(view.centerX, view.centerY)
      .setSize(
        camera.width / camera.zoom + 96,
        camera.height / camera.zoom + 96,
      );
    this.interactionHint?.setScale(1 / camera.zoom);
    if (world) {
      this.atmosphere?.step(time, delta, world, !outside);
      audio.setScene(
        outside ? "neighborhood" : "shelter",
        dayPhase(world.minute),
      );
    }
    this.companionRuntime?.step(time, delta);
    this.outdoors.step(this.player.x, this.player.y, this.keys.SHIFT.isDown, this.reduced || immersionPreferences.get().reducedEffects);
    this.encounters.step(
      this.player.x,
      this.player.y,
      time,
      delta,
      this.navigation,
    );
    for (const find of SHARED_FINDS) {
      const sprite = this.discoveries.get(find.id);
      sprite?.setVisible(
        s.data.house.id.startsWith("system:hub") &&
          !s.data.player.facts.includes("world-find:" + find.id),
      );
      if (sprite)
        sprite.y =
          find.y +
          (this.reduced || find.id === "community-letter"
            ? 0
            : Math.sin(time / 550 + find.x) * 1.5);
    }
    const nearFind =
      s.data.house.id.startsWith("system:hub") &&
      SHARED_FINDS.find(
        (find) =>
          !s.data?.player.facts.includes("world-find:" + find.id) &&
          Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            find.x,
            find.y,
          ) < 70,
      );
    const target = this.outdoors.near(this.player.x, this.player.y);
    const nearAnimal = this.encounters.near(this.player.x, this.player.y),
      stair = nearStair(s.data.house, this.player.x, this.player.y);
    this.interactionHint
      ?.setVisible(!!nearFind || !!target || !!nearAnimal || !!stair)
      .setText(
        stair
          ? "E · " + (stair.to === "upstairs" ? "Go upstairs" : "Go downstairs")
          : nearAnimal
            ? "E · Meet " + nearAnimal.animal.name
            : target
              ? "E · " + target.label
              : nearFind
                ? "E · " + nearFind.name
                : "",
      )
      .setPosition(this.player.x, this.player.y - 65);
    const active = document.activeElement,
      typing =
        active?.matches("input,textarea,[contenteditable=true]") ||
        (!!document.querySelector("[role=dialog],[role=menu]") &&
          !(s.decoration && active === this.game.canvas));
    let x = 0,
      y = 0;
    if (s.status === "online" && !typing && !s.decoration) {
      x =
        (this.keys.D.isDown || this.keys.RIGHT.isDown ? 1 : 0) -
        (this.keys.A.isDown || this.keys.LEFT.isDown ? 1 : 0) +
        this.joystick.x;
      y =
        (this.keys.S.isDown || this.keys.DOWN.isDown ? 1 : 0) -
        (this.keys.W.isDown || this.keys.UP.isDown ? 1 : 0) +
        this.joystick.y;
      if (x || y) {
        this.interactions.cancel();
        if (homes.get().interactionMenu) patch({ interactionMenu: null });
        this.path = [];
        this.queueCare = null;
      } else if (this.path.length) {
        const target = this.path[0],
          dx = target.x - this.player.x,
          dy = target.y - this.player.y,
          l = Math.hypot(dx, dy);
        if (l < 2) this.path.shift();
        else {
          x = dx / l;
          y = dy / l;
        }
      }
    }
    if (s.status !== "online" || s.decoration) {
      if (this.interactions.active) this.interactions.cancel();
      x = 0;
      y = 0;
      this.path = [];
    }
    if (!typing && Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.interactions.cancel();
      patch({ interactionMenu: null });
      this.path = [];
    }
    if (this.interactions.locksMovement) {
      x = 0;
      y = 0;
    }
    const motion=movementProfile(gameAppearance(s.data.player.appearance),this.keys.SHIFT.isDown);
    if(motion.dash&&!x&&!y&&s.status==='online'&&!s.decoration&&!typing&&!this.interactions.locksMovement){const heading=headingVector(this.direction);x=heading.x;y=heading.y}
    if (this.interactions.locksMovement || s.decoration || typing || s.status !== 'online') this.contactMotor.reset()
    const length = Math.hypot(x, y);
    if (length || this.contactMotor.recoiling) {
      x /= Math.max(1, length);
      y /= Math.max(1, length);
      moveActor(
        this.player,
        { x, y },
        [],
        delta,
        this.navigation,
        this.keys.SHIFT.isDown,
        motion.speed,
        this.contactMotor,
      );
      if (length) this.direction =
        Math.abs(x) > Math.abs(y)
          ? x < 0
            ? "left"
            : "right"
          : y < 0
            ? "up"
            : "down";
      if (time > this.lastStep) {
        this.lastStep=time+Math.max(90,Math.round(350*105/motion.speed));
        if(!motion.gentle)audio.effect("step-path");
      }
    }
    if (!length) this.velocity = { x: 0, y: 0 };
    const currentAction = this.interactions.active;
    if (
      currentAction?.target.startsWith("pet:") &&
      currentAction.phase === "approach" &&
      time > this.nextActionTarget
    ) {
      this.nextActionTarget = time + 750;
      const pet = s.pets.find((p) => p.id === currentAction.target.slice(4));
      if (!pet) this.interactions.cancel("This pet left the room.");
      else if (
        Math.hypot(
          pet.x - currentAction.point.x,
          pet.y - currentAction.point.y,
        ) > 70
      ) {
        const q = this.navigation?.nearest({ x: pet.x, y: pet.y + 34 }, 24);
        if (q)
          this.interactions.retarget(
            q,
            this.navigation!.path(this.player, q),
            pet,
          );
      }
    }
    this.interactions.step(time, this.player, this.path.length === 0);
    if (this.localPose)
      this.player.setPosition(this.localPose.x, this.localPose.y);
    if (length && !this.interactions.active && time < this.actionUntil && !allowsMovingAction(this.actionName)) {
      this.actionUntil = 0;
      this.player.setData('modelEmoteUntil', 0);
    }
    const currentAbility = activeAbility();
    if(isAbility(this.actionName)&&currentAbility?.id!==this.actionName){this.actionUntil=0;this.player.setData('modelEmoteUntil',0)}
    const desired =
      time < this.actionUntil
        ? this.actionName
        : length
          ? (motion.running?"run_":"walk_") + this.direction
          : "idle_" + this.direction;
    const poseFacing = this.localPose ? ({ down: 0, left: -Math.PI / 2, up: Math.PI, right: Math.PI / 2 } as Record<string, number>)[this.localPose.facing] : null
    this.player.setData('modelPoseFacing', poseFacing)
    if (poseFacing !== null) this.player.setData('modelFacing', poseFacing)
    playPlayer(this, this.player, s.data.player.appearance, this.localPose?.animation ?? desired);
    this.player.setDepth(this.localPose?.groundY ?? this.player.y);
    if (!s.decoration) {
      const wetUntil = (movement(s.data.player.id)?.environment ?? s.data.environment)?.wetUntil ?? 0
      this.roomReactions.effects.observe(s.data.player.id, this.player, this.keys.SHIFT.isDown, (outside && !!world?.weather.includes('rain')) || wetUntil * 1000 > Date.now(), !outside, performance.now())
      this.roomReactions.equipped(s.data.player.id, this.player, this.localPose ? '' : s.data.environment?.tool ?? '')
      this.roomReactions.step(s.data.house, performance.now(), this.reduced || immersionPreferences.get().reducedEffects)
    }
    if (
      s.status === "online" &&
      !this.localPose &&
      time - this.lastSend > 100 &&
      (Math.hypot(this.player.x - this.sent.x, this.player.y - this.sent.y) >
        0.5 ||
        this.direction !== this.sent.direction ||
        !!length !== this.sent.walking)
    ) {
      this.sent = {
        x: this.player.x,
        y: this.player.y,
        direction: this.direction,
        walking: !!length,
      };
      this.lastSend = time;
      live({
        type: "player.move",
        x: this.player.x,
        y: this.player.y,
        direction: this.direction,
        walking: !!length,
      });
    }
    if (!typing && !s.decoration && Phaser.Input.Keyboard.JustDown(this.keys.E))
      this.interact();
    if (s.decoration && this.candidate && !typing) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R))
        this.command({ type: "rotate" });
      for (const [key, dx, dy] of [
        ["LEFT", -1, 0],
        ["RIGHT", 1, 0],
        ["UP", 0, -1],
        ["DOWN", 0, 1],
      ] as const)
        if (Phaser.Input.Keyboard.JustDown(this.keys[key])) {
          this.candidate.x += dx;
          this.candidate.y += dy;
          this.drawGhost();
        }
      if (Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) this.commit();
      if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.clearGhost();
    }
    if (this.queueCare) {
      const p = s.pets.find((p) => p.id === this.queueCare!.pet);
      if (p && Math.hypot(p.x - this.player.x, p.y - this.player.y) < 78) {
        live({
          type: "pet.interact",
          actionId: crypto.randomUUID(),
          pet: p.id,
          action: this.queueCare.action,
        });
        this.queueCare = null;
        this.path = [];
      } else if (!this.path.length) this.queueCare = null;
    }
    for (const [id, a] of this.actors) {
      const r = s.players[id] ? { ...s.players[id], ...movement(id) } : null;
      if (!r) continue;
      const pose = this.poses.get(id),
        blend = 1 - Math.exp(-Math.min(delta, 50) / 70);
      a.x = Phaser.Math.Linear(a.x, pose?.x ?? r.x, blend);
      a.y = Phaser.Math.Linear(a.y, pose?.y ?? r.y, blend);
      this.roomReactions.effects.observe(id, a, r.walking, (r.environment?.wetUntil ?? 0) * 1000 > Date.now(), !outside, performance.now())
      this.roomReactions.equipped(id, a, pose ? '' : r.environment?.tool ?? '')
      const poseFacing = pose ? ({ down: 0, left: -Math.PI / 2, up: Math.PI, right: Math.PI / 2 } as Record<string, number>)[pose.facing] : null
      a.setData('modelPoseFacing', poseFacing)
      if (poseFacing !== null) a.setData('modelFacing', poseFacing)
      playPlayer(
        this,
        a,
        r.person.appearance,
        this.poses.get(id)?.animation ??
          (r.walking ? "walk_" : "idle_") + r.direction,
      );
      a.setDepth(this.poses.get(id)?.groundY ?? a.y);
      this.labels
        .get(id)
        ?.setPosition(a.x, a.y + 3)
        .setDepth(a.y + 1);
    }
    if (time > this.nextVoice) {
      this.nextVoice = time + 12000 + Math.random() * 14000;
      const pet = s.pets.find(
        (p) => Math.hypot(p.x - this.player.x, p.y - this.player.y) < 150,
      );
      if (pet)
        audio.effectAt(
          pet.state === "sleep" ? "purr" : "meow",
          Math.hypot(pet.x - this.player.x, pet.y - this.player.y),
        );
    }
    this.petShadows.clear().fillStyle(0x38251a, 0.18);
    for (const p of s.pets) {
      const a = this.petActors.get(p.id);
      if (!a) continue;
      companionPositions.set(p.id, { x: p.x, y: p.y });
      let px = p.x,
        py = p.y;
      if (p.next) {
        const dx = p.next[0] - p.x,
          dy = p.next[1] - p.y,
          l = Math.hypot(dx, dy) || 1,
          d = Math.min(
            l,
            28 * Math.min(1.2, (performance.now() - s.petTick) / 1000),
          );
        px += (dx / l) * d;
        py += (dy / l) * d;
      }
      let elevation = p.elevation ?? 0;
      if (p.transition) {
        const t = Math.max(
            0,
            Math.min(
              1,
              (Date.now() / 1000 - p.transition.started) /
                p.transition.duration,
            ),
          ),
          from = p.transition.from,
          to = p.transition.to;
        px = from[0] + (to[0] - from[0]) * t;
        py = from[1] + (to[1] - from[1]) * t;
        elevation =
          from[2] +
          (to[2] - from[2]) * t +
          (this.reduced ? 0 : Math.sin(t * Math.PI) * 12);
      }
      const dx = px - a.x,
        dy = py - (a.y + (p.elevation ?? 0)),
        moving = !p.transition && Math.hypot(dx, dy) > 2;
      const blend = p.transition ? 1 : 1 - Math.exp(-Math.min(delta, 50) / 90);
      a.x = Phaser.Math.Linear(a.x, px, blend);
      a.y = Phaser.Math.Linear(a.y, py - elevation, blend);
      this.petShadows.fillEllipse(
        px,
        py - 1,
        Math.max(7, 18 - elevation / 4),
        5,
      );
      const direction =
        Math.abs(dx) > Math.abs(dy)
          ? dx < 0
            ? "left"
            : "right"
          : dy < 0
            ? "up"
            : "down";
      const names: Record<string, string> = {
        idle: "standing",
        rest: "lie_down",
        climb: "jump_sofa",
        descend: "lie_down",
        wander: "walk_" + direction,
        sit: "sitting",
        sleep: "sleep",
        stretch: "stretch",
        groom: "groom",
        eat: "eat",
        drink: "drink",
        play: "play",
        petted: "pet",
        happy: "happy",
        scratch: "scratch_post",
        sofa: "sofa_sit",
        hide: "lie_down",
        watch: "standing",
        follow: "walk_" + direction,
        approach: "walk_" + direction,
      };
      playAnimal(
        this,
        a,
        p.sprite,
        moving ? "walk_" + direction : (names[p.state] ?? "idle"),
      );
      const support = p.surface
        ? s.data.house.activeLayout.find((piece) =>
            p.surface!.startsWith(piece.id + "/"),
          )
        : undefined;
      a.setDepth(support ? support.y * 32 + 34 : py);
      this.labels
        .get(p.id)
        ?.setPosition(a.x, a.y + 3)
        .setDepth(a.depth + 1)
        .setVisible(
          s.selectedPet === p.id ||
            Math.hypot(a.x - this.player.x, a.y - this.player.y) < 100,
        );
      a.setTint(s.selectedPet === p.id ? 0xffd995 : 0xffffff);
    }
    for (const [id, b] of this.bubbles) {
      const target =
        id === s.data.player.id ? this.player : this.actors.get(id);
      if (target?.scene) b.follow(target.x, target.y);
      else {
        b.destroy();
        this.bubbles.delete(id);
      }
    }
    this.debug.clear();
    if (s.debugGeometry && this.navigation) {
      this.debug.lineStyle(1, 0xef5b51, 0.8);
      for (const r of this.navigation.rects)
        this.debug.strokeRect(r.x, r.y, r.width, r.height);
      this.debug.lineStyle(1, 0x55c9e7, 0.8);
      const f = footRect(this.player);
      this.debug.strokeRect(f.x, f.y, f.width, f.height);
      this.debug.fillStyle(0xa69bff, 0.18);
      const view = this.cameras.main.worldView;
      for (const key of this.navigation.blocked) {
        const [x, y] = key.split(",").map(Number);
        if (
          x * 8 >= view.left &&
          x * 8 <= view.right &&
          y * 8 >= view.top &&
          y * 8 <= view.bottom
        )
          this.debug.fillRect(x * 8, y * 8, 8, 8);
      }
      for (const p of s.data.house.activeLayout) {
        const d = furnitureAt(p),
          v = visualBounds(p);
        this.debug.lineStyle(1, 0xffffff, 0.25);
        this.debug.strokeRect(v.x, v.y, v.width, v.height);
        this.debug.lineStyle(1, 0xf093d4, 0.65);
        for (const r of d.geometry.placement) {
          const b = worldRect(p, r);
          this.debug.strokeRect(b.x, b.y, b.width, b.height);
        }
        this.debug.fillStyle(0xf093d4, 0.9);
        for (const a of d.geometry.seats) {
          const q = worldPoint(p, a.point);
          this.debug.fillCircle(q.x, q.y - a.elevation, 3);
        }
        this.debug.fillStyle(0xffcc55, 0.9);
        for (const a of d.geometry.approaches) {
          const q = worldPoint(p, a);
          this.debug.fillCircle(q.x, q.y, 2);
        }
        this.debug.lineStyle(1, 0x81e198, 0.9);
        for (const a of d.geometry.surfaces) {
          const r = worldRect(p, a.landingBounds);
          this.debug.strokeRect(r.x, r.y - a.elevation, r.width, r.height);
        }
      }
    }
    this.shadow.clear();
    if (s.decoration) {
      this.shadow.lineStyle(1, 0x725f48, 0.18);
      for (let x = 32; x < s.data.house.width * 32; x += 32)
        this.shadow.lineBetween(x, 32, x, (s.data.house.height - 1) * 32);
      for (let y = 32; y < s.data.house.height * 32; y += 32)
        this.shadow.lineBetween(32, y, (s.data.house.width - 1) * 32, y);
      if (this.candidate) {
        const ok = valid(
          this.candidate,
          s.draft,
          s.data.house.zone,
          s.data.house.interiorPreset,
        );
        const color = ok ? 0x328d51 : 0xc84337;
        this.shadow.fillStyle(color, 0.25);
        for (const r of furnitureAt(this.candidate).geometry.placement) {
          const b = worldRect(this.candidate, r);
          this.shadow.fillRect(b.x, b.y, b.width, b.height);
        }
        this.shadow.lineStyle(2, color, 1);
        this.shadow.strokeRect(
          this.candidate.x * 32,
          this.candidate.y * 32,
          32,
          32,
        );
      }
    }
  }
}
