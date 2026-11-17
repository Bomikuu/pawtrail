import { FloorAnimationClock } from './animation-clock'

export type SceneryMotion = {
  kind: 'lights' | 'holo-head' | 'holo-koi' | 'fan' | 'cloth' | 'flow' | 'crane'
  lights?: boolean
  hook?: [number,number]
  cycleMs: number
  projectionBottom?: number
  rotor?: [number, number, number, number]
  rotors?: [number,number,number,number][]
  flow?: [number,number,number,number]
  atlas?: { file: string; cell: [number, number]; columns: number; rows: number }
}
export type ReflectionPatch = [number, number, number, number]
type Frame = { width: number; height: number }
type Mask = { source: HTMLCanvasElement; dark: HTMLCanvasElement }

/** Keyed native layers; source art is immutable and colliders never animate. */
export class SceneryMotionRenderer {
  readonly clock = new FloorAnimationClock()
  private masks = new Map<string, Mask>()
  private disposed = false
  private mask(image: HTMLImageElement, width: number, height: number): Mask {
    const key = image.src + ':' + width + ':' + height
    const cached = this.masks.get(key)
    if (cached) return cached
    const source = document.createElement('canvas'), dark = document.createElement('canvas')
    source.width = dark.width = width; source.height = dark.height = height
    const c = source.getContext('2d', { willReadFrequently: true })!, d = dark.getContext('2d')!
    c.imageSmoothingEnabled = false; c.drawImage(image, 0, 0, width, height)
    const pixels = c.getImageData(0, 0, width, height)
    for (let i = 0; i < pixels.data.length; i += 4) {
      const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2]
      const cyan = g > 105 && b > 115 && r < Math.max(g, b) * .86
      const magenta = r > 130 && b > 100 && g < Math.max(r, b) * .8
      const amber = r > 175 && g > 100 && b < g * .86
      if (!(cyan || magenta || amber)) pixels.data[i + 3] = 0
    }
    c.putImageData(pixels, 0, 0)
    d.drawImage(source, 0, 0); d.globalCompositeOperation = 'source-in'; d.fillStyle = '#10182e'; d.fillRect(0, 0, width, height)
    const mask = { source, dark }; this.masks.set(key, mask); return mask
  }
  /** Call once from the owning stage RAF, never once per object. */
  tick(time: number, visible: boolean, paused: boolean) { return this.clock.tick(time, visible, paused) }
  draw(c: CanvasRenderingContext2D, image: HTMLImageElement, frame: Frame, motion: SceneryMotion, instance: string, x: number, y: number, reducedMotion: boolean, atlas?: HTMLImageElement) {
    if (this.disposed) return
    const { width: w, height: h } = frame, p = this.clock.phase(instance, motion.cycleMs, reducedMotion), angle = p * Math.PI * 2
    c.save(); c.translate(x, y); c.imageSmoothingEnabled = false
    try {
      if(motion.kind==='crane'){c.drawImage(image,0,0,w,h);if(!reducedMotion){c.save();c.globalCompositeOperation='screen';c.globalAlpha=.12+.12*Math.sin(angle*2);c.drawImage(this.mask(image,w,h).source,0,0);c.restore()}if(atlas&&motion.atlas){const [cw,ch]=motion.atlas.cell,[hx,hy]=motion.hook??[w-20,10];c.save();c.translate(hx,hy);c.rotate(reducedMotion?0:Math.sin(angle)*.035);c.drawImage(atlas,Math.round(-cw/2),0,cw,ch);c.restore()}return}
      if (reducedMotion) { c.drawImage(image, 0, 0, w, h); return }
      if (motion.kind === 'cloth') {
        const roof = motion.projectionBottom ?? Math.round(h * .4)
        c.drawImage(image, 0, roof, w, h - roof, 0, roof, w, h - roof)
        for (let col = 0; col < w; col += 2) {
          const count = Math.min(2, w - col), tension = Math.sin(col / w * Math.PI)
          const offset = Math.round(Math.sin(angle + col / w * Math.PI) * 1.5 * tension)
          c.drawImage(image, col, 0, count, roof, col, offset, count, roof)
        }
        return
      }
      if (motion.kind === 'holo-koi' && atlas && motion.atlas) {
        const bottom = motion.projectionBottom ?? 96
        c.drawImage(image, 0, bottom, w, h - bottom, 0, bottom, w, h - bottom)
        const [cw, ch] = motion.atlas.cell
        for (let row = 0; row < motion.atlas.rows; row++) {
          const a = angle + row * Math.PI, frame = Math.floor(p * 16 + row * 2) % motion.atlas.columns
          const centerX = w / 2 + Math.cos(a) * w * .23, centerY = bottom * .48 + Math.sin(a) * 12
          c.save(); c.translate(Math.round(centerX), Math.round(centerY))
          c.scale(Math.sin(a) < 0 ? -1 : 1, 1)
          c.drawImage(atlas, frame * cw, row * ch, cw, ch, -cw / 2, -ch / 2, cw, ch); c.restore()
        }
        return
      }
      if (motion.kind === 'holo-head' || motion.kind === 'holo-koi') {
        const bottom = motion.projectionBottom ?? Math.round(h * .77)
        c.drawImage(image, 0, bottom, image.naturalWidth, image.naturalHeight - bottom, 0, bottom, w, h - bottom)
        // Re-project horizontal rows: the emitter stays fixed while tails/head
        // articulate, instead of bobbing/fading the whole picture.
        for (let row = 0; row < bottom; row += 2) {
          const count = Math.min(2, bottom - row), root = 1 - row / bottom
          const shift = motion.kind === 'holo-koi' ? Math.sin(angle + root * Math.PI * 3) * 2.4 * root : Math.sin(angle) * 2 * root + Math.sin(angle * 2 + root) * .45 * root
          c.drawImage(image, 0, row, image.naturalWidth, count, Math.round(shift), row, w, count)
        }
        const scan = Math.floor(p * bottom)
        c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = .38
        c.drawImage(image, 0, scan, image.naturalWidth, 2, 0, scan, w, 2)
        c.restore(); return
      }
      c.drawImage(image, 0, 0, w, h)
      if(motion.lights){c.save();c.globalCompositeOperation='screen';c.globalAlpha=.12+.10*Math.sin(angle);c.drawImage(this.mask(image,w,h).source,0,0);c.restore()}
      if (motion.kind === 'lights') {
        const mask = this.mask(image, w, h), banks = 5, bank = Math.floor(p * banks)
        c.globalAlpha = .28; c.drawImage(mask.dark, 0, 0)
        c.globalCompositeOperation = 'screen'; c.globalAlpha = .15 + .12 * (1 + Math.sin(angle))
        c.drawImage(mask.source, 0, 0)
        const top = Math.floor(bank * h / banks), height = Math.ceil(h / banks)
        c.globalAlpha = .65; c.drawImage(mask.source, 0, top, w, Math.min(height, h - top), 0, top, w, Math.min(height, h - top)); return
      }
      if(motion.kind==='flow'&&motion.flow){
        const[x,y,width,height]=motion.flow
        c.save();c.beginPath();c.rect(x,y,width,height);c.clip()
        for(let row=0;row<height;row+=2){const shift=Math.round(Math.sin(angle+row/13)*2);c.drawImage(image,x,y+row,width,Math.min(2,height-row),x+shift,y+row,width,Math.min(2,height-row))}
        c.restore();return
      }
      if (motion.kind === 'fan' && (motion.rotor||motion.rotors)) {
        for(const [cx, cy, rx, ry] of motion.rotors??[motion.rotor!]){
        c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.clip()
        c.translate(cx, cy); c.scale(1, ry / rx); c.rotate(angle)
        c.drawImage(image, cx - rx, cy - ry, rx * 2, ry * 2, -rx, -rx, rx * 2, rx * 2)
        c.restore()}; return
      }
    } finally { c.restore() }
  }
  reflections(c: CanvasRenderingContext2D, image: HTMLImageElement, patches: readonly ReflectionPatch[], instance: string, reducedMotion: boolean) {
    if (this.disposed || reducedMotion) return
    c.save(); c.imageSmoothingEnabled = false; c.globalCompositeOperation = 'screen'
    patches.forEach(([x, y, w, h], index) => {
      const phase = this.clock.phase(instance + ':' + index, 7000 + index * 370)
      const row = y + Math.floor(phase * Math.max(1, h - 3))
      c.globalAlpha = Math.sin(phase * Math.PI) * .22
      c.drawImage(image, x, row, w, Math.min(3, y + h - row), x, row, w, Math.min(3, y + h - row))
    })
    c.restore()
  }
  dispose() {
    this.disposed = true; this.clock.dispose()
    for (const mask of this.masks.values()) { mask.source.width = mask.dark.width = 1; mask.source.height = mask.dark.height = 1 }
    this.masks.clear()
  }
  reset() { this.clock.reset(); this.masks.clear() }
}
