import Phaser from 'phaser'
import { jetpackEnvelope } from '../actor-rig/action-playback'
import { catJumpMotion } from '../actor-rig/cat-appearance'
import clips from '../actor-rig/actions.json'

/** A stepped pixel contact shadow anchored to the world, never to a lifted joint. */
export class ActorGroundShadow {
  private graphics?: Phaser.GameObjects.Graphics
  private action = ''
  private since = 0
  private last = 0
  constructor(private scene: Phaser.Scene, private kind: 'player' | 'cat') {}

  update(target: Phaser.GameObjects.Sprite, action: string, time: number, reduced: boolean, direction: string) {
    const view = this.scene.cameras.main.worldView
    if (!target.visible || target.alpha <= 0 || target.x < view.x - 80 || target.x > view.right + 80 || target.y < view.y - 80 || target.y > view.bottom + 80) {
      this.graphics?.setVisible(false)
      return
    }
    if (action !== this.action || time < this.last) { this.action = action; this.since = time }
    this.last = time
    const elapsed = Math.max(0, time - this.since)
    const floating = /^(float|floating)$/.test(action)
    const flying = /^jetpack(_takeoff|_land)?$/.test(action)
    const resting = /^(sleep|sleepy|rest|lie_down)$/.test(action)
    const catJump = this.kind === 'cat' && (action === 'jump' || action === 'pounce')
    const jumpDuration = clips['orange-tabby'].jump.frames / clips['orange-tabby'].jump.fps * 1000
    const lift = flying ? jetpackEnvelope(action, elapsed).lift : floating || action === 'fly' ? .7 : catJump ? catJumpMotion(elapsed / jumpDuration).lift : 0
    const bob = floating && !reduced ? Math.sin(elapsed / 1000 * Math.PI) * .02 : 0
    const sideways = /left|right/.test(direction)
    let width = this.kind === 'player' ? 8 : sideways ? 11 : 9
    let height = this.kind === 'player' ? 3 : sideways ? 3 : 4
    if (resting) { width += this.kind === 'player' ? 6 : 2; height += 1 }
    if (action === 'ride' || action === 'car') { width = 27; height = 7 }
    width += Math.round(lift * 7)
    height += Math.round(lift * 2)
    const strength = Math.max(.08, .19 - lift * .085 + bob)
    const graphics = this.graphics ??= this.scene.add.graphics()
    const pixelScale=Number(target.getData('actorPixelDensity')??1)*Number(target.getData('actorBodyScale')??1)
    graphics.vertexRoundMode = 'fullAuto'
    graphics.clear().setVisible(true).setPosition(Math.round(target.x + 2 + lift * 2), Math.round(target.y + 1 + lift * 5))
      .setScale(target.scaleX*pixelScale, target.scaleY*pixelScale).setDepth(target.depth - .06).setAlpha(target.alpha)
    const oval = (w: number, h: number, alpha: number) => {
      graphics.fillStyle(0x25322b, alpha)
      for (let row = -h; row <= h; row++) {
        const span = Math.max(1, Math.round(w * Math.sqrt(Math.max(0, 1 - (row / (h + .5)) ** 2))))
        graphics.fillRect(-span, row, span * 2, 1)
      }
    }
    oval(width + 2, height + 1, strength * .4)
    oval(width, height, strength)
  }

  hide() { this.graphics?.setVisible(false) }
  destroy() { this.graphics?.destroy(); this.graphics = undefined }
}
