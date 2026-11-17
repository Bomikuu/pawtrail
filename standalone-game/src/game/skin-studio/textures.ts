export const ATLAS_SIZE = 256
export type SkinPart = string
export type SurfaceGroup = 'Clothing' | 'Hair' | 'Face' | 'Accessories' | 'Silhouettes'
export type SkinSheet = { id: SkinPart; label: string; color: string; pieces: string[]; width?: number; height?: number; group?: SurfaceGroup; layout?:'silhouette'; description?: string; meshes?: string[] }
export const skinParts: SkinSheet[] = [
  { id: 'shirt', label: 'Shirt', color: '#4c8b81', pieces: ['Body', 'Left sleeve', 'Right sleeve'] },
  { id: 'pants', label: 'Pants', color: '#c69b63', pieces: ['Waist', 'Left leg', 'Right leg'] },
  { id: 'shoes', label: 'Shoes', color: '#654136', pieces: ['Left shoe', 'Right shoe'] },
]
export const faces = ['Front', 'Back', 'Right', 'Left', 'Top', 'Bottom']
export const origins = [[12, 20], [140, 20], [12, 140]]
export function faceRect(piece: number, face: number) {
  const [x, y] = origins[piece]
  return { x: x + face % 3 * 32, y: y + Math.floor(face / 3) * 32, w: 32, h: 32 }
}
export function makeTexture(part: SkinPart) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = ATLAS_SIZE
  const context = canvas.getContext('2d')!
  const spec = skinParts.find(entry => entry.id === part)
  if (!spec) return canvas
  context.fillStyle = spec.color
  spec.pieces.forEach((_, piece) => faces.forEach((_, face) => {
    const rect = faceRect(piece, face)
    context.fillRect(rect.x, rect.y, rect.w, rect.h)
  }))
  return canvas
}
export function drawGuide(context: CanvasRenderingContext2D, part: SkinPart, labels = true) {
  const spec = skinParts.find(entry => entry.id === part)
  if (!spec) return
  context.save()
  spec.pieces.forEach((name, piece) => {
    const [x, y] = origins[piece]
    if (labels) {
      context.font = '8px monospace'
      context.fillStyle = '#ffffff'
      context.fillText(name, x, y - 4)
    }
    faces.forEach((name, face) => {
      const r = faceRect(piece, face)
      context.strokeStyle = '#ffdd68'
      context.lineWidth = .6
      context.strokeRect(r.x + .3, r.y + .3, 31.4, 31.4)
      if (labels) {
        context.font = '5px monospace'
        context.fillStyle = '#ffffff'
        context.fillText(name, r.x + 2, r.y + 7)
      }
    })
  })
  context.restore()
}
export function downloadFile(name: string, data: Blob | string) {
  const url = typeof data === 'string' ? data : URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  if (typeof data !== 'string') setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export async function readTexture(source: string) {
  const image = new Image()
  image.src = source
  await image.decode()
  if (image.naturalWidth < 1 || image.naturalHeight < 1 || image.naturalWidth > 1024 || image.naturalHeight > 1024) throw new Error('Texture dimensions must be between 1 and 1024 pixels.')
  return image
}

export function describeSurface(surface:string): Pick<SkinSheet, 'label'|'group'|'description'> {
  const name=surface.toLowerCase()
  if (/face|half|closed/.test(name)) {
    const frame=/closed/.test(name)?'Eyes closed':/half/.test(name)?'Half blink':'Eyes open'
    return {label:frame,group:'Face',description:`${frame} facial artwork. Blink frames are separate maps; update each when changing eyes or skin details.`}
  }
  if (/hair|fringe|lock|crown/.test(name)) return {label:surface.replace(/-/g,' '),group:'Hair',description:'Painted highlights and strand separation on shaped hair geometry. Painting changes color and detail; the shape stays the same.'}
  if (/bow|ribbon|goggle|hat/.test(name)) return {label:surface.replace(/-/g,' '),group:'Accessories',description:'Accessory artwork. This surface follows its original model UVs and attachment point.'}
  return {label:surface.replace(/-/g,' '),group:'Clothing',description:'Painted garment details mapped onto the original model. Repeated areas share this sheet and will change together.'}
}
export function drawCheckerboard(context:CanvasRenderingContext2D,width:number,height:number,cell=8){
  context.fillStyle='#272a30';context.fillRect(0,0,width,height)
  context.fillStyle='#343840'
  for(let y=0;y<height;y+=cell)for(let x=0;x<width;x+=cell)if((Math.floor(x/cell)+Math.floor(y/cell))%2===0)context.fillRect(x,y,cell,cell)
}
