import Phaser from 'phaser'
import { furnitureAt } from '../housing/geometry'
import { furnitureArt } from '../housing/room-art'
import type { Placement } from '../housing/types'

/** Screen-sized circular action above the selected object; rotation still uses its authored facings. */
export class FurnitureRotationControl {
  private button: Phaser.GameObjects.Graphics
  constructor(
    private scene: Phaser.Scene,
    rotate: () => void,
  ) {
    this.button = scene.add.graphics().setDepth(10020).setVisible(false)
    this.button.setInteractive(
      new Phaser.Geom.Circle(0, 0, 21),
      Phaser.Geom.Circle.Contains,
    )
    this.button.input!.cursor = 'pointer'
    this.button.on('pointerover', () => this.draw(true))
    this.button.on('pointerout', () => this.draw(false))
    this.button.on(
      'pointerdown',
      (
        _: unknown,
        __: unknown,
        ___: unknown,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation()
        rotate()
      },
    )
    this.draw(false)
  }
  private draw(hover: boolean) {
    const b = this.button.clear()
    b.fillStyle(0x38271e, 0.14).fillCircle(1, 2, 20)
    b.fillStyle(hover ? 0xf4e3c8 : 0xfffcf5).fillCircle(0, 0, 20)
    b.lineStyle(1, 0xa87b51).strokeCircle(0, 0, 20)
    b.lineStyle(2, 0x493527)
      .beginPath()
      .arc(0, 0, 8, -Math.PI / 4, Math.PI * 1.5)
      .strokePath()
    b.beginPath().moveTo(0, -8).lineTo(5, -8).lineTo(5, -13).strokePath()
  }
  sync(piece?: Placement) {
    const def = piece && furnitureAt(piece),
      art = piece && furnitureArt(piece)
    if (!piece || !def || !art || (def.supportedRotations?.length ?? 0) < 2) {
      this.button.setVisible(false)
      this.button.disableInteractive()
      return
    }
    const zoom = this.scene.cameras.main.zoom
    this.button
      .setVisible(true)
      .setActive(true)
      .setPosition(
        art.x,
        art.y - (def.indicatorHeight ?? def.anchor[1]) - 25 / zoom,
      )
      .setScale(1 / zoom)
    if (this.button.input) this.button.input.enabled = true
  }
  destroy() {
    this.button.destroy()
  }
}
