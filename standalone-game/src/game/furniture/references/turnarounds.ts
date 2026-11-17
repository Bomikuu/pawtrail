import couch from './couch-turnaround.json'
import aquarium from './aquarium-turnaround.json'
import batch from './batch-01.json'
import chairs from './chairs.json'

type View = { file: string; width: number; height: number; anchor: number[]; label: string }
export type FurnitureTurnaround = {
  referenceViews: Record<string, View>
  projection: { sidePitchDegrees: number; blendPower?: number }
}
const turnarounds: Record<string, FurnitureTurnaround> = { couch, aquarium, ...batch, ...chairs }
export const furnitureTurnaround = (model: string) => turnarounds[model]
