import * as T from 'three'
import type { ActorAppearance } from './appearance'
import { amberTexture, type AmberSurface } from './amber-study-textures'
import { createAnimeFaceGeometry } from './anime-face-geometry'
import { refinedFaceState } from './refined-action-support'

/** Head-only revision; the caller owns the unchanged body and cloth timeline. */
export function attachAmberAnimeHead(head:T.Object3D,headwear:T.Group,appearance:ActorAppearance){
  const C=appearance.colors
  // Keep earlier meshes for deterministic disposal, but hide only head artwork.
  head.traverse(n=>{if(n instanceof T.Mesh){let p:T.Object3D|null=n;while(p&&p!==headwear)p=p.parent;if(p!==headwear)n.visible=false}})
  const materials=new Map<string,T.MeshBasicMaterial>()
  const mat=(surface:AmberSurface)=>{
    if(!materials.has(surface))materials.set(surface,new T.MeshBasicMaterial({map:amberTexture(surface,C),toneMapped:false,side:T.DoubleSide,vertexColors:surface.startsWith('hair-')}))
    return materials.get(surface)!
  }
  const group=(name:string,parent:T.Object3D,x=0,y=0,z=0)=>{const n=new T.Group();n.name=name;n.position.set(x,y,z);parent.add(n);return n}
  const skin=new T.MeshBasicMaterial({color:C.skin,toneMapped:false})
  const geometry=(p:number[],uv:number[],indices:number[])=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g}
  const paintShape=(g:T.BufferGeometry)=>{
    const normal=g.getAttribute('normal'),colors:number[]=[]
    for(let i=0;i<normal.count;i++){
      const light=normal.getZ(i)*.35-normal.getX(i)*.2+normal.getY(i)*.15
      const shade=light<-.15?.79:light<.1?.91:1
      colors.push(shade,shade,shade)
    }
    g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g
  }
  const mount=(name:string,parent:T.Object3D,g:T.BufferGeometry,surface:AmberSurface)=>{const n=new T.Mesh(paintShape(g),mat(surface));n.name=name;parent.add(n);return n}
  // Shared approved profile; preserves Amber's existing vertices, UVs and groups.
  const faceGeometry=createAnimeFaceGeometry()
  const faces=(['anime-face','anime-half','anime-closed']as const).map(surface=>{
    const n=new T.Mesh(faceGeometry,[mat(surface),skin]);n.name='CurvedFace_'+surface;head.add(n);return n
  })
  for(const side of [-1,1]){const ear=new T.Mesh(new T.SphereGeometry(1,10,8),skin);ear.scale.set(.7,1.25,.85);ear.position.set(side*5.15,-1,0);head.add(ear)}
  // Rounded cap with a raised front opening and an irregular, lock-shaped rim.
  const cp:number[]=[],cu:number[]=[],ci:number[]=[],rings=8,segments=40
  for(let r=0;r<=rings;r++)for(let c=0;c<=segments;c++){
    const f=r/rings,a=c/segments*Math.PI*2,frontness=Math.max(0,Math.cos(a)),phi=f*Math.PI*.63
    const width=Math.sin(phi)*6.4,depth=Math.sin(phi)*4.9
    const rim=Math.pow(f,5)*(frontness*4.8+.35*Math.sin(a*6))
    cp.push(Math.sin(a)*width,2+Math.cos(phi)*6.2+rim,-1.25+Math.cos(a)*depth)
    cu.push(c/segments,1-f)
  }
  for(let r=0;r<rings;r++)for(let c=0;c<segments;c++){const a=r*(segments+1)+c;ci.push(a,a+1,a+segments+1,a+1,a+segments+2,a+segments+1)}
  mount('LayeredHairCrown',head,geometry(cp,cu,ci),'hair-crown')
  // The old rectangular goggle band exposed a broad top face above the crown.
  // Fit the strap to the skull instead, keeping the existing lenses and ribbon.
  const oldBand=headwear.getObjectByName('GoggleHeadband');if(oldBand)oldBand.visible=false
  const strapP:number[]=[],strapUv:number[]=[],strapIx:number[]=[]
  for(let r=0;r<2;r++)for(let c=0;c<=40;c++){
    const a=c/40*Math.PI*2
    strapP.push(Math.sin(a)*6.2,3.7+r*.8,-1+Math.cos(a)*4.75)
    strapUv.push(c/40,r)
  }
  for(let c=0;c<40;c++)strapIx.push(c,c+1,c+41,c+1,c+42,c+41)
  const strap=new T.Mesh(geometry(strapP,strapUv,strapIx),new T.MeshBasicMaterial({color:C.leather,toneMapped:false,side:T.DoubleSide}));strap.name='FittedGoggleStrap';headwear.add(strap)
  const roots:T.Group[]=[],tails:T.Group[]=[]
  const lock=(name:string,parent:T.Object3D,path:number[][],surface:AmberSurface)=>{
    const p:number[]=[],uv:number[]=[],ix:number[]=[],sides=12
    path.forEach(([x,y,z,width,depth],r)=>{for(let c=0;c<=sides;c++){
      const a=c/sides*Math.PI*2
      p.push(x+Math.cos(a)*width/2,y,z+Math.sin(a)*depth/2)
      uv.push((Math.cos(a)+1)/2,1-r/(path.length-1))
    }})
    for(let r=0;r<path.length-1;r++)for(let c=0;c<sides;c++){const a=r*(sides+1)+c;ix.push(a,a+1,a+sides+1,a+1,a+sides+2,a+sides+1)}
    return mount(name,parent,geometry(p,uv,ix),surface)
  }
  // Separate swept bangs, not one thick extruded forehead panel.
  const bang=group('SweptCenterBang',head,-.8,6.4,2.3);roots.push(bang)
  lock('MainSweptFringe',bang,[[0,0,0,4.3,2.2],[.8,-1.6,1,4.1,1.8],[1.5,-3.4,1.8,3.3,1.4],[1.9,-5.1,2,1.9,.8],[.9,-6.3,2,.08,.1]],'hair-fringe')
  for(const s of [-1,1]){
    const fringe=group('TempleFringe_'+s,head,s*3.8,5.5,1.5);roots.push(fringe)
    lock('TaperedTempleBang',fringe,[[0,0,0,3.5,2.5],[s*.8,-1.8,1.3,3.2,2],[s*1.1,-3.9,1.8,2.5,1.6],[s*.8,-5.5,1.7,1.4,.8],[-s*.35,-6.5,1.9,.06,.12]],'hair-fringe')
    const cheek=group('CheekLock_'+s,head,s*5.6,1,.1);roots.push(cheek)
    lock('SharpCheekLock',cheek,[[0,1.2,0,2.8,3.1],[s*.2,-1.8,.3,2.8,2.7],[s*.8,-4.7,.3,2.1,2.1],[s*1.2,-6.3,0,1.1,1],[-s*.3,-7.2,.2,.03,.1]],'hair-lock')
    const tail=group('LongSideHair_'+s,cheek,s*.1,-6,-1);tails.push(tail)
    lock('PointedSideTail',tail,[[0,0,0,2.8,2.7],[s*.8,-3.6,-.4,3.2,2.5],[s*1.5,-7.6,-.8,2.7,2.1],[s*.8,-11,-.6,1.8,1.4],[-s*1.3,-13,.1,.03,.12]],'hair-lock')
    const flick=group('HairFlick_'+s,head,s*5.6,3,-.8)
    lock('FineSilhouetteFlick',flick,[[0,0,0,1.3,1.4],[s*1.5,-1,-.1,1.1,1],[s*2.2,-2.7,0,.04,.08]],'hair-fringe')
  }
  for(const[i,x]of [-4.3,-1.4,1.4,4.3].entries()){
    const root=group('BackHairLayer_'+i,head,x,3,-4.35);tails.push(root)
    const s=i<2?-1:1
    lock('SeparatedBackLock',root,[[0,1,0,3.7,3.2],[s*.1,-3,-.5,4,3],[s*.4,-7,-.7,3.6,2.8],[s*.8,-12,-.9,3.2,2.4],[s*.6,-16,-.5,2.3,1.6],[-s*1.2,-19,.3,.02,.1]],'hair-lock')
  }
  headwear.scale.set(1,1,1);headwear.position.y=1.1
  return {pose(t:number,weight:number,phase:number,walking:boolean,action='idle'){
    const {closed,half}=refinedFaceState(action,phase,walking)
    faces[0].visible=!closed&&!half;faces[1].visible=half;faces[2].visible=closed
    roots.forEach((n,i)=>{n.rotation.x=Math.sin(t-i*.4)*(.014+weight*.03);n.rotation.z=Math.sin(t-.5-i*.35)*(.012+weight*.022)})
    tails.forEach((n,i)=>{n.rotation.x=.03+Math.sin(t-.6-i*.3)*(.055+weight*.075);n.rotation.z=Math.sin(t-i*.4)*(.025+weight*.035)})
  }}
}
