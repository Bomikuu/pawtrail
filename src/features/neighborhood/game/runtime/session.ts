import Phaser from "phaser";
import { rendererConfig, bindRendererRecovery } from "../renderer";
let game: Phaser.Game | undefined,
  booting: Promise<Phaser.Game> | undefined,
  active: "World" | "Home" | "ActorCompare" | undefined,
  host: HTMLElement | undefined,
  normalHost: HTMLElement | undefined,
  resizeObserver: ResizeObserver | undefined;
const parked = document.createElement("div");
parked.hidden = true;
function resize() {
  if (!game || !host) return;
  game.scale.parent = host;
  game.scale.setParentSize(
    Math.max(1, host.clientWidth),
    Math.max(1, host.clientHeight),
  );
  if (active !== "Home")
    game.scale.resize(
      Math.max(1, host.clientWidth),
      Math.max(1, host.clientHeight),
    );
  else game.scale.refresh();
}
function attach(next: HTMLElement) {
  host = next;
  if (game?.canvas) {
    game.loop.wake();
    next.appendChild(game.canvas);
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(next);
    resize();
  }
}
async function boot() {
  if (game) return game;
  if (booting) return booting;
  booting = (async () => {
    const [{ WorldScene }, { HomeScene }] = await Promise.all([
      import("../world-scene"),
      import("../housing/scene"),
    ]);
    return new Promise<Phaser.Game>((resolve) => {
      const instance = new Phaser.Game({
        ...rendererConfig(),
        parent: host ?? parked,
        autoFocus: false,
        backgroundColor: "#6a9039",
        scale: {
          mode: Phaser.Scale.RESIZE,
          width: host?.clientWidth || 800,
          height: host?.clientHeight || 600,
        },
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
            fixedStep: true,
            fps: 60,
          },
        },
        input: { activePointers: 3, keyboard: true },
        audio: { noAudio: true },
        callbacks: {
          postBoot: (g) => {
            game = g;
            g.scene.add("World", WorldScene, false);
            g.scene.add("Home", HomeScene, false);
            bindRendererRecovery(g);
            g.canvas.tabIndex = 0;
            g.canvas.setAttribute("role", "application");
            resolve(g);
          },
        },
      });
      void instance;
    });
  })();
  return booting;
}
export async function mountWorld(
  next: HTMLElement,
  mode: "World" | "Home" | "ActorCompare",
  ready?: () => void,
) {
  normalHost = next;
  host = next;
  const g = await boot();
  if (mode === "ActorCompare" && g.scene.getIndex(mode) === -1) {
    const { ActorComparisonScene } = await import("./actor-comparison-scene");
    if (g.scene.getIndex(mode) === -1) g.scene.add(mode, ActorComparisonScene, false);
  }
  if (!next.isConnected) return () => {};
  attach(next);
  if (active !== mode || !g.scene.isActive(mode)) {
    if (active) g.scene.stop(active);
    active = mode;
    g.scale.scaleMode = Phaser.Scale.RESIZE;
    resize();
    g.scene
      .getScene(mode)
      .events.once(Phaser.Scenes.Events.CREATE, () => ready?.());
    g.scene.start(mode);
  } else ready?.();
  return () => {
    if (normalHost === next) {
      normalHost = undefined;
      if (host === next) {
        resizeObserver?.disconnect();
        parked.appendChild(g.canvas);
        host = undefined;
        if (active) g.scene.stop(active);
        active = undefined;
        g.loop.sleep();
      }
    }
  };
}
/** Reparent the same live canvas into the editor, never create a second game. */
export function editorViewport(next: HTMLElement) {
  const previous = normalHost;
  attach(next);
  return () => {
    if (previous?.isConnected) attach(previous);
  };
}
export function screenPoint(clientX: number, clientY: number) {
  if (!game || !active) return null;
  const b = game.canvas.getBoundingClientRect(),
    scene = game.scene.getScene(active);
  return scene.cameras.main.getWorldPoint(
    ((clientX - b.left) * game.scale.width) / b.width,
    ((clientY - b.top) * game.scale.height) / b.height,
  );
}
export function resetWorldRenderer() {
  resizeObserver?.disconnect();
  game?.destroy(true);
  game = undefined;
  booting = undefined;
  active = undefined;
}
