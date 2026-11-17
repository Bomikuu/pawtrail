import data from './palettes/sofa.json'
import { decodePaletteMask, normalizePaletteColor, recolorUpholstery, upholsteryRamp, SOFA_DEFAULT_COLOR } from './palette-color'

export const SOFA_PALETTE_VIEWS = data.views

/** Eight reusable native canvases per preview. No per-color images/files or per-frame recolor. */
export class SofaPalette {
 color=SOFA_DEFAULT_COLOR
 private surfaces=new Map<string,{original:ImageData;mask:Uint8Array;canvas:HTMLCanvasElement}>()
 constructor(images:ReadonlyMap<string,HTMLImageElement>){
  for(const view of Object.values(data.views)){
   const mask=decodePaletteMask(view.runs,view.width*view.height,data.shades.length)
   for(const file of [view.file,view.foreground]){
    const image=images.get(file)
    if(!image||image.naturalWidth!==view.width||image.naturalHeight!==view.height)throw Error('Sofa palette sources do not match their native mask.')
    const canvas=document.createElement('canvas');canvas.width=view.width;canvas.height=view.height
    const context=canvas.getContext('2d',{willReadFrequently:true})!
    context.imageSmoothingEnabled=false;context.drawImage(image,0,0)
    const original=context.getImageData(0,0,view.width,view.height)
    for(let i=0;i<mask.length;i++)if(mask[i]&&original.data[i*4+3]){
     const expected=data.shades[mask[i]-1]
     if([0,1,2].some(c=>original.data[i*4+c]!==parseInt(expected.slice(1+c*2,3+c*2),16)))throw Error('Sofa artwork changed; refresh its upholstery mask before recoloring.')
    }
    this.surfaces.set(file,{original,mask,canvas})
   }
  }
 }
 setColor(value:string){
  const color=normalizePaletteColor(value)
  if(color===this.color)return
  const ramp=upholsteryRamp(color,data.shades)
  for(const surface of this.surfaces.values()){
   const original=surface.original
   const rgba=color===SOFA_DEFAULT_COLOR?new Uint8ClampedArray(original.data):recolorUpholstery(original.data,surface.mask,ramp)
   surface.canvas.getContext('2d')!.putImageData(new ImageData(rgba,original.width,original.height),0,0)
  }
  this.color=color
 }
 image(file:string){return this.surfaces.get(file)?.canvas}
 /** Non-destructive editor projection: painted source stays separate from material color. */
 recolorSurface(file:string,source:HTMLCanvasElement,output:HTMLCanvasElement){
  const surface=this.surfaces.get(file)
  if(!surface||source.width!==surface.original.width||source.height!==surface.original.height)throw Error('Sofa surface dimensions do not match its upholstery mask.')
  if(output.width!==source.width)output.width=source.width
  if(output.height!==source.height)output.height=source.height
  const pixels=source.getContext('2d')!.getImageData(0,0,source.width,source.height)
  // Explicit brush edits override the material overlay; never overwrite edited artwork.
  const mask=new Uint8Array(surface.mask)
  for(let i=0;i<mask.length;i++)if(mask[i]&&[0,1,2,3].some(c=>pixels.data[i*4+c]!==surface.original.data[i*4+c]))mask[i]=0
  const rgba=this.color===SOFA_DEFAULT_COLOR?pixels.data:recolorUpholstery(pixels.data,mask,upholsteryRamp(this.color,data.shades))
  output.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(rgba),source.width,source.height),0,0)
 }
 dispose(){this.surfaces.clear()}
}
