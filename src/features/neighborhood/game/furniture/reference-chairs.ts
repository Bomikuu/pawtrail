import * as T from 'three'
import references from './references/chairs.json'
import { roundedFurnitureVolume, type furnitureKit } from './model-kit'
import type { CouchStyle } from './model'

export type ReferenceChairId = keyof typeof references
export const isReferenceChair = (id: string): id is ReferenceChairId => Object.hasOwn(references, id)
type Point = [number, number, number]
type Paint = { width: number; height: number; rgba: string }
type Kind = 'wood' | 'leg' | 'seat' | 'back' | 'arm' | 'pillow' | 'top'

/** Three individual solid seat designs; shared painting and native actor contacts. */
export function createReferenceChair(k: ReturnType<typeof furnitureKit>, style: CouchStyle, id: ReferenceChairId) {
  const reference = references[id], { width, depth, height } = reference.dimensions
  const upholstered = id === 'armchair', palette = new Set<string>(), maps = new Map<string, T.DataTexture>()
  const recolors = new Map<string, string>(), groups = k.groups
  function texture(paint: Paint, kind: Kind, key: string) {
    const cacheKey = key + ':' + kind
    if (maps.has(cacheKey)) return maps.get(cacheKey)!
    const bytes = Uint8Array.from(atob(paint.rgba), c => c.charCodeAt(0))
    const wood = kind === 'wood' || kind === 'leg' || !upholstered && (id === 'chair' || kind === 'back')
    for (let i = 0; i < bytes.length; i += 4) {
      const hex = '#' + [...bytes.slice(i, i + 3)].map(v => v.toString(16).padStart(2,'0')).join('')
      const key = hex + ':' + wood + ':' + (kind === 'pillow'), known = recolors.get(key)
      let result = known ?? hex
      if (!known && style.id !== 'original' && kind !== 'pillow' && (wood || upholstered)) {
        const value = new T.Color(hex), base = new T.Color(wood ? upholstered ? '#ce9148' : '#d58b46' : '#8b9050'), target = new T.Color(wood ? style.wood : style.fabric)
        const a = value.getHSL({h:0,s:0,l:0}), b = base.getHSL({h:0,s:0,l:0}), t = target.getHSL({h:0,s:0,l:0})
        // Preserve dark ink, while recoloring cloth shadows as well as lights.
        // A linear-HSL .1 cutoff left mid-dark sage patches in Terracotta/Cream.
        if (upholstered ? Math.max(bytes[i],bytes[i+1],bytes[i+2]) > 70 : a.l > .1) {
          const l = a.l >= b.l ? t.l + (1-t.l)*(a.l-b.l)/(1-b.l) : t.l*a.l/b.l
          value.setHSL(t.h + a.h-b.h, Math.min(1,t.s*(.7+.3*a.s/Math.max(.01,b.s))),T.MathUtils.clamp(l,.04,.97))
          result = '#' + value.getHexString()
        }
      }
      // Pillow paint has its own cache key so a fabric recolor cannot touch its flower.
      if (kind !== 'pillow') recolors.set(key,result)
      palette.add(result)
      for (let channel = 0; channel < 3; channel++) bytes[i+channel] = parseInt(result.slice(1+channel*2,3+channel*2),16)
    }
    const map = new T.DataTexture(bytes,paint.width,paint.height,T.RGBAFormat)
    map.colorSpace = T.SRGBColorSpace; map.magFilter = map.minFilter = T.NearestFilter; map.generateMipmaps = false; map.needsUpdate = true
    maps.set(cacheKey,map);k.ownTexture(map);return map
  }
  function part(parent: T.Group, name: string, position: Point, dimensions: Point, radii: Point, kind: Kind, angles: Point = [0,0,0], shape?: T.BufferGeometry) {
    const input = shape ?? roundedFurnitureVolume(dimensions,radii)
    const transform = new T.Matrix4().compose(new T.Vector3(...position),new T.Quaternion().setFromEuler(new T.Euler(...angles)),new T.Vector3(1,1,1))
    const localBounds = new T.Box3().setFromBufferAttribute(input.getAttribute('position') as T.BufferAttribute), localSize = localBounds.getSize(new T.Vector3())
    const inverse = transform.clone().invert(), geometry = input.index ? input.toNonIndexed() : input.clone()
    if (kind === 'wood' || kind === 'leg') {
      const edgeGeometry = input.clone().applyMatrix4(transform)
      k.outline(parent,name+' · join',edgeGeometry,[0,0,0]);edgeGeometry.dispose()
    }
    input.dispose();geometry.applyMatrix4(transform)
    const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal')
    const buckets = new Map<string,{vertices:number[];uv:number[];map:T.Texture}>()
    for (let i = 0; i < positions.count; i += 3) {
      const normal = new T.Vector3()
      for (let j = 0; j < 3; j++) normal.add(new T.Vector3().fromBufferAttribute(normals,i+j))
      const horizontal = Math.abs(normal.y) > Math.max(Math.abs(normal.x),Math.abs(normal.z))
      const face = horizontal || normal.z >= Math.abs(normal.x) ? 'front' : -normal.z >= Math.abs(normal.x) ? '180' : normal.x > 0 ? '90' : '270'
      const localPaint = face === 'front' || kind === 'pillow' || kind === 'leg' || !upholstered
      const patch = horizontal && normal.y > 0 && kind === 'seat' ? 'top' : kind
      const key = localPaint ? patch + (horizontal ? ':horizontal' : '') : face
      if (!buckets.has(key)) buckets.set(key,{vertices:[],uv:[],map:localPaint ? texture(reference.patches[patch],kind,patch) : texture(reference.paintViews[face as '90'|'180'|'270'],kind,face)})
      const bucket = buckets.get(key)!
      for (let j = 0; j < 3; j++) {
        const world = new T.Vector3().fromBufferAttribute(positions,i+j), local = world.clone().applyMatrix4(inverse)
        bucket.vertices.push(...world.toArray())
        if (localPaint) {
          const side = face === '90' || face === '270'
          const across = side ? (local.z-localBounds.min.z)/Math.max(.01,localSize.z) : (local.x-localBounds.min.x)/Math.max(.01,localSize.x)
          const u = face === '180' || face === '270' ? 1-across : across
          const v = horizontal ? (localBounds.max.z-local.z)/Math.max(.01,localSize.z) : (localBounds.max.y-local.y)/Math.max(.01,localSize.y)
          bucket.uv.push(u,v)
        } else {
          const theta = Number(face)*Math.PI/180, pitch = (face === '180' ? Math.atan2(34.5,90) : reference.projection.sidePitchDegrees*Math.PI/180)
          bucket.uv.push((48+world.x*Math.cos(theta)-world.z*Math.sin(theta))/96,(96-Math.cos(pitch)*world.y+Math.sin(pitch)*(world.x*Math.sin(theta)+world.z*Math.cos(theta)))/112)
        }
      }
    }
    geometry.dispose()
    for (const [key,data] of buckets) {
      const mesh = new T.BufferGeometry();mesh.setAttribute('position',new T.Float32BufferAttribute(data.vertices,3));mesh.setAttribute('uv',new T.Float32BufferAttribute(data.uv,2));mesh.computeVertexNormals()
      k.referenceMesh(parent,name+' · '+key,mesh,data.map)
    }
  }
  const seatHeight = reference.seatHeight
  if (upholstered) {
    for (const x of [-12.2,12.2]) for (const z of [-9.4,9.4]) part(groups.base,'Short timber foot',[x,1.7,z],[4,3.4,4],[.4,.3,.4],'leg')
    part(groups.base,'Timber base rail',[0,3.9,0],[30,2,23],[.8,.4,.8],'wood')
    part(groups.base,'Upholstered lower frame',[0,6.7,0],[28,4.5,23],[2,1.3,2],'arm')
    part(groups.base,'Separate plump seat',[0,10.2,1],[22,4.5,20],[2,1.8,2.5],'seat')
    part(groups.back,'Single rounded padded back',[0,18.3,-8],[27,23.4,8],[10,7,3.5],'back',[-.05,0,0])
    for (const [parent,x] of [[groups.leftArm,-13.5],[groups.rightArm,13.5]] as const)
      part(parent,'Rounded rolled upholstered arm',[x,11.8,0],[6,17.5,23.5],[2.8,5.5,6],'arm')
    const pillow = k.group('Flower pillow 1',groups.back)
    part(pillow,'Single angled cream floral pillow',[6,17.2,-5.3],[9,10,3],[1.1,1.1,.9],'pillow',[-.12,.18,-.18])
  } else {
    for (const x of [-8.2,8.2]) {
      part(groups.base,'Front tapered timber leg',[x,5,7.2],[3.2,10,3.2],[.35,.25,.35],'leg',[0,0,x<0?.025:-.025])
      part(groups.back,'Continuous rear leg and back post',[x,id === 'chair' ? 15.4 : 14.8,-8],[3,id === 'chair' ? 30.8 : 29.6,3],[.35,.35,.35],'leg',[-.025,0,0])
    }
    part(groups.base,'Solid seat frame',[0,9.2,0],[22,2.2,20],[1,.4,.8],'wood')
    part(groups.base,id==='chair'?'Beveled timber seat':'Single sage seat cushion',[0,seatHeight-1.35,0],[22,2.7,20],[1.3,.8,1.4],'seat')
    for (const z of [-7.2,7.2]) part(groups.base,'Low front/back stretcher',[0,3.7,z],[16,1.7,1.8],[.2,.2,.2],'leg')
    for (const x of [-8.2,8.2]) part(groups.base,'Low side stretcher',[x,4.5,0],[1.7,1.6,15],[.2,.2,.2],'leg')
    if (id === 'chair') {
      part(groups.back,'Broad upper back board',[0,25.2,-8.4],[15,6,2.8],[1.3,.6,.5],'back')
      part(groups.back,'Single low back rail',[0,17.8,-8.2],[15,2.1,2.5],[.3,.25,.3],'wood')
    } else {
      const crest = new T.Shape();crest.moveTo(-10,0);crest.lineTo(10,0);crest.lineTo(10,4);crest.lineTo(6.5,4.6);crest.lineTo(4.5,6);crest.lineTo(-4.5,6);crest.lineTo(-6.5,4.6);crest.lineTo(-10,4);crest.closePath()
      const crown = new T.ExtrudeGeometry(crest,{depth:2.8,bevelEnabled:true,bevelSize:.35,bevelThickness:.3,bevelSegments:1,steps:1});crown.translate(0,0,-1.4)
      part(groups.back,'Shaped broad dining crest',[0,24.2,-8.2],[20,6,2.8],[0,0,0],'back',[0,0,0],crown)
      for (const x of [-3,3]) part(groups.back,'Two interior vertical back splats',[x,18.2,-8.2],[2.2,12.5,2.3],[.2,.25,.2],'leg')
    }
  }
  k.root.userData.reference = {source:reference.source,sha256:reference.sha256,turnaround:reference.sheet,sheetSha256:reference.sheetSha256,projection:reference.projection,representation:reference.representation,review:reference.review}
  k.root.userData.outline = {nativePixels:1,ink:'#3a261d',structuralEdges:!upholstered}
  const dockZ = upholstered ? 5.5 : 3.5
  return {seats:[{id:'seat-1',point:[0,seatHeight,dockZ]}],top:height,grounds:[[-width/2,-depth/2,width,depth]] as [number,number,number,number][],approach:[0,0,depth/2+35],palette:[...palette],
    seatSupport:{height:seatHeight,front:10},seatClearance:{left:upholstered?-10.5:-11,right:upholstered?10.5:11,back:upholstered?-2:-6,front:10,armTop:upholstered?20.55:0},
    surfaces:[{id:'perch-1',point:[0,seatHeight,3],rect:[-8,-4,16,12],capacity:1}]}
}
