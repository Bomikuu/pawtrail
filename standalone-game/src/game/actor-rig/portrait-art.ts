import type { ActorAppearance } from './appearance'

export type PortraitArt = { skin?: HTMLImageElement; hair?: HTMLImageElement }
const directory='/pawtrail-game/game-assets/dialogue-portraits/painted-v4/'
let pending:Promise<PortraitArt>|undefined
export function loadPortraitArt() {
  return pending??=(async()=>{
    const image=async(name:string)=>{try{const item=new Image();item.src=directory+name;await item.decode();return item}catch{return undefined}}
    const [skin,hair]=await Promise.all([image('skin-uv.png'),image('hair-uv.png')])
    return {skin,hair}
  })()
}
const channels=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))
const blend=(a:number[],b:number[],t:number)=>a.map((value,i)=>Math.round(value+(b[i]-value)*t))
/** Keep the painted value clusters while adapting the likeness to the saved colors. */
export function tintedPortraitArt(image:HTMLImageElement,a:ActorAppearance,kind:'skin'|'hair',width:number,height:number){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height
  const p=canvas.getContext('2d',{willReadFrequently:true})!;p.imageSmoothingEnabled=false;p.drawImage(image,0,0,width,height)
  const data=p.getImageData(0,0,width,height),d=data.data
  const c=a.colors,skin=channels(c.skin)
  const palette=kind==='hair'?[c.hairShade,c.hair,c.hairLight,c.hairSheen].map(channels):[blend(skin,channels('#803c2d'),.32),skin,blend(skin,channels('#ffd28b'),.38)]
  for(let i=0;i<d.length;i+=4){
    const value=d[i]*.299+d[i+1]*.587+d[i+2]*.114
    const t=Math.max(0,Math.min(.999,kind==='hair'?(value-20)/154:(value-85)/139))*(palette.length-1)
    const step=Math.floor(t),color=blend(palette[step],palette[Math.min(palette.length-1,step+1)],t-step)
    for(let j=0;j<3;j++)d[i+j]=color[j]
    d[i+3]=255
  }
  p.putImageData(data,0,0)
  return canvas
}

export function portraitPalette(a:ActorAppearance,art:PortraitArt){
  const counts=new Map<string,number>()
  for(const kind of ['skin','hair'] as const){
    if(!art[kind])continue
    const canvas=tintedPortraitArt(art[kind]!,a,kind,128,64),d=canvas.getContext('2d')!.getImageData(0,0,128,64).data
    for(let i=0;i<d.length;i+=4){const key='#'+[d[i],d[i+1],d[i+2]].map(value=>value.toString(16).padStart(2,'0')).join('');counts.set(key,(counts.get(key)??0)+1)}
  }
  return [...counts].sort((x,y)=>y[1]-x[1]).slice(0,56).map(([hex])=>hex)
}
