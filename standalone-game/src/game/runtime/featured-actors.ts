import { actorPreviews } from './actor-previews'
import { defaultAppearance, readAppearance, type ActorAppearance } from '../actor-rig/appearance'
import { yaeStudyAppearance } from '../actor-rig/yae-study-appearance'
import {rikaAppearance,peonyAppearance} from '../actor-rig/rika-appearance'

const base = defaultAppearance(), amber = actorPreviews.find(actor => actor.id === 'amber-outrider')
const amberLook = amber && readAppearance({ ...base, parts: { ...base.parts, ...amber.parts },
  colors: { ...base.colors, ...amber.colors }, accessories: { ...base.accessories, ...amber.accessories }, face: amber.face ?? base.face })
export const featuredActors: Record<string, { name: string; model: 'amber' | 'yae'|'rika'|'peony'; collection: string; appearance: ActorAppearance }> = {
  'rika-hoshino':{name:'Rika Hoshino',model:'rika',collection:'rika-hoshino-refined-cel',appearance:rikaAppearance()},
  'peony-7':{name:'Peony-7 · Rika',model:'peony',collection:'rika-hoshino-refined-cel',appearance:peonyAppearance()},
  'amber-outrider': { name: 'Amber', model: 'amber', collection: 'amber-refined-cel', appearance: amberLook ?? base },
  'yae-miko': { name: 'Yae Miko', model: 'yae', collection: 'yae-miko-refined-cel', appearance: yaeStudyAppearance() },
}
