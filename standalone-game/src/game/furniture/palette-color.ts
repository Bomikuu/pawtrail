export type Rgb=readonly [number,number,number]
export const SOFA_DEFAULT_COLOR='#898a4a'
export function normalizePaletteColor(value:string){
 if(!/^#[0-9a-f]{6}$/i.test(value))throw Error('Choose a six-digit hex color, such as #376db7.')
 return value.toLowerCase()
}
const rgb=(hex:string):Rgb=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]
function hsl([r,g,b]:Rgb){
 r/=255;g/=255;b/=255
 const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2,d=max-min
 if(!d)return [0,0,l] as const
 const s=d/(1-Math.abs(2*l-1)),h=(max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)/6
 return [h,s,l] as const
}
function fromHsl(h:number,s:number,l:number):Rgb{
 const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h*6%2-1)),m=l-c/2
 const [r,g,b]=h<1/6?[c,x,0]:h<2/6?[x,c,0]:h<3/6?[0,c,x]:h<4/6?[0,x,c]:h<5/6?[x,0,c]:[c,0,x]
 return [r,g,b].map(v=>Math.round(Math.max(0,Math.min(1,v+m))*255)) as [number,number,number]
}
/** Preserve authored light/dark separation, including near-black/white colors. */
export function upholsteryRamp(color:string,shades:readonly string[]):Rgb[]{
 const normalized=normalizePaletteColor(color)
 if(normalized===SOFA_DEFAULT_COLOR)return shades.map(rgb)
 const [h,s,l]=hsl(rgb(normalized)),base=hsl(rgb(SOFA_DEFAULT_COLOR))[2],contrast=.4+.6*Math.sin(Math.PI*l)
 return shades.map(shade=>fromHsl(h,s,Math.max(0,Math.min(1,l+(hsl(rgb(shade))[2]-base)*contrast))))
}
export function decodePaletteMask(runs:readonly (readonly number[])[],pixels:number,shadeCount:number){
 const mask=new Uint8Array(pixels);let offset=0
 for(const [count,shade] of runs){
  if(!Number.isInteger(count)||count<1||!Number.isInteger(shade)||shade<0||shade>shadeCount||offset+count>pixels)throw Error('Invalid upholstery mask.')
  mask.fill(shade,offset,offset+count);offset+=count
 }
 if(offset!==pixels)throw Error('Upholstery mask dimensions do not match.')
 return mask
}
/** Copy-on-write: every unmasked RGBA byte, alpha and original buffer stays intact. */
export function recolorUpholstery(source:Uint8ClampedArray,mask:Uint8Array,ramp:readonly Rgb[]){
 if(source.length!==mask.length*4)throw Error('Upholstery mask dimensions do not match.')
 const output=new Uint8ClampedArray(source)
 for(let i=0;i<mask.length;i++){
  if(!mask[i]||!source[i*4+3])continue
  const color=ramp[mask[i]-1]
  if(!color)throw Error('Missing upholstery shade.')
  output[i*4]=color[0];output[i*4+1]=color[1];output[i*4+2]=color[2]
 }
 return output
}
