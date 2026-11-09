import type { ActorAppearance } from './appearance'
import { defaultAppearance } from './appearance'
import { gameAppearance } from './game-appearances'
import { SPEAKER_PORTRAITS } from '../characters'

const SIZE = 144, FRAMES = 96
type Art = { file: string; cut: number; eyes: [number, number, number, number]; eyeWidth: number; eyeHeight: number; appearance: ActorAppearance; glasses: boolean }
const folder = '/pawtrail-game/game-assets/dialogue-portraits/'
const authored = new Set(Object.keys(SPEAKER_PORTRAITS))
function choose(appearance: ActorAppearance, identity?: string): Art {
  const id = identity && authored.has(identity) ? identity
    : appearance.parts.hair === 'long'
      ? appearance.accessories.glasses ? 'glasses-rescuer' : 'maya'
      : appearance.parts.hair === 'spiky' || appearance.parts.hair === 'hero-spikes'
        ? 'male-red-gardener' : 'rescuer'
  const base = gameAppearance(id)?.appearance ?? defaultAppearance()
  return {
    file: id === 'rescuer' ? folder + 'illustrated-v2/trail-rescuer.png' : SPEAKER_PORTRAITS[id],
    cut: id === 'rescuer' ? .64 : .7,
    eyes: id === 'rescuer' ? [.387, .354, .539, .333] : [.46, .46, .63, .46],
    eyeWidth: id === 'rescuer' ? 13 : 9,
    eyeHeight: id === 'rescuer' ? 11 : 7,
    appearance: base,
    glasses: /glasses|blonde-rescuer|violet-rescuer|red-rescuer|male-violet/.test(id),
  }
}
const rgb = (hex: string) => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16))
const luminance = (color: number[]) => color[0] * .299 + color[1] * .587 + color[2] * .114

/** Authored 2D illustration with articulated head/torso layers; no 3D face render. */
export class IllustratedPortrait {
  private canvas = document.createElement('canvas')
  private context: CanvasRenderingContext2D
  private head = document.createElement('canvas')
  private body = document.createElement('canvas')
  private frames = new Map<number, ImageData>()
  private art: Art
  private cut: number
  private constructor(private appearance: ActorAppearance, identity?: string) {
    this.art = choose(appearance, identity)
    this.cut = Math.round(this.art.cut * SIZE)
    for (const canvas of [this.canvas, this.head, this.body]) { canvas.width = canvas.height = SIZE }
    const context = this.canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Illustrated portrait unavailable.')
    this.context = context
    context.imageSmoothingEnabled = false
  }
  static async create(appearance: ActorAppearance, identity?: string) {
    const portrait = new IllustratedPortrait(appearance, identity)
    try { await portrait.load(); return portrait }
    catch (error) { portrait.dispose(); throw error }
  }
  private async load() {
    const image = new Image()
    image.src = this.art.file
    await image.decode()
    const context = this.context
    context.drawImage(image, 0, 0, SIZE, SIZE)
    this.tint()
    const head = this.head.getContext('2d')!, body = this.body.getContext('2d')!
    head.imageSmoothingEnabled = body.imageSmoothingEnabled = false
    head.drawImage(this.canvas, 0, 0, SIZE, this.cut, 0, 0, SIZE, this.cut)
    body.drawImage(this.canvas, 0, this.cut - 3, SIZE, SIZE - this.cut + 3, 0, this.cut - 3, SIZE, SIZE - this.cut + 3)
    this.drawOutfit(body)
    this.drawHeadwear(head)
    this.drawFaceDetails(head)
  }
  private tint() {
    const data = this.context.getImageData(0, 0, SIZE, SIZE), pixels = data.data
    const original = this.art.appearance.colors, target = this.appearance.colors
    const roles = ['hair', 'skin', 'jacket', 'shirt', 'cream'] as const
    const ramps = roles.flatMap(role => [.68, .84, 1, 1.15].map(shade => ({ role, reference: rgb(original[role]).map(value => Math.min(255, value * shade)), color: rgb(target[role]) })))
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 128) { pixels[i + 3] = 0; continue }
      pixels[i + 3] = 255
      const color = [pixels[i], pixels[i + 1], pixels[i + 2]], light = luminance(color)
      if (light < 42) continue // Keep the illustrator's dark contour and pupils.
      const y = Math.floor(i / 4 / SIZE)
      let nearest: typeof ramps[number] | undefined, best = Infinity
      for (const ramp of ramps) {
        if (ramp.role === 'hair' && y >= this.cut || ramp.role === 'jacket' && y < this.cut - 7) continue
        const distance = color.reduce((sum, channel, j) => sum + (channel - ramp.reference[j]) ** 2, 0)
        if (distance < best) { best = distance; nearest = ramp }
      }
      if (!nearest || best > 5600 || original[nearest.role] === target[nearest.role]) continue
      const shade = Math.max(.48, Math.min(1.55, light / Math.max(1, luminance(rgb(original[nearest.role])))))
      nearest.color.forEach((value, j) => { pixels[i + j] = Math.min(255, Math.round(value * shade)) })
    }
    this.context.putImageData(data, 0, 0)
  }
  private polygon(context: CanvasRenderingContext2D, color: string, points: number[][], outline = true) {
    context.beginPath(); points.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y)); context.closePath()
    context.fillStyle = color; context.fill()
    if (outline) { context.strokeStyle = '#38271e'; context.lineWidth = 2; context.stroke() }
  }
  private drawOutfit(context: CanvasRenderingContext2D) {
    const a = this.appearance, c = a.colors, outfit = a.parts.outfit
    if (outfit === 'gown' || outfit === 'gi' || outfit === 'spacesuit') {
      const main = outfit === 'gown' ? c.gown : outfit === 'gi' ? c.orange : c.cream
      this.polygon(context, main, [[8,144],[17,119],[48,104],[63,110],[80,110],[95,104],[126,120],[139,144]])
      if (outfit === 'gown') {
        this.polygon(context, c.gownShade, [[48,105],[69,120],[95,105],[87,144],[55,144]], false)
        context.fillStyle = c.gold
        for (let x = 54; x < 91; x += 6) context.fillRect(x, 113 + Math.round(Math.sin((x - 54) / 37 * Math.PI) * 6), 3, 3)
      } else if (outfit === 'gi') {
        this.polygon(context, c.shirtDark, [[48,105],[70,124],[93,105],[79,144],[60,144]], false)
        context.strokeStyle = c.shirt; context.lineWidth = 3; context.beginPath(); context.moveTo(49,107); context.lineTo(79,144); context.stroke()
      } else {
        context.fillStyle = c.metalShade; context.fillRect(52,121,39,20)
        context.fillStyle = c.metal; context.fillRect(55,123,33,14)
        context.fillStyle = c.shirt; context.fillRect(58,126,15,7)
        context.fillStyle = c.gold; context.fillRect(79,127,4,4)
      }
    }
  }
  private drawHeadwear(context: CanvasRenderingContext2D) {
    const a = this.appearance, c = a.colors
    if (a.parts.headwear === 'wide-brim') {
      this.polygon(context, c.hat, [[30,29],[34,11],[54,3],[88,5],[106,23],[123,26],[127,36],[102,43],[26,43],[14,37],[16,31]])
      this.polygon(context, c.hatBand, [[31,24],[105,23],[110,30],[28,31]], false)
      context.fillStyle = c.cream; context.fillRect(48,10,24,3)
    } else if (a.parts.headwear === 'halo') {
      context.strokeStyle = c.ink; context.lineWidth = 7; context.beginPath(); context.ellipse(72,9,28,6,0,0,Math.PI*2); context.stroke()
      context.strokeStyle = c.gold; context.lineWidth = 4; context.stroke()
    } else if (a.parts.headwear === 'space-helmet') {
      context.strokeStyle = c.metalShade; context.lineWidth = 10; context.beginPath(); context.ellipse(72,60,53,55,0,0,Math.PI*2); context.stroke()
      context.strokeStyle = c.cream; context.lineWidth = 6; context.stroke()
      context.strokeStyle = c.gold; context.lineWidth = 3; context.beginPath(); context.ellipse(72,60,46,48,0,0,Math.PI*2); context.stroke()
    } else if (a.parts.headwear === 'hood') {
      context.strokeStyle = c.hoodShade; context.lineWidth = 7; context.beginPath(); context.moveTo(30,92); context.lineTo(22,53); context.quadraticCurveTo(24,5,72,4); context.quadraticCurveTo(120,8,119,53); context.lineTo(110,92); context.stroke()
      context.strokeStyle = c.hood; context.lineWidth = 4; context.stroke()
    }
    if (a.accessories.glasses && !this.art.glasses) {
      context.strokeStyle = c.ink; context.lineWidth = 2
      for (const [x,y] of [[this.art.eyes[0],this.art.eyes[1]],[this.art.eyes[2],this.art.eyes[3]]]) { context.beginPath(); context.ellipse(x * SIZE, y * SIZE, 11,10,0,0,Math.PI*2); context.stroke() }
      context.fillStyle = c.ink; context.fillRect(this.art.eyes[0]*SIZE+10,this.art.eyes[1]*SIZE-2,Math.max(2,(this.art.eyes[2]-this.art.eyes[0])*SIZE-20),2)
    }
  }
  private drawFaceDetails(context: CanvasRenderingContext2D) {
    const a = this.appearance, [leftX,leftY,rightX,rightY] = this.art.eyes
    for (const [x,y,color] of [[leftX,leftY,a.face.leftEye],[rightX,rightY,a.face.rightEye]] as const) {
      context.fillStyle=color; context.fillRect(Math.round(x*SIZE),Math.round(y*SIZE)+2,2,2)
    }
    const x=(leftX+rightX)/2*SIZE,y=(leftY+rightY)/2*SIZE+17
    context.fillStyle=a.face.marking
    if(a.accessories.facialHair==='mustache'){
      this.polygon(context,a.face.marking,[[x-9,y],[x-4,y-3],[x,y-1],[x+4,y-3],[x+9,y],[x+5,y+2],[x,y+1],[x-5,y+2]],false)
    }else if(a.accessories.facialHair==='goatee')this.polygon(context,a.face.marking,[[x-5,y+7],[x+5,y+7],[x+3,y+12],[x,y+14],[x-3,y+12]],false)
    if(a.accessories.faceMarking==='freckles')for(const side of [-1,1])for(const [dx,dy] of [[11,-3],[15,-2],[13,1]])context.fillRect(x+side*dx,y+dy,1,1)
    if(a.accessories.faceMarking==='beauty-mark')context.fillRect(x+12,y+5,2,2)
  }
  frame(index: number) {
    index = ((Math.floor(index) % FRAMES) + FRAMES) % FRAMES
    const cached = this.frames.get(index)
    if (cached) return cached
    const context = this.context, t = index / FRAMES * Math.PI * 2, a = this.appearance
    context.clearRect(0, 0, SIZE, SIZE)
    if (a.parts.wings !== 'none') {
      for (const side of [-1,1]) for (let feather = 0; feather < 4; feather++) {
        const x = 72 + side * (44 + feather * 4)
        this.polygon(context, feather%2?a.colors.feather:a.colors.featherShade, [[x,142],[x-side*7,107],[x+side*5,83+feather*6],[x+side*9,129]])
      }
    }
    context.save(); context.translate(0, Math.sin(t * 2) * .55); context.drawImage(this.body,0,0); context.restore()
    context.save(); context.translate(72 + Math.sin(t) * .8, this.cut - 2 + Math.sin(t*2)*.45); context.rotate(Math.sin(t)*.018); context.translate(-72,-this.cut+2)
    context.drawImage(this.head,0,0)
    const phase = index / FRAMES, blink = Math.max(0,1-Math.abs(phase-.34)/.022,1-Math.abs(phase-.82)/.022)
    if (blink > .3) {
      const [leftX,leftY,rightX,rightY] = this.art.eyes
      for (const [x,y] of [[leftX,leftY],[rightX,rightY]]) {
        const width=this.art.eyeWidth,height=this.art.eyeHeight
        context.fillStyle = a.colors.skin; context.fillRect(Math.round(x*SIZE-width/2),Math.round(y*SIZE-height/2),width,height)
        context.fillStyle = a.colors.ink; context.fillRect(Math.round(x*SIZE-width/2),Math.round(y*SIZE),width,2)
      }
    }
    context.restore()
    const result = context.getImageData(0,0,SIZE,SIZE)
    // Keep authored pixel edges crisp after the tiny cut-out head rotations.
    for (let i=3;i<result.data.length;i+=4) result.data[i] = result.data[i]>=128?255:0
    this.frames.set(index,result)
    return result
  }
  dispose() { this.frames.clear(); for (const canvas of [this.canvas,this.head,this.body]) canvas.width = canvas.height = 0 }
}
