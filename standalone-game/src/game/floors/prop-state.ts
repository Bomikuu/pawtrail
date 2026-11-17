import type { ObjectState } from '../housing/types'
export type FloorPropState=ObjectState&{allocation?:'clinic'|'transit';relay?:number[]}
