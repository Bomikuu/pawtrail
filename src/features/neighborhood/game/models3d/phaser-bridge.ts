import Phaser from "phaser";
import {
  createModel,
  modelStage,
  pixelRenderer,
  pose,
  type ModelOptions,
} from "./model";
import { modelPreferences } from "./preferences";
import { ActorEmoteEffects } from "../runtime/emote-effects";
import {
  bakedActor,
  bakedDirection,
  playBakedActor,
  type BakedDirection,
} from "../runtime/baked-actors";
import { customCharacterId, appearanceHeadHeight, defaultAppearance } from '../actor-rig/appearance';
import { getSavedCharacter, resolveSavedCharacter } from '../creator/library';
import { LiveCharacter } from '../runtime/live-character';
import { allowsMovingAction, actorEffectAction } from '../actor-rig/action-layers';
import { gameAppearance, type GameAppearance } from '../actor-rig/game-appearances';
import { CREATOR_FRAME } from '../actor-rig/pixel-renderer';
const baseAppearance={appearance:defaultAppearance()};
let serial = 0,
  renderer: ReturnType<typeof pixelRenderer> | undefined,
  failed = false;
const bound = new WeakMap<
  Phaser.GameObjects.Sprite,
  { identity: string; kind: ModelOptions["kind"] }
>();
/** Shared appearance binding: approved pixel exports first, existing mesh actors otherwise. */
export function bindModel(
  sprite: Phaser.GameObjects.Sprite,
  kind: ModelOptions["kind"],
  identity: string,
) {
  identity =
    (
      {
        "orange-tabby": "orange_tabby",
        "black-cat": "black_cat",
        "white-cat": "white_cat",
      } as Record<string, string>
    )[identity] ?? identity;
  const existing = bound.get(sprite);
  if (existing) {
    existing.identity = identity;
    existing.kind = kind;
    return;
  }
  const state = { identity, kind };
  bound.set(sprite, state);
  const scene = sprite.scene,
    key = "live-mesh:" + serial++,
    texture = scene.textures.createCanvas(key, 48, 60)!,
    stage = modelStage();
  const image = scene.add
    .sprite(sprite.x, sprite.y, key)
    .setOrigin(0.5, stage.footAnchor);
  image.vertexRoundMode = "fullAuto";
  image.setData("live3d", true);
  let signature = "",
    rig: ReturnType<typeof createModel> | undefined,
    last = -Infinity,
    oldX = sprite.x,
    oldY = sprite.y,
    yaw = 0,
    pendingDistance = 0,
    hasMoved = false,
    preferences: Partial<ModelOptions> = {},
    preferenceId = "",
    preferenceDirty = true,
    direction: BakedDirection = "down";
  let personal: LiveCharacter | undefined, personalId="", personalFailed="";
  let builtinLook: GameAppearance | undefined;
  const nativeWebGL = sprite.renderWebGL,
    nativeWebGLStep = sprite.renderWebGLStep,
    nativeCanvas = sprite.renderCanvas;
  // Phaser 4 stores the original draw function in its render-step pipeline.
  // Keep the input camera list populated without submitting the legacy sprite.
  const inputOnlyWebGL: typeof sprite.renderWebGL = (_renderer, source, context) => {
    context.camera.addToRenderList(source);
  };
  const inputOnlyStep: typeof sprite.renderWebGLStep = (_renderer, source, context) => {
    context.camera.addToRenderList(source);
  };
  const inputOnlyCanvas: typeof sprite.renderCanvas = (_renderer, source, camera) => {
    camera.addToRenderList(source);
  };
  const suppressNative = () => {
    sprite.renderWebGL = inputOnlyWebGL;
    sprite.renderWebGLStep = inputOnlyStep;
    sprite.renderCanvas = inputOnlyCanvas;
  };
  const retainNative = () => {
    image.setVisible(false);
    sprite.renderWebGL = nativeWebGL;
    sprite.renderWebGLStep = nativeWebGLStep;
    sprite.renderCanvas = nativeCanvas;
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const emoteEffects = new ActorEmoteEffects(scene, kind);
  const refreshPreferences = () => {
    preferenceDirty = true;
  };
  window.addEventListener("pawtrail:models3d", refreshPreferences);
  const redraw = (time: number, delta: number) => {
    if (!sprite.scene) return;
    image
      .setVisible(sprite.visible)
      .setDepth(sprite.depth + 0.01)
      .setPosition(sprite.x, sprite.y)
      .setScale(sprite.scaleX*(state.kind==='player'&&personal?(customCharacterId(state.identity)?1:builtinLook?.bodyScale??1)/CREATOR_FRAME.density:1), sprite.scaleY*(state.kind==='player'&&personal?(customCharacterId(state.identity)?1:builtinLook?.bodyScale??1)/CREATOR_FRAME.density:1))
      .setAlpha(sprite.alpha)
      .setTint(sprite.tintTopLeft);
    const dx = sprite.x - oldX,
      dy = sprite.y - oldY,
      distance = Math.hypot(dx, dy),
      moving = distance > 0.015 && distance < Math.max(16, delta * 0.4);
    oldX = sprite.x;
    oldY = sprite.y;
    let action = String(
      sprite.getData("modelAction") ??
        sprite.anims.currentAnim?.key?.split("/").pop() ??
        "idle_down",
    );
    const emoteUntil = Number(sprite.getData("modelEmoteUntil") ?? 0);
    const timedAction=String(sprite.getData("modelEmoteAction")??'');
    if(emoteUntil>0&&emoteUntil<=time&&allowsMovingAction(timedAction)){
      sprite.setData('modelEmoteUntil',0);
      if(action===timedAction){action=moving?'walk':'idle';sprite.setData('modelAction',action)}
    }
    if (emoteUntil > time) {
      const emoteAction=String(sprite.getData("modelEmoteAction")??action);
      const interrupted=allowsMovingAction(emoteAction)&&action!==emoteAction&&!/^(walk|run|idle|standing|watch)(_|$)/.test(action);
      if(interrupted){sprite.setData("modelEmoteUntil",0)}
      else if (distance > Math.max(.3, delta * .015) && !sprite.getData("modelEmoteLock") && !allowsMovingAction(emoteAction)) {
        sprite.setData("modelEmoteUntil", 0);
        action = "walk";
      } else action = emoteAction;
    }
    // Ignore teleports/room arrival for stride phase. Diagonal headings survive the stop.
    if (moving) {
      yaw = Math.atan2(dx, dy);
      hasMoved = true;
      pendingDistance += distance;
      if (/^(walk|run|idle|standing|watch)/.test(action)) action = /^run/.test(action)?"run":"walk";
    } else if (!hasMoved && /left|right|up|down/.test(action))
      yaw = action.includes("left")
        ? -Math.PI / 2
        : action.includes("right")
          ? Math.PI / 2
          : action.includes("up")
            ? Math.PI
            : 0;
    const interactionYaw = sprite.getData("modelFacing");
    if (!moving && !allowsMovingAction(action) && !/^(walk|run|idle|standing|watch)/.test(action) &&
        typeof interactionYaw === "number" && Number.isFinite(interactionYaw)) {
      yaw = interactionYaw;
    }
    const custom=state.kind==='player'&&customCharacterId(state.identity);
    if(state.kind==='player'&&personalId!==state.identity){personalId=state.identity;personalFailed='';if(custom)void resolveSavedCharacter(state.identity)}
    if(state.kind==='player'&&!custom&&(preferenceDirty||preferenceId!==state.identity)){
      preferences=modelPreferences(state.identity);preferenceId=state.identity;preferenceDirty=false;
      builtinLook=gameAppearance(state.identity,preferences)??{...baseAppearance,headScale:1,bodyScale:1,yaw:0};
      personalFailed='';
    }
    const saved=custom?(getSavedCharacter(state.identity)??baseAppearance):state.kind==='player'?builtinLook:undefined;
    const bodyScale=!custom&&state.kind==='player'?builtinLook?.bodyScale??1:1;
    sprite.setData('actorBodyScale',bodyScale);
    if(saved&&personalFailed!==state.identity){
      const camera=scene.cameras.main.worldView;
      if(!image.visible||sprite.x<camera.x-80||sprite.x>camera.right+80||sprite.y<camera.y-80||sprite.y>camera.bottom+80){emoteEffects.hide();pendingDistance=0;return;}
      try{
        if(rig){stage.scene.remove(rig.root);rig.dispose();rig=undefined;signature=''}
        personal??=new LiveCharacter(texture,saved);
        suppressNative();image.anims.stop();image.setTexture(key).setOrigin(CREATOR_FRAME.anchor.x,CREATOR_FRAME.anchor.y).setData('bakedPixelActor',null)
          .setScale(sprite.scaleX*bodyScale/CREATOR_FRAME.density,sprite.scaleY*bodyScale/CREATOR_FRAME.density);
        direction=bakedDirection(yaw+(!custom?builtinLook?.yaw??0:0),direction);
        const renderedAction=personal.update(saved,action,moving,direction,time,sprite.anims.timeScale,reduced.matches,pendingDistance);
        const height=appearanceHeadHeight(saved.appearance),head=!custom?builtinLook?.headScale??1:1;
        emoteEffects.update(sprite,actorEffectAction(saved.appearance,renderedAction),time,reduced.matches,direction,height+(height-28)*(head-1));
        pendingDistance=0;return;
      }catch(error){personalFailed=state.identity;personal?.dispose();personal=undefined;texture.setSize(48,60);image.setScale(sprite.scaleX,sprite.scaleY);console.error('Appearance unavailable; showing the approved rescuer',error)}
    }
    if(personal){personal.dispose();personal=undefined;texture.setSize(48,60)}
    const baked = bakedActor(state.kind, state.identity) ?? (state.kind==='player' ? bakedActor('player','rescuer') : undefined);
    emoteEffects.update(sprite, action, time, reduced.matches, bakedDirection(yaw, direction), baked?.headHeight);
    if (baked) {
      if (rig) {
        stage.scene.remove(rig.root);
        rig.dispose();
        rig = undefined;
        signature = "";
      }
      pendingDistance = 0;
      if (!scene.textures.exists(baked.texture)) {
        retainNative();
        return;
      }
      suppressNative();
      direction = bakedDirection(yaw, direction);
      playBakedActor(image, baked, moving, direction, action, reduced.matches, sprite.anims.timeScale);
      return;
    }
    if (failed) {
      retainNative();
      return;
    }
    try {
      renderer ??= pixelRenderer();
    } catch (error) {
      failed = true;
      console.error("3D actor renderer unavailable; retaining native actors", error);
      retainNative();
      return;
    }
    suppressNative();
    if (image.texture.key !== key) {
      image.anims.stop();
      image.setTexture(key);
    }
    image.setOrigin(0.5, stage.footAnchor).setData("live3d", true);
    image.setData("bakedPixelActor", null);
    if (preferenceDirty || preferenceId !== state.identity) {
      preferences = modelPreferences(state.identity);
      preferenceId = state.identity;
      preferenceDirty = false;
    }
    const next = JSON.stringify([state.identity, preferences]);
    if (next !== signature) {
      if (rig) {
        stage.scene.remove(rig.root);
        rig.dispose();
      }
      rig = createModel({ kind: state.kind, identity: state.identity, ...preferences });
      stage.scene.add(rig.root);
      signature = next;
      last = -Infinity;
    }
    const target = yaw + Number(preferences.yaw ?? 0),
      angle = Math.atan2(
        Math.sin(target - rig!.motion.yaw),
        Math.cos(target - rig!.motion.yaw),
      ),
      turning = Math.abs(angle) > 0.006;
    const view = scene.cameras.main.worldView,
      onScreen =
        sprite.x >= view.x - 64 &&
        sprite.x <= view.right + 64 &&
        sprite.y >= view.y - 64 &&
        sprite.y <= view.bottom + 64;
    if (!image.visible || !onScreen) {
      pendingDistance = 0;
      return;
    }
    const animated =
      moving ||
      turning ||
      rig!.motion.walk > 0.005 ||
      /pet|feed|water|play|climb|eat|drink/.test(action);
    if (time - last < (animated ? 15 : 50)) return;
    last = time;
    pose(rig!, state.kind, action, time, target, {
      distance: pendingDistance,
      reducedMotion: reduced.matches,
    });
    pendingDistance = 0;
    renderer!.render(stage.scene, stage.camera);
    texture.context.clearRect(0, 0, 48, 60);
    texture.context.drawImage(renderer!.domElement, 0, 0);
    texture.refresh();
  };
  // Keep hit testing and alpha/visibility intact. Suppress only the native draw calls.
  suppressNative();
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, redraw);
  sprite.once("destroy", () => {
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, redraw);
    window.removeEventListener("pawtrail:models3d", refreshPreferences);
    rig?.dispose();
    personal?.dispose();
    emoteEffects.destroy();
    image.destroy();
    if (scene.textures.exists(key)) scene.textures.remove(key);
  });
}
