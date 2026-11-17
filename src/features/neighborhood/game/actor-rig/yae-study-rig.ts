import * as T from 'three'
import { createRescuer, type Rig } from './rigs'
import type { ActorAppearance } from './appearance'
import { yaeTexture, type YaeSurface } from './yae-study-textures'
import { createFaceContour } from './face-contour'
import { AMBER_FACE_SECTIONS, createAnimeFaceGeometry } from './anime-face-geometry'
import { archiveBodyGeometry, bindTorsoParts, refinedFaceState } from './refined-action-support'

type Section=[y:number,rx:number,rz:number,x?:number,z?:number]

/** Reference-built garments on the shared skeleton; independent of Amber's geometry. */
export function createYaeStudy(appearance:ActorAppearance,faceStyle:'yae'|'amber'='yae'):Rig{
  const base=createRescuer(appearance),C=appearance.colors
  const get=(name:string)=>base.root.getObjectByName(name)!
  archiveBodyGeometry(base,'YaeOriginalMeshArchive')
  const materials=new Map<string,T.MeshBasicMaterial>()
  const material=(color:string,surface?:YaeSurface)=>{
    const key=surface??color
    if(!materials.has(key))materials.set(key,new T.MeshBasicMaterial({color:surface?'#ffffff':color,map:surface?yaeTexture(surface):null,vertexColors:true,side:T.DoubleSide,toneMapped:false}))
    return materials.get(key)!
  }
  const group=(name:string,parent:T.Object3D,x=0,y=0,z=0)=>{const n=new T.Group();n.name=name;n.position.set(x,y,z);parent.add(n);return n}
  const shade=(g:T.BufferGeometry)=>{
    g.computeVertexNormals();const normals=g.getAttribute('normal'),colors:number[]=[]
    for(let i=0;i<normals.count;i++){
      const dot=-normals.getX(i)*.25+normals.getY(i)*.4+normals.getZ(i)*.3
      const s=dot<-.2?.8:dot<.1?.92:1;colors.push(s,s,s)
    }
    g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g
  }
  const mesh=(name:string,parent:T.Object3D,g:T.BufferGeometry,color:string,surface?:YaeSurface)=>{
    const n=new T.Mesh(shade(g),material(color,surface));n.name=name;parent.add(n);return n
  }
  const round=(name:string,parent:T.Object3D,color:string,x:number,y:number,z:number,rx:number,ry:number,rz:number)=>{
    const n=mesh(name,parent,new T.SphereGeometry(1,16,10),color);n.position.set(x,y,z);n.scale.set(rx,ry,rz);return n
  }
  const loftGeometry=(sections:Section[],segments=20,face=false)=>{
    const positions:number[]=[],uv:number[]=[],front:number[]=[],back:number[]=[]
    const top=sections[0][0],bottom=sections[sections.length-1][0],max=Math.max(...sections.map(s=>s[1]))
    sections.forEach(([y,rx,rz,x=0,z=0],r)=>{for(let c=0;c<=segments;c++){
      const a=-Math.PI+c/segments*Math.PI*2,px=Math.sin(a)*rx
      positions.push(px+x,y,Math.cos(a)*rz+z)
      uv.push(face?(px/max+1)/2:c/segments,(y-bottom)/(top-bottom))
    }})
    for(let r=0;r<sections.length-1;r++)for(let c=0;c<segments;c++){
      const a=r*(segments+1)+c,b=a+segments+1,theta=-Math.PI+(c+.5)/segments*Math.PI*2
      const list=face&&Math.abs(theta)>Math.PI/2?back:front;list.push(a,b,a+1,a+1,b,b+1)
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex([...front,...back])
    if(face){g.addGroup(0,front.length,0);g.addGroup(front.length,back.length,1)}
    return g
  }
  const loft=(name:string,parent:T.Object3D,sections:Section[],color:string,surface?:YaeSurface)=>mesh(name,parent,loftGeometry(sections),color,surface)
  const volume=(name:string,parent:T.Object3D,points:number[][],depth:number,color:string)=>{
    const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath()
    const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.12,bevelThickness:.1});g.translate(0,0,-depth/2)
    return mesh(name,parent,g,color)
  }
  const upper=get('UpperBody'),chest=get('ChestBreath'),head=get('Head')
  const amberFace=faceStyle==='amber'
  const faceSections:Section[]=amberFace
    ?[...AMBER_FACE_SECTIONS].reverse().map(([y,rx,rz])=>[y,rx,rz])
    :[[6.5,2.5,2],[5.2,4.25,3.1],[3,5.05,3.75],[1,5.25,3.95],[-1,5.05,3.7],[-3.4,4.2,3.1],[-5.3,2.6,2],[-6.6,.2,.9]]
  const faceG=amberFace?createAnimeFaceGeometry():shade(loftGeometry(faceSections,32,true))
  // Amber's painted face is unlit: retain Yae's own eye/mouth artwork without
  // extra surface shading, rather than transferring Amber's facial identity.
  const faceSkin=amberFace?new T.MeshBasicMaterial({color:C.skin,toneMapped:false}):material(C.skin)
  const faces=(['face','half','closed']as const).map(surface=>{
    const painted=amberFace?new T.MeshBasicMaterial({map:yaeTexture(surface),side:T.DoubleSide,toneMapped:false}):material('#ffffff',surface)
    const n=new T.Mesh(faceG,[painted,faceSkin]);n.name='YaeFace_'+surface;head.add(n);return n
  })
  const bottom=faceSections[faceSections.length-1],lower=faceSections.filter(([y])=>y<=1.2&&y>bottom[0])
  const zOffset=amberFace?.15:0
  const jaw=lower.map(([y,rx,rz])=>new T.Vector3(-rx*.96,y,rz*.28+zOffset+.08))
  jaw.push(new T.Vector3(0,bottom[0],bottom[2]+zOffset+.1))
  jaw.push(...[...lower].reverse().map(([y,rx,rz])=>new T.Vector3(rx*.96,y,rz*.28+zOffset+.08)))
  head.add(createFaceContour(faceG,amberFace?'#805542':'#8c5962',.45,jaw))
  for(const s of [-1,1])round('YaeEar',head,C.skin,s*(amberFace?5.15:5),amberFace?-1:-.9,amberFace?0:.1,amberFace?.7:.6,amberFace?1.25:1.1,amberFace?.85:.8)
  loft('YaeNeck',upper,[[28.1,1.6,1.55],[25.5,1.6,1.55]],C.skin)
  // Round crown with a raised face opening; the fringe has its own curved mesh.
  const cp:number[]=[],cu:number[]=[],ci:number[]=[],segments=40,rows=9
  for(let r=0;r<=rows;r++)for(let c=0;c<=segments;c++){
    const f=r/rows,a=c/segments*Math.PI*2,phi=f*Math.PI*.64
    cp.push(Math.sin(a)*Math.sin(phi)*6.3,2+Math.cos(phi)*6.3+Math.pow(f,5)*Math.max(0,Math.cos(a))*4.8,-1+Math.cos(a)*Math.sin(phi)*4.8)
    cu.push(c/segments,1-f)
  }
  for(let r=0;r<rows;r++)for(let c=0;c<segments;c++){const a=r*(segments+1)+c;ci.push(a,a+segments+1,a+1,a+1,a+segments+1,a+segments+2)}
  const crown=new T.BufferGeometry();crown.setAttribute('position',new T.Float32BufferAttribute(cp,3));crown.setAttribute('uv',new T.Float32BufferAttribute(cu,2));crown.setIndex(ci);mesh('YaeRoundedCrown',head,crown,C.hair,'hair')
  const hairRoots:T.Group[]=[],hairTails:T.Group[]=[]
  const lock=(name:string,parent:T.Object3D,sections:Section[],short=false)=>loft(name,parent,sections,C.hair,short?'fringe':'hair')
  const sweep=group('YaeSweptBang',head,-3.5,6,2.9);hairRoots.push(sweep)
  lock('YaeCrossingForelock',sweep,[[1,1,1.1],[0,2.5,1.1,1],[-1.5,2.6,1,2.2,.8],[-3,2,1,3.8,1.1],[-4.5,1.2,.65,5.2,1],[-5.2,.04,.1,5.8,.8]],true)
  const other=group('YaePartedBang',head,-4,4.5,2.2);hairRoots.push(other)
  lock('YaeLeftFringe',other,[[1,1.6,1.3],[0,1.7,1.2,-.3,.7],[-2,1.3,1,-.4,1.1],[-4,.8,.7,-.3,1.1],[-5.7,.03,.1,.2,1]],true)
  for(const s of [-1,1]){
    const side=group('YaeTempleLock_'+s,head,s*(amberFace?5.3:5.1),2,.1);hairRoots.push(side)
    lock('YaeCheekWisp',side,[[2,1.3,1.6],[0,1.5,1.5,s*.1,.4],[-2.6,1.1,1.2,s*.4,.7],[-4.8,.6,.7,s*1,.7],[-5.7,.03,.1,s*1.7,.4]],true)
    const long=group('YaeLongSide_'+s,head,s*5.4,-2,-1);hairTails.push(long)
    lock('YaeLongPinkTress',long,[[2,1.5,1.6],[0,1.9,1.65],[-4,2,1.5,s*.5,-.3],[-9,1.7,1.3,s*1.3,-.5],[-14,1.3,1,s*2.2,-.5],[-18,.65,.6,s*2.9,-.1],[-20,.025,.1,s*3.7,.4]])
    const earRoot=group('YaeFoxEar_'+s,head,s*5.5,2.4,-.5)
    volume('YaePointedFoxEar',earRoot,[[0,2.1],[s*5.4,1.2],[s*3.1,-.7],[0,-1.1]],1.6,C.hair)
    const inner=volume('YaeInnerFoxEar',earRoot,[[s*.8,1.4],[s*4.2,1],[s*2.7,-.2],[s*.8,-.5]],.2,C.hairLight);inner.position.z=.95
    const ornament=group('YaeGoldTemple_'+s,head,s*5.4,5.8,-.5)
    const arc=mesh('YaeGoldenHeadArc',ornament,new T.TorusGeometry(2.3,.32,5,16,Math.PI*.9),C.gold);arc.rotation.z=s*.45;arc.position.y=.3;arc.scale.x=.7
    const jewel=mesh('YaeTempleAmethyst',ornament,new T.OctahedronGeometry(.8),C.ribbon);jewel.position.set(s*.1,-.9,1)
    const pendant=group('YaeHangingEarring_'+s,head,s*6.2,-2.4,1.1)
    const ring=mesh('YaePendantGold',pendant,new T.TorusGeometry(1.25,.22,4,12),C.gold);ring.scale.y=1.4
    const gem=mesh('YaePendantViolet',pendant,new T.OctahedronGeometry(1),C.ribbon);gem.scale.z=.45;gem.position.z=.2
    volume('YaePendantTassel',pendant,[[-.7,-1.9],[0,-2.9],[.7,-1.9],[0,-1.3]],.35,C.gold)
  }
  for(const[i,x]of [-4.2,-1.4,1.4,4.2].entries()){
    const t=group('YaeBackTress_'+i,head,x,3,-4.3);hairTails.push(t)
    const s=i<2?-1:1
    lock('YaeLayeredBackHair',t,[[2,1.3,1.6],[0,2,1.8],[-6,2.1,1.7,s*.3,-.3],[-13,2,1.5,s*.7,-.6],[-19,1.6,1.1,s*1.2,-.4],[-24,.7,.6,s*1.8,0],[-26,.03,.08,s*2.2,.5]])
  }
  // Sleeveless fitted shrine top, separate flowing sleeves and a split layered skirt.
  const bodice=loft('YaeIvoryBodice',chest,[[5.3,3.5,2.4],[3,4.8,2.9],[0,4.4,2.7],[-3,3.7,2.5],[-5.7,4.4,2.7]],C.cream,'bodice')
  const frontUv=bodice.geometry.getAttribute('uv'),bp=bodice.geometry.getAttribute('position')
  for(let i=0;i<frontUv.count;i++)frontUv.setX(i,(bp.getX(i)/4.8+1)/2)
  loft('YaeStandingWhiteCollar',upper,[[28.5,1.8,1.8],[27,2.2,2],[25.9,3.3,2.3]],C.cream)
  loft('YaeCrimsonWaistSash',upper,[[15.2,4.5,2.9],[13.3,4.9,3]],C.jacket)
  const waist=mesh('YaeGoldWaistClasp',upper,new T.OctahedronGeometry(1.2),C.gold);waist.position.set(0,14.3,3.3);waist.scale.z=.35
  const ribbonRoot=group('YaeBackSash',upper,0,14.4,-3.6)
  for(const s of [-1,1]){const bow=round('YaeRedSashLoop',ribbonRoot,C.jacket,s*2.2,0,0,2.5,1.2,.6);bow.rotation.z=s*.3}
  const panels:{mesh:T.Mesh;rest:Float32Array;phase:number;length:number}[]=[]
  const cloth=(name:string,parent:T.Object3D,width:number,length:number,surface:YaeSurface,phase:number,flare=.25)=>{
    const p:number[]=[],uv:number[]=[],ix:number[]=[],cols=8,rows=10
    for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
      const v=r/rows,u=c/cols
      p.push((u*2-1)*width/2*(1+v*flare),-v*length,Math.cos(u*Math.PI*4)*.18*v)
      uv.push(u,1-v)
    }
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c;ix.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2)}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix)
    const n=mesh(name,parent,g,C.cream,surface);panels.push({mesh:n,rest:new Float32Array(p),phase,length});return n
  }
  for(const s of [-1,1]){
    const hip=get(s<0?'HipLeft':'HipRight'),knee=get(s<0?'KneeLeft':'KneeRight'),ankle=get(s<0?'AnkleLeft':'AnkleRight')
    loft('YaeBareThigh',hip,[[.5,1.65,1.8],[-5.3,1.5,1.65]],C.skin)
    loft('YaeBareCalf',knee,[[.2,1.5,1.65],[-2.3,1.25,1.5],[-5.2,.9,1.1]],C.skin)
    round('YaeSandalSole',ankle,C.shoe,0,-1.3,1.1,1.45,.65,2.7)
    round('YaeFoot',ankle,C.skin,0,-.55,.9,1.25,.65,2.3)
    const strap=mesh('YaeRedSandalStrap',ankle,new T.TorusGeometry(1.05,.18,4,12),C.jacket);strap.rotation.x=Math.PI/2;strap.position.set(0,-.05,1.7);strap.scale.z=1.4
    const shoulder=get(s<0?'ShoulderLeft':'ShoulderRight'),elbow=get(s<0?'ElbowLeft':'ElbowRight'),wrist=get(s<0?'WristLeft':'WristRight')
    loft('YaeExposedShoulder',shoulder,[[.55,.2,.3],[-.1,1.45,1.6],[-1.4,1.55,1.7],[-3.2,1.2,1.4],[-4.7,1.05,1.25]],C.skin)
    loft('YaeDetachedSleeveCuff',shoulder,[[-2.4,1.45,1.55],[-3.1,1.65,1.7],[-4.5,1.55,1.6]],C.jacket)
    loft('YaeForearm',elbow,[[.2,1.05,1.2],[-3.7,.8,1]],C.skin)
    round('YaeHand',wrist,C.skin,0,-.4,.15,.9,1.05,1.1)
    const sleeve=group('YaeFlowingSleeve_'+s,elbow,s*.2,.8,-.5)
    const clothSleeve=cloth('YaeEmbroideredSleeve',sleeve,4.7,8.2,'sleeve',s,1.1);clothSleeve.rotation.y=s*.18
    const armGold=mesh('YaeArmGoldFlower',shoulder,new T.OctahedronGeometry(.85),C.gold);armGold.position.set(s*1.45,-2.8,.9);armGold.scale.z=.4
    const sidePanel=group('YaeSideSkirt_'+s,upper,s*4.6,14.1,-.4);sidePanel.rotation.y=s*1.15
    cloth('YaeCrimsonSidePanel',sidePanel,5.4,11.3,'skirt',s*.7,.5)
    const back=group('YaeBackRobe_'+s,upper,s*2.6,14.2,-3.1)
    cloth('YaeLongBackRobe',back,5.7,12.2,'sleeve',s*.8,.4)
  }
  const apron=group('YaeFrontShrinePanel',upper,0,14,3.2)
  cloth('YaeIvoryFrontApron',apron,5.6,7.6,'sleeve',.5,.2)
  bindTorsoParts(base,['YaeNeck','YaeStandingWhiteCollar'])
  return {...base,pose(action,phase,layers){
    base.pose(action,phase,{...layers,idleSoleHeight:1.625})
    const walking=['walk','run','power_run','rescue_dash'].includes(action)||typeof layers?.locomotionPhase==='number'
    const t=(layers?.secondaryMotion?.phase??phase)*Math.PI*2,weight=layers?.secondaryMotion?.locomotion??(action==='run'?1.25:walking?1:0)
    head.position.y=17.2;head.scale.setScalar(amberFace?1.08:1.06)
    const {closed:shut,half}=refinedFaceState(action,phase,walking)
    faces[0].visible=!shut&&!half;faces[1].visible=half;faces[2].visible=shut
    for(const[s,side]of [[-1,'Left'],[1,'Right']]as const){get('Shoulder'+side).position.x=s*5.6;if(action==='idle'&&layers?.referenceStance)get('Shoulder'+side).rotation.z=s*.045;if(action!=='power_up')get('Hip'+side).position.x+=s*(2.1-2.6)}
    hairRoots.forEach((n,i)=>{n.rotation.x=Math.sin(t-i*.5)*(.012+weight*.018);n.rotation.z=Math.sin(t-.4-i*.3)*.018})
    hairTails.forEach((n,i)=>{n.rotation.x=.025+Math.sin(t-.8-i*.25)*(.045+weight*.055);n.rotation.z=Math.sin(t-.4-i*.3)*(.018+weight*.025)})
    for(const panel of panels){
      const sleeve=panel.mesh.name==='YaeEmbroideredSleeve'
      const hipHeight=(get('HipLeft').position.y+get('HipRight').position.y)/2
      panel.mesh.scale.y=action==='sleep'?.65:sleeve?(['sit','float','ride'].includes(action)?.72:1):T.MathUtils.clamp((hipHeight-1)/11.4,.35,1)
      const p=panel.mesh.geometry.getAttribute('position')as T.BufferAttribute
      for(let i=0;i<p.count;i++){
        const x=panel.rest[i*3],y=panel.rest[i*3+1],z=panel.rest[i*3+2],v=-y/panel.length,flex=v*v
        p.setXYZ(i,x+Math.sin(t-v+panel.phase)*.25*flex,y+Math.sin(t+panel.phase+x)*.14*flex,z-Math.sin(t-v*1.7+panel.phase+x*.12)*(.35+weight*.55)*flex-weight*.65*v)
      }
      p.needsUpdate=true
    }
  }}
}

/** Optional experiment; the preferred default keeps Yae's own face proportions. */
export const createYaeAmberStyleStudy=(appearance:ActorAppearance)=>createYaeStudy(appearance,'amber')
