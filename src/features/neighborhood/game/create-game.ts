import Phaser from 'phaser'
import { WorldScene } from './world-scene'
export function createGame(parent: HTMLElement) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#6a9039',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    autoFocus: false,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: parent.clientWidth,
      height: parent.clientHeight,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [WorldScene],
    input: { activePointers: 3, keyboard: true },
    audio: { noAudio: true },
  })
  const describe = () => {
    if (!game.canvas) return
    game.canvas.setAttribute('tabindex', '0')
    game.canvas.setAttribute(
      'aria-label',
      'PawTrail neighborhood. Move with WASD or arrow keys. Press E to interact. Accessible action controls are beside the game.',
    )
    game.canvas.setAttribute('role', 'application')
  }
  if (game.canvas) describe()
  else game.events.once(Phaser.Core.Events.READY, describe)
  return game
}
