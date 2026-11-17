import type {ItemAction,Vec,Rect} from './document'
import {segmentRect} from './spatial'
const ease=(t:number)=>t*t*(3-2*t)
export function chainProgress(action:ItemAction,time:number){const c=action.chain;return c?Math.max(0,Math.min(1,(time-c.start)/(c.end-c.start))):0}
/** Ground projection of an authored, segmented weapon; the visible hand height is separate. */
export function chainPath(action:ItemAction,time:number,origin:Vec,f:Vec,solids:Rect[]=[]):Vec[]{
 const c=action.chain
 if(!c||time<c.start||time>c.end)return[]
 const t=chainProgress(action,time),extension=c.mode==='orbit'?ease(Math.max(0,Math.min(1,t/.15,(1-t)/.15))):Math.sin(Math.PI*t)**.65
 const angle=(c.mode==='thrust'?0:c.mode==='orbit'?t*c.angle*Math.PI/180-Math.PI:(ease(t)-.5)*c.angle*Math.PI/180)*(c.reverse?-1:1)
 const dir={x:f.x*Math.cos(angle)-f.y*Math.sin(angle),y:f.x*Math.sin(angle)+f.y*Math.cos(angle)}
 const reach=10+(c.reach-10)*extension,side={x:dir.y,y:-dir.x},points:Vec[]=[{...origin}]
 for(let i=1;i<=c.segments;i++){
  const u=i/c.segments,bend=Math.sin(u*Math.PI)*(c.mode==='thrust'?Math.sin(t*Math.PI*2)*5:reach*.22)
  let next:Vec
  if(c.mode==='orbit'){
   // Two close coils around the body, then an outward tail. Two whole turns
   // keep the tip's attack angle synchronized with the existing hit windows.
   const coil=Math.min(1,u/.65),tail=Math.max(0,(u-.65)/.35)
   const radius=u<.65?(12+coil*5)*Math.min(1,u/.08)*extension:17*extension+(reach-17*extension)*ease(tail)
   const a=angle+coil*Math.PI*4
   const d={x:f.x*Math.cos(a)-f.y*Math.sin(a),y:f.x*Math.sin(a)+f.y*Math.cos(a)}
   next={x:origin.x+d.x*radius,y:origin.y+d.y*radius}
  }else next={x:origin.x+dir.x*reach*u+side.x*bend,y:origin.y+dir.y*reach*u+side.y*bend}
  const prev=points.at(-1)!
  let fraction=1
  for(const solid of solids){const contact=segmentRect(prev,next,solid);if(contact!==null)fraction=Math.min(fraction,contact)}
  points.push({x:prev.x+(next.x-prev.x)*fraction,y:prev.y+(next.y-prev.y)*fraction})
  if(fraction<1)break
 }
 return points
}
export function chainTouches(action:ItemAction,before:number,after:number,origin:Vec,f:Vec,target:Rect,solids:Rect[]){
 const c=action.chain;if(!c)return true
 // Four intermediate samples plus segment sweeps prevent narrow targets being skipped by a fast whip.
 let previous:Vec[]=[]
 const inflated={x:target.x-c.width/2,y:target.y-c.width/2,width:target.width+c.width,height:target.height+c.width}
 for(let sample=0;sample<=4;sample++){
  const points=chainPath(action,before+(after-before)*sample/4,origin,f,solids)
  for(let i=1;i<points.length;i++)if(segmentRect(points[i-1],points[i],inflated)!==null||previous[i]&&segmentRect(previous[i],points[i],inflated)!==null)return true
  previous=points
 }
 return false
}
