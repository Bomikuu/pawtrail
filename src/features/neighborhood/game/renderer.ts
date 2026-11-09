import Phaser from "phaser";
/** Phaser 4 render nodes; only public APIs. Canvas is an explicit reduced-effects recovery path. */
export function rendererConfig(): Phaser.Types.Core.GameConfig {
  return {
    type:
      sessionStorage.getItem("pawtrail:canvas-recovery") === "1"
        ? Phaser.CANVAS
        : Phaser.AUTO,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    render: { pixelArt: true, roundPixels: true, antialias: false },
    fps: { target: 60, smoothStep: true },
  };
}
export function bindRendererRecovery(game: Phaser.Game) {
  const lost = (event: Event) => {
    event.preventDefault();
    window.dispatchEvent(
      new CustomEvent("pawtrail:renderer-error", {
        detail:
          "The graphics connection was interrupted. Retry with the lighter renderer to keep playing.",
      }),
    );
  };
  const bind = () => game.canvas?.addEventListener("webglcontextlost", lost);
  if (game.canvas) bind();
  else game.events.once(Phaser.Core.Events.READY, bind);
  game.events.once(Phaser.Core.Events.DESTROY, () =>
    game.canvas?.removeEventListener("webglcontextlost", lost),
  );
}
