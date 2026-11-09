import Phaser from 'phaser'
import art from './emote-art.json'
import { CarEmote } from './car-emote'
import {jetpackEnvelope,JETPACK_LAND_MS} from '../actor-rig/action-playback'
import { ActorActionAudio } from './action-audio'
import { ActorGroundShadow } from './actor-shadow'

export type EmoteEffect = 'sad' | 'happy' | 'angry' | 'dance' | 'float' | 'sleep' | 'tired' | 'heart' | 'surprised' | 'yarn' | 'laugh' | 'sick' | 'car' | 'power_up' | 'super_saiyan' | 'jetpack' | 'rescue_dash' | 'gentle_approach'
const colors = Object.fromEntries(Object.entries(art.palette).map(([key, value]) => [key, Number.parseInt(value.slice(1), 16)])) as Record<string, number>
const sprites = art.sprites as Record<string, string[]>
export const emoteEffect = (action: string): EmoteEffect | undefined => ({
  rescue_dash:'rescue_dash',gentle_approach:'gentle_approach',
  jetpack:'jetpack',jetpack_takeoff:'jetpack',jetpack_land:'jetpack',
  power_up: 'power_up', super_saiyan:'super_saiyan',
  sad: 'sad', cry: 'sad', crying: 'sad', happy: 'happy', cheer: 'happy',
  angry: 'angry', dance: 'dance', float: 'float', floating: 'float',
  sleep: 'sleep', sleepy: 'sleep', rest: 'sleep', tired: 'tired',
  pet: 'heart', petted: 'heart', petting: 'heart', being_petted: 'heart',
  surprised: 'surprised', play: 'yarn', yarn: 'yarn', roll_yarn: 'yarn',
  laugh: 'laugh', laughing: 'laugh', sick: 'sick', car: 'car', ride: 'car',
} as Record<string, EmoteEffect>)[action]

/** Pixel-only drawing shared by the normal actor binding and comparison field. */
export class ActorEmoteEffects {
  private back?: Phaser.GameObjects.Graphics
  private front?: Phaser.GameObjects.Graphics
  private current = ''
  private since = 0
  private last = 0
  private phaseAction=''
  private phaseSince=0
  private car?: CarEmote
  private sound: ActorActionAudio
  private shadow: ActorGroundShadow
  private silence = () => this.sound.stop()
  constructor(private scene: Phaser.Scene, private kind: 'player' | 'cat') {
    this.sound = new ActorActionAudio(kind)
    this.shadow = new ActorGroundShadow(scene, kind)
    scene.events.on(Phaser.Scenes.Events.PAUSE, this.silence)
    scene.events.on(Phaser.Scenes.Events.SLEEP, this.silence)
    scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.silence)
  }

  private stamp(graphics: Phaser.GameObjects.Graphics, name: string, x: number, y: number, scale = 1, tint?: number) {
    sprites[name].forEach((row, py) => [...row].forEach((pixel, px) => {
      const color = colors[pixel]
      if (color !== undefined) graphics.fillStyle(tint ?? color)
        .fillRect(Math.round(x) + px * scale, Math.round(y) + py * scale, scale, scale)
    }))
  }

  private thread(graphics: Phaser.GameObjects.Graphics, x: number, y: number, endX: number, endY: number) {
    // Integer Bresenham segments keep the loose yarn crisp at every heading.
    x = Math.round(x); y = Math.round(y); endX = Math.round(endX); endY = Math.round(endY)
    const dx = Math.abs(endX - x), dy = -Math.abs(endY - y)
    const sx = x < endX ? 1 : -1, sy = y < endY ? 1 : -1
    let error = dx + dy
    graphics.fillStyle(colors.v)
    while (true) {
      graphics.fillRect(x, y, 1, 1)
      if (x === endX && y === endY) break
      const twice = error * 2
      if (twice >= dy) { error += dy; x += sx }
      if (twice <= dx) { error += dx; y += sy }
    }
  }

  update(target: Phaser.GameObjects.Sprite, action: string, time: number, reduced = false, direction = 'down', headHeight?: number, soundEnabled = true) {
    this.shadow.update(target, action, time, reduced, direction)
    this.sound.update(target, action, time, soundEnabled)
    const effect = emoteEffect(action)
    const view = this.scene.cameras.main.worldView
    const catOnly = effect === 'heart' || effect === 'yarn'
    if (!effect || (catOnly && this.kind !== 'cat') || !target.visible || target.alpha <= 0 || target.x < view.x - 80 || target.x > view.right + 80 || target.y < view.y - 80 || target.y > view.bottom + 80) {
      this.back?.setVisible(false); this.front?.setVisible(false); this.current = ''
      this.car?.hide()
      return
    }
    if (!this.back) this.back = this.scene.add.graphics()
    if (!this.front) this.front = this.scene.add.graphics()
    this.back.vertexRoundMode = 'fullAuto'; this.front.vertexRoundMode = 'fullAuto'
    if(action!==this.phaseAction||time<this.last){this.phaseAction=action;this.phaseSince=time}
    if (effect !== this.current || time < this.last) { this.since = time; this.current = effect }
    this.last = time
    const elapsed = reduced ? 400 : time - this.since
    const t = elapsed / 1000
    if (effect === 'car') {
      this.car ??= new CarEmote(this.scene)
      this.car.update(target, elapsed, direction, reduced)
    } else this.car?.hide()
    const front = this.front, back = this.back
    const pixelScale=Number(target.getData('actorPixelDensity')??1)*Number(target.getData('actorBodyScale')??1)
    for (const [graphics, depth] of [[back, -.02], [front, .04]] as const) {
      graphics.clear().setVisible(true).setPosition(target.x, target.y)
        .setDepth(target.depth + depth).setScale(target.scaleX*pixelScale, target.scaleY*pixelScale).setAlpha(target.alpha)
    }
    const height = headHeight ?? (this.kind === 'player' ? 38 : 20)
    if(effect==='rescue_dash'){
      const headings=['down','down_right','right','up_right','up','up_left','left','down_left'],angle=Math.max(0,headings.indexOf(direction))*Math.PI/4
      const dx=Math.sin(angle),dy=Math.cos(angle)
      for(let i=0;i<(reduced?2:7);i++){
        const length=7+i*3,offset=i%2?-5:5,drift=reduced?0:Math.floor(t*12+i)%3
        const x=Math.round(-dx*length+dy*offset),y=Math.round(-12-dy*length-dx*offset)
        back.fillStyle(i%2?0xffcf70:0x86ccda,.8).fillRect(x,y,Math.abs(dx)>.5?5+drift:1,Math.abs(dy)>.5?4+drift:1)
      }
    }else if(effect==='gentle_approach'){
      const y=-height-8-(reduced?0:Math.round(Math.sin(t*2)))
      front.fillStyle(0x365e44).fillRect(-3,y-1,5,2).fillRect(-4,y+1,7,3).fillRect(-3,y+4,5,2).fillRect(1,y+5,1,3)
      front.fillStyle(0x91b86b).fillRect(-2,y,3,4).fillRect(-3,y+2,2,2)
      front.fillStyle(0xe6ecc5).fillRect(-2,y+1,1,2)
      for(const side of [-1,1])back.fillStyle(0x91b86b,.55).fillRect(side*9,Math.round(1+(reduced?0:Math.sin(t*2+side))),2,1)
    }else if(effect==='jetpack'){
      const phaseElapsed=Math.max(0,time-this.phaseSince),flight=jetpackEnvelope(action,phaseElapsed)
      const directions=['down','down_right','right','up_right','up','up_left','left','down_left']
      const yaw=Math.max(0,directions.indexOf(direction))*Math.PI/4
      const lift=(height>=54?6:8)*flight.lift*.94
      const bob=action==='jetpack'&&!reduced?Math.sin(phaseElapsed/1000*12/16*Math.PI*2)*.4:0
      for(const side of [-1,1]){
        const x=Math.round(side*7.8*Math.cos(yaw)-6.8*Math.sin(yaw))
        const z=-side*7.8*Math.sin(yaw)-6.8*Math.cos(yaw)
        const y=Math.round(-13*.94+z*.36-lift-bob)
        const layer=z>0?front:back
        const length=Math.max(0,Math.round((16+(reduced?0:Math.sin(t*12+side)*2))*flight.thrust))
        for(let row=0;row<length;row++){
          const width=row<3?2:row<length*.7?1:0
          const sway=reduced?0:Math.round(Math.sin(row*.8+t*9+side)*Math.min(1,row/8))
          layer.fillStyle(row<length*.65?0xf59a38:0xe66736).fillRect(x-width+sway,y+row,width*2+1,1)
          if(row<length*.75)layer.fillStyle(row<4?0xf6fbde:0xffe18a).fillRect(x+sway,y+row,1,1)
        }
        if(flight.thrust>.1)layer.fillStyle(0xfff0b1).fillRect(x-1,y-1,3,2)
      }
      // ActorGroundShadow keeps a single ground contact through all flight stages.
      if(action==='jetpack_land'&&phaseElapsed>JETPACK_LAND_MS*.45){
        const spread=(phaseElapsed/JETPACK_LAND_MS-.45)*14
        for(const side of [-1,1])for(let i=0;i<3;i++)front.fillStyle(i%2?0xe6ddbc:0xf5eccf,.65).fillRect(Math.round(side*(5+spread+i*2)),2-i%2,3,1)
      }
    }else if(effect==='power_up'||effect==='super_saiyan'){
      const superSaiyan=effect==='super_saiyan'
      // A stepped flame outline sits behind the body; sparks stay off the face.
      const pulse=reduced?1:.92+Math.sin(t*Math.PI*2)*.08
      const half=Math.round((superSaiyan?23:17)*pulse),top=-height-(superSaiyan?12:7)
      const outline=[[-half+2,2],[-half-4,-10],[-half+1,-18],[-half+1,-29],[-10,-33],[-11,top+10],[-4,top+13],[0,top],[5,top+12],[12,top+7],[11,-31],[half+2,-26],[half,-17],[half+5,-9],[half-2,2]]
      // Every visible stroke is an integer pixel. No full-screen flash or gradient.
      for(let i=0;i<outline.length;i++){
        const [x,y]=outline[i],[nx,ny]=outline[(i+1)%outline.length]
        const steps=Math.max(Math.abs(nx-x),Math.abs(ny-y),1)
        for(let j=0;j<=steps;j++){
          const px=Math.round(x+(nx-x)*j/steps),py=Math.round(y+(ny-y)*j/steps)
          back.fillStyle(0xd17c24,.9).fillRect(px-1,py-1,superSaiyan?4:3,superSaiyan?4:3)
          back.fillStyle(0xffda72).fillRect(px,py,superSaiyan?3:2,superSaiyan?3:2)
        }
      }
      back.fillStyle(0xffd66a,superSaiyan?.28:.17)
      for(let y=top+2;y<2;y++){
        const span=Math.round(half*Math.sin(Math.PI*(y-top)/(2-top))**.55)
        if(span>0)back.fillRect(-span,y,span*2,1)
      }
      back.fillStyle(0xffdf81,.85)
      for(let i=0;i<48;i++){const angle=i*Math.PI/24;back.fillRect(Math.round(Math.cos(angle)*(half+6)),Math.round(2+Math.sin(angle)*3),1,1)}
      for(let i=0;i<(reduced?3:superSaiyan?18:10);i++){
        const rise=reduced?.45:(t*.65+i*.137)%1,side=i%2?1:-1
        const x=Math.round(side*((superSaiyan?13:11)+(i%3)*4+Math.sin(i*2.1)*2)),y=Math.round(2-rise*(height+12))
        const layer=i%3===0?front:back
        layer.fillStyle(i%3===0?0xfff3be:0xffcb50).fillRect(x,y,1,i%2?3:2)
      }
      for(const side of [-1,1]){
        const phase=reduced?0:Math.floor(t*4)%3,baseX=side*(half+4),baseY=-height+12+phase*6
        front.fillStyle(0x9ddfe5).fillRect(baseX,baseY,2,4).fillRect(baseX-side*2,baseY+3,3,1).fillRect(baseX-side*2,baseY+4,1,3)
      }
      if(superSaiyan){
        // Long jagged paths visibly arc around the aura instead of tiny head marks.
        for(const side of [-1,1])for(let bolt=0;bolt<(reduced?1:2);bolt++){
          const drift=reduced?0:Math.floor(t*3+bolt)%3
          const x=side*(half+3+bolt*3),y=top+13+bolt*19
          const points=[[x,y],[x-side*5,y+7+drift],[x+side*2,y+8+drift],[x-side*6,y+17],[x-side*2,y+18],[x-side*8,y+26]]
          for(let i=0;i<points.length-1;i++){
            const [ax,ay]=points[i],[bx,by]=points[i+1],steps=Math.max(Math.abs(bx-ax),Math.abs(by-ay))
            for(let step=0;step<=steps;step++){
              const px=Math.round(ax+(bx-ax)*step/Math.max(1,steps)),py=Math.round(ay+(by-ay)*step/Math.max(1,steps))
              front.fillStyle(0x75cce5).fillRect(px-1,py-1,3,3)
              front.fillStyle(0xe5fcff).fillRect(px,py,1,1)
            }
          }
        }
        // A second stepped corona keeps the stronger form readable on pale ground.
        for(const side of [-1,1])for(let i=0;i<8;i++)back.fillStyle(0xffedac).fillRect(side*(half-5-i),top+17+i*4,1,3)
      }
      for(let i=0;i<(reduced?0:superSaiyan?7:4);i++){
        const phase=(t*.5+i*.23)%1
        back.fillStyle(0x896b45).fillRect(-18+i*12,Math.round(3-phase*9),2,2)
      }
    } else if (effect === 'car') {
      // Gentle road flecks make the wheel spin readable without moving the
      // player through navigation or implying that this is a driving command.
      for (let i = 0; i < (reduced ? 0 : 5); i++) {
        const phase = (t * .8 + i * .19) % 1
        back.fillStyle(colors.w).fillRect(Math.round(-36 + phase * 72), 19 + i % 2 * 5, 4, 1)
      }
    } else if (effect === 'laugh') {
      const bob = reduced ? 0 : Math.round(Math.sin(t * Math.PI * 4))
      this.stamp(front, 'laugh', -9, -height - 23 + bob)
      for (const side of [-1, 1]) {
        const drop = reduced ? .3 : (t * 1.8 + (side + 1) * .12) % 1
        front.fillStyle(colors.b).fillRect(side * 12, -height - 13 + Math.round(drop * 7), 2, 3)
        front.fillStyle(colors.y).fillRect(side * 15, -height - 20 + bob, 2, 1)
      }
    } else if (effect === 'sick') {
      const sway = reduced ? 0 : Math.round(Math.sin(t * Math.PI))
      this.stamp(front, 'sick', -9 + sway, -height - 23)
      for (let i = 0; i < (reduced ? 1 : 3); i++) {
        const drift = (t / 2 + i * .3) % 1
        front.fillStyle(colors.h).fillRect(8 + Math.round(drift * 5), -height + 10 - Math.round(drift * 6), 2, 1)
      }
    } else if (effect === 'sad') {
      const cloudY = -height - 18
      this.stamp(front, 'storm', -11, cloudY)
      for (let i = 0; i < (reduced ? 3 : 7); i++) {
        const phase = (t * 1.3 + i * .17) % 1
        front.fillStyle(0x78c8df).fillRect(-9 + i * 3, cloudY + 12 + Math.round(phase * 9), 1, 3)
      }
      for (const side of [-1, 1]) {
        const drop = reduced ? 1 : (t * 2 + (side + 1) * .2) % 1
        front.fillStyle(0x78c8df).fillRect(side * 3, Math.round(-height + 11 + drop * 5), 1, 2)
      }
    } else if (effect === 'happy') {
      const confetti = [0xf5c864, 0xef805a, 0x73b995, 0xb586d5, 0x57b4d2]
      for (let i = 0; i < (reduced ? 4 : 14); i++) {
        const phase = (t / 1.4 + i * .137) % 1
        const x = Math.round(Math.sin(i * 2.4) * (7 + phase * 9))
        const y = Math.round(-height - 9 + phase * (height + 12))
        front.fillStyle(confetti[i % confetti.length]).fillRect(x, y, i % 2 ? 1 : 2, i % 2 ? 2 : 1)
      }
    } else if (effect === 'angry') {
      this.stamp(front, 'angry', -9 + (reduced ? 0 : Math.round(Math.sin(t * 8))), -height - 23)
      // White steam accents separate the larger red scowl from foliage and roofs.
      front.fillStyle(colors.w).fillRect(-14, -height - 12, 3, 1).fillRect(12, -height - 15, 3, 1)
        .fillRect(-13, -height - 17, 2, 1).fillRect(12, -height - 8, 2, 1)
    } else if (effect === 'dance') {
      const bob = reduced ? 0 : Math.round(Math.sin(t * Math.PI * 2))
      this.stamp(front, 'disco', -5, -height - 12 + bob)
      const sparkles = [0xb586d5, 0x57b4d2, 0xf5c864, 0x73b995]
      for (let i = 0; i < (reduced ? 2 : 6); i++) {
        const phase = t * 1.2 + i
        const x = Math.round(Math.cos(phase) * 13), y = Math.round(-height - 2 + Math.sin(phase) * 7)
        front.fillStyle(sparkles[i % sparkles.length]).fillRect(x - 1, y, 3, 1).fillRect(x, y - 1, 1, 3)
      }
    } else if (effect === 'float') {
      const bob = reduced ? 0 : Math.round(Math.sin(t * Math.PI) * .8)
      // A wide, white, four-lobed cloud sits beneath the lifted body. Its front
      // lip remains visible rather than disappearing behind the actor's feet.
      this.stamp(back, 'fluffy', -15, -8 + bob)
      front.fillStyle(colors.h).fillRect(-11, 4 + bob, 23, 2)
      front.fillStyle(colors.c).fillRect(-13, 2 + bob, 5, 2).fillRect(9, 1 + bob, 5, 2)
        .fillRect(-20, 1 + bob, 3, 2).fillRect(18, -3 + bob, 3, 2)
    } else if (effect === 'heart') {
      const pulse = reduced ? 0 : Math.sin(t * Math.PI * 1.8)
      const name = pulse > .4 ? 'heartLarge' : pulse < -.4 ? 'heartSmall' : 'heart'
      const mask = sprites[name], x = -Math.floor(mask[0].length / 2), y = -height - 5 - mask.length
      this.stamp(front, name, x, y)
      front.fillStyle(colors.w).fillRect(-11, -height - 12, 3, 1).fillRect(11, -height - 9, 1, 3)
    } else if (effect === 'surprised') {
      const bounce = reduced ? 0 : -Math.round(Math.max(0, Math.sin(t * Math.PI * 2)) * 2)
      this.stamp(front, 'surprised', -9, -height - 23 + bounce)
      front.fillStyle(colors.o).fillRect(13, -height - 22 + bounce, 4, 9).fillRect(13, -height - 11 + bounce, 4, 4)
      front.fillStyle(colors.y).fillRect(14, -height - 21 + bounce, 2, 7).fillRect(14, -height - 10 + bounce, 2, 2)
    } else if (effect === 'yarn') {
      const headingX = direction.includes('left') ? -1 : direction.includes('right') ? 1 : 0
      const headingY = direction.includes('up') ? -1 : direction.includes('down') ? 1 : 0
      const rolling = action === 'roll_yarn'
      const roll = reduced ? 0 : Math.sin(t * Math.PI * 2) * (rolling ? 8 : 4)
      const x = Math.round((rolling ? 16 : headingX * 15) + (headingX ? roll * .4 : roll))
      const y = Math.round((rolling ? 2 : -10 + headingY * 13) + (headingX ? roll * .35 : 0))
      const layer = headingY < 0 ? back : front
      const turn = reduced ? 0 : Math.floor((t * 4) % 4)
      this.thread(layer, x - 1, y - 1, x - 10, y + 2)
      this.thread(layer, x - 10, y + 2, x - 14, y)
      this.thread(layer, x - 14, y, x - 17, y + 2)
      this.stamp(layer, turn ? 'yarn' + turn : 'yarn', x - 6, y - 12)
    } else if (effect === 'sleep') {
      const sleepHeight = this.kind === 'player' ? 14 : 9
      for (let i = 0; i < (reduced ? 2 : 4); i++) {
        const phase = (t / 2.4 + i * .22) % 1
        const x = 3 + Math.round(phase * 11), y = -sleepHeight - 4 - Math.round(phase * 13)
        this.stamp(front, 'z', x + 1, y + 1)
        this.stamp(front, 'z', x, y, 1, 0xfff2da)
      }
    } else if (effect === 'tired') {
      this.stamp(front, 'battery', -5, -height - 9)
      for (let i = 0; i < (reduced ? 1 : 3); i++) {
        const drift = (t / 2 + i * .3) % 1
        front.fillStyle(0xfff2da).fillRect(5 + Math.round(drift * 5), Math.round(-height + 12 - drift * 4), i ? 1 : 2, 1)
      }
    }
  }

  hide() {
    this.back?.setVisible(false); this.front?.setVisible(false); this.car?.hide()
    this.shadow.hide(); this.sound.stop()
  }

  destroy() {
    this.scene.events.off(Phaser.Scenes.Events.PAUSE, this.silence)
    this.scene.events.off(Phaser.Scenes.Events.SLEEP, this.silence)
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.silence)
    this.sound.stop(); this.shadow.destroy()
    this.back?.destroy(); this.front?.destroy(); this.car?.destroy(); this.back = undefined; this.front = undefined; this.car = undefined
  }
}
