import * as T from 'three'
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js'
import {createPortraitBust} from '../portrait-bust'
import {loadPortraitArt} from '../portrait-art'
import {gameAppearance} from '../game-appearances'
import {pointAtUV,reference} from './reference'
/** Export a clearly marked editable starter. It is never installed as the authored asset. */
export async function createMayaStarterGLB(){
 const bust=createPortraitBust(gameAppearance('maya')!.appearance,await loadPortraitArt())
 try{
  bust.pose(0,{yaw:0,expression:'idle',steady:true});bust.root.name='MayaPortraitRoot';bust.root.userData.authoringStatus='procedural-starter-not-approved';bust.head.name='MayaHead'
  const hair=new T.Group();hair.name='MayaHair';bust.head.add(hair)
  for(const child of [...bust.head.children])if(child!==hair&&/Hair|Fringe|Crown|Parting|Long/.test(child.name))hair.add(child)
  const torso=new T.Group();torso.name='MayaTorso';bust.root.add(torso);const upper=bust.head.parent!
  for(const child of [...upper.children])if(child!==bust.head)torso.add(child)
  const face=bust.root.getObjectByName('PaintedFace') as T.Mesh;(face.material as T.Material).name='MayaFacePaint';bust.root.updateMatrixWorld(true)
  for(const [id,u,v] of [['eyeLeft',109,69],['eyeRight',147,69],['browLeft',109,50],['browRight',147,50],['mouth',128,98],['chin',128,128]] as const){
   const position=pointAtUV(face,u/256,1-v/128);if(!position)continue
   const empty=new T.Object3D();empty.name=reference.landmarks.find(mark=>mark.id===id)!.node;empty.position.copy(bust.head.worldToLocal(position));bust.head.add(empty)
  }
  return await new GLTFExporter().parseAsync(bust.root,{binary:true,onlyVisible:true}) as ArrayBuffer
 }finally{bust.dispose()}
}
