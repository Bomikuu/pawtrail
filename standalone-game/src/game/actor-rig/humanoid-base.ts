import * as T from 'three'

export const HUMANOID_BASE_REVISION='refined-humanoid-v2'
/** Same joint locations and extents as the original body; only surfaces change. */
function profile(width:number,height:number,depth:number,sections:readonly(readonly[number,number,number])[]){
 const sides=24,p:number[]=[],uv:number[]=[],indices:number[]=[]
 for(const[y,w,d]of sections)for(let c=0;c<=sides;c++){
  const angle=c/sides*Math.PI*2;p.push(Math.sin(angle)*width*w/2,y*height,Math.cos(angle)*depth*d/2);uv.push(c/sides,y+.5)
 }
 for(let r=0;r<sections.length-1;r++)for(let c=0;c<sides;c++){
  const a=r*(sides+1)+c;indices.push(a,a+1,a+sides+1,a+1,a+sides+2,a+sides+1)
 }
 const bottom=p.length/3;p.push(0,sections[0][0]*height,0);uv.push(.5,0)
 const top=p.length/3;p.push(0,sections.at(-1)![0]*height,0);uv.push(.5,1)
 const topRow=(sections.length-1)*(sides+1)
 for(let c=0;c<sides;c++)indices.push(bottom,c+1,c,top,topRow+c,topRow+c+1)
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry
}
const face=[[-.5,.03,.12],[-.45,.32,.6],[-.32,.68,.9],[-.14,.89,1],[.1,1,1],[.3,.94,.94],[.45,.55,.6],[.5,.03,.1]]as const
const torso=[[-.5,.76,.8],[-.38,.8,.87],[-.13,.86,.96],[.1,1,1],[.34,.95,.94],[.5,.65,.72]]as const
const limb=[[-.5,.7,.78],[-.38,.83,.9],[0,.94,1],[.3,1,.96],[.44,.78,.75],[.5,.1,.1]]as const
const pelvis=[[-.5,.86,.78],[-.3,1,.96],[.2,1,1],[.5,.85,.9]]as const
export function humanoidPartGeometry(name:string,width:number,height:number,depth:number){
 const sections=/^(TealShirt|TunicTorso)$/.test(name)?torso:/^(JacketSleeve|Forearm|Shin|CargoShorts)$/.test(name)?limb:/^ContinuousShortsWaist$/.test(name)?pelvis:undefined
 return sections?profile(width,height,depth,sections):undefined
}
export function humanoidFaceGeometry(){return profile(1,1,1,face)}
export function humanoidHairLockGeometry(){return profile(1,1,1,[[-.5,.03,.03],[-.3,.48,.55],[0,.94,1],[.3,1,.9],[.5,.35,.35]])}
