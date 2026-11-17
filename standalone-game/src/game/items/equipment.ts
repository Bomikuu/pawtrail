import * as T from 'three'
import {createStudioGeometry} from '../skin-studio/primitives'
import {createRescuer,type Rig} from '../actor-rig/rigs'
import type {ActorAppearance} from '../actor-rig/appearance'
import {hasHoverChain,type ItemDocument,type ActionKey} from './document'
import {attachHoverChain,hoveringChainWeight} from './hover-chain'
import {applyItemPose,itemRotation} from './motion'
import {attachSpectralGuardian} from './spectral-guardian'
import {prepareSpectralArt,spectralPalette} from './spectral-art'
import {applyWeaponStance} from './stance'
const textures=new Map<string,T.Texture>()
const palettes=new Map<string,string[]>()
export async function prepareItem(item:ItemDocument){await Promise.all([item.guardian?prepareSpectralArt():Promise.resolve(),...item.parts.filter(part=>part.texture&&!textures.has(part.texture)).map(part=>new Promise<void>((resolve,reject)=>{const image=new Image(),source=part.texture!;image.onload=()=>{if(image.width<1||image.height<1||image.width>128||image.height>128){reject(Error('Item textures must be at most 128 × 128 native pixels.'));return}const map=new T.Texture(image);map.colorSpace=T.SRGBColorSpace;map.magFilter=map.minFilter=T.NearestFilter;map.generateMipmaps=false;map.needsUpdate=true;textures.set(source,map);const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,image.width,image.height).data,colors=new Set<string>();for(let i=0;i<data.length&&colors.size<128;i+=4)if(data[i+3]>=128)colors.add('#'+[0,1,2].map(c=>data[i+c].toString(16).padStart(2,'0')).join(''));palettes.set(source,[...colors]);while(textures.size>64){const key=textures.keys().next().value!;textures.delete(key);palettes.delete(key)}resolve()};image.onerror=()=>reject(Error('An item texture could not load. Import a valid PNG and try again.'));image.src=source}))]) }
export function itemPalette(item:ItemDocument){return [...item.parts.flatMap(p=>[p.color,...(p.texture?palettes.get(p.texture)??[]:[])]),...Object.values(item.actions).flatMap(a=>a?.chain?[a.chain.color]:[]),...(hasHoverChain(item)?['#9775b5','#d8c1ec','#bd83fa','#fff2ce']:[]),...(item.guardian?spectralPalette:[])]}
export function mountItemRoot(rig:Rig,item:ItemDocument){
 const grip=new T.Group(),motion=new T.Group(),content=new T.Group()
 grip.name='EquippedItemGrip';motion.name='EquippedItemMotion';content.name='EquippedItemParts';grip.add(motion);motion.add(content)
 const pairGrip=new T.Group(),pairMotion=new T.Group(),pairContent=new T.Group()
 pairGrip.name='EquippedPairGrip';pairMotion.name='EquippedPairMotion';pairContent.name='EquippedPairParts';pairGrip.add(pairMotion);pairMotion.add(pairContent)
 let paired=false,sources:T.Mesh[]=[],copies:T.Mesh[]=[]
 const update=(doc:ItemDocument,carried=true)=>{
  const attachment=carried&&doc.equipment.carry?doc.equipment.carry:doc.equipment
  const target=rig.root.getObjectByName(attachment.socket)
  if(!target)throw Error('The selected attachment socket is unavailable.')
  if(grip.parent!==target)target.add(grip)
  grip.position.fromArray(attachment.position);grip.rotation.set(...attachment.rotation.map(T.MathUtils.degToRad) as [number,number,number]);content.position.fromArray(doc.equipment.pivot).multiplyScalar(-1)
  const twin=doc.equipment.paired;paired=!!twin&&!(carried&&doc.equipment.carry);pairGrip.visible=paired
  if(twin){
   const hand=rig.root.getObjectByName(doc.equipment.socket==='WristRight'?'WristLeft':'WristRight')
   if(!hand)throw Error('The character has no compatible second hand.')
   if(pairGrip.parent!==hand)hand.add(pairGrip)
   pairGrip.position.fromArray(twin.position);pairGrip.rotation.set(...twin.rotation.map(T.MathUtils.degToRad) as [number,number,number])
   pairContent.position.fromArray(doc.equipment.pivot).multiplyScalar(-1);pairContent.scale.x=twin.mirror?-1:1
  }
 }
 const syncPair=()=>{
  if(!paired)return
  const meshes=content.children.filter((node):node is T.Mesh=>node instanceof T.Mesh)
  if(meshes.length!==sources.length||meshes.some((node,i)=>node!==sources[i])){
   pairContent.clear();sources=meshes;copies=meshes.map(source=>{const copy=source.clone(false);copy.name='Paired_'+source.name;copy.userData={weaponPair:true};copy.raycast=()=>{};pairContent.add(copy);return copy})
  }
  sources.forEach((source,i)=>{const copy=copies[i];copy.geometry=source.geometry;copy.material=source.material;copy.position.copy(source.position);copy.quaternion.copy(source.quaternion);copy.scale.copy(source.scale);copy.visible=source.visible})
 }
 update(item)
 return{grip,motion,content,pairGrip,pairMotion,update,syncPair,disposePair(){pairGrip.removeFromParent();pairContent.clear();sources=[];copies=[]}}
}
export function equipItem(rig:Rig,item:ItemDocument){
 const mounted=mountItemRoot(rig,item)
 for(const part of item.parts){const geometry=createStudioGeometry(part.shape,part.textureLayout),edit=item.meshEdits.find(e=>e.mesh==='attachment:'+part.id),position=geometry.getAttribute('position');if(edit){if(edit.vertexCount!==position.count)throw Error('An item vertex edit no longer matches its shape. Reset that part’s vertex edits.');for(const[index,x,y,z]of edit.offsets)position.setXYZ(index,position.getX(index)+x,position.getY(index)+y,position.getZ(index)+z);position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere()}
 const map=part.texture?textures.get(part.texture)?.clone():undefined;if(map){map.needsUpdate=true}
 const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({color:map?'#ffffff':part.color,map,vertexColors:true,side:T.DoubleSide,alphaTest:.5,toneMapped:false}));mesh.name='Equipped_'+part.name;mesh.userData.itemPartId=part.id;mesh.userData.itemVisible=part.visible;mesh.position.fromArray(part.position);mesh.rotation.set(...part.rotation.map(T.MathUtils.degToRad) as [number,number,number]);mesh.scale.fromArray(part.scale);mesh.visible=part.visible;mounted.content.add(mesh)}
 mounted.syncPair()
 return{...mounted,sample(name:'grip'|'tip'|'muzzle'){rig.root.updateMatrixWorld(true);return name==='grip'?mounted.grip.getWorldPosition(new T.Vector3()):mounted.content.localToWorld(new T.Vector3(...item.equipment.tip))},setVisible(value:boolean){mounted.grip.visible=value},dispose(){mounted.disposePair();mounted.grip.removeFromParent();mounted.grip.traverse(node=>{if(node instanceof T.Mesh){node.geometry.dispose();const m=node.material as T.MeshBasicMaterial;m.map?.dispose();m.dispose()}})}}
}
/** Decorates a completed actor; refined factories cannot archive this equipment. */
export function equippedFactory(base:((appearance:ActorAppearance)=>Rig)|undefined,item:ItemDocument){
 return(appearance:ActorAppearance):Rig=>{
  const rig=(base??createRescuer)(appearance),equipment=equipItem(rig,item),hover=attachHoverChain(rig),guardian=item.guardian?attachSpectralGuardian(rig):null,pose=rig.pose
  rig.itemSockets={grip:equipment.grip}
  rig.pose=(action,phase,layers)=>{
   const key=action.startsWith('item-')?action.slice(5) as ActionKey:null
   const move=key?item.actions[key]:undefined
   const moving=!!move&&!move.lockMovement&&typeof layers?.locomotionPhase==='number'
   const gait=key==='running'?'run':layers?.gait??'walk'
   pose(moving?gait:key==='running'?'run':key?'idle':action,moving?layers!.locomotionPhase!:key==='running'?phase:key?0:phase,key?{...layers,referenceStance:!moving&&!!move?.mask.some(joint=>/^(Hip|Knee|Ankle)/.test(joint)),gait,secondaryMotion:{phase:layers?.secondaryMotion?.phase??phase,locomotion:moving?1:Math.sin(Math.PI*phase)*.8}}:layers)
   if(!key)applyWeaponStance(rig,item,action,layers?.secondaryMotion?.phase??phase)
   equipment.update(item,!key)
   equipment.motion.rotation.set(0,0,0)
   if(move){
    applyItemPose(rig,moving?{...move,mask:move.mask.filter(joint=>!/^(Hip|Knee|Ankle)/.test(joint))}:move,phase*move.duration)
    equipment.motion.rotation.set(...itemRotation(move,phase*move.duration).map(T.MathUtils.degToRad) as [number,number,number])
   }
   equipment.pairMotion.rotation.set(-equipment.motion.rotation.x,-equipment.motion.rotation.y,-equipment.motion.rotation.z)
   equipment.syncPair()
   hover.update(item,layers?.secondaryMotion?.phase??phase,hoveringChainWeight(move,phase*(move?.duration??0)))
   guardian?.update(item,layers?.secondaryMotion?.phase??phase,layers?.secondaryMotion?.locomotion??0,move,phase*(move?.duration??0),key??undefined)
   const chain=move?.chain,deployed=!!chain&&!!move&&phase*move.duration>=chain.start&&phase*move.duration<=chain.end
   for(const node of equipment.content.children)if(String(node.userData.itemPartId).startsWith('deployed-'))node.visible=!!node.userData.itemVisible&&!deployed&&!hasHoverChain(item)
  }
  return rig
 }
}
