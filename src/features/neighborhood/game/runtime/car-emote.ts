import Phaser from 'phaser'
import car from './emote-car.json'

type Heading = keyof typeof car.animations

export function preloadEmoteCar(scene: Phaser.Scene) {
  if (!scene.textures.exists(car.texture)) scene.load.spritesheet(car.texture, car.file, {
    frameWidth: car.frameWidth, frameHeight: car.frameHeight,
    spacing: car.spacing, margin: car.margin,
  })
}

/** Shared cosmetic vehicle layer; it never replaces the actor's collision body. */
export class CarEmote {
  private sprite?: Phaser.GameObjects.Sprite
  constructor(private scene: Phaser.Scene) {}

  update(target: Phaser.GameObjects.Sprite, elapsed: number, direction: string, reduced: boolean) {
    if (!this.scene.textures.exists(car.texture)) return
    if (!this.sprite) {
      this.scene.textures.get(car.texture).setFilter(Phaser.Textures.FilterMode.NEAREST)
      this.sprite = this.scene.add.sprite(0, 0, car.texture)
        .setOrigin(car.groundPixel.x / car.frameWidth, car.groundPixel.y / car.frameHeight)
      this.sprite.vertexRoundMode = 'fullAuto'
    }
    const clip = car.animations[direction as Heading] ?? car.animations.down_right
    const frame = reduced ? 0 : Math.floor(elapsed / 1000 * car.frameRate) % (clip.end - clip.start + 1)
    this.sprite.setVisible(target.visible).setAlpha(target.alpha)
      .setScale(target.scaleX*Number(target.getData('actorPixelDensity')??1), target.scaleY*Number(target.getData('actorPixelDensity')??1)).setDepth(target.depth - .01)
      .setPosition(target.x, target.y + car.attachmentOffsetY * target.scaleY*Number(target.getData('actorPixelDensity')??1))
      .setTint(target.tintTopLeft).setFrame(clip.start + frame)
  }

  hide() { this.sprite?.setVisible(false) }
  destroy() { this.sprite?.destroy(); this.sprite = undefined }
}
