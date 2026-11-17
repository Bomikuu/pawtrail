import {audio} from '../systems/audio'
import {areaOrigin,forward} from './spatial'
import {chainPath} from './chain-path'
import type {AbilityEvent,AbilitySnapshot} from './runtime'
import type {Vec,Rect,HitArea} from './document'
type Effect={event:AbilityEvent;age:number;duration:number}
export function drawArea(ctx:CanvasRenderingContext2D,o:Vec,f:Vec,h:HitArea,color='#4ee8be'){
 const origin=areaOrigin(o,f,h);ctx.save();ctx.translate(origin.x,origin.y);ctx.rotate(Math.atan2(f.y,f.x));ctx.fillStyle=color+'25';ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath()
 if(h.kind==='arc'){const a=h.angle*Math.PI/360;ctx.moveTo(0,0);ctx.arc(0,0,h.range,-a,a);ctx.closePath()}
 if(h.kind==='circle')ctx.arc(0,0,h.range,0,Math.PI*2)
 if(h.kind==='box')ctx.rect(0,-h.width/2,h.range,h.width)
 if(h.kind==='capsule'){ctx.moveTo(0,-h.width/2);ctx.lineTo(h.range,-h.width/2);ctx.arc(h.range,0,h.width/2,-Math.PI/2,Math.PI/2);ctx.lineTo(0,h.width/2);ctx.arc(0,0,h.width/2,Math.PI/2,Math.PI*1.5)}
 ctx.fill();ctx.stroke();ctx.restore()
}
export class ItemPresentation{
 private effects:Effect[]=[]
 private stops:{stop:()=>void;until:number}[]=[]
 muted=false
 consume(events:AbilityEvent[],silent=false){for(const event of events){if(event.kind==='sound'||event.kind==='hit'||event.kind==='blocked'){if(!silent&&!this.muted&&this.stops.length<8)this.stops.push({stop:audio.itemEffect(event.art?.sound??'impact'),until:performance.now()+600})}if(['trail','burst','hit','blocked'].includes(event.kind)){this.effects.push({event,age:0,duration:event.art?.lifetime??240});if(this.effects.length>32)this.effects.shift()}}}
 advance(delta:number){for(const e of this.effects)e.age+=delta;this.effects=this.effects.filter(e=>e.age<e.duration);this.stops=this.stops.filter(s=>{if(s.until>performance.now())return true;s.stop();return false})}
 drawChain(ctx:CanvasRenderingContext2D,snapshot:AbilitySnapshot,hand:Vec|undefined,solids:Rect[],layer:'back'|'front'){
  const cast=snapshot.cast,chain=cast?.action.chain
  if(!cast||!chain)return
  const origin=cast.actor.position,f=forward(cast.actor.direction),anchor=hand??{x:origin.x+f.x*5,y:origin.y-21}
  for(const[lag,alpha]of [[48,.12],[24,.22],[0,1]]){
   const points=chainPath(cast.action,cast.elapsed-lag,origin,f,solids)
   if(points.length<2)continue
   const visual=points.map((p,i)=>{
    // Use the authored segment index even when a wall clips the tail.
    const u=i/chain.segments
    if(chain.mode==='orbit'){
     const height=u<=.65?8+24*u/.65:32-20*(u-.65)/.35
     const handBlend=Math.max(0,1-u/.12)
     return{x:Math.round(p.x+(anchor.x-origin.x)*handBlend),y:Math.round(p.y-height+(anchor.y-origin.y+8)*handBlend)}
    }
    return{x:Math.round(p.x+(anchor.x-origin.x)*(1-u)),y:Math.round(p.y-12+(anchor.y-origin.y+12)*(1-u))}
   })
   const inLayer=(i:number)=>((points[i].y+points[i-1].y)/2>=origin.y)===(layer==='front')
   ctx.save();ctx.globalAlpha=alpha
   ctx.strokeStyle=chain.color+'66';ctx.lineWidth=6;ctx.beginPath()
   for(let i=1;i<visual.length;i++)if(inLayer(i)){ctx.moveTo(visual[i-1].x,visual[i-1].y);ctx.lineTo(visual[i].x,visual[i].y)}
   ctx.stroke()
   if(lag===0){
    if(layer==='back'){const ground=points.at(-1)!;ctx.fillStyle='#241c3433';ctx.beginPath();ctx.ellipse(ground.x,ground.y,6,2.5,0,0,Math.PI*2);ctx.fill()}
    for(let i=1;i<visual.length;i++){
     if(!inLayer(i))continue
     const p=visual[i],q=visual[i-1];ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.y-q.y,p.x-q.x));ctx.strokeStyle='#35253f';ctx.lineWidth=3;ctx.strokeRect(-3,-1.5,6,3);ctx.strokeStyle=i%2?'#e5c9ff':chain.color;ctx.lineWidth=1;ctx.strokeRect(-3,-1.5,6,3);ctx.restore()
    }
    if((points.at(-1)!.y>=origin.y)===(layer==='front')){
     const tip=visual.at(-1)!;ctx.translate(tip.x,tip.y);ctx.rotate(cast.elapsed/100);ctx.fillStyle='#39233f';ctx.fillRect(-5,-5,10,10);ctx.fillStyle=chain.color;ctx.fillRect(-4,-4,8,8);ctx.fillStyle='#fff2ce';ctx.fillRect(-2,-3,3,2);ctx.fillStyle=chain.color;for(const[x,y]of [[-7,-1],[5,-1],[-1,-7],[-1,5]])ctx.fillRect(x,y,3,3)
    }
   }
   ctx.restore()
  }
 }
 draw(ctx:CanvasRenderingContext2D,snapshot:AbilitySnapshot){
  for(const wave of snapshot.projectiles){ctx.save();ctx.translate(wave.position.x,wave.position.y);ctx.rotate(Math.atan2(wave.forward.y,wave.forward.x));ctx.globalAlpha=Math.min(1,(wave.spec.lifetime-wave.age)/140);const visual=wave.art.size;ctx.strokeStyle=wave.art.color;ctx.fillStyle=wave.art.color+'44';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-wave.spec.depth,-visual/2);ctx.quadraticCurveTo(wave.spec.depth*1.5,0,-wave.spec.depth,visual/2);ctx.stroke();ctx.lineTo(-wave.spec.depth*1.5,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff8dc';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-4,-visual*.4);ctx.quadraticCurveTo(8,0,-4,visual*.4);ctx.stroke();ctx.restore()}
  for(const fx of this.effects){const e=fx.event,t=fx.age/fx.duration;ctx.save();ctx.translate(e.position.x,e.position.y);ctx.globalAlpha=1-t;ctx.strokeStyle=e.art?.color??'#ffc767';ctx.fillStyle=e.art?.color??'#ffc767';ctx.lineWidth=3*(1-t)+1
   if(e.kind==='trail'){ctx.rotate(Math.atan2(e.forward.y,e.forward.x));const radius=(e.art?.size??64)*(.65+.35*t);ctx.beginPath();ctx.arc(0,0,radius,-1.1+t*.6,1.1+t*.6);ctx.stroke()}
   else for(let i=0;i<4;i++){const a=i*Math.PI/2+.3,r=3+12*t;ctx.fillRect(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r),2,2)}ctx.restore()}
 }
 stopVoices(){for(const s of this.stops)s.stop();this.stops=[]}
 clear(){this.effects=[];this.stopVoices()}
}
