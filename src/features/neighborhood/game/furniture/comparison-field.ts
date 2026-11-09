import { PixelActor, humanClips } from '../actor-rig/pixel-renderer'
import type { ActorAppearance } from '../actor-rig/appearance'
import catalog from '../housing/catalog.json'
import type { Furniture } from '../housing/types'
import {
  ContactEffects,
  ContactMotor,
  type ContactPoint,
  type ContactRect,
} from './contacts'

export type FieldOptions = {
  running: boolean
  rain: boolean
  tool: 'none' | 'shovel' | 'lawn-mower'
  geometry: boolean
  paused: boolean
  reduced: boolean
}
const items = (catalog as unknown as { items: Furniture[] }).items
const fieldItems = [
  { id: 'curtain-passage', key: 'curtain', x: 104, y: 107 },
  { id: 'aquarium', key: 'aquarium', x: 231, y: 127 },
].map((p) => ({ ...p, def: items.find((item) => item.id === p.id)! }))
const translated = (p: (typeof fieldItems)[number], r: number[]) => ({
  x: p.x + r[0] - p.def.anchor[0],
  y: p.y + r[1] - p.def.anchor[1],
  width: r[2],
  height: r[3],
})
const solids: ContactRect[] = [
  { x: 194, y: 46, width: 80, height: 10 },
  ...fieldItems.flatMap((p) =>
    p.def.geometry.ground.map((r) => translated(p, r)),
  ),
]
const curtain = fieldItems[0]
const sensor = [
  {
    id: 'bush',
    kind: 'bush' as const,
    bounds: { x: 54, y: 176, width: 28, height: 18 },
  },
  {
    id: 'curtain',
    kind: 'curtain' as const,
    bounds: translated(
      curtain,
      curtain.def.reaction?.sensor ?? [12, 48, 40, 22],
    ),
  },
]
const foot = (p: ContactPoint) => ({
  x: p.x - 5,
  y: p.y - 6,
  width: 10,
  height: 6,
})
const overlaps = (a: ContactRect, b: ContactRect) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y

/** Local authoring field; shared contacts, no housing API, inventory or rewards. */
export class FurnitureField {
  private actor: PixelActor
  private actorCanvas = document.createElement('canvas')
  private effects = new ContactEffects()
  private motor = new ContactMotor()
  private position = { x: 145, y: 144 }
  private direction = 'down'
  private keys = new Set<string>()
  private touch = { x: 0, y: 0 }
  private soil = new Set<string>()
  private images = new Map<string, HTMLImageElement>()
  private frame = 0
  private previous = 0
  private lastDraw = 0
  private wetUntil = 0
  private stopped = false
  private impact = 0
  private error = false
  private digUntil = 0
  constructor(
    private canvas: HTMLCanvasElement,
    appearance: ActorAppearance,
    private options: () => FieldOptions,
    private notice: (message: string) => void,
  ) {
    this.actor = new PixelActor(appearance)
    this.actorCanvas.width = 64
    this.actorCanvas.height = 80
    canvas.width = 288
    canvas.height = 240
    this.effects.sensors = sensor
    const files: Record<string, string> = {
      bush: '/assets/game/community/bush.png',
    }
    for (const p of fieldItems) {
      const view = p.def.styles?.[0].views['0']
      files[p.key] = p.def.file
      for (const [index, frame] of (view?.motion ?? []).entries())
        files[p.key + '-' + index] = frame.file
    }
    for (const [key, file] of Object.entries(files)) {
      const image = new Image()
      image.onload = () => {
        if (!this.stopped) this.images.set(key, image)
      }
      image.onerror = () => {
        if (!this.stopped)
          this.notice(
            'A model image could not load. Reopen the field to retry.',
          )
      }
      image.src = file
    }
    canvas.addEventListener('keydown', this.down)
    canvas.addEventListener('keyup', this.up)
    canvas.addEventListener('blur', this.blur)
    document.addEventListener('visibilitychange', this.blur)
    this.frame = requestAnimationFrame(this.tick)
  }
  input(x: number, y: number) {
    this.touch = { x, y }
  }
  reset() {
    this.position = { x: 145, y: 144 }
    this.soil.clear()
    this.effects.reset()
    this.effects.sensors = sensor
    this.motor.reset()
    this.wetUntil = 0
    this.blur()
    this.notice('Field reset. All changes here are local to this preview.')
  }
  private down = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase()
    if (
      [
        'w',
        'a',
        's',
        'd',
        'arrowup',
        'arrowdown',
        'arrowleft',
        'arrowright',
        'shift',
        'e',
      ].includes(key)
    ) {
      event.preventDefault()
      this.keys.add(key)
    }
    if (key === 'e' && !event.repeat) this.dig()
  }
  private up = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase())
  }
  private blur = () => {
    this.keys.clear()
    this.touch = { x: 0, y: 0 }
    this.previous = 0
  }
  private clear = (p: ContactPoint) =>
    p.x > 9 &&
    p.x < 279 &&
    p.y > 33 &&
    p.y < 230 &&
    !solids.some((r) => overlaps(foot(p), r))
  dig() {
    if (this.options().paused) return
    if (this.options().tool !== 'shovel') {
      this.notice('Choose the shovel, face grass, then press E or Dig.')
      return
    }
    const dx = this.direction.includes('left')
        ? -1
        : this.direction.includes('right')
          ? 1
          : 0,
      dy = this.direction.includes('up')
        ? -1
        : this.direction.includes('down')
          ? 1
          : 0
    const point = { x: this.position.x + dx * 25, y: this.position.y + dy * 25 }
    if (point.y < 160 || point.y >= 224 || !this.clear(point)) {
      this.notice('Face an open grass tile in the lower garden.')
      return
    }
    this.soil.add(Math.floor(point.x / 32) + ',' + Math.floor(point.y / 32))
    this.digUntil = performance.now() + 700
    this.notice('Shovel: grass changed to soil in this preview.')
  }
  private tick = (now: number) => {
    if (this.stopped) return
    this.frame = requestAnimationFrame(this.tick)
    if (document.hidden) return
    const dt = this.previous ? Math.min(40, now - this.previous) : 16
    this.previous = now
    const options = this.options()
    let x =
      Number(this.keys.has('d') || this.keys.has('arrowright')) -
      Number(this.keys.has('a') || this.keys.has('arrowleft')) +
      this.touch.x
    let y =
      Number(this.keys.has('s') || this.keys.has('arrowdown')) -
      Number(this.keys.has('w') || this.keys.has('arrowup')) +
      this.touch.y
    const running = options.running || this.keys.has('shift'),
      length = Math.hypot(x, y)
    x /= Math.max(1, length)
    y /= Math.max(1, length)
    if (!options.paused) {
      const speed = running ? 155 : 88
      this.position = this.motor.move(
        this.position,
        { x: (x * speed * dt) / 1000, y: (y * speed * dt) / 1000 },
        this.clear,
        running,
        now,
        dt,
      )
      if (length)
        this.direction =
          Math.abs(x) > 0.4 && Math.abs(y) > 0.4
            ? (y < 0 ? 'up_' : 'down_') + (x < 0 ? 'left' : 'right')
            : Math.abs(x) > Math.abs(y)
              ? x < 0
                ? 'left'
                : 'right'
              : y < 0
                ? 'up'
                : 'down'
      if (this.motor.impacts !== this.impact) {
        this.impact = this.motor.impacts
        this.notice('Solid contact: short knockback. The wall stays solid.')
      }
      const outdoors = this.position.y >= 160
      if (options.rain && outdoors) this.wetUntil = now + 45000
      this.effects.observe(
        'preview',
        this.position,
        running,
        now < this.wetUntil,
        !outdoors,
        now,
      )
      if (
        options.tool === 'lawn-mower' &&
        length &&
        outdoors &&
        this.position.y < 224
      )
        this.soil.add(
          Math.floor(this.position.x / 32) +
            ',' +
            Math.floor(this.position.y / 32),
        )
    }
    if (now - this.lastDraw < 50) return
    this.lastDraw = now
    try {
      this.draw(now, !!length && !options.paused, running, options)
    } catch {
      if (!this.error) {
        this.error = true
        this.notice(
          'The field renderer was interrupted. Reopen the page to retry.',
        )
      }
      this.stopped = true
      cancelAnimationFrame(this.frame)
    }
  }
  private draw(
    now: number,
    moving: boolean,
    running: boolean,
    options: FieldOptions,
  ) {
    const c = this.canvas.getContext('2d')!
    c.imageSmoothingEnabled = false
    c.clearRect(0, 0, 288, 240)
    c.fillStyle = '#ead9b9'
    c.fillRect(0, 0, 288, 160)
    c.fillStyle = '#d7c29f'
    for (let x = 0; x < 288; x += 32)
      for (let y = 0; y < 160; y += 16) c.fillRect(x, y, 1, 16)
    c.fillStyle = '#7d9a4e'
    c.fillRect(0, 160, 288, 80)
    c.fillStyle = '#99b365'
    for (let x = 4; x < 288; x += 16)
      for (let y = 164; y < 240; y += 16) c.fillRect(x + (y % 3), y, 2, 3)
    for (const cell of this.soil) {
      const [x, y] = cell.split(',').map(Number)
      c.fillStyle = '#926843'
      c.fillRect(x * 32, y * 32, 32, 32)
      c.fillStyle = '#b48a59'
      c.fillRect(x * 32 + 4, y * 32 + 8, 9, 2)
      c.fillRect(x * 32 + 19, y * 32 + 23, 6, 2)
    }
    for (const print of this.effects.footprints) {
      c.globalAlpha = 0.42 * Math.max(0, 1 - (now - print.born) / 12000)
      c.fillStyle = '#497a7e'
      c.save()
      c.translate(print.x, print.y)
      c.rotate(-print.angle)
      c.fillRect(print.side * 3, -3, 2, 5)
      c.restore()
    }
    c.globalAlpha = 1
    c.fillStyle = '#4d3425'
    c.fillRect(194, 30, 80, 26)
    c.fillStyle = '#bd8c5b'
    c.fillRect(196, 32, 76, 20)
    c.fillStyle = '#e0bd84'
    c.fillRect(198, 34, 72, 3)
    const objects = [
      { y: 107, draw: () => this.curtain(c, now, options) },
      { y: 127, draw: () => this.aquarium(c, now, options) },
      { y: 188, draw: () => this.bush(c, now, options) },
      {
        y: this.position.y,
        draw: () => this.character(c, now, moving, running),
      },
    ]
    for (const object of objects.sort((a, b) => a.y - b.y)) object.draw()
    if (options.rain) {
      c.fillStyle = '#a1c9d7'
      for (let i = 0; i < 20; i++) {
        const x = (i * 37) % 288,
          y =
            160 +
            ((options.reduced || options.paused ? i * 13 : now / 9 + i * 13) %
              80)
        c.fillRect(x, y, 1, 4)
      }
    }
    if (options.geometry) {
      c.lineWidth = 1
      c.strokeStyle = '#bf492e'
      for (const r of solids)
        c.strokeRect(r.x + 0.5, r.y + 0.5, r.width, r.height)
      c.strokeStyle = '#34756c'
      for (const s of sensor)
        c.strokeRect(
          s.bounds.x + 0.5,
          s.bounds.y + 0.5,
          s.bounds.width,
          s.bounds.height,
        )
      c.strokeStyle = '#35627d'
      const f = foot(this.position)
      c.strokeRect(f.x + 0.5, f.y + 0.5, f.width, f.height)
    }
    c.fillStyle = '#38271e'
    c.font = 'bold 10px "Saira Condensed"'
    c.fillText('CURTAIN', 83, 37)
    c.fillText('AQUARIUM', 214, 60)
    c.fillText('SOLID WALL', 208, 24)
    c.fillText('GARDEN', 7, 154)
    c.fillStyle = '#fff8e9'
    c.fillRect(0, 0, 188, 17)
    c.fillStyle = '#38271e'
    c.font = '9px "Instrument Sans"'
    c.fillText(
      (now < this.wetUntil
        ? 'Wet · ' + Math.ceil((this.wetUntil - now) / 1000) + 's'
        : 'Dry') +
        ' · ' +
        (options.tool === 'none'
          ? 'Empty hands'
          : options.tool === 'shovel'
            ? 'Shovel'
            : 'Mower') +
        ' · Soil ' +
        this.soil.size,
      6,
      11,
    )
  }
  private character(
    c: CanvasRenderingContext2D,
    now: number,
    moving: boolean,
    running: boolean,
  ) {
    const action =
        now < this.digUntil && !moving
          ? 'pick_up'
          : moving
            ? running
              ? 'run'
              : 'walk'
            : 'idle',
      clip = humanClips[action] ?? humanClips.idle,
      count = clip.frames ?? 8
    this.actorCanvas
      .getContext('2d')!
      .putImageData(
        this.actor.frame(
          action,
          this.direction,
          Math.floor((now / 1000) * clip.fps) % count,
        ),
        0,
        0,
      )
    c.fillStyle = '#38271e'
    c.globalAlpha = 0.17
    c.beginPath()
    c.ellipse(this.position.x, this.position.y - 1, 9, 3, 0, 0, Math.PI * 2)
    c.fill()
    c.globalAlpha = 1
    c.drawImage(
      this.actorCanvas,
      Math.round(this.position.x - 32),
      Math.round(this.position.y - 60),
    )
    if (this.options().tool !== 'none') {
      c.fillStyle = '#785333'
      c.fillRect(
        Math.round(this.position.x + 10),
        Math.round(this.position.y - 18),
        2,
        18,
      )
      c.fillStyle = this.options().tool === 'shovel' ? '#8b9995' : '#b3643e'
      c.fillRect(
        Math.round(this.position.x + 7),
        Math.round(this.position.y - 3),
        this.options().tool === 'shovel' ? 7 : 14,
        5,
      )
    }
  }
  private bush(
    c: CanvasRenderingContext2D,
    now: number,
    options: FieldOptions,
  ) {
    const image = this.images.get('bush')
    if (!image) return
    c.save()
    c.translate(68, 188)
    c.rotate(
      this.effects.sway('bush', now, options.reduced || options.paused) * 0.11,
    )
    c.drawImage(image, -16, -32)
    c.restore()
  }
  private nativeObject(
    c: CanvasRenderingContext2D,
    key: string,
    now: number,
    options: FieldOptions,
  ) {
    const p = fieldItems.find((item) => item.key === key)!,
      motion = p.def.styles?.[0].views['0'].motion ?? []
    const index =
      key === 'curtain'
        ? Math.max(
            0,
            Math.min(
              motion.length - 1,
              Math.round(
                ((this.effects.sway(
                  'curtain',
                  now,
                  options.reduced || options.paused,
                ) +
                  1) /
                  2) *
                  (motion.length - 1),
              ),
            ),
          )
        : options.reduced || options.paused
          ? 0
          : Math.floor((now / 1000) * (p.def.reaction?.fps ?? 6)) %
            Math.max(1, motion.length)
    const image = this.images.get(key + '-' + index) ?? this.images.get(key)
    if (image) c.drawImage(image, p.x - p.def.anchor[0], p.y - p.def.anchor[1])
  }
  private curtain(
    c: CanvasRenderingContext2D,
    now: number,
    options: FieldOptions,
  ) {
    this.nativeObject(c, 'curtain', now, options)
  }
  private aquarium(
    c: CanvasRenderingContext2D,
    now: number,
    options: FieldOptions,
  ) {
    this.nativeObject(c, 'aquarium', now, options)
  }
  dispose() {
    this.stopped = true
    cancelAnimationFrame(this.frame)
    this.canvas.removeEventListener('keydown', this.down)
    this.canvas.removeEventListener('keyup', this.up)
    this.canvas.removeEventListener('blur', this.blur)
    document.removeEventListener('visibilitychange', this.blur)
    for (const image of this.images.values()) {
      image.onload = null
      image.onerror = null
    }
    this.actor.dispose()
    this.effects.reset()
    this.motor.reset()
  }
}
