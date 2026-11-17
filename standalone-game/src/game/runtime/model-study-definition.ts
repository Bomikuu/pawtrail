import type { ActorAppearance } from '../actor-rig/appearance'
import type { Rig } from '../actor-rig/rigs'

export type StudyModels={id:string;name:string;appearance:ActorAppearance;factories:[(a:ActorAppearance)=>Rig,(a:ActorAppearance)=>Rig]}
export type ModelStudyDefinition={
  id:string
  name:string
  heading:string
  description:string
  summary:string
  sides:[{title:string;description:string},{title:string;description:string}]
  creatorQuery:string
  references:{src:string;alt:string}[]
  referenceNote:string
  textureDescription:string
  load:()=>Promise<StudyModels>
  paintTextures:(canvas:HTMLCanvasElement)=>void|Promise<void>
}
