import {approachVelocity} from '../systems/studio-locomotion'
import { bindModel } from "../models3d/phaser-bridge";
import { preloadBakedActors, registerBakedActors } from "./baked-actors";
import Phaser from "phaser";
import native from "./native-actors.json";
import catalog from "../housing/catalog.json";
import type { Point } from "../housing/types";
import { movementVector } from "../systems/behavior";
import type { ContactMotor } from '../furniture/contacts'
export const playerTexture = (id: string) =>
  "actor:player:" + (id in catalog.players ? id : "rescuer");
const catNames: Record<string, string> = {
  "orange-tabby": "orange_tabby",
  "black-cat": "black_cat",
  "white-cat": "white_cat",
  "brown-aspin": "brown_aspin",
  "white-puppy": "white_puppy",
  "spotted-dog": "spotted_dog",
};
export function animalSheet(id: string) {
  return catNames[id] ?? id;
}
export const animalTexture = (id: string) => "actor:animal:" + animalSheet(id);
export function preloadActors(scene: Phaser.Scene) {
  preloadBakedActors(scene);
  for (const [id, p] of Object.entries(catalog.players)) {
    const sheet = id === "rescuer" ? native.sheets.rescuer : p,
      key = playerTexture(id);
    if (!scene.textures.exists(key))
      scene.load.spritesheet(
        key,
        id === "rescuer" ? "/pawtrail-game/game-assets/rescuer.png" : p.file,
        { frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight },
      );
  }
  for (const [id, s] of Object.entries(native.sheets))
    if (id !== "rescuer" && !scene.textures.exists(animalTexture(id)))
      scene.load.spritesheet(
        animalTexture(id),
        "/pawtrail-game/game-assets/" + id + ".png",
        { frameWidth: s.frameWidth, frameHeight: s.frameHeight },
      );
  for (const [id, s] of Object.entries(catalog.cats))
    if (
      !(animalSheet(id) in native.sheets) &&
      !scene.textures.exists(animalTexture(id))
    )
      scene.load.spritesheet(animalTexture(id), s.file, {
        frameWidth: s.frameWidth,
        frameHeight: s.frameHeight,
      });
}
export function registerActors(scene: Phaser.Scene) {
  registerBakedActors(scene);
  for (const [id, s] of Object.entries(catalog.players)) {
    if (id === "rescuer") continue;
    for (const [name, a] of Object.entries(s.animations)) {
      const key = playerTexture(id) + "/" + name;
      if (!scene.anims.exists(key))
        scene.anims.create({
          key,
          frames: scene.anims.generateFrameNumbers(playerTexture(id), {
            start: a.row * s.columns,
            end: a.row * s.columns + a.frames - 1,
          }),
          frameRate: a.fps,
          repeat: -1,
        });
    }
  }
  for (const [key, a] of Object.entries(native.animations)) {
    const s = native.sheets[a.sheet as keyof typeof native.sheets],
      texture =
        a.sheet === "rescuer"
          ? playerTexture("rescuer")
          : animalTexture(a.sheet),
      name = key.split("/")[1],
      animation = texture + "/" + name;
    if (!scene.anims.exists(animation))
      scene.anims.create({
        key: animation,
        frames: a.frames.map((f) => ({
          key: texture,
          frame: (f.y / s.frameHeight) * s.columns + f.x / s.frameWidth,
        })),
        frameRate: a.fps,
        repeat: -1,
      });
  }
  for (const [id, s] of Object.entries(catalog.cats))
    if (!(animalSheet(id) in native.sheets))
      for (const [name, rects] of Object.entries(s.animations)) {
        const key = animalTexture(id) + "/" + name;
        if (!scene.anims.exists(key))
          scene.anims.create({
            key,
            frames: rects.map((r) => ({
              key: animalTexture(id),
              frame: (r[1] / s.frameHeight) * s.columns + r[0] / s.frameWidth,
            })),
            frameRate: 5,
            repeat: -1,
          });
      }
}
export function configurePlayer(sprite: Phaser.GameObjects.Sprite, id: string) {
  const p =
      catalog.players[id as keyof typeof catalog.players] ??
      catalog.players.rescuer,
    a = id === "rescuer" ? native.sheets.rescuer.anchor : [16, 46];
  sprite.setOrigin(a[0] / p.frameWidth, a[1] / p.frameHeight);
  bindModel(sprite, "player", id);
  sprite.vertexRoundMode = "fullAuto";
  const body = (sprite as Phaser.Physics.Arcade.Sprite).body as
    Phaser.Physics.Arcade.Body | undefined;
  if (body?.setSize) body.setSize(10, 6).setOffset(a[0] - 5, a[1] - 6);
}
export function configureAnimal(sprite: Phaser.GameObjects.Sprite, id: string) {
  const s = native.sheets[animalSheet(id) as keyof typeof native.sheets];
  sprite.setOrigin(0.5, s ? s.anchor[1] / s.frameHeight : 46 / 48);
  if (!/dog|puppy|aspin/.test(id)) bindModel(sprite, "cat", id);
  sprite.vertexRoundMode = "fullAuto";
  const body = (sprite as Phaser.Physics.Arcade.Sprite).body as
    Phaser.Physics.Arcade.Body | undefined;
  if (body?.setSize) {
    const anchor = s?.anchor ?? [24, 46];
    body.setSize(10, 6).setOffset(anchor[0] - 5, anchor[1] - 6);
  }
}
export function playPlayer(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  id: string,
  action: string,
  repeat?: number,
) {
  sprite.setData("modelAction", action);
  const texture = playerTexture(id),
    aliases: Record<string, string> = {
      sleep: "sit",
      rest: "sit",
      refill_water: "feed",
      clean: "pick_up",
      inspect_furniture: "idle_down",
      pick_up_furniture: "pick_up",
      place_object: "pick_up",
      hold_item: "idle_down",
      play: "pet",
    };
  const key = [action, aliases[action], "idle_down"]
    .filter(Boolean)
    .map((a) => texture + "/" + a)
    .find((k) => scene.anims.exists(k));
  if (key) sprite.play(repeat === undefined ? key : { key, repeat }, true);
}
export function playAnimal(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  id: string,
  action: string,
  repeat?: number,
) {
  sprite.setData("modelAction", action);
  const aliases: Record<string, string> = {
    standing: "idle",
    watch: "idle",
    rest: "sleep",
    sitting: "sit",
    petted: "pet",
    groom: "idle",
    climb: "happy",
    descend: "sit",
    drink: "eat",
    sofa: "sit",
  };
  const texture = animalTexture(id),
    key = [action, aliases[action], "idle", "standing"]
      .filter(Boolean)
      .map((a) => texture + "/" + a)
      .find((k) => scene.anims.exists(k));
  if (key) sprite.play(repeat === undefined ? key : { key, repeat }, true);
}
export function faceActor(sprite: Phaser.GameObjects.Sprite, target: Point) {
  sprite.setData("modelFacing", Math.atan2(target.x - sprite.x, target.y - sprite.y));
}
export const facing = (x: number, y: number) =>
  Math.abs(x) > Math.abs(y)
    ? x < 0
      ? "left"
      : "right"
    : y < 0
      ? "up"
      : "down";
/** One player controller; Arcade bodies and kinematic room actors share input, speed and arrival semantics. */
const humanMotors=new WeakMap<Phaser.GameObjects.Sprite,{velocity:{x:number;y:number};at:number}>()
export function moveActor(
  sprite: Phaser.GameObjects.Sprite,
  input: Point,
  path: Point[],
  delta: number,
  nav: { clear: (p: Point) => boolean } | undefined,
  sprint = false,
  speed?: number,
  contacts?: ContactMotor,
) {
  let { x, y } = input;
  if (x || y) path.length = 0;
  else if (path.length) {
    const p = path[0],
      dx = p.x - sprite.x,
      dy = p.y - sprite.y,
      l = Math.hypot(dx, dy);
    if (l < 2) path.shift();
    else {
      x = dx / l;
      y = dy / l;
    }
  }
  const body = (sprite as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.Body|undefined;
  let velocity = movementVector(x, y, sprint, speed)
  const dt = body?.setVelocity?Math.max(1/60,Math.min(delta,40)/1000):Math.min(delta,40)/1000,
    next = path[0];
  const now=performance.now(),previous=humanMotors.get(sprite)
  velocity=approachVelocity(previous&&now-previous.at<100?previous.velocity:{x:0,y:0},velocity,Math.min(delta,40)/1000)
  humanMotors.set(sprite,{velocity,at:now})
  let dx = velocity.x * dt,
    dy = velocity.y * dt;
  if (
    next &&
    Math.hypot(next.x - sprite.x, next.y - sprite.y) < Math.hypot(dx, dy)
  ) {
    dx = next.x - sprite.x;
    dy = next.y - sprite.y;
  }
  if(body?.setVelocity){
    if(nav){
      const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/3));let px=sprite.x,py=sprite.y;
      for(let i=0;i<steps;i++){if(nav.clear({x:px+dx/steps,y:py}))px+=dx/steps;if(nav.clear({x:px,y:py+dy/steps}))py+=dy/steps}
      dx=px-sprite.x;dy=py-sprite.y;
    }
    body.setVelocity(dt?dx/dt:0,dt?dy/dt:0);
  }
  else if (contacts && nav) {
    const point = contacts.move(sprite, { x: dx, y: dy }, nav.clear.bind(nav), sprint || (speed ?? 0) > 130, performance.now(), delta)
    sprite.setPosition(point.x, point.y)
  }
  else {
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 3));
    for (let i = 0; i < n; i++) {
      const px = sprite.x + dx / n,
        py = sprite.y + dy / n;
      if (!nav || nav.clear({ x: px, y: sprite.y })) sprite.x = px;
      if (!nav || nav.clear({ x: sprite.x, y: py })) sprite.y = py;
    }
  }
  return { moving: !!(x || y), direction: facing(x, y), velocity };
}
