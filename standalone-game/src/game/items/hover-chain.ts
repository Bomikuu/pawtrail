import * as T from 'three'
import type {Rig} from '../actor-rig/rigs'
import {hasHoverChain,type ItemAction,type ItemDocument} from './document'
/** A decorative equipped state, never an ability or hit area. */
export function hoveringChainWeight(action?:ItemAction,time=0){
 const chain=action?.chain
 if(!chain)return 1
 if(time<chain.start){const t=Math.min(1,time/Math.max(1,chain.start));return 1-t*t*(3-2*t)}
 if(time<=chain.end)return 0
 const t=Math.min(1,(time-chain.end)/Math.max(1,action!.duration-chain.end))
 return t*t*(3-2*t)
}
export function attachHoverChain(rig:Rig){
 const group=new T.Group();group.name='EquippedHoverChain';group.visible=false
 const parent=rig.root.getObjectByName('RescuerStance')??rig.root
 parent.add(group)
 const geometry=new T.TorusGeometry(1.8,.38,4,8).scale(1.45,.65,1),dark=new T.MeshBasicMaterial({color:'#9775b5',toneMapped:false}),light=new T.MeshBasicMaterial({color:'#d8c1ec',toneMapped:false})
 const links=Array.from({length:40},(_,i)=>{const mesh=new T.Mesh(geometry,i%2?light:dark);mesh.name='HoverLink_'+i;mesh.raycast=()=>{};group.add(mesh);return mesh})
 const head=new T.Group();head.name='HoveringChainWeight';group.add(head)
 const core=new T.Mesh(new T.SphereGeometry(2.5,6,4),new T.MeshBasicMaterial({color:'#bd83fa',toneMapped:false}));core.raycast=()=>{};head.add(core)
 const glint=new T.Mesh(new T.BoxGeometry(1.2,1.2,.3),new T.MeshBasicMaterial({color:'#fff2ce',toneMapped:false}));glint.position.set(-.7,.8,2);glint.raycast=()=>{};head.add(glint)
 const point=(u:number,time:number)=>{
  const angle=time+u*Math.PI*4.5,radius=15+Math.sin(u*Math.PI)*2.5
  return new T.Vector3(Math.cos(angle)*radius,10+u*25+Math.sin(time*2+u*Math.PI)*1.2,Math.sin(angle)*radius)
 }
 return{
  update(item:ItemDocument,phase:number,weight=1){
   const enabled=hasHoverChain(item)&&weight>.001
   group.visible=enabled
   if(!enabled)return
   const time=phase*Math.PI*2
   const chain=Object.values(item.actions).find(action=>action?.chain)?.chain
   core.material.color.set(chain?.color??'#bd83fa')
   // Gently gather toward the body while deploying, then unfurl on recovery.
   group.position.y=(1-weight)*22
   group.scale.setScalar(weight)
   for(let i=0;i<links.length;i++){
    const u=i/(links.length-1),p=point(u,time),next=point(Math.min(1,u+.01),time),direction=next.sub(p).normalize()
    links[i].position.copy(p)
    links[i].quaternion.setFromUnitVectors(new T.Vector3(1,0,0),direction)
    links[i].rotateX(i%2?Math.PI/2:0)
   }
   head.position.copy(point(1,time));head.rotation.set(Math.sin(time)*.12,time,Math.sin(time*2)*.1)
  },
  dispose(){
   group.removeFromParent();geometry.dispose();dark.dispose();light.dispose();core.geometry.dispose();core.material.dispose();glint.geometry.dispose();glint.material.dispose()
  },
 }
}
