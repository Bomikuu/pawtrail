import type { ActorAppearance } from '../actor-rig/appearance'
import type { Rig } from '../actor-rig/rigs'
import { PHOTO_PORTRAIT_STYLES } from '../actor-rig/photo-portrait-catalog'

export type CreatorPreviewModel='shared'|'amber'|'yae'|'sieg'|'sieghart'|'aurelia'|'rika'|'peony'|'mira'
const factories:Partial<Record<CreatorPreviewModel,(appearance:ActorAppearance)=>Rig>>={}
const portraitCollections:Partial<Record<CreatorPreviewModel,string>>={amber:'amber-refined-cel',yae:'yae-miko-refined-cel',sieg:'sieg-refined-cel',sieghart:'sieghart-refined-cel',aurelia:'aurelia-weiss-refined-cel',rika:'rika-hoshino-refined-cel',peony:'rika-hoshino-refined-cel',mira:'mira-adler-refined-cel'}
export function creatorPortraitChoices(model:CreatorPreviewModel){
  const ids=model==='sieghart'?['sieghart-refined-cel','sieghart-painterly']:[portraitCollections[model]]
  return ids.flatMap(id=>{const entry=PHOTO_PORTRAIT_STYLES.find(style=>style.id===id);return entry?[entry]:[]})
}
export function creatorPortraitCollection(model:CreatorPreviewModel,preferred?:string){
  const choices=creatorPortraitChoices(model)
  return choices.find(style=>style.id===preferred)?.id??choices[0]?.id??portraitCollections[model]
}
export async function prepareCreatorModel(model:CreatorPreviewModel){
  if(model==='shared'||factories[model])return
  if(model==='amber'){
    const [textures,rig]=await Promise.all([import('../actor-rig/amber-study-textures'),import('../actor-rig/amber-study-rig')])
    await textures.loadAmberStudyTextures();factories.amber=rig.createAmberShoulderStudy
  }else if(model==='yae'){
    const [textures,rig]=await Promise.all([import('../actor-rig/yae-study-textures'),import('../actor-rig/yae-study-rig')])
    await textures.loadYaeStudyTextures();factories.yae=rig.createYaeStudy
  }else if(model==='sieg'){
    const [textures,rig]=await Promise.all([import('../actor-rig/sieg-textures'),import('../actor-rig/sieg-rig')])
    await textures.loadSiegTextures();factories.sieg=rig.createSieg
  }else if(model==='sieghart'){
    const [textures,rig]=await Promise.all([import('../actor-rig/sieghart-textures'),import('../actor-rig/sieghart-rig')])
    await textures.loadSieghartTextures();factories.sieghart=rig.createSieghart
  }else if(model==='rika'||model==='peony'){
    const textures=await import('../actor-rig/rika-textures');await textures.loadRikaTextures()
    if(model==='rika')factories.rika=(await import('../actor-rig/rika-rig')).createRika
    else factories.peony=(await import('../actor-rig/peony-rig')).createPeony
  }else if(model==='mira'){
    const [textures,rig]=await Promise.all([import('../actor-rig/mira-textures'),import('../actor-rig/mira-rig')])
    await textures.loadMiraTextures();factories.mira=rig.createMira
  }else if(model==='aurelia'){
    const [textures,rig]=await Promise.all([import('../actor-rig/aurelia-textures'),import('../actor-rig/aurelia-rig')])
    await textures.loadAureliaTextures();factories.aurelia=rig.createAurelia
  }
}
export function creatorModelFactory(model:CreatorPreviewModel){
  if(model==='shared')return undefined
  const factory=factories[model]
  if(!factory)throw Error('The selected character model is not ready. Reopen its preview.')
  return factory
}
export function creatorModelReady(model:CreatorPreviewModel){return model==='shared'||!!factories[model]}
