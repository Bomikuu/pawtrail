import * as T from 'three'

/** Approved Amber profile, reusable when the owner explicitly chooses this shape. */
export const AMBER_FACE_SECTIONS:readonly (readonly [number,number,number])[]=[
  [-6.8,.25,1],[-6.1,1.9,1.9],[-4.8,3.5,2.7],[-3,4.6,3.35],[-1,5.25,3.85],
  [1.2,5.5,4],[3.4,5.3,3.85],[5.1,4.5,3.1],[6.2,2.5,2],
]

/** Curved face with planar front UVs and a separate untextured rear material group. */
export function createAnimeFaceGeometry(sections=AMBER_FACE_SECTIONS){
  const sides=32,p:number[]=[],uv:number[]=[],front:number[]=[],back:number[]=[]
  const halfWidth=Math.max(...sections.map(s=>s[1])),bottom=sections[0][0],height=sections[sections.length-1][0]-bottom
  for(const[y,width,depth]of sections)for(let c=0;c<=sides;c++){
    const angle=-Math.PI+c/sides*Math.PI*2,x=Math.sin(angle)*width
    p.push(x,y,Math.cos(angle)*depth+.15)
    uv.push(T.MathUtils.clamp((x+halfWidth)/(halfWidth*2),0,1),(y-bottom)/height)
  }
  for(let r=0;r<sections.length-1;r++)for(let c=0;c<sides;c++){
    const a=r*(sides+1)+c,angle=-Math.PI+(c+.5)/sides*Math.PI*2
    const list=Math.abs(angle)<=Math.PI/2?front:back
    list.push(a,a+1,a+sides+1,a+1,a+sides+2,a+sides+1)
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex([...front,...back]);g.computeVertexNormals()
  g.addGroup(0,front.length,0);g.addGroup(front.length,back.length,1)
  return g
}
