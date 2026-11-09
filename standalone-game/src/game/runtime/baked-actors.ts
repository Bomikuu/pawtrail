import Phaser from "phaser";
import manifest from "./baked-actors.json";
import { preloadEmoteCar } from "./car-emote";

type BakedAnimation = { start: number; end: number; frameRate: number; repeat: number };
export type BakedActor = {
  id: string;
  kind: "player" | "cat";
  texture: string;
  file: string;
  frameWidth: number;
  frameHeight: number;
  spacing: number;
  margin: number;
  anchor: { x: number; y: number };
  headHeight?: number;
  animations: Record<string, BakedAnimation>;
};
const sheets = manifest as BakedActor[];
const headings = [
  "down", "down_right", "right", "up_right", "up", "up_left", "left", "down_left",
] as const;
export type BakedDirection = (typeof headings)[number];

export function bakedActor(kind: "player" | "cat", identity: string) {
  const id = identity === "orange-tabby" ? "orange_tabby" : identity;
  return sheets.find((sheet) => sheet.kind === kind && sheet.id === id);
}

export function preloadBakedActors(scene: Phaser.Scene) {
  preloadEmoteCar(scene);
  for (const sheet of sheets) preloadBakedSheet(scene, sheet);
}

export function preloadBakedSheet(scene: Phaser.Scene, sheet: BakedActor) {
  if (!scene.textures.exists(sheet.texture)) {
    scene.load.spritesheet(sheet.texture, sheet.file, {
      frameWidth: sheet.frameWidth,
      frameHeight: sheet.frameHeight,
      spacing: sheet.spacing,
      margin: sheet.margin,
    });
  }
}

export function registerBakedActors(scene: Phaser.Scene) {
  for (const sheet of sheets) {
    if (!scene.textures.exists(sheet.texture)) continue;
    scene.textures.get(sheet.texture).setFilter(Phaser.Textures.FilterMode.NEAREST);
    for (const [name, animation] of Object.entries(sheet.animations)) {
      const key = sheet.texture + "/" + name.replace("-", "_");
      if (scene.anims.exists(key)) continue;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(sheet.texture, {
          start: animation.start,
          end: animation.end,
        }),
        frameRate: animation.frameRate,
        repeat: animation.repeat,
      });
    }
  }
}

/** Keep a heading near sector boundaries so path/network jitter cannot flicker it. */
export function bakedDirection(yaw: number, previous: BakedDirection): BakedDirection {
  const previousAngle = headings.indexOf(previous) * Math.PI / 4;
  const difference = Math.atan2(Math.sin(yaw - previousAngle), Math.cos(yaw - previousAngle));
  if (Math.abs(difference) < Math.PI / 8 + Math.PI / 36) return previous;
  return headings[(Math.round(yaw / (Math.PI / 4)) % 8 + 8) % 8];
}

function actionFor(sheet: BakedActor, requested: string, moving: boolean) {
  const aliases: Record<string, string> = sheet.kind === "player" ? {
    refill_water: "water", fill_water: "water", water_plant: "water",
    fill_food: "feed", care_aquarium: "clean", rest: "sleep",
    pick_up_furniture: "pick_up", place_object: "pick_up", move_object: "pick_up",
    carry_supplies: "hold_item", inspect_furniture: "inspect", observe: "inspect",
    check: "inspect", rescue: "pick_up",
    sleepy: "sleep", crying: "sad", cry: "sad", floating: "float", laughing: "laugh", car: "ride",
  } : {
    standing: "idle", watch: "idle", sitting: "sit", sofa: "sit", sofa_sit: "sit",
    rest: "sleep", petted: "pet", feed: "eat", water: "drink",
    scratch_post: "scratch", jump_sofa: "climb", descend: "climb", hide: "lie_down",
    follow: "walk", approach: "walk", wander: "walk",
    sleepy: "sleep", crying: "sad", cry: "sad", floating: "float", laughing: "laugh", car: "ride",
  };
  const action = aliases[requested] ?? requested;
  if (/^(idle|walk)(_|$)/.test(action)) return moving ? "walk" : "idle";
  if (Object.hasOwn(sheet.animations, action + "-down")) return action;
  return moving ? "walk" : "idle";
}

/** Preserve stride/breath phase when turning instead of restarting the cycle. */
export function playBakedActor(
  image: Phaser.GameObjects.Sprite,
  sheet: BakedActor,
  moving: boolean,
  direction: BakedDirection,
  requestedAction: string,
  reducedMotion: boolean,
  timeScale: number,
) {
  const action = actionFor(sheet, requestedAction, moving);
  const key = sheet.texture + "/" + action + "_" + direction;
  const previous = image.anims.currentAnim?.key;
  const progress = image.anims.getProgress();
  const textureChanged = image.texture.key !== sheet.texture;
  if (textureChanged) {
    image.anims.stop();
    image.setTexture(sheet.texture);
  }
  image.setOrigin(sheet.anchor.x, sheet.anchor.y);
  image.setData("live3d", false);
  image.setData("bakedPixelActor", sheet.id);
  const animation = image.scene.anims.get(key);
  if (!animation) return;
  if (reducedMotion && ["idle", "sit", "sleep", "lie_down", "happy", "dance", "float", "sad", "angry", "tired", "surprised", "laugh", "sick", "ride"].includes(action)) {
    image.anims.stop();
    image.setFrame(animation.frames[0].textureFrame);
    return;
  }
  // A completed pickup/wave must hold its last frame until the action changes.
  if (textureChanged || previous !== key || (!image.anims.isPlaying && animation.repeat === -1)) {
    image.play(key, true);
  }
  if (!textureChanged && previous && previous !== key && previous.startsWith(sheet.texture + "/" + action + "_")) {
    image.anims.setProgress(progress);
  }
  image.anims.timeScale = action === "walk" ? timeScale : 1;
}
