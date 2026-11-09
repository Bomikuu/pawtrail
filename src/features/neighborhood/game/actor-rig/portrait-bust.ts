import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { attachHair, attachHeadwear } from './appearance-parts'
import { attachAngelWings } from './angel-parts'
import { fittedAppearance, type ActorAppearance } from './appearance'
import type { PartKit } from './part-kit'
import { PortraitFace, paintSurface, hairTexture, clothTexture } from './portrait-paint'
import type { PortraitView } from './portrait-state'
import type { PortraitArt } from './portrait-art'

type Profile = [number, number, number, number?][]
function profileAt(profile: Profile, y: number) {
  const next=profile.findIndex(point=>point[0]>=y),i=Math.max(1,next<0?profile.length-1:next)
  const a=profile[i-1],b=profile[i],t=T.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1)
  return [T.MathUtils.lerp(a[1],b[1],t),T.MathUtils.lerp(a[2],b[2],t),T.MathUtils.lerp(a[3]??0,b[3]??0,t)]
}
/** Explicit cylindrical UVs: u=.5 is the face, sides/back have their own texels. */
function surface(profile: Profile, columns=48, rows=32) {
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[]
  const min=profile[0][0],max=profile[profile.length-1][0]
  for(let row=0;row<=rows;row++){
    const y=T.MathUtils.lerp(min,max,row/rows),[rx,rz,z]=profileAt(profile,y)
    for(let col=0;col<=columns;col++){
      const u=col/columns,angle=(u-.5)*Math.PI*2
      positions.push(Math.sin(angle)*rx,y,Math.cos(angle)*rz+z);uvs.push(u,row/rows)
    }
  }
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const a=row*(columns+1)+col,b=a+1,c=a+columns+1,d=c+1
    indices.push(a,b,c,b,d,c)
  }
  const geometry=new T.BufferGeometry()
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2))
  geometry.setIndex(indices);geometry.computeVertexNormals()
  return geometry
}
function shade(geometry:T.BufferGeometry) {
  if(!geometry.getAttribute('normal'))geometry.computeVertexNormals()
  const normals=geometry.getAttribute('normal'),colors=[]
  for(let i=0;i<normals.count;i++){
    const light=normals.getY(i)*.4+normals.getZ(i)*.2-normals.getX(i)*.2
    const value=light<-.25?.78:light<0?.9:1;colors.push(value,value,value)
  }
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));return geometry
}
function lockGeometry(points:number[][],width:number,depth:number) {
  const curve=new T.CatmullRomCurve3(points.map(point=>new T.Vector3(point[0],point[1],point[2])))
  const steps=16,sides=8,frames=curve.computeFrenetFrames(steps,false),vertices:number[]=[],uv:number[]=[],indices:number[]=[]
  for(let i=0;i<=steps;i++){
    const t=i/steps,point=curve.getPointAt(t),taper=Math.max(.025,Math.pow(1-t,.3))*(.8+Math.sin(t*Math.PI)*.2)
    for(let j=0;j<=sides;j++){
      const angle=j/sides*Math.PI*2,p=point.clone().addScaledVector(frames.normals[i],Math.cos(angle)*width*.5*taper).addScaledVector(frames.binormals[i],Math.sin(angle)*depth*.5*taper)
      vertices.push(p.x,p.y,p.z);uv.push(j/sides,1-t)
    }
  }
  for(let i=0;i<steps;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,a+1,b+1,b)}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry
}

/** Portrait-specific anatomy. Shares appearance data, never changes gameplay bodies. */
export function createPortraitBust(input:ActorAppearance, art:PortraitArt={}) {
  const a=fittedAppearance(input),c=a.colors,root=new T.Group(),upper=new T.Group(),head=new T.Group()
  root.name='PaintedPortraitBust';root.add(upper);head.name='PortraitHead';head.position.y=33.4;upper.add(head)
  const textures=new Set<T.Texture>(),face=new PortraitFace(a,art);textures.add(face.texture)
  const material=(color:string,map?:T.Texture)=>{if(map)textures.add(map);return new T.MeshBasicMaterial({color,map,toneMapped:false})}
  const mesh=(name:string,parent:T.Object3D,geometry:T.BufferGeometry,mat:T.Material,x=0,y=0,z=0)=>{const item=new T.Mesh(geometry,mat);item.name=name;item.position.set(x,y,z);parent.add(item);return item}
  const hairMap=hairTexture(a,art),hairMat=material('#ffffff',hairMap),clothMat=material('#ffffff',clothTexture(a))
  const skinMap=paintSurface(p=>{p.fillStyle=c.skin;p.fillRect(0,0,256,128);p.fillStyle=c.skinShadow;p.fillRect(0,0,70,128);p.fillRect(190,0,66,128);p.fillStyle=c.skinLight;p.fillRect(92,0,8,128)})
  const skinMat=material('#ffffff',skinMap)
  const kit:PartKit={colors:c,shade,
    group(name,parent,x=0,y=0,z=0){const group=new T.Group();group.name=name;group.position.set(x,y,z);parent.add(group);return group},
    part(name,parent,color,x,y,z,w,h,d,bevel=.2){return mesh(name,parent,shade(new RoundedBoxGeometry(w,h,d,1,Math.min(bevel,w/2,h/2,d/2))),new T.MeshBasicMaterial({color,vertexColors:true,toneMapped:false}),x,y,z)},
    round(name,parent,color,x,y,z,w,h,d){const g=shade(new T.SphereGeometry(1,20,16));g.scale(w/2,h/2,d/2);return mesh(name,parent,g,new T.MeshBasicMaterial({color,vertexColors:true,toneMapped:false}),x,y,z)},
    paint(item){const previous=item.material as T.Material;previous.dispose();item.material=hairMat;return item},
  }
  const faceProfile:Profile=[[-7,.4,.8,.85],[-6.5,2.2,2.7,.6],[-5.5,3.5,3.55,.4],[-3.6,a.parts.face==='soft'?5.35:5.1,4.3,.1],[-.5,5.95,4.7],[1.5,6.1,4.65],[3.8,5.75,4.5],[5.7,4.3,3.6],[7,.1,.1]]
  const geometry=surface(faceProfile),base=geometry.getAttribute('position'),jaw=base.clone(),cheeks=base.clone()
  for(let i=0;i<base.count;i++){
    const y=base.getY(i),x=base.getX(i),z=base.getZ(i),lower=T.MathUtils.clamp((-y-1.6)/4.5,0,1)
    jaw.setXYZ(i,x,y-lower*.7,z+Math.max(0,z/5)*lower*.2)
    const lift=Math.max(0,1-Math.abs(y+2)/3)*Math.min(1,Math.abs(x)/4)*Math.max(0,z/5)
    cheeks.setXYZ(i,x*(1+lift*.025),y+lift*.4,z)
  }
  jaw.name='jawOpen';cheeks.name='smileCheeks';geometry.morphAttributes.position=[jaw,cheeks]
  const faceMesh=mesh('PaintedFace',head,geometry,material('#ffffff',face.texture));faceMesh.updateMorphTargets()
  // Neck, shoulders and torso end here. There are no hidden legs in this rig.
  mesh('Neck',upper,surface([[25,2,1.8],[29,2.1,1.9],[30,1.8,1.7]],32,8),skinMat)
  mesh('Torso',upper,surface([[10.5,8.5,3.8],[16,9.3,4.1],[21,9.8,4.2],[24,7.4,3.6],[26.2,2.6,2.1]],48,24),clothMat)
  for(const side of [-1,1]){
    const arm=new T.SphereGeometry(1,24,20);arm.scale(3.25,6.9,3.1)
    const shoulder=mesh('UpperArm'+side,upper,arm,clothMat,side*8.6,16.6,.1);shoulder.rotation.z=side*.14
    kit.round('Ear'+side,head,c.skin,side*6.05,-1.15,-.05,1.8,3.2,1.4)
    kit.round('EarFold'+side,head,c.skinShadow,side*6.5,-1.1,.4,.55,1.7,.5)
  }
  // A wrap-around cap and curved locks give the painted hair real side/back depth.
  const capPositions:number[]=[],capUV:number[]=[],capIndices:number[]=[]
  for(let row=0;row<=16;row++)for(let col=0;col<=48;col++){
    const u=col/48,angle=(u-.5)*Math.PI*2,front=Math.max(0,Math.cos(angle)),bottom=-4.6+front*8.4,t=row/16,y=T.MathUtils.lerp(bottom,7.7,t)
    const [rx,rz,z]=profileAt(faceProfile,Math.min(6.96,y-.4))
    capPositions.push(Math.sin(angle)*(rx+.5),y,Math.cos(angle)*(rz+.55)+z-.1);capUV.push(u,t)
  }
  for(let row=0;row<16;row++)for(let col=0;col<48;col++){const i=row*49+col;capIndices.push(i,i+1,i+49,i+1,i+50,i+49)}
  const cap=new T.BufferGeometry();cap.setAttribute('position',new T.Float32BufferAttribute(capPositions,3));cap.setAttribute('uv',new T.Float32BufferAttribute(capUV,2));cap.setIndex(capIndices);cap.computeVertexNormals();mesh('PaintedHairCap',head,cap,hairMat)
  const locks:T.Mesh[]=[]
  const lock=(name:string,points:number[][],width:number,depth:number)=>{
    const geometry=lockGeometry(points,width,depth),uv=geometry.getAttribute('uv'),offset=.04+(locks.length%5)*.16
    // Each modeled lock receives one painted strand group, not the whole atlas.
    for(let i=0;i<uv.count;i++)uv.setX(i,offset+uv.getX(i)*.16)
    const item=mesh(name,head,geometry,hairMat);locks.push(item)
  }
  if(['spiky','hero-spikes'].includes(a.parts.hair))attachHair(kit,head,a.parts.hair)
  else if(a.parts.hair==='cropped'){
    lock('ShortFringe',[[-3,5,3],[0,4.3,4.7],[3,2.6,4.7]],3,1.5)
  }else{
    lock('SweptFringeA',[[1.6,7,1.9],[-1.8,5.8,3.8],[-4.8,3.3,4.5],[-5.3,.3,3]],3.2,2)
    lock('SweptFringeB',[[3,6.8,1.6],[4.3,4.4,3.5],[5.4,1.2,3.6],[5.5,-.6,2]],2.7,1.8)
    lock('CrownLock',[[-.4,7.1,-3],[-3.7,6.2,-.8],[-5.5,3.5,.8]],3.7,2)
    lock('ForeheadLock',[[1,6.2,3.3],[-.6,4.8,5.1],[-2.8,2.1,5.05]],2.6,1.4)
    lock('PartingRibbon',[[1.5,7.5,1.2],[-.8,6.4,4.3],[-3.9,4.4,4.9]],2.1,1.2)
  }
  if(a.parts.hair==='long'){
    for(const side of [-1,1])for(let layer=0;layer<3;layer++){
      const x=5.25+layer*.48,z=1.7-layer*1.3
      lock('LongSide'+side+'_'+layer,[[side*x,3.5,z],[side*(x+1.1),.5,z+.4],[side*(x+.4),-3,z+.8],[side*(x+1.15),-5.7,z+1.4],[side*(x-.3),-8.4-layer*.4,z+2]],3.2,1.9)
    }
    for(let layer=0;layer<5;layer++){
      const x=(layer-2)*2.1
      lock('LongBack'+layer,[[x,3,-3.2],[x*1.2,-2,-4.7],[x*1.35,-6,-4.2],[x*1.1,-9.2-(layer%2),-3]],3.8,2.1)
    }
  }
  attachHeadwear(kit,head,a.parts.headwear)
  if(a.parts.wings==='feathered')attachAngelWings(kit,upper)
  if(a.accessories.glasses){
    for(const side of [-1,1]){
      const points=Array.from({length:33},(_,i)=>{const angle=i/32*Math.PI*2;return new T.Vector3(side*2.65+Math.cos(angle)*1.9,-.25+Math.sin(angle)*1.7,4.6)})
      mesh('GlassesRim'+side,head,new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.14,5,false),material(c.ink))
      kit.part('GlassesArm'+side,head,c.ink,side*5.9,-.2,1.3,.25,.25,6.5,.05)
      kit.part('LensGlint'+side,head,c.cream,side*2.65-.7,.5,4.77,.6,.22,.12,.02)
    }
    kit.part('GlassesBridge',head,c.ink,0,.1,4.9,1.6,.25,.3,.05)
  }
  if(a.parts.held==='sword'){
    kit.part('SwordGrip',upper,c.leather,9,24,-3.8,1,7,1,.15);kit.part('SwordGuard',upper,c.gold,9,21,-3.8,5,.9,1.4,.15)
  }
  const pose=(frame:number,view:PortraitView)=>{
    const phase=frame/96,t=phase*Math.PI*2,expression=view.talking?'talking':view.expression
    const happy=expression==='happy',smile=happy||expression==='smile'
    const blink=Math.max(0,1-Math.abs(phase-.34)/.025,1-Math.abs(phase-.82)/.025)
    const syllable=expression==='talking'?Math.max(0,Math.sin(frame*1.75))*(.45+Math.sin(frame*.63)**2*.5):happy?.25:0
    upper.position.y=view.steady?0:Math.sin(t*2)*.12
    head.rotation.set(view.steady?0:Math.sin(t*2+.5)*.022+(happy?-.035:0),view.steady?0:Math.sin(t)*.055,(view.steady?0:Math.sin(t+.8)*.018)+(view.headTilt??0))
    face.paint(expression,blink,syllable)
    faceMesh.morphTargetInfluences![0]=syllable
    faceMesh.morphTargetInfluences![1]=smile?1:0
    for(let i=0;i<locks.length;i++)locks[i].rotation.z=view.steady?0:Math.sin(t+i*.5)*.006
  }
  let disposed=false
  return {root,head,pose,dispose(){
    if(disposed)return;disposed=true
    const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>()
    root.traverse(node=>{if(node instanceof T.Mesh){geometries.add(node.geometry);for(const mat of Array.isArray(node.material)?node.material:[node.material])materials.add(mat)}})
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(texture=>texture.dispose());root.clear()
  }}
}
