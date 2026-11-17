import Phaser from 'phaser'
import { SofaPalette, SOFA_PALETTE_VIEWS } from './sofa-palette'
import { SOFA_DEFAULT_COLOR } from './palette-color'
import type { Placement } from '../housing/types'
import type { RoomImage } from '../housing/room-art'
import { furniture } from '../housing/geometry'

type Entry = { palette: SofaPalette; body: Phaser.Textures.CanvasTexture; front: Phaser.Textures.CanvasTexture; signature: string }
let serial = 0

/** Two reusable GPU textures per colored placement; source textures are never mutated. */
export class SofaPaletteTextures {
  private prefix = `sofa-upholstery:${++serial}:`
  private entries = new Map<string, Entry>()
  constructor(private scene: Phaser.Scene) {}

  resolve(piece: Placement, art: RoomImage, slot = `placed:${piece.id}`): RoomImage {
    const color = piece.upholsteryColor
    if (piece.item !== 'sofa' || !color || color === SOFA_DEFAULT_COLOR || !/^#[0-9a-f]{6}$/i.test(color)) {
      // Releasing textures is deferred until stale sprites have been replaced/destroyed.
      return art
    }
    const view = SOFA_PALETTE_VIEWS[String(piece.rotation) as keyof typeof SOFA_PALETTE_VIEWS]
    if (!view || art.file !== view.file) return art
    let entry = this.entries.get(slot)
    if (!entry) {
      const images = new Map<string, HTMLImageElement>()
      for (const [rotation, source] of Object.entries(SOFA_PALETTE_VIEWS)) {
        const base = `f:sofa:${furniture.sofa.defaultStyle}:${rotation}`
        images.set(source.file, this.scene.textures.get(base).getSourceImage() as HTMLImageElement)
        images.set(source.foreground, this.scene.textures.get(base + ':front').getSourceImage() as HTMLImageElement)
      }
      const palette = new SofaPalette(images)
      const body = this.scene.textures.createCanvas(this.prefix + slot + ':body', view.width, view.height)
      const front = this.scene.textures.createCanvas(this.prefix + slot + ':front', view.width, view.height)
      if (!body || !front) {
        if (body) this.scene.textures.remove(body.key)
        if (front) this.scene.textures.remove(front.key)
        palette.dispose()
        throw Error('The sofa color textures could not be created.')
      }
      body.setFilter(Phaser.Textures.FilterMode.NEAREST); front.setFilter(Phaser.Textures.FilterMode.NEAREST)
      entry = { palette, body, front, signature: '' }; this.entries.set(slot, entry)
    }
    const signature = color + ':' + piece.rotation
    if (entry.signature !== signature) {
      entry.palette.setColor(color)
      for (const [target, file] of [[entry.body, view.file], [entry.front, view.foreground]] as const) {
        target.context.clearRect(0, 0, view.width, view.height)
        target.context.imageSmoothingEnabled = false
        target.context.drawImage(entry.palette.image(file)!, 0, 0)
        target.refresh()
      }
      entry.signature = signature
    }
    return { ...art, texture: entry.body.key,
      ...(art.foreground ? { foreground: { ...art.foreground, texture: entry.front.key } } : {}) }
  }

  retain(slots: Set<string>) { for (const slot of this.entries.keys()) if (!slots.has(slot)) this.release(slot) }
  release(slot: string) {
    const entry = this.entries.get(slot)
    if (!entry) return
    this.scene.textures.remove(entry.body.key); this.scene.textures.remove(entry.front.key)
    entry.palette.dispose(); this.entries.delete(slot)
  }
  dispose() { for (const slot of this.entries.keys()) this.release(slot) }
}
