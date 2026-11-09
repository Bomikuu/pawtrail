import * as T from 'three'
import { appearancePalette } from './rigs'
import { PixelFinish } from './pixel-renderer'
import { createPortraitBust } from './portrait-bust'
import { acquirePortraitStage, PORTRAIT_SIZE, PORTRAIT_FRAMES } from './portrait-stage'
import { defaultPortraitView, portraitYaw, type PortraitView } from './portrait-state'
import type { ActorAppearance } from './appearance'
import { loadPortraitArt, portraitPalette, type PortraitArt } from './portrait-art'
import { referenceCamera, pointAtUV, projectLandmark, type Calibration, type LandmarkPositions } from './maya/reference'

export class HumanPortraitRenderer {
  private shared=acquirePortraitStage()
  private scene=new T.Scene()
  private camera=new T.OrthographicCamera(-17,17,17,-17,.1,250)
  private bust:ReturnType<typeof createPortraitBust>|undefined
  private finish:PixelFinish
  private frames=new Map<string,ImageData>()
  private disposed=false
  readonly assetSource='prototype' as const
  static async create(appearance:ActorAppearance,headScale=1,calibration?:Calibration){return new HumanPortraitRenderer(appearance,headScale,await loadPortraitArt(),calibration)}
  constructor(appearance:ActorAppearance,headScale=1,art:PortraitArt={},calibration?:Calibration){
    this.finish=new PixelFinish([...appearancePalette(appearance),...portraitPalette(appearance,art)])
    try{
      this.bust=createPortraitBust(appearance,art);this.scene.add(this.bust.root)
      this.bust.head.scale.setScalar(T.MathUtils.clamp(headScale,.8,1.25))
      this.bust.root.updateMatrixWorld(true)
      const bounds=new T.Box3().setFromObject(this.bust.head),size=bounds.getSize(new T.Vector3())
      const faceHeight=bounds.max.y-Math.max(bounds.min.y,26)
      const span=Math.max(27.5,faceHeight*1.4,size.x*1.55),target=new T.Vector3(0,30.7,0)
      // Only a bust was built, so rotation never reveals a lower body.
      target.y=Math.max(30.7,bounds.max.y-span*.46)
      this.camera.left=this.camera.bottom=-span/2;this.camera.right=this.camera.top=span/2
      this.camera.position.copy(target).add(new T.Vector3(0,span*.045,100));this.camera.lookAt(target);this.camera.updateProjectionMatrix()
      if(calibration)this.camera=referenceCamera(calibration)
    }catch(error){this.dispose();throw error}
  }
  frame(index:number,view:PortraitView=defaultPortraitView){
    index=((Math.floor(index)%PORTRAIT_FRAMES)+PORTRAIT_FRAMES)%PORTRAIT_FRAMES
    const yaw=Math.round(portraitYaw(view.yaw)*90/Math.PI)*Math.PI/90
    const key=[index,yaw,view.expression,!!view.talking,!!view.steady,view.headTilt??0].join(':')
    this.bust!.pose(index,view);this.bust!.root.rotation.y=yaw
    const cached=this.frames.get(key);if(cached)return cached
    const {renderer,context}=this.shared
    if(renderer.getContext().isContextLost())throw new Error('Portrait rendering interrupted.')
    renderer.render(this.scene,this.camera);context.clearRect(0,0,PORTRAIT_SIZE,PORTRAIT_SIZE);context.drawImage(renderer.domElement,0,0)
    const result=this.finish.finish(context.getImageData(0,0,PORTRAIT_SIZE,PORTRAIT_SIZE),1)
    if(this.frames.size>=24)this.frames.delete(this.frames.keys().next().value!)
    this.frames.set(key,result);return result
  }
  getLandmarks():LandmarkPositions{
    const points:LandmarkPositions={},root=this.bust!.root,face=root.getObjectByName('PaintedFace') as T.Mesh
    root.updateMatrixWorld(true);this.camera.updateMatrixWorld(true)
    for(const [name,u,v] of [['eyeLeft',109,69],['eyeRight',147,69],['browLeft',109,50],['browRight',147,50],['mouth',128,98],['chin',128,128]] as const){
      const point=pointAtUV(face,u/256,1-v/128);if(point)points[name]=projectLandmark(point,this.camera)
    }
    for(const [name,object] of [['shoulderLeft','UpperArm-1'],['shoulderRight','UpperArm1']] as const){
      const node=root.getObjectByName(object) as T.Mesh|undefined;if(!node)continue
      const vertices=node.geometry.getAttribute('position');let highest=new T.Vector3(0,-Infinity,0)
      for(let i=0;i<vertices.count;i++){const p=node.localToWorld(new T.Vector3().fromBufferAttribute(vertices,i));if(p.y>highest.y)highest=p}
      points[name]=projectLandmark(highest,this.camera)
    }
    let crown=new T.Vector3(0,-Infinity,0)
    this.bust!.head.traverse(node=>{if(node instanceof T.Mesh&&/Hair|Fringe|Crown|Parting/.test(node.name)){const p=node.geometry.getAttribute('position');for(let i=0;i<p.count;i++){const v=node.localToWorld(new T.Vector3().fromBufferAttribute(p,i));if(v.y>crown.y)crown=v}}})
    if(Number.isFinite(crown.y))points.crown=projectLandmark(crown,this.camera)
    return points
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.bust?.dispose();this.frames.clear();this.shared.release()}
}
