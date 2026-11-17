import type * as T from 'three'
import type { MonsterEncounter } from './encounter'
import type { HeadId } from './vaelrith'

export type MonsterRepresentation = 'layered-2d' | 'volume-3d' | 'full-3d'

/** Presentation changes artwork and pose only, never the encounter rules. */
export interface MonsterPresentation {
  root: T.Group
  pose(time: number, encounter: MonsterEncounter, reducedMotion: boolean): void
  throatPosition(id: HeadId): T.Vector3
  sealPosition(id: HeadId): T.Vector3
  setCamera?(camera: T.Camera): void
  dispose(): void
}
