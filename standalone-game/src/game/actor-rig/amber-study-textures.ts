import * as T from 'three'

export type AmberSurface = 'hair' | 'face' | 'face-half' | 'face-closed' | 'bodice' | 'jacket' | 'cape' | 'boots' | 'shorts' | 'bow' | 'sleeve' | 'anime-face' | 'anime-half' | 'anime-closed' | 'hair-crown' | 'hair-fringe' | 'hair-lock'
let paintedAtlas:HTMLImageElement|undefined
let animeAtlas:HTMLImageElement|undefined
let loading:Promise<void>|undefined
export function loadAmberStudyTextures(){
  return loading??=(async()=>{const image=new Image(),face=new Image();image.src='/pawtrail-game/actor-studio/amber-study-v2/painted-surfaces.png';face.src='/pawtrail-game/actor-studio/amber-study-v3/anime-face.png';try{await Promise.all([image.decode(),face.decode()]);paintedAtlas=image;animeAtlas=face}catch(error){loading=undefined;throw error}})()
}

/** Painted pixel clusters live in UV space, not on a billboard over the model. */
export function amberTexture(surface: AmberSurface, colors: Record<string,string>) {
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=96
  const c=canvas.getContext('2d')!, C=colors
  c.imageSmoothingEnabled=false
  const rect=(color:string,x:number,y:number,w:number,h:number)=>{c.fillStyle=color;c.fillRect(x,y,w,h)}
  const poly=(color:string,points:number[][])=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
  if(surface==='hair'){
    rect(C.hair,0,0,64,96)
    poly(C.hairShade,[[0,0],[9,0],[14,26],[8,52],[18,78],[13,96],[0,96]])
    poly(C.hairLight,[[15,0],[32,0],[35,18],[27,35],[30,54],[22,72],[26,92],[19,96],[15,69],[19,45],[13,22]])
    poly(C.hairSheen,[[17,8],[29,5],[30,13],[21,26],[18,25]])
    poly(C.hairShade,[[42,0],[48,0],[43,23],[50,50],[42,75],[44,96],[36,96],[36,72],[42,49],[36,23]])
    poly(C.hairLight,[[53,0],[60,0],[57,25],[61,49],[54,77],[57,96],[50,96],[48,71],[54,48],[49,24]])
    rect(C.hairShade,0,89,64,7)
  }else if(surface==='face'){
    rect(C.skin,0,0,64,96)
    poly(C.skinShadow,[[0,0],[64,0],[64,22],[52,18],[43,25],[26,15],[12,25],[0,21]])
    poly(C.skinLight,[[8,28],[43,24],[51,37],[47,68],[39,85],[22,87],[9,62]])
    poly(C.skinShadow,[[56,18],[64,18],[64,96],[25,96],[20,89],[43,84],[52,69]])
    rect(C.blush,8,65,11,4);rect(C.blush,45,65,10,4)
    rect(C.skin,10,64,7,2);rect(C.skin,46,64,7,2)
  }else if(surface==='bodice'){
    rect(C.cream,0,0,64,96)
    poly(C.creamShadow,[[0,0],[9,0],[15,30],[13,64],[20,96],[0,96]])
    poly(C.shirtLight,[[16,9],[28,15],[26,44],[32,74],[28,95],[19,95],[19,58]])
    poly(C.creamShadow,[[49,0],[64,0],[64,96],[44,96],[50,63],[45,34]])
    for(const side of [-1,1]){
      poly(C.gold,[[32+side*24,8],[32+side*27,12],[32+side*10,38],[32+side*7,36]])
      poly(C.gold,[[32+side*9,43],[32+side*17,48],[32+side*12,59],[32+side*18,66],[32+side*11,80],[32+side*17,89],[32+side*13,94],[32+side*6,80],[32+side*10,66],[32+side*5,58]])
    }
    poly(C.gold,[[32,25],[36,32],[32,40],[28,32]])
    rect(C.gold,31,43,2,53)
  }else if(surface==='jacket'||surface==='cape'){
    rect(C.jacketDark,0,0,64,96)
    poly(C.jacket,[[7,0],[53,0],[58,96],[3,96]])
    poly(C.jacketLight,[[11,0],[21,0],[18,24],[25,51],[17,76],[21,96],[9,96],[11,70],[17,46],[11,24]])
    poly(C.jacketDark,[[35,0],[43,0],[37,30],[45,58],[39,96],[30,96],[36,59],[30,31]])
    rect(C.gold,2,0,2,96);rect(C.gold,60,0,2,96);rect(C.creamShadow,4,0,1,96)
    rect(C.gold,0,89,64,3);rect(C.creamShadow,0,92,64,1)
    if(surface==='cape')for(const x of [12,45]){
      poly(C.gold,[[x,72],[x+5,65],[x+10,72],[x+5,81]])
      poly(C.jacketDark,[[x+3,72],[x+5,69],[x+7,72],[x+5,76]])
    }
  }else if(surface==='sleeve'){
    rect(C.jacketDark,0,0,64,96)
    poly(C.jacket,[[8,0],[55,0],[58,77],[52,96],[10,96],[5,66]])
    poly(C.jacketLight,[[16,7],[25,2],[31,14],[25,31],[21,59],[24,80],[17,87],[14,55],[19,28]])
    poly(C.jacketDark,[[42,29],[49,20],[46,50],[51,68],[45,85],[39,77],[43,56]])
    // A curved cuff seam and short folds, rather than a rectangular gold panel.
    poly(C.gold,[[8,85],[19,88],[32,89],[45,88],[56,84],[57,87],[46,91],[32,92],[18,91],[7,88]])
    rect(C.creamShadow,18,88,10,1)
  }else if(surface==='boots'){
    rect(C.shoe,0,0,64,96);rect(C.jacketDark,0,0,64,34)
    poly(C.jacket,[[0,0],[45,0],[37,30],[19,47],[0,37]])
    poly(C.gold,[[5,29],[12,27],[31,43],[48,25],[53,31],[32,53]])
    poly(C.hairLight,[[10,55],[17,51],[19,83],[15,89],[10,83]])
    rect(C.shortsDark,42,35,22,61);rect(C.gold,7,5,50,2)
  }else if(surface==='shorts'){
    rect(C.shortsDark,0,0,64,96);rect(C.shorts,4,0,43,96)
    poly(C.shortsLight,[[10,4],[21,4],[18,52],[24,79],[16,95],[10,65]])
    rect(C.creamShadow,0,86,64,5);rect(C.cream,0,91,64,4)
    rect(C.gold,3,0,2,86)
  }else{
    rect(C.jacketDark,0,0,64,96);rect(C.ribbon,5,0,54,96)
    poly(C.jacketLight,[[8,4],[21,1],[37,48],[27,71],[21,45]])
    poly(C.creamShadow,[[0,0],[64,0],[64,8],[47,7],[43,16],[34,7],[0,9]])
    poly(C.gold,[[5,62],[59,48],[61,52],[6,67]])
    rect(C.jacketDark,43,18,5,65)
  }
  const cells:Partial<Record<AmberSurface,number>>={face:0,'face-half':1,'face-closed':2,bodice:3,hair:4,cape:5}
  const cell=cells[surface]
  if(paintedAtlas&&cell!==undefined){
    c.drawImage(paintedAtlas,(cell%3)*paintedAtlas.width/3,Math.floor(cell/3)*paintedAtlas.height/2,paintedAtlas.width/3,paintedAtlas.height/2,0,0,64,96)
  }
  if(surface.startsWith('hair-')){
    rect(C.hair,0,0,64,96)
    const crown=surface==='hair-crown',fringe=surface==='hair-fringe'
    // Distinct directional maps: crown rays, swept bangs, long tapered locks.
    for(let i=0;i<5;i++){
      const x=-5+i*16,bend=fringe?18:crown?i*3-7:4
      poly(C.hairShade,[[x,0],[x+5,0],[x+7+bend,38],[x+3+bend,70],[x+7+bend,96],[x+1+bend,96],[x-2+bend,67],[x+2+bend,38]])
      poly(C.hairLight,[[x+6,3],[x+13,1],[x+12+bend,30],[x+15+bend,58],[x+10+bend,85],[x+7+bend,92],[x+10+bend,58],[x+7+bend,29]])
      poly(C.hairSheen,[[x+7,12],[x+12,10],[x+11+bend*.5,25],[x+8+bend*.5,31]])
    }
    // Painted separations are internal edges; the sprite contour stays bold.
    rect(C.hairShade,0,0,3,96);rect(C.hairShade,61,0,3,96)
    rect(C.hairLight,4,18,2,49)
    poly(C.hairShade,[[0,87],[10,90],[18,85],[33,92],[46,87],[64,90],[64,96],[0,96]])
  }
  if(animeAtlas&&surface.startsWith('anime-')){
    const index=surface==='anime-face'?0:surface==='anime-half'?1:2
    c.drawImage(animeAtlas,index*animeAtlas.width/3,0,animeAtlas.width/3,animeAtlas.height,0,0,64,96)
  }
  const texture=new T.CanvasTexture(canvas)
  texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;texture.generateMipmaps=false
  // The shared rig disposer already owns painted model textures with this flag.
  texture.userData.catCoat=true;texture.userData.studioSurface=surface
  return texture
}
