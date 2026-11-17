import * as T from 'three'
import references from './references/batch-01.json'
import { roundedFurnitureVolume, type furnitureKit } from './model-kit'
import type { CouchStyle } from './model'

export type ReferenceTimberId = keyof typeof references
export const isReferenceTimber = (id: string): id is ReferenceTimberId => Object.hasOwn(references, id)
const baseCos = 90 / Math.hypot(90, 34.5), baseSin = 34.5 / Math.hypot(90, 34.5)
type Paint = { width: number; height: number; indices: string }
type Point = [number, number, number]

/** Each item owns its structure. The shared helper only maps/finishes actual volume. */
export function createReferenceTimber(k: ReturnType<typeof furnitureKit>, style: CouchStyle, id: ReferenceTimberId) {
  const reference = references[id], root = k.group('Reference timber furniture'), palette = new Set<string>()
  const { width, depth, height } = reference.dimensions
  const originalWood = new T.Color('#e28c4b').getHSL({ h: 0, s: 0, l: 0 })
  const targetWood = new T.Color(style.fabric).getHSL({ h: 0, s: 0, l: 0 })
  const bookRects = reference.books.flat()
  const colorCache = new Map<string, string>()
  function color(hex: string, x: number, y: number, source: boolean) {
    const isBook = source && bookRects.some(([bx, by, bw, bh]) => x >= bx && x < bx + bw && y >= by && y < by + bh)
    const key = hex + ':' + isBook, cached = colorCache.get(key)
    if (cached) return cached
    const c = new T.Color(hex), hsl = c.getHSL({ h: 0, s: 0, l: 0 })
    if (style.fabric.toLowerCase() !== '#e28c4b' && !isBook && hsl.l > .07) {
      const light = hsl.l >= originalWood.l
        ? targetWood.l + (1 - targetWood.l) * (hsl.l - originalWood.l) / (1 - originalWood.l)
        : targetWood.l * hsl.l / originalWood.l
      c.setHSL(targetWood.h + hsl.h - originalWood.h, Math.min(1, targetWood.s * (.7 + .3 * hsl.s / originalWood.s)), T.MathUtils.clamp(light, .04, .97))
    }
    const result = '#' + c.getHexString()
    palette.add(result)
    colorCache.set(key, result)
    return result
  }
  function texture(paint: Paint, source = false) {
    const indices = Uint8Array.from(atob(paint.indices), char => char.charCodeAt(0))
    // Complete painted structural surfaces, including the source alpha margin.
    // Multi-source fill keeps real geometry closed without an expensive nearest-pixel search.
    const queue: number[] = [], seen = new Uint8Array(indices.length)
    for (let i = 0; i < indices.length; i++) if (indices[i]) { queue.push(i); seen[i] = 1 }
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const at = queue[cursor], x = at % paint.width, y = Math.floor(at / paint.width)
      for (const next of [x > 0 ? at - 1 : -1, x < paint.width - 1 ? at + 1 : -1, y > 0 ? at - paint.width : -1, y < paint.height - 1 ? at + paint.width : -1]) {
        if (next < 0 || seen[next]) continue
        seen[next] = 1; indices[next] = indices[at]; queue.push(next)
      }
    }
    const rgba = new Uint8Array(indices.length * 4)
    for (let i = 0; i < indices.length; i++) {
      const hex = color(reference.palette[indices[i]].slice(0, 7), i % paint.width, Math.floor(i / paint.width), source)
      rgba.set([1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16)).concat(255), i * 4)
    }
    const map = new T.DataTexture(rgba, paint.width, paint.height, T.RGBAFormat)
    map.colorSpace = T.SRGBColorSpace
    map.magFilter = map.minFilter = T.NearestFilter
    map.generateMipmaps = false; map.needsUpdate = true
    return map
  }
  const maps = { front: texture(reference.sourceTexture, true), left: texture(reference.paintViews['90']),
    back: texture(reference.paintViews['180']), right: texture(reference.paintViews['270']) }
  const sourceIndices = Uint8Array.from(atob(reference.sourceTexture.indices), char => char.charCodeAt(0))
  const topRect = id === 'table' ? [10,22,45,5] : id === 'side-table' ? [6,4,19,5] : [15,6,34,3]
  const [tx,ty,tw,th] = topRect, topIndices: number[] = []
  for (let y = ty; y < ty + th; y++) for (let x = tx; x < tx + tw; x++) topIndices.push(sourceIndices[y * reference.sourceTexture.width + x])
  const topMap = texture({width:tw,height:th,indices:btoa(String.fromCharCode(...topIndices))})
  k.ownTexture(topMap)
  const pagesData = new Uint8Array(8 * 16 * 4)
  for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) {
    const hex = y === 0 || y === 15 ? '#805a36' : y % 3 === 0 ? '#d8bf8f' : '#f7dda3'
    palette.add(hex); pagesData.set([1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16)).concat(255), (y * 8 + x) * 4)
  }
  const pages = new T.DataTexture(pagesData, 8, 16, T.RGBAFormat)
  pages.colorSpace = T.SRGBColorSpace; pages.magFilter = pages.minFilter = T.NearestFilter; pages.generateMipmaps = false; pages.needsUpdate = true
  k.ownTexture(pages)
  function uv(point: Point, face: 'front' | 'left' | 'back' | 'right') {
    const [x, y, z] = point
    if (face === 'front') return [(x + reference.sourceFrame.anchor[0]) / reference.sourceFrame.width,
      (reference.sourceFrame.anchor[1] - baseCos * y + baseSin * z) / reference.sourceFrame.height]
    const angle = face === 'left' ? 90 : face === 'back' ? 180 : 270, theta = angle * Math.PI / 180
    const pitch = (face === 'back' ? Math.atan2(34.5, 90) : reference.projection.sidePitchDegrees * Math.PI / 180)
    return [(48 + x * Math.cos(theta) - z * Math.sin(theta)) / 96,
      (96 - Math.cos(pitch) * y + Math.sin(pitch) * (x * Math.sin(theta) + z * Math.cos(theta))) / 112]
  }
  function volume(name: string, position: Point, dimensions: Point, radii?: Point, book = false, cover?: T.DataTexture) {
    const source = radii ? roundedFurnitureVolume(dimensions, radii) : new T.BoxGeometry(...dimensions)
    k.outline(root, name + ' · structural edges', source, position)
    const geometry = source.index ? source.toNonIndexed() : source.clone()
    source.dispose()
    const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal'), originalUV = geometry.getAttribute('uv')
    const groups = new Map<string, { vertices: number[]; uv: number[]; map: T.DataTexture }>()
    for (let i = 0; i < positions.count; i += 3) {
      const normal = new T.Vector3()
      for (let j = 0; j < 3; j++) normal.add(new T.Vector3().fromBufferAttribute(normals, i + j))
      const horizontal = Math.abs(normal.y) > Math.max(Math.abs(normal.x), Math.abs(normal.z))
      const top = horizontal && normal.y > 0
      const face = horizontal ? 'front'
        : Math.abs(normal.x) > Math.abs(normal.z) ? normal.x > 0 ? 'left' : 'right' : normal.z > 0 ? 'front' : 'back'
      const frontSpine = normal.z > 0 && Math.abs(normal.z) >= Math.max(Math.abs(normal.x), Math.abs(normal.y))
      const page = book && horizontal, wrappedCover = book && !horizontal && !frontSpine
      const key = page ? 'pages' : wrappedCover ? 'cover' : top ? 'top' : face
      if (!groups.has(key)) groups.set(key, { vertices: [], uv: [], map: page ? pages : wrappedCover ? cover! : top ? topMap : maps[face] })
      const group = groups.get(key)!
      for (let j = 0; j < 3; j++) {
        const point: Point = [positions.getX(i + j) + position[0], positions.getY(i + j) + position[1], positions.getZ(i + j) + position[2]]
        group.vertices.push(...point)
        group.uv.push(...(page || wrappedCover || top ? [originalUV.getX(i + j), 1 - originalUV.getY(i + j)] : uv(point, face)))
      }
    }
    geometry.dispose()
    for (const [face, data] of groups) {
      const mesh = new T.BufferGeometry()
      mesh.setAttribute('position', new T.Float32BufferAttribute(data.vertices, 3)); mesh.setAttribute('uv', new T.Float32BufferAttribute(data.uv, 2)); mesh.computeVertexNormals()
      k.referenceMesh(root, name + ' · ' + face, mesh, data.map)
    }
  }

  if (id === 'table') {
    volume('Broad bevelled tabletop', [0, 29.5, 0], [54, 3, 30], [4.5, 1.2, 3.5])
    volume('Deep continuous solid apron', [0, 17.4, 0], [52, 22.8, 28.2])
    volume('Lower apron edge molding', [0, 6.3, 0], [52.4, 1.4, 28.5])
    for (const x of [-21, 21]) for (const z of [-10.7, 10.7]) volume('Short square timber foot', [x, 3.4, z], [6, 6.8, 5.5], [.5, .3, .4])
  } else if (id === 'side-table') {
    volume('Chamfered square tabletop', [0, 20, 0], [25, 4, 21], [3, 1.4, 2.8])
    for (const x of [-9, 9]) for (const z of [-7.5, 7.5]) volume('Straight square table leg', [x, 9.4, z], [4, 18.8, 4])
    volume('Inset lower shelf', [0, 6, 0], [17, 2.1, 15], [.5, .2, .4])
    for (const z of [-7.5, 7.5]) volume('Upper cross rail', [0, 17.5, z], [18, 1.8, 1.8])
  } else {
    volume('Heavy chamfered top cornice', [0, 53.7, 0], [44, 3.6, 16], [3, 1.3, 2.4])
    for (const x of [-19.5, 19.5]) volume('Full cabinet side upright', [x, 27.4, 0], [3, 49.6, 14])
    volume('Inset closed timber rear', [0, 27, -6.3], [37, 48, 1.4])
    volume('Bottom timber plinth', [0, 4.1, 0], [42, 2.5, 14.5])
    for (const top of [35.2, 20.2, 5.2]) volume('Book shelf', [0, top - .8, 0], [38, 1.6, 13])
    for (const x of [-17.5, 17.5]) for (const z of [-4.5, 4.5]) volume('Short bookcase foot', [x, 1.8, z], [4.5, 3.6, 4])
    reference.books.forEach((row, rowIndex) => row.forEach(([x, y, w, h], index) => {
      const z = 5, top = (reference.sourceFrame.anchor[1] - y + baseSin * z) / baseCos,
        bottom = (reference.sourceFrame.anchor[1] - y - h + baseSin * z) / baseCos, d = 8 + index % 3
      const counts = new Map<number,number>()
      for (let yy=y; yy<y+h; yy++) for (let xx=x; xx<x+w; xx++) {
        const code=sourceIndices[yy*reference.sourceTexture.width+xx]
        if (code) counts.set(code,(counts.get(code)??0)+1)
      }
      const code=[...counts].sort((a,b)=>b[1]-a[1])[0][0], hex=reference.palette[code]
      const coverMap=new T.DataTexture(Uint8Array.from([1,3,5].map(offset=>parseInt(hex.slice(offset,offset+2),16)).concat(255)),1,1,T.RGBAFormat)
      coverMap.colorSpace=T.SRGBColorSpace;coverMap.magFilter=coverMap.minFilter=T.NearestFilter;coverMap.needsUpdate=true;k.ownTexture(coverMap)
      volume(`Book ${rowIndex + 1}-${index + 1}`, [x + w / 2 - reference.sourceFrame.anchor[0], (top + bottom) / 2, z - d / 2], [w, top - bottom, d], undefined, true, coverMap)
    }))
  }
  k.root.userData.reference = { source: reference.source, sha256: reference.sha256, turnaround: reference.sheet,
    sheetSha256: reference.sheetSha256, projection: reference.projection, dimensions: reference.dimensions,
    representation: reference.representation, review: reference.review }
  k.root.userData.outline = { nativePixels: 1, ink: '#3a261d', structuralEdges: true }
  return { top: height, grounds: [[-width / 2, -depth / 2, width, depth]] as [number, number, number, number][],
    approach: [0, 0, depth / 2 + 14], palette: [...palette],
    surfaces: id === 'bookshelf' ? [] : [{ id: 'perch-1', point: [0, height, 0], rect: [-width / 2 + 4, -depth / 2 + 4, width - 8, depth - 8], capacity: 1 }] }
}
