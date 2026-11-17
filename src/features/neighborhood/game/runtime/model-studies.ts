import type { ModelStudyDefinition } from './model-study-definition'
import { creatorTemplates } from '../creator/state'
import { amberTexture, loadAmberStudyTextures, type AmberSurface } from '../actor-rig/amber-study-textures'
import { loadYaeStudyTextures, yaeTexture, type YaeSurface } from '../actor-rig/yae-study-textures'
import { yaeStudyAppearance } from '../actor-rig/yae-study-appearance'

const styleReferences=[
  {src:'/pawtrail-game/actor-studio/references/amber-rpg-style-1.png',alt:'Owner-provided pixel RPG reference with layered capes and ornate outfits'},
  {src:'/pawtrail-game/actor-studio/references/amber-rpg-style-2.png',alt:'Owner-provided pixel RPG reference for proportions and hair silhouettes'},
]
export const amberStudy:ModelStudyDefinition={
  id:'amber',name:'Amber',heading:'Amber’s model study.',
  description:'Compare the shoulder shape from front, three-quarter and side views. Both versions keep the approved head, feet and cape motion.',
  summary:'The left side keeps the previous shoulders. The right side has curved shoulder caps, slimmer tapered sleeves and fitted gold emblems. Both share the approved head, idle and walking animations.',
  sides:[{title:'Previous shoulders',description:'Approved head · previous sleeves'},{title:'Refined shoulders',description:'Sloped caps · tapered sleeves'}],
  creatorQuery:'?preview=actors&skin=amber-outrider',
  references:[...styleReferences,{src:'/pawtrail-game/actor-studio/references/amber-outrider.webp',alt:'Amber appearance reference'}],
  referenceNote:'The pixel references guide the style. Amber’s illustration guides her colors, goggles, rabbit ribbon and outfit.',
  textureDescription:'Top: crown, swept fringe, long locks and anime face. Bottom: bodice, fitted sleeve, cape and boots.',
  async load(){
    const [,rig]=await Promise.all([loadAmberStudyTextures(),import('../actor-rig/amber-study-rig')])
    const appearance=creatorTemplates.find(t=>t.id==='amber-outrider')?.appearance
    if(!appearance)throw Error('Amber’s appearance is unavailable.')
    return {id:'amber',name:'Amber',appearance,factories:[rig.createAmberHeadStudy,rig.createAmberShoulderStudy]}
  },
  paintTextures(canvas){
    const c=canvas.getContext('2d')!,appearance=creatorTemplates.find(t=>t.id==='amber-outrider')!.appearance
    c.imageSmoothingEnabled=false
    const surfaces:AmberSurface[]=['hair-crown','hair-fringe','hair-lock','anime-face','bodice','sleeve','cape','boots']
    surfaces.forEach((s,i)=>{const t=amberTexture(s,appearance.colors);c.drawImage(t.image as HTMLCanvasElement,i%4*64,Math.floor(i/4)*96);t.dispose()})
  },
}
export const amberVolumeStudy:ModelStudyDefinition={
  ...amberStudy,
  id:'amber-volume',heading:'Amber’s volume study.',
  description:'Compare the current Amber with fuller body and hair geometry. Use the side view to inspect depth, then check her front silhouette.',
  summary:'Both models share the same face, rig, walking cycle, camera and pixel resolution. The trial adds rounded torso and hip sections, fuller hair layers and dedicated side shading. It is not installed in the game roster.',
  sides:[{title:'Current Amber',description:'Approved face, shoulders and outfit'},{title:'Fuller volume trial',description:'Rounded body · layered hair depth'}],
  textureDescription:'Top: the existing crown, fringe, face and bodice maps. Bottom: new side/rear bodice, jacket, shorts and sleeve surfaces. These stay crisp at native pixel resolution.',
  async load(){
    const [,rig,volume]=await Promise.all([loadAmberStudyTextures(),import('../actor-rig/amber-study-rig'),import('../actor-rig/amber-volume-study')])
    const appearance=creatorTemplates.find(t=>t.id==='amber-outrider')?.appearance
    if(!appearance)throw Error('Amber’s appearance is unavailable.')
    return {id:'amber-volume',name:'Amber',appearance,factories:[rig.createAmberShoulderStudy,volume.createAmberVolumeStudy]}
  },
  paintTextures(canvas){
    return loadAmberStudyTextures().then(()=>import('../actor-rig/amber-volume-study')).then(({paintAmberVolumeTextures})=>{
      const appearance=creatorTemplates.find(t=>t.id==='amber-outrider')!.appearance
      paintAmberVolumeTextures(canvas,appearance)
    })
  },
}
export const yaeStudy:ModelStudyDefinition={
  id:'yae',name:'Yae Miko',heading:'Yae Miko’s model study.',
  description:'Yae’s own face proportions and soft jaw outline are the preferred version. The Amber-style experiment remains on the left for comparison.',
  summary:'Left: the optional Amber-style face trial. Right: Yae’s reference-specific face with the soft cheek-and-jaw outline. Both share her costume and animations.',
  sides:[{title:'Amber-style trial',description:'Optional shared-profile experiment'},{title:'Yae reference face',description:'Preferred Yae profile · soft contour'}],
  creatorQuery:'?preview=actors',
  references:[...styleReferences,{src:'/pawtrail-game/actor-studio/yae-study-v1/appearance-reference.webp',alt:'Owner-provided Yae Miko illustration used for hair, ears, ornaments and shrine clothing'}],
  referenceNote:'Her original illustration guides identity and costume; the approved pixel RPG references guide rendering. Sandals and the garment’s rear construction are interpretations where the supplied crop does not show them.',
  textureDescription:'Top: open eyes, half blink, closed eyes and long hair. Bottom: swept fringe, ivory bodice, embroidered sleeve and crimson skirt.',
  async load(){
    const [,rig]=await Promise.all([loadYaeStudyTextures(),import('../actor-rig/yae-study-rig')])
    return {id:'yae',name:'Yae Miko',appearance:yaeStudyAppearance(),factories:[rig.createYaeAmberStyleStudy,rig.createYaeStudy]}
  },
  paintTextures(canvas){
    const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false
    const surfaces:YaeSurface[]=['face','half','closed','hair','fringe','bodice','sleeve','skirt']
    surfaces.forEach((s,i)=>{const t=yaeTexture(s);c.drawImage(t.image as HTMLCanvasElement,i%4*64,Math.floor(i/4)*96);t.dispose()})
  },
}
