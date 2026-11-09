import * as T from 'three'
import type { ActorAppearance } from './appearance'
import type { PortraitExpression } from './portrait-state'
import { tintedPortraitArt, type PortraitArt } from './portrait-art'

const W = 256, H = 128
function blendColor(a:string,b:string,t:number){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('')}
export function pixelTexture(canvas: HTMLCanvasElement) {
  const texture = new T.CanvasTexture(canvas)
  texture.colorSpace = T.SRGBColorSpace; texture.magFilter = texture.minFilter = T.NearestFilter
  texture.generateMipmaps = false
  return texture
}
/** Paint covers the entire UV surface; the profile is not a projected front PNG. */
export function paintSurface(paint: (context: CanvasRenderingContext2D) => void, width = W, height = H) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
  const context = canvas.getContext('2d')!
  context.imageSmoothingEnabled = false; paint(context)
  return pixelTexture(canvas)
}
export function clothTexture(a: ActorAppearance) {
  const c = a.colors, outfit = a.parts.outfit
  return paintSurface(p => {
    const base = outfit === 'gown' ? c.gown : outfit === 'gi' ? c.orange : outfit === 'spacesuit' ? c.cream : outfit === 'coat' ? c.hood : c.jacket
    p.fillStyle = base; p.fillRect(0,0,W,H)
    // Hand-authored broad folds, with small weave clusters rather than striping.
    for(let x=0;x<W;x+=4){
      const light=Math.cos((x/W-.5)*Math.PI*2)*.18-Math.sin(x/W*Math.PI*2)*.06
      p.fillStyle=blendColor(base,light>0?c.jacketLight:c.jacketDark,Math.abs(light));p.fillRect(x,0,4,H)
    }
    for(const [x,y] of [[42,44],[69,75],[88,26],[165,24],[190,69],[223,42]]){
      p.fillStyle=blendColor(base,c.jacketDark,.26);p.beginPath();p.moveTo(x,y);p.quadraticCurveTo(x-7,y+22,x-3,y+41);p.quadraticCurveTo(x+2,y+20,x+6,y+5);p.closePath();p.fill()
      p.strokeStyle=blendColor(base,c.jacketLight,.4);p.lineWidth=1;p.beginPath();p.moveTo(x+3,y+6);p.quadraticCurveTo(x,y+20,x+1,y+30);p.stroke()
    }
    p.fillStyle=blendColor(base,c.jacketLight,.23)
    for(let y=9;y<H;y+=5)for(let x=(y%3)*3;x<W;x+=11)if((x+y)%7<3)p.fillRect(x,y,1,1)
    if(!['gown','spacesuit'].includes(outfit)){
      p.fillStyle=c.shirt;p.beginPath();p.moveTo(107,0);p.lineTo(149,0);p.lineTo(134,128);p.lineTo(122,128);p.closePath();p.fill()
      p.fillStyle=blendColor(c.shirt,c.shirtLight,.5);p.beginPath();p.moveTo(124,29);p.quadraticCurveTo(118,64,125,104);p.lineTo(128,99);p.quadraticCurveTo(124,65,128,29);p.closePath();p.fill()
      p.strokeStyle=c.jacketDark;p.lineWidth=3;p.beginPath();p.moveTo(105,0);p.lineTo(120,128);p.moveTo(151,0);p.lineTo(136,128);p.stroke()
      for(const x of [100,144]){
        p.fillStyle=c.jacketDark;p.fillRect(x,50,13,25);p.fillStyle=base;p.fillRect(x+1,52,11,21)
        p.fillStyle=blendColor(base,c.jacketLight,.65);p.fillRect(x,50,13,6);p.fillStyle=c.jacketDark;p.fillRect(x+1,56,11,1)
        p.fillStyle=c.gold;p.fillRect(x+6,53,2,2);p.fillStyle=c.jacketLight
        for(let y=60;y<72;y+=3){p.fillRect(x+2,y,1,1);p.fillRect(x+10,y,1,1)}
      }
      for(const side of [-1,1]){
        p.fillStyle=c.jacketLight;p.beginPath();p.moveTo(128+side*23,0);p.lineTo(128+side*17,42);p.lineTo(128+side*9,25);p.lineTo(128+side*13,0);p.closePath();p.fill()
        p.strokeStyle=c.jacketDark;p.lineWidth=1;p.stroke()
      }
      if(outfit==='gi'){p.fillStyle=c.shirtDark;p.fillRect(101,0,9,53);p.fillRect(146,0,9,53)}
    }else if(outfit==='spacesuit'){
      p.fillStyle=c.metalShade;p.fillRect(111,58,35,33);p.fillStyle=c.metal;p.fillRect(113,60,31,28)
      p.fillStyle=c.shirt;p.fillRect(117,64,16,12);p.fillStyle=c.gold;p.fillRect(137,65,4,4)
    }else{p.strokeStyle=c.gold;p.lineWidth=2;p.beginPath();p.moveTo(106,5);p.quadraticCurveTo(128,36,150,5);p.stroke()}
    if(a.parts.backpack)for(const x of [92,155]){p.fillStyle=c.backpackDark;p.fillRect(x,0,9,H);p.fillStyle=c.backpack;p.fillRect(x+1,0,5,H);p.fillStyle=c.backpackLight;p.fillRect(x+2,10,1,77);p.fillStyle=c.leather;p.fillRect(x-1,39,11,7)}
  })
}
export function hairTexture(a: ActorAppearance, art:PortraitArt = {}) {
  if(art.hair)return pixelTexture(tintedPortraitArt(art.hair,a,'hair',128,256))
  const c = a.colors
  return paintSurface(p=>{
    p.fillStyle=c.hair;p.fillRect(0,0,64,64)
    for(let x=0;x<64;x+=8){
      const offset=(x/8)%3
      p.fillStyle=c.hairShade;p.fillRect(x+5,7+offset,2,49);p.fillRect(x+4,47,2,17)
      p.fillStyle=c.hairLight;p.fillRect(x,10+offset*4,3,12);p.fillRect(x+1,23+offset*4,2,18)
      p.fillStyle=c.hairSheen;p.fillRect(x,11+offset*4,2,4)
    }
  },64,64)
}

export class PortraitFace {
  readonly canvas = document.createElement('canvas')
  readonly texture: T.CanvasTexture
  private context: CanvasRenderingContext2D
  private painted?:HTMLCanvasElement
  constructor(private appearance: ActorAppearance, art:PortraitArt={}) {
    this.canvas.width=W;this.canvas.height=H;this.context=this.canvas.getContext('2d')!
    if(art.skin)this.painted=tintedPortraitArt(art.skin,appearance,'skin',W,H)
    this.texture=pixelTexture(this.canvas)
    this.paint('idle',0,0)
  }
  paint(expression: PortraitExpression, blink: number, mouth: number) {
    const p=this.context,c=this.appearance.colors,face=this.appearance.face
    if(this.painted)p.drawImage(this.painted,0,0)
    else{
      p.fillStyle=c.skin;p.fillRect(0,0,W,H)
      for(let x=0;x<W;x+=2){const angle=(x/W-.5)*Math.PI*2,shade=Math.cos(angle)*.6-Math.sin(angle)*.2;p.fillStyle=shade<0?c.skinShadow:shade>.5?c.skinLight:c.skin;p.fillRect(x,0,2,H)}
    }
    const happy=expression==='happy', smiling=happy||expression==='smile'
    // Glazed irises, expressive upper lids and painted lower-lid accents.
    for(const [x,eye,side] of [[109,face.rightEye,-1],[147,face.leftEye,1]] as const){
      p.save();p.globalAlpha=.24;p.fillStyle=c.blush;p.beginPath();p.ellipse(x+side*2,86,10,5,-side*.12,0,Math.PI*2);p.fill();p.restore()
      p.fillStyle=c.skinLight;p.fillRect(x-7,82,3,1);p.fillRect(x+3,89,4,1)
      p.strokeStyle=c.ink;p.lineWidth=2.2;p.lineCap='round'
      const h=(happy?8:19)*(1-blink)
      if(blink>.65||happy){p.beginPath();p.moveTo(x-9,70);p.quadraticCurveTo(x,smiling?61:73,x+8,69);p.stroke()}
      else{
        p.beginPath();p.moveTo(x-9,69);p.bezierCurveTo(x-8,56,x+8,57,x+9,67);p.bezierCurveTo(x+9,81,x-7,82,x-9,69);p.closePath();p.fillStyle=c.ink;p.fill()
        p.save();p.beginPath();p.ellipse(x,69,7,Math.max(1,h/2-1),-.04*side,0,Math.PI*2);p.clip()
        p.fillStyle=eye;p.fillRect(x-8,58,16,24)
        p.fillStyle=c.ink;p.beginPath();p.ellipse(x+.5,68,3.2,8,0,0,Math.PI*2);p.fill()
        p.save();p.globalAlpha=.4;p.fillStyle=c.hairLight;p.beginPath();p.ellipse(x,76,5,2.5,0,0,Math.PI*2);p.fill();p.restore()
        p.fillStyle=c.cream;p.fillRect(x-4,60,3,4);p.fillRect(x-1,61,2,2);p.fillRect(x+4,72,1,2)
        p.restore()
        p.strokeStyle=c.hairShade;p.lineWidth=1;p.beginPath();p.moveTo(x-8,82);p.quadraticCurveTo(x,85,x+7,81);p.stroke()
        if(this.appearance.parts.face==='soft'){
          p.strokeStyle=c.ink;p.lineWidth=2;p.beginPath();p.moveTo(x+side*7,61);p.lineTo(x+side*10,58);p.stroke()
        }
      }
      p.strokeStyle=c.hairShade;p.lineWidth=2.8;p.beginPath();p.moveTo(x-8,51-(smiling?2:0));p.quadraticCurveTo(x-1,47-(smiling?2:0),x+7,52);p.stroke()
      p.strokeStyle=c.hairLight;p.lineWidth=.8;p.beginPath();p.moveTo(x-6,49);p.lineTo(x-1,48);p.stroke()
    }
    p.strokeStyle=c.mouth;p.lineWidth=2;p.lineCap='round'
    if(mouth>.08){
      p.fillStyle=c.ink;p.beginPath();p.ellipse(128,98,smiling?9:6,2+mouth*8,0,0,Math.PI*2);p.fill()
      p.fillStyle=c.blush;p.fillRect(124,100+Math.round(mouth*3),8,2)
      if(smiling){p.fillStyle=c.cream;p.fillRect(122,92,12,2)}
    }else{p.beginPath();p.moveTo(smiling?117:120,96);p.quadraticCurveTo(128,smiling?105:100,smiling?139:136,95);p.stroke();p.strokeStyle=c.skinShadow;p.lineWidth=1;p.beginPath();p.moveTo(124,103);p.quadraticCurveTo(129,105,134,102);p.stroke();p.fillStyle=c.skinLight;p.fillRect(126,106,5,1)}
    p.fillStyle=face.marking
    if(this.appearance.accessories.facialHair==='mustache'){for(const side of [-1,1]){p.beginPath();p.ellipse(128+side*5,92,7,2.5,-side*.18,0,Math.PI*2);p.fill()}}
    if(this.appearance.accessories.facialHair==='goatee'){p.beginPath();p.moveTo(121,108);p.lineTo(135,108);p.lineTo(128,117);p.closePath();p.fill()}
    if(this.appearance.accessories.faceMarking==='freckles')for(const side of [-1,1])for(const [x,y] of [[12,86],[17,89],[15,83]])p.fillRect(128+side*x,y,1,1)
    if(this.appearance.accessories.faceMarking==='beauty-mark')p.fillRect(146,100,2,2)
    this.texture.needsUpdate=true
  }
}
