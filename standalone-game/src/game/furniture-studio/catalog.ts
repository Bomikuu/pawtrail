import housing from '../housing/catalog.json'
import { furnitureDefinitions, type FurnitureDefinition } from '../furniture/model'

export type FurnitureAsset = {
  id: string
  label: string
  category: string
  file: string
  width: number
  height: number
  definition?: FurnitureDefinition
}

/** Inventory IDs stay distinct, including legacy painted variants of a model. */
export const furnitureAssets: FurnitureAsset[] = housing.items.map(item => ({
  id: item.id,
  label: item.label,
  category: item.category === 'interior' ? 'Decor' : item.category,
  file: item.file,
  width: item.width,
  height: item.height,
  definition: furnitureDefinitions.find(model => model.id === item.id),
})).sort((a, b) => Number(!!b.definition) - Number(!!a.definition) || a.label.localeCompare(b.label))

export const furnitureCategories = [...new Set(furnitureAssets.map(item => item.category))].sort()
export const furnitureModelCount = furnitureAssets.filter(item => item.definition).length
export const furnitureDraftKey = (asset: FurnitureAsset, style: string) => `${asset.id}:${style}`
