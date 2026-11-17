import * as T from 'three'
import { createRescuer, type Rig } from './rigs'
import type { ActorAppearance } from './appearance'
import { amberTexture, type AmberSurface } from './amber-study-textures'
import { attachOutriderHeadwear } from './outrider-parts'
import { attachAmberAnimeHead } from './amber-anime-head'
import { archiveBodyGeometry, bindTorsoParts, neutralLimbPose, refinedFaceState } from './refined-action-support'

/** Isolated art trial: same pose skeleton; no catalogue/save/roster replacement. */
export function createAmberStudy(appearance:ActorAppearance,refineHead=false,refineShoulders=false):Rig {
  const base=createRescuer(appearance),C=appearance.colors
  const get=(name:string)=>base.root.getObjectByName(name)!
  archiveBodyGeometry(base,'OriginalGeometryArchive')
  const materials=new Map<string,T.MeshBasicMaterial>()
  const material=(color:string,surface?:AmberSurface)=>{
    const key=surface??color
    if(!materials.has(key))materials.set(key,new T.MeshBasicMaterial({color:surface?'#ffffff':color,map:surface?amberTexture(surface,C):null,side:T.DoubleSide,toneMapped:false}))
    return materials.get(key)!
  }
  const group=(name:string,parent:T.Object3D,x=0,y=0,z=0)=>{const n=new T.Group();n.name=name;n.position.set(x,y,z);parent.add(n);return n}
  const mesh=(name:string,parent:T.Object3D,geometry:T.BufferGeometry,color:string,x=0,y=0,z=0,surface?:AmberSurface)=>{const n=new T.Mesh(geometry,material(color,surface));n.name=name;n.position.set(x,y,z);parent.add(n);return n}
  const box=(name:string,parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number,surface?:AmberSurface)=>mesh(name,parent,new T.BoxGeometry(w,h,d),color,x,y,z,surface)
  const round=(name:string,parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number)=>{const n=mesh(name,parent,new T.SphereGeometry(1,12,10),color,x,y,z);n.scale.set(w/2,h/2,d/2);return n}
  /** A shaped, volumetric garment/lock with explicit front/back UVs. */
  const volume=(name:string,parent:T.Object3D,points:number[][],depth:number,surface:AmberSurface,x=0,y=0,z=0)=>{
    const n=points.length,positions:number[]=[],uv:number[]=[],indices:number[]=[]
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys)
    for(const face of [1,-1])for(const [px,py]of points){positions.push(px,py,face*depth/2);uv.push((px-minX)/(maxX-minX),(py-minY)/(maxY-minY))}
    const triangles=T.ShapeUtils.triangulateShape(points.map(([px,py])=>new T.Vector2(px,py)),[])
    for(const[a,b,c]of triangles){indices.push(a,b,c,n+c,n+b,n+a)}
    for(let i=0;i<n;i++){const next=(i+1)%n;indices.push(i,next,n+i,next,n+next,n+i)}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals()
    return mesh(name,parent,g,'#ffffff',x,y,z,surface)
  }
  // A curved sleeve cap slopes toward the neck and tapers into the elbow.
  // Ring sections replace the old extruded polygon's flat top and side walls.
  const fittedSleeve=(parent:T.Object3D,side:number)=>{
    const rings=[
      [.7,.08,.08,-.45],[.45,.85,1,-.4],[0,1.65,1.9,-.25],
      [-.9,1.95,2.2,-.1],[-2,1.85,2.1,0],[-3.4,1.6,1.9,.08],[-4.65,1.45,1.8,.1],
    ]
    const positions:number[]=[],uv:number[]=[],indices:number[]=[],segments=16
    rings.forEach(([y,rx,rz,shift],r)=>{for(let c=0;c<=segments;c++){
      const a=-Math.PI+c/segments*Math.PI*2
      positions.push(Math.sin(a)*rx+side*shift,y,Math.cos(a)*rz)
      uv.push(c/segments,1-r/(rings.length-1))
    }})
    for(let r=0;r<rings.length-1;r++)for(let c=0;c<segments;c++){
      const a=r*(segments+1)+c,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1)
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals()
    // Discrete painted shading keeps depth legible without smooth 3D lighting.
    const normals=g.getAttribute('normal'),colors:number[]=[]
    for(let i=0;i<normals.count;i++){
      const light=-normals.getX(i)*.25+normals.getY(i)*.4+normals.getZ(i)*.3
      const shade=light<-.15?.8:light<.15?.92:1;colors.push(shade,shade,shade)
    }
    g.setAttribute('color',new T.Float32BufferAttribute(colors,3))
    const sleeve=mesh('RoundedShoulderSleeve',parent,g,'#ffffff',0,0,0,'sleeve')
    const sleeveMaterial=sleeve.material as T.MeshBasicMaterial
    sleeveMaterial.vertexColors=true
  }
  const upper=get('UpperBody'),chest=get('ChestBreath'),head=get('Head')
  const face=volume('SculptedFace',head,[[-6.3,4.5],[-6.5,.3],[-5.6,-3.4],[-3.3,-6],[0,-6.7],[3.3,-6],[5.6,-3.4],[6.5,.3],[6.3,4.5],[3.6,6],[-3.6,6]],7,'face',0,.3,.7)
  face.rotation.x=-.025
  const faceHalf=new T.Mesh(face.geometry,material('#ffffff','face-half'));faceHalf.position.copy(face.position);faceHalf.rotation.copy(face.rotation);head.add(faceHalf)
  const faceClosed=new T.Mesh(face.geometry,material('#ffffff','face-closed'));faceClosed.position.copy(face.position);faceClosed.rotation.copy(face.rotation);head.add(faceClosed)
  box('Neck',upper,C.skin,0,27,0,3.7,3.2,3.6)
  const eyes=get('EyeBlink');eyes.clear()
  for(const s of [-1,1]){
    round('Ear',head,C.skinShadow,s*6.2,-1,0,1.7,3,2.1)
  }
  const closed=get('RestingEyes');closed.clear()
  volume('FittedBodice',chest,[[-4.9,5],[-5.6,2],[-4.3,-5.8],[4.3,-5.8],[5.6,2],[4.9,5]],5.8,'bodice',0,0,.2)
  for(const s of [-1,1]){
    volume('OpenRedJacket',chest,[[-1.9,5.6],[-2.5,2],[-1.7,-3.5],[1.4,-4.3],[1.6,3.5]],3.6,'jacket',s*5,1,.6)
    const lapel=box('GoldLapel',chest,C.gold,s*3.7,4,3.4,.5,4.5,.45);lapel.rotation.z=s*-.45
  }
  volume('CapeCollar',upper,[[-6,0],[-4,3.2],[4,3.2],[6,0],[0,-1.7]],3,'jacket',0,25.8,-.7)
  box('LeatherBelt',upper,C.leather,0,14.4,.3,10.7,1.4,6.1)
  const star=mesh('GoldBuckle',upper,new T.CylinderGeometry(1.3,1.3,.5,6),C.gold,0,14.4,3.65);star.rotation.x=Math.PI/2
  box('ShortsWaist',upper,C.shorts,0,13.7,0,10.5,2,5.5,'shorts')
  box('HipPouch',upper,C.leather,-7.1,12.3,.2,3.6,5.2,3.9)
  box('PouchFlap',upper,C.hat,-7.1,14.2,2.4,3.8,1.3,.7)
  box('PouchClasp',upper,C.gold,-7.1,12.9,2.85,.7,1,.3)
  for(const [s,side]of [[-1,'Left'],[1,'Right']] as const){
    const hip=get('Hip'+side),knee=get('Knee'+side),ankle=get('Ankle'+side),shoulder=get('Shoulder'+side),elbow=get('Elbow'+side),wrist=get('Wrist'+side)
    volume('TailoredShorts',hip,[[-2.5,0],[-2.6,-5.7],[2.5,-5.5],[2.4,0]],5.6,'shorts',0,0,0)
    round('Thigh',knee,C.skin,0,.2,0,3.7,2.5,3.9)
    volume('TallBoot',knee,[[-1.8,.2],[-2,-4.9],[2,-4.9],[1.9,.2]],4.1,'boots',0,-.3,0)
    volume('BootFoot',ankle,[[-2.1,.6],[-2.2,-1.8],[2.2,-1.8],[2,.6]],5.9,'boots',0,-.05,1)
    box('BootSole',ankle,C.ink,0,-1.8,1.2,4.5,.5,5.9)
    if(refineShoulders)fittedSleeve(shoulder,s)
    else volume('SculptedSleeve',shoulder,[[-2.2,.3],[-2.1,-3.9],[1.8,-4.7],[2.4,-.8]],4.9,'jacket')
    const badgeRadius=refineShoulders?1.05:1.3
    const badge=mesh('ShoulderEmblem',shoulder,new T.CylinderGeometry(badgeRadius,badgeRadius,refineShoulders?.25:.45,refineShoulders?8:6),C.gold,s*(refineShoulders?1.8:2),-1.4,refineShoulders?.55:1);badge.rotation.z=Math.PI/2
    volume('DarkSleeve',elbow,[[-1.5,.4],[-1.7,-3.9],[1.6,-3.8],[1.5,.3]],3.7,'boots')
    box('GloveCuff',wrist,C.jacket,0,.8,0,3.4,1.3,3.9)
    round('WhiteGlove',wrist,C.cream,0,-.65,.1,3.3,2.7,3.6)
    box('GloveHighlight',wrist,C.shirtLight,-.6,-.3,1.8,1.3,.5,.3)
  }
  const hairCrown=mesh('HairCrown',head,new T.SphereGeometry(1,16,12),'#ffffff',0,1.5,-2.1,'hair');hairCrown.scale.set(7.7,6.4,5.7)
  hairCrown.rotation.x=-.04
  const hairLock=(parent:T.Object3D,path:number[][])=>{
    const ps:number[]=[],uvs:number[]=[],ix:number[]=[],sides=10
    path.forEach(([x,y,z,width,depth],r)=>{for(let c=0;c<=sides;c++){const a=c/sides*Math.PI*2;ps.push(x+Math.cos(a)*width/2,y,z+Math.sin(a)*depth/2);uvs.push(c/sides,1-r/(path.length-1))}})
    for(let r=0;r<path.length-1;r++)for(let c=0;c<sides;c++){const a=r*(sides+1)+c;ix.push(a,a+sides+1,a+1,a+1,a+sides+1,a+sides+2)}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(ix);g.computeVertexNormals();return mesh('CurvedHairLock',parent,g,'#ffffff',0,0,0,'hair')
  }
  const locks:T.Group[]=[]
  for(const s of [-1,1]){
    const lock=group('PaintedHairLock_'+s,head,s*6.1,1.5,.1);locks.push(lock)
    hairLock(lock,[[0,3,0,3,3.5],[s*.5,-1,.4,3.5,3.5],[s*.8,-4,.2,3,3],[s*.3,-7,-.4,2.5,2.4],[-s*.8,-9,-.7,.2,.5]])
    const tail=group('HairSideTail_'+s,lock,s*.2,-7.6,-1);locks.push(tail)
    hairLock(tail,[[0,1,0,3,3],[s*.8,-3,-.4,3.7,3],[s*1.7,-8,-1.2,3.3,2.8],[s*.5,-12,-1.8,2.3,2],[-s,-14,-1.8,.1,.3]])
  }
  const fringe=volume('PartedFringe',head,[[-6,6.4],[-2,7.4],[2,6.5],[3.6,2.2],[1.8,-.8],[-.1,.4],[-1.2,3],[-3.2,.9],[-5.8,-.4]],2.2,'hair',-.5,0,4.1)
  fringe.rotation.z=.07
  const backLocks:T.Group[]=[]
  for(const [i,x]of [-5,-1.8,1.8,5].entries()){
    const lock=group('BackLock_'+i,head,x,3,-4.5);backLocks.push(lock)
    hairLock(lock,[[0,2,0,4.8,3.5],[.3,-3,-.5,5,3.6],[.6,-8,-.7,4.8,3.5],[i<2?-1:1,-13,-1.2,4.5,3],[i<2?-1.5:1.5,-18,-.5,3.5,2.2],[i<2?-2.8:2.8,-20,0,.2,.5]])
  }
  const kit={colors:C,group,part:(name:string,parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number)=>box(name,parent,color,x,y,z,w,h,d),round,paint:(n:T.Mesh)=>n,shade:(g:T.BufferGeometry)=>g}
  const headwear=attachOutriderHeadwear(kit,head)!
  // Widen and fold the existing identity-defining ribbon, then UV-paint both ears.
  headwear.position.y=1.5;headwear.position.z=.4;headwear.scale.set(1.12,1,1.05)
  headwear.traverse(n=>{if(n instanceof T.Mesh&&n.name==='SculptedRabbitRibbon'){
    n.material=material('#ffffff','bow')
    const p=n.geometry.getAttribute('position'),uv=n.geometry.getAttribute('uv')
    for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+2.5)/4.6,p.getY(i)/12)
    uv.needsUpdate=true
  }})
  const animeHead=refineHead?attachAmberAnimeHead(head,headwear,appearance):undefined
  const capeParent=group('FlexibleCape',chest,0,5.3,-3.9)
  const cols=12,rows=14,positions:number[]=[],uv:number[]=[],indices:number[]=[]
  for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
    const v=r/rows,u=c/cols,width=7+v*5.2
    const split=Math.abs(u-.5)<.09&&v>.7?(v-.7)*4:0
    positions.push((u*2-1)*width,-v*18.8+split,-v*1.6+Math.pow(Math.abs(u-.5)*2,3)*6*v);uv.push(u,1-v)
  }
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c;indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2)}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals()
  const cape=mesh('PaintedFlexibleCape',capeParent,geometry,'#ffffff',0,0,0,'cape')
  const attribute=geometry.getAttribute('position') as T.BufferAttribute
  bindTorsoParts(base,['Neck','CapeCollar'])
  return {...base,pose(action,phase,layers){
    base.pose(action,phase,{...layers,idleSoleHeight:2.05})
    const t=(layers?.secondaryMotion?.phase??phase)*Math.PI*2,walking=['walk','run','power_run','rescue_dash'].includes(action)||typeof layers?.locomotionPhase==='number',weight=layers?.secondaryMotion?.locomotion??(action==='run'?1.25:walking?1:0)
    // Head is already below the SpineBend pivot at y=14 in the shared skeleton.
    head.position.y=16.4;head.scale.setScalar(1.08)
    const {closed:shut,half}=refinedFaceState(action,phase,walking)
    face.visible=!animeHead&&!shut&&!half;faceHalf.visible=!animeHead&&half;faceClosed.visible=!animeHead&&shut
    for(const[s,side]of [[-1,'Left'],[1,'Right']]as const){
      get('Shoulder'+side).position.x=s*(refineShoulders?6.4:7)
      if(action!=='power_up')get('Hip'+side).position.x+=s*(2.9-2.6)
      if(neutralLimbPose(action))get('Shoulder'+side).rotation.z+=s*((refineShoulders?.055:.09)-(layers?.referenceStance?0:.045))
    }
    // The chest, hair and fabric have independent phase offsets, not one rigid sway.
    locks.forEach((n,i)=>{n.rotation.x=Math.sin(t-i*.55)*(.045+weight*.065);n.rotation.z=Math.sin(t-.7-i*.4)*(.025+weight*.04)})
    backLocks.forEach((n,i)=>{n.rotation.x=.04+Math.sin(t-.6-i*.3)*(.055+weight*.075);n.rotation.z=Math.sin(t-i*.35)*(.03+weight*.04)})
    animeHead?.pose(t,weight,phase,walking,action)
    const amp=.7+weight*.95
    for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
      const i=r*(cols+1)+c,v=r/rows,u=c/cols,flex=v*v
      attribute.setXYZ(i,positions[i*3]+Math.sin(t-.9*v+u)*amp*flex,positions[i*3+1]+Math.sin(t+u*3-v)*.35*flex,positions[i*3+2]-Math.sin(t-v*1.9+u*3.3)*amp*flex-weight*1.6*v)
    }
    attribute.needsUpdate=true
    cape.rotation.y=Math.sin(t-.3)*(.025+weight*.035)
    cape.rotation.x=action==='sleep'?.35:weight*.1
    capeParent.scale.set(1,action==='sleep'?.65:1,1)
  }}
}

export const createAmberHeadStudy=(appearance:ActorAppearance)=>createAmberStudy(appearance,true)
export const createAmberShoulderStudy=(appearance:ActorAppearance)=>createAmberStudy(appearance,true,true)
