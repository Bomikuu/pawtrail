import * as T from 'three'

export type YaeSurface='face'|'half'|'closed'|'bodice'|'hair'|'sleeve'|'skirt'|'fringe'
let atlas:HTMLImageElement|undefined,loading:Promise<void>|undefined
export function loadYaeStudyTextures(){
  return loading??=(async()=>{const image=new Image();image.src='/pawtrail-game/actor-studio/yae-study-v1/painted-surfaces.png';try{await image.decode();atlas=image}catch(error){loading=undefined;throw error}})()
}
export function yaeTexture(surface:YaeSurface){
  if(!atlas)throw Error('Yae’s material atlas is not loaded.')
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=96
  const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false
  const cell={face:0,half:1,closed:2,bodice:3,hair:4,fringe:4,sleeve:5,skirt:5}[surface]
  c.drawImage(atlas,cell%3*64,Math.floor(cell/3)*64,64,64,0,0,64,96)
  if(surface==='skirt'){
    c.fillStyle='#8a204f';c.fillRect(0,0,64,96)
    for(let i=0;i<4;i++){
      c.fillStyle='#bd365f';c.fillRect(i*16+2,0,9,96)
      c.fillStyle='#db758a';c.fillRect(i*16+3,0,2,76)
    }
    c.fillStyle='#e0b879';c.fillRect(0,88,64,2)
  }
  if(surface==='fringe'){
    // Smaller highlight clusters follow the shorter swept forelocks.
    c.fillStyle='#e8a2b6';c.fillRect(11,10,8,7);c.fillRect(14,17,5,6)
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace
  texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;texture.userData.catCoat=true;texture.userData.studioSurface=surface
  return texture
}
