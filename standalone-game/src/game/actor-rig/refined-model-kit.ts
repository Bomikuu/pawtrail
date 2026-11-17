import * as T from 'three'

export type BodySection=[y:number,width:number,depth:number,x?:number,z?:number]
/** Curved anatomy, thick silhouette pieces and layered cloth on a shared rig. */
export function refinedModelKit<Surface extends string>(texture:(surface:Surface)=>T.Texture){
 const materials=new Map<string,T.MeshBasicMaterial>()
 const material=(color:string,surface?:Surface)=>{
  const key=surface??color
  if(!materials.has(key))materials.set(key,new T.MeshBasicMaterial({color:surface?'#ffffff':color,map:surface?texture(surface):null,side:T.DoubleSide,toneMapped:false,vertexColors:true}))
  return materials.get(key)!
 }
 const group=(name:string,parent:T.Object3D,x=0,y=0,z=0)=>{const n=new T.Group();n.name=name;n.position.set(x,y,z);parent.add(n);return n}
 const mesh=(name:string,parent:T.Object3D,g:T.BufferGeometry,color:string,surface?:Surface)=>{
  g.computeVertexNormals();const normals=g.getAttribute('normal'),colors:number[]=[]
  for(let i=0;i<normals.count;i++){const dot=-normals.getX(i)*.22+normals.getY(i)*.35+normals.getZ(i)*.28,shade=dot<-.2?.84:dot<.1?.95:1;colors.push(shade,shade,shade)}
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));const n=new T.Mesh(g,material(color,surface));n.name=name;parent.add(n);return n
 }
 const round=(name:string,parent:T.Object3D,color:string,x:number,y:number,z:number,rx:number,ry:number,rz:number,surface?:Surface)=>{
  const n=mesh(name,parent,new T.SphereGeometry(1,20,12),color,surface);n.position.set(x,y,z);n.scale.set(rx,ry,rz);return n
 }
 const loft=(name:string,parent:T.Object3D,sections:BodySection[],color:string,surface?:Surface,frontUV=false,arc:readonly[number,number]=[-Math.PI,Math.PI*2])=>{
  const segments=24,p:number[]=[],uv:number[]=[],ix:number[]=[],top=sections[0][0],bottom=sections.at(-1)![0],max=Math.max(...sections.map(s=>s[1]))
  for(const[y,w,d,x=0,z=0]of sections)for(let c=0;c<=segments;c++){
   const a=arc[0]+c/segments*arc[1],px=Math.sin(a)*w
   p.push(px+x,y,Math.cos(a)*d+z);uv.push(frontUV?(px/max+1)/2:c/segments,(y-bottom)/(top-bottom))
  }
  for(let r=0;r<sections.length-1;r++)for(let c=0;c<segments;c++){const a=r*(segments+1)+c,b=a+segments+1;ix.push(a,b,a+1,a+1,b,b+1)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);return mesh(name,parent,g,color,surface)
 }
 const volume=(name:string,parent:T.Object3D,points:number[][],depth:number,color:string,surface?:Surface)=>{
  const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath()
  const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.14,bevelThickness:.12,bevelSegments:2,steps:1});g.translate(0,0,-depth/2);g.computeBoundingBox()
  const box=g.boundingBox!,p=g.getAttribute('position'),uv=g.getAttribute('uv')
  for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)-box.min.x)/Math.max(.01,box.max.x-box.min.x),(p.getY(i)-box.min.y)/Math.max(.01,box.max.y-box.min.y))
  return mesh(name,parent,g,color,surface)
 }
 type ClothSurface={mesh:T.Mesh;rest:Float32Array;progress:Float32Array}
 const cloths:{surfaces:ClothSurface[];phase:number}[]=[]
 const cloth=(name:string,parent:T.Object3D,width:number,length:number,surface:Surface,phase:number,options:{flare?:number;curve?:number;lining?:Surface;sweep?:number;lift?:number;thickness?:number;taper?:number}={})=>{
  const cols=10,rows=12,p:number[]=[],uv:number[]=[],ix:number[]=[],progress:number[]=[]
  for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
   const u=c/cols,v=r/rows,taper=Math.max(.025,1-(options.taper??0)*Math.pow(v,1.5));p.push((u*2-1)*width/2*(1+v*(options.flare??.25))*taper+Math.sin(v*Math.PI)*(options.sweep??0),-v*length+Math.sin(v*Math.PI)*(options.lift??0),Math.sin(u*Math.PI)*(options.curve??.5)*taper+Math.sin(u*Math.PI*4)*.12*v*taper+Math.sin(v*Math.PI*1.4)*(options.sweep??0)*.4);uv.push(u,1-v);progress.push(v)
  }
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c;ix.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix)
  g.computeVertexNormals()
  const normals=g.getAttribute('normal'),half=(options.thickness??.22)/2
  const front=p.map((value,i)=>value+normals.array[i]*half),back=p.map((value,i)=>value-normals.array[i]*half)
  const geometry=(points:number[],indices:number[],coords:number[])=>{
   const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(points,3));result.setAttribute('uv',new T.Float32BufferAttribute(coords,2));result.setIndex(indices);return result
  }
  const n=mesh(name,parent,geometry(front,ix,uv),'#ffffff',surface)
  n.material=n.material.clone();n.material.side=T.FrontSide
  const lining=mesh(name+'Lining',parent,geometry(back,ix,uv),'#ffffff',options.lining??surface)
  lining.material=lining.material.clone();lining.material.side=T.BackSide
  // Close the actual perimeter, including the hem; the reverse is not another
  // coplanar double-sided sheet with an almost invisible positional offset.
  const boundary:number[]=[]
  for(let c=0;c<=cols;c++)boundary.push(c)
  for(let r=1;r<=rows;r++)boundary.push(r*(cols+1)+cols)
  for(let c=cols-1;c>=0;c--)boundary.push(rows*(cols+1)+c)
  for(let r=rows-1;r>0;r--)boundary.push(r*(cols+1))
  const edgePoints:number[]=[],edgeUV:number[]=[],edgeIndices:number[]=[],edgeProgress:number[]=[]
  for(let j=0;j<=boundary.length;j++){
   const index=boundary[j%boundary.length]
   for(const [side,points]of[front,back].entries()){
    edgePoints.push(...points.slice(index*3,index*3+3));edgeUV.push(j/boundary.length,side);edgeProgress.push(progress[index])
   }
   if(j<boundary.length){const a=j*2;edgeIndices.push(a,a+1,a+2,a+2,a+1,a+3)}
  }
  const edge=mesh(name+'TexturedEdge',parent,geometry(edgePoints,edgeIndices,edgeUV),'#ffffff',surface)
  cloths.push({phase,surfaces:[{mesh:n,rest:new Float32Array(front),progress:new Float32Array(progress)},{mesh:lining,rest:new Float32Array(back),progress:new Float32Array(progress)},{mesh:edge,rest:new Float32Array(edgePoints),progress:new Float32Array(edgeProgress)}]})
  g.dispose();return n
 }
 const animateCloth=(time:number,weight:number,resting=false,hemScale=1)=>{
  for(const c of cloths){
   for(const part of c.surfaces){const n=part.mesh,p=n.geometry.getAttribute('position')as T.BufferAttribute
    for(let i=0;i<p.count;i++){const x=part.rest[i*3],y=part.rest[i*3+1],z=part.rest[i*3+2],v=part.progress[i],flex=v*v;p.setXYZ(i,x+Math.sin(time-v*1.6+c.phase)*(.18+weight*.24)*flex,y+Math.sin(time+x*.13+c.phase)*.1*flex,z-Math.sin(time-v*2+c.phase)*(.28+weight*.48)*flex-weight*.45*v)}
    p.needsUpdate=true;n.scale.y=(resting?.72:1)*hemScale
   }
  }
 }
 return{group,mesh,round,loft,volume,cloth,animateCloth,material}
}
