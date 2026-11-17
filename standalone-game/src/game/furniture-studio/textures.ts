import type { FurnitureAsset } from './catalog'
import { normalizePaletteColor } from '../furniture/palette-color'

export type FurnitureSurface = {
  id: string
  label: string
  width: number
  height: number
  meshes: string[]
  kind: 'texture' | 'color' | 'sprite'
}
export type FurnitureCanvases = Record<string, HTMLCanvasElement>
export type FurnitureTexturePackage = {
  kind: 'pawtrail-furniture-textures'
  version: 1
  assetId: string
  source: string
  styleId: string
  upholsteryColor?: string
  surfaces: Record<string, { width: number; height: number; image: string }>
}
export const FURNITURE_SAVE_PREFIX = 'pawtrail:furniture-textures:v1:'
export const textureZooms = [1, 2, 3, 4, 6, 8, 12, 16]

export function copySurface(source: HTMLCanvasElement) {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  canvas.getContext('2d')!.drawImage(source, 0, 0)
  return canvas
}

export function furniturePackage(asset: FurnitureAsset, styleId: string, canvases: FurnitureCanvases, upholsteryColor?: string): FurnitureTexturePackage {
  return {
    kind: 'pawtrail-furniture-textures', version: 1, assetId: asset.id, source: asset.file, styleId,
    ...(asset.id === 'sofa' && upholsteryColor ? { upholsteryColor: normalizePaletteColor(upholsteryColor) } : {}),
    surfaces: Object.fromEntries(Object.entries(canvases).map(([id, canvas]) => [id, {
      width: canvas.width, height: canvas.height, image: canvas.toDataURL('image/png'),
    }])),
  }
}

/** Packages contain native images only. Geometry, scripts and remote URLs are never loaded. */
export function parseFurniturePackage(text: string, asset: FurnitureAsset, styleId: string): FurnitureTexturePackage {
  if (text.length > 8 * 1024 * 1024) throw new Error('This package exceeds the 8 MB limit.')
  let value: FurnitureTexturePackage
  try { value = JSON.parse(text) as FurnitureTexturePackage }
  catch { throw new Error('This file is not valid JSON. Choose an exported furniture texture package.') }
  if (!value || value.kind !== 'pawtrail-furniture-textures' || value.version !== 1)
    throw new Error('Choose a PawTrail furniture texture package.')
  if (value.assetId !== asset.id || value.styleId !== styleId)
    throw new Error('Choose the furniture and style used by this package first.')
  if (value.source !== asset.file) throw new Error('This package belongs to a different source revision. Export a fresh template first.')
  if (value.upholsteryColor !== undefined) {
    if (asset.id !== 'sofa' || typeof value.upholsteryColor !== 'string') throw new Error('This item does not support upholstery coloring.')
    value.upholsteryColor = normalizePaletteColor(value.upholsteryColor)
  }
  if (!value.surfaces || typeof value.surfaces !== 'object' || Array.isArray(value.surfaces))
    throw new Error('This package has no texture surfaces.')
  const rows = Object.entries(value.surfaces)
  if (!rows.length || rows.length > 128) throw new Error('This package has an invalid number of surfaces.')
  let pixels = 0
  for (const [id, row] of rows) {
    if (!/^[a-z0-9-]+$/i.test(id) || !row || !Number.isInteger(row.width) || !Number.isInteger(row.height)
      || row.width < 1 || row.height < 1 || row.width > 1024 || row.height > 1024
      || typeof row.image !== 'string' || !/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(row.image))
      throw new Error('A texture surface is invalid. Use native-sized PNG surfaces.')
    pixels += row.width * row.height
  }
  if (pixels > 4 * 1024 * 1024) throw new Error('This package contains too many texture pixels.')
  return value
}

export async function restoreFurniturePackage(value: FurnitureTexturePackage, canvases: FurnitureCanvases, isCurrent = () => true) {
  const ids = Object.keys(canvases)
  if (ids.length !== Object.keys(value.surfaces).length || ids.some(id => !Object.hasOwn(value.surfaces, id)))
    throw new Error('The model surfaces have changed. Use a package exported from the current model.')
  const images = await Promise.all(ids.map(async id => {
    const row = value.surfaces[id], canvas = canvases[id]
    if (row.width !== canvas.width || row.height !== canvas.height)
      throw new Error('A texture has different native dimensions. Export a fresh template.')
    const image = new Image()
    image.src = row.image
    await image.decode()
    if (image.naturalWidth !== canvas.width || image.naturalHeight !== canvas.height)
      throw new Error('A packaged image has different dimensions from its surface.')
    return { id, image }
  }))
  // Validate every image before touching any surface; never apply a late import to another item.
  if (!isCurrent()) return false
  for (const { id, image } of images) {
    const canvas = canvases[id], context = canvas.getContext('2d')!
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0)
  }
  return true
}
