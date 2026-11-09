import Phaser from 'phaser'
import rules from './interactions.json'
import { ContactEffects, swimmingFish } from './contacts'
import { worldPoint } from '../housing/spatial'
import { furnitureAt } from '../housing/geometry'
import { furnitureArt } from '../housing/room-art'
import type { House, Placement } from '../housing/types'

type Profile = {
  contact?: 'bush' | 'curtain'
  sensor?: number[]
  cloth?: number[]
  ambient?: string
  water?: number[]
}
type View = {
  id: string
  p: Placement
  profile: Profile
  image?: Phaser.GameObjects.Image
  native?: {
    frames: { file: string; frontFile: string }[]
    kind: string
    fps: number
    texture: string
    foreground?: Phaser.GameObjects.Image
  }
  paint: Phaser.GameObjects.Graphics
}
export class RoomReactions {
  readonly effects = new ContactEffects()
  private views: View[] = []
  private floor: Phaser.GameObjects.Graphics
  private tools = new Map<
    string,
    { paint: Phaser.GameObjects.Graphics; seen: number }
  >()
  constructor(private scene: Phaser.Scene) {
    this.floor = scene.add.graphics().setDepth(-45)
  }
  sync(
    layout: Placement[],
    images: Map<string, Phaser.GameObjects.Image>,
    fronts: Map<string, Phaser.GameObjects.Image>,
  ) {
    for (const view of this.views) view.paint.destroy()
    this.views = []
    this.effects.sensors = []
    for (const p of layout) {
      const d = furnitureAt(p),
        art = furnitureArt(p)
      const profile: Profile | undefined =
        d.reaction?.kind === 'sway'
          ? { contact: 'curtain', sensor: d.reaction.sensor }
          : (rules.profiles as Record<string, Profile>)[p.item]
      if (!profile && !d.reaction) continue
      const view = {
        id: p.id,
        p,
        profile: profile ?? {},
        ...(d.motion?.length && d.reaction && art
          ? {
              native: {
                frames: d.motion,
                kind: d.reaction.kind,
                fps: d.reaction.fps,
                texture: art.texture,
                foreground: fronts.get(p.id),
              },
            }
          : {}),
        image: images.get(p.id),
        paint: this.scene.add.graphics().setDepth(p.y * 32 + 33),
      }
      this.views.push(view)
      if (profile?.sensor && profile.contact) {
        const [x, y, width, height] = profile.sensor,
          q = worldPoint(p, [x, y])
        this.effects.sensors.push({
          id: p.id,
          kind: profile.contact,
          bounds: { ...q, width, height },
        })
      }
    }
  }
  step(house: House, now: number, reduced: boolean) {
    for (const [id, tool] of this.tools)
      if (now - tool.seen > 1000) {
        tool.paint.destroy()
        this.tools.delete(id)
      }
    this.floor.clear()
    if (house.zone === 'yard')
      for (const [key, value] of Object.entries(house.objectStates ?? {})) {
        if (!key.startsWith('terrain:') || value.surface !== 'soil') continue
        const [x, y] = key.slice('terrain:'.length).split(',').map(Number)
        this.floor.fillStyle(0x8c6240).fillRect(x * 32, y * 32, 32, 32)
        this.floor
          .fillStyle(0xab8054)
          .fillRect(x * 32 + 3, y * 32 + 4, 8, 2)
          .fillRect(x * 32 + 18, y * 32 + 21, 9, 2)
      }
    for (const print of this.effects.footprints) {
      const age = now - print.born
      if (age > 12000) continue
      this.floor.fillStyle(0x527b7a, 0.36 * Math.max(0, 1 - age / 12000))
      const x = print.x + Math.cos(print.angle) * print.side * 3,
        y = print.y - Math.sin(print.angle) * print.side * 3
      this.floor.fillEllipse(Math.round(x), Math.round(y - 2), 3, 5)
    }
    for (const view of this.views) {
      const { profile, p, paint } = view,
        sway = this.effects.sway(p.id, now, reduced)
      paint.clear()
      if (view.native) {
        const n = view.native,
          index =
            n.kind === 'sway'
              ? Math.max(
                  0,
                  Math.min(
                    n.frames.length - 1,
                    Math.round(((sway + 1) / 2) * (n.frames.length - 1)),
                  ),
                )
              : reduced
                ? 0
                : Math.floor((now / 1000) * n.fps) % n.frames.length
        view.image?.setTexture(n.texture + ':motion:' + index)
        n.foreground?.setTexture(n.texture + ':motion:' + index + ':front')
        continue
      }
      if (profile.contact === 'bush') view.image?.setAngle(sway * 7)
      if (profile.cloth) {
        const [x, y, width, height] = profile.cloth,
          q = worldPoint(p, [x, y]),
          bend = Math.round(sway * 7)
        // The window frame never moves; only the two soft fabric panels do.
        for (const side of [-1, 1]) {
          const left = side < 0 ? q.x : q.x + width - 12
          paint.fillStyle(0x8e9e69).fillPoints(
            [
              { x: left, y: q.y },
              { x: left + 12, y: q.y },
              { x: left + 12 + bend, y: q.y + height },
              { x: left + bend, y: q.y + height },
            ],
            true,
          )
          paint
            .lineStyle(1, 0xc1d092)
            .lineBetween(left + 4, q.y + 2, left + 4 + bend, q.y + height - 2)
        }
      }
      if (profile.water) {
        const [x, y, width, height] = profile.water,
          q = worldPoint(p, [x, y])
        for (const fish of swimmingFish(
          { ...q, width, height },
          reduced ? 0 : now,
        )) {
          paint
            .fillStyle(Phaser.Display.Color.HexStringToColor(fish.color).color)
            .fillRect(fish.x - 2, fish.y - 1, 5, 3)
            .fillTriangle(
              fish.x - fish.facing * 2,
              fish.y,
              fish.x - fish.facing * 5,
              fish.y - 2,
              fish.x - fish.facing * 5,
              fish.y + 2,
            )
          paint
            .fillStyle(0x38271e)
            .fillRect(fish.x + fish.facing, fish.y - 1, 1, 1)
        }
      }
    }
  }
  equipped(id: string, point: { x: number; y: number }, tool: string) {
    let view = this.tools.get(id)
    if (!tool) {
      view?.paint.destroy()
      this.tools.delete(id)
      return
    }
    if (!view) {
      view = { paint: this.scene.add.graphics(), seen: 0 }
      this.tools.set(id, view)
    }
    view.seen = performance.now()
    const paint = view.paint.clear().setDepth(point.y + 2),
      x = Math.round(point.x + 11),
      y = Math.round(point.y)
    paint.fillStyle(0x785333).fillRect(x, y - 18, 2, 18)
    if (tool === 'shovel')
      paint.fillStyle(0x8b9995).fillRect(x - 2, y - 3, 6, 6)
    else {
      paint.fillStyle(0xb3643e).fillRect(x - 1, y - 5, 15, 6)
      paint
        .fillStyle(0x38271e)
        .fillRect(x, y, 4, 3)
        .fillRect(x + 10, y, 4, 3)
    }
  }
  reset() {
    this.effects.reset()
    this.floor.clear()
    for (const view of this.views) view.paint.destroy()
    this.views = []
    for (const view of this.tools.values()) view.paint.destroy()
    this.tools.clear()
  }
  destroy() {
    this.reset()
    this.floor.destroy()
  }
}
