import type {Vec,Rect,HitArea} from './document'
export const directions=['down','down_left','left','up_left','up','up_right','right','down_right']
export function forward(direction:string):Vec{const angle=Math.max(0,directions.indexOf(direction))*Math.PI/4;return{x:-Math.sin(angle),y:Math.cos(angle)}}
export const center=(r:Rect):Vec=>({x:r.x+r.width/2,y:r.y+r.height/2})
export const overlap=(a:Rect,b:Rect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y
const corners=(r:Rect)=>[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}]
export function segmentRect(start:Vec,end:Vec,r:Rect){let lo=0,hi=1;for(const axis of ['x','y'] as const){const delta=end[axis]-start[axis],min=r[axis],max=min+(axis==='x'?r.width:r.height);if(Math.abs(delta)<1e-9){if(start[axis]<min||start[axis]>max)return null}else{let a=(min-start[axis])/delta,b=(max-start[axis])/delta;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return null}}return lo}
function distanceSegment(p:Vec,a:Vec,b:Vec){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t)}
/** Continuous oriented rectangle sweep. Tests its full band against world axes and both local axes. */
export function sweepBand(start:Vec,end:Vec,f:Vec,width:number,depth:number,r:Rect){
 const side={x:f.y,y:-f.x},c=center(r),delta={x:end.x-start.x,y:end.y-start.y};let enter=0,exit=1
 for(const axis of [{x:1,y:0},{x:0,y:1},f,side]){const radius=(Math.abs(side.x*axis.x+side.y*axis.y)*width+Math.abs(f.x*axis.x+f.y*axis.y)*depth+Math.abs(axis.x)*r.width+Math.abs(axis.y)*r.height)/2,p=(start.x-c.x)*axis.x+(start.y-c.y)*axis.y,v=delta.x*axis.x+delta.y*axis.y;if(Math.abs(v)<1e-9){if(Math.abs(p)>radius)return null}else{let a=(-radius-p)/v,b=(radius-p)/v;if(a>b)[a,b]=[b,a];enter=Math.max(enter,a);exit=Math.min(exit,b);if(enter>exit)return null}}
 return enter
}
export function areaOrigin(origin:Vec,f:Vec,h:HitArea){return{x:origin.x+f.x*h.offset,y:origin.y+f.y*h.offset}}
export function areaHits(origin:Vec,f:Vec,h:HitArea,r:Rect){
 const o=areaOrigin(origin,f,h),end={x:o.x+f.x*h.range,y:o.y+f.y*h.range}
 if(h.kind==='box')return sweepBand(o,end,f,h.width,0,r)!==null
 if(h.kind==='circle')return Math.hypot(o.x-Math.max(r.x,Math.min(r.x+r.width,o.x)),o.y-Math.max(r.y,Math.min(r.y+r.height,o.y)))<=h.range
 if(h.kind==='capsule'){if(segmentRect(o,end,r)!==null)return true;const candidates=[...corners(r)],radius=h.width/2;return candidates.some(p=>distanceSegment(p,o,end)<=radius)||[o,end].some(p=>Math.hypot(p.x-Math.max(r.x,Math.min(r.x+r.width,p.x)),p.y-Math.max(r.y,Math.min(r.y+r.height,p.y)))<=radius)}
 const half=h.angle*Math.PI/360,inside=(p:Vec)=>{const dx=p.x-o.x,dy=p.y-o.y,d=Math.hypot(dx,dy);return d<=h.range+1e-6&&(d<1e-8||(dx*f.x+dy*f.y)/d>=Math.cos(half)-1e-6)}
 if(corners(r).some(inside)||inside({x:Math.max(r.x,Math.min(r.x+r.width,o.x)),y:Math.max(r.y,Math.min(r.y+r.height,o.y))}))return true
 if(o.x>=r.x&&o.x<=r.x+r.width&&o.y>=r.y&&o.y<=r.y+r.height)return true
 for(const a of [-half,half]){const ray={x:o.x+(f.x*Math.cos(a)-f.y*Math.sin(a))*h.range,y:o.y+(f.x*Math.sin(a)+f.y*Math.cos(a))*h.range};if(segmentRect(o,ray,r)!==null)return true}
 // Circle-edge intersections catch sectors touching an edge with no contained corner.
 for(const x of [r.x,r.x+r.width]){const dy=Math.sqrt(h.range*h.range-(x-o.x)**2);if(Number.isFinite(dy))for(const y of [o.y-dy,o.y+dy])if(y>=r.y&&y<=r.y+r.height&&inside({x,y}))return true}
 for(const y of [r.y,r.y+r.height]){const dx=Math.sqrt(h.range*h.range-(y-o.y)**2);if(Number.isFinite(dx))for(const x of [o.x-dx,o.x+dx])if(x>=r.x&&x<=r.x+r.width&&inside({x,y}))return true}
 return false
}
export function clearSight(origin:Vec,target:Rect,solids:Rect[]){const p=center(target);return !solids.some(r=>{const t=segmentRect(origin,p,r);return t!==null&&t<1})}
