import * as T from 'three'
import manifest from '../../../assets/monster-studio/solvaris-solar-arbiter/manifest.json'
import { DEITY } from './deity'
import type { DeityEncounter } from './deity-encounter'

type Anchors = { proximal: number[]; distal: number[] }
/** Colossal articulated cutouts; the live hands also define reachable hit regions. */
export class DeityRig {
  readonly root = new T.Group()
  private maps: T.Texture[] = []
  private materials: T.SpriteMaterial[] = []
  private halo: T.Sprite
  private torso: T.Sprite
  private lower: T.Sprite
  private head: T.Sprite
  private shoulders: T.Sprite[] = []
  private upper: T.Sprite[] = []
  private forearms: T.Sprite[] = []
  private hands: T.Sprite[] = []
  static async create() {
    const atlas = await new T.TextureLoader().loadAsync(DEITY.assets+manifest.atlas)
    atlas.minFilter=atlas.magFilter=T.NearestFilter;atlas.generateMipmaps=false;atlas.colorSpace=T.SRGBColorSpace
    try{return new DeityRig(atlas)}catch(error){atlas.dispose();throw error}
  }
  private constructor(private atlas:T.Texture) {
    this.root.name=DEITY.id+'-colossal-cutout-rig'
    for(let i=0;i<manifest.columns*manifest.rows;i++){
      const map=atlas.clone();map.repeat.set(1/manifest.columns,1/manifest.rows)
      map.offset.set(i%manifest.columns/manifest.columns,1-(Math.floor(i/manifest.columns)+1)/manifest.rows);map.needsUpdate=true;this.maps.push(map)
    }
    const p=manifest.parts
    this.halo=this.part(p.halo,0,28,28);this.halo.position.set(0,15.5,-1.2)
    this.lower=this.part(p.lowerBody,3,7.7,10.5);this.lower.center.set(.5,.05)
    this.torso=this.part(p.torso,4,9.5,12)
    this.head=this.part(p.head,9,9.2,8.5)
    for(let i=0;i<2;i++){
      this.shoulders.push(this.part(i?p.rightShoulder:p.leftShoulder,7,5,4.4))
      this.upper.push(this.part(i?p.rightUpperArm:p.leftUpperArm,2,4.2,8))
      this.forearms.push(this.part(i?p.rightForearm:p.leftForearm,5,4.2,8))
      const hand=this.part(i?p.rightHand:p.leftHand,8,3.8,4.2)
      hand.center.set(manifest.handWrist[0],manifest.handWrist[1]);this.hands.push(hand)
    }
  }
  private part(frame:number,order:number,width:number,height:number) {
    const material=new T.SpriteMaterial({map:this.maps[frame],transparent:true,alphaTest:.5,depthWrite:false,toneMapped:false})
    material.userData.frame=frame;this.materials.push(material)
    const sprite=new T.Sprite(material);sprite.renderOrder=order;sprite.scale.set(width,height,1);this.root.add(sprite);return sprite
  }
  private link(sprite:T.Sprite,proximal:T.Vector3,distal:T.Vector3,anchors:Anchors) {
    const vx=proximal.x-distal.x,vy=(proximal.y-distal.y)*.896-(proximal.z-distal.z)*.443
    const length=Math.max(.2,Math.hypot(vx,vy)),dx=anchors.proximal[0]-anchors.distal[0],dy=anchors.proximal[1]-anchors.distal[1]
    const width=Math.min(4.2,length*1.3),height=Math.sqrt(Math.max(.05,length*length-dx*dx*width*width))/Math.abs(dy)
    sprite.center.set((anchors.proximal[0]+anchors.distal[0])/2,(anchors.proximal[1]+anchors.distal[1])/2)
    sprite.position.copy(proximal).add(distal).multiplyScalar(.5);sprite.scale.set(width,height,1)
    sprite.material.rotation=-Math.atan2(vx,vy)+Math.atan2(dx*width,dy*height)
  }
  private elbow(shoulder:T.Vector3,hand:T.Vector3,side:number) {
    const direction=new T.Vector3().subVectors(hand,shoulder),distance=Math.max(.01,direction.length())
    direction.divideScalar(distance)
    const a=8.2,b=8,along=(a*a-b*b+Math.min(distance,a+b-.02)**2)/(2*Math.min(distance,a+b-.02))
    const normal=new T.Vector3(side,-.25,-.35);normal.addScaledVector(direction,-normal.dot(direction)).normalize()
    return shoulder.clone().addScaledVector(direction,along).addScaledVector(normal,Math.sqrt(Math.max(.1,a*a-along*along)))
  }
  pose(time:number,e:DeityEncounter,reduced:boolean) {
    const t=time/1000,phase=e.enraged?manifest.enragedFrameOffset:0,death=Math.min(1,e.deathElapsed/1200)
    const breath=reduced?0:Math.sin(t*2)*.045,drop=e.bodyDrop,lean=drop/2.8*3
    for(const material of this.materials){material.map=this.maps[(material.userData.frame as number)+phase];material.opacity=1-death*.92}
    this.halo.material.rotation=reduced?0:t*(e.enraged ? .07 : .025)
    this.halo.position.y=15.5+(reduced?0:Math.sin(t*.8)*.08)-death*2
    this.halo.scale.setScalar(28*(1+(!reduced&&e.window()==='enraging'?Math.sin(e.phaseElapsed/180)*.007:0)))
    this.torso.position.set(0,14.6-drop+breath,lean);this.torso.scale.y=12*(1+breath*.06)
    this.lower.position.set(0,.3+(!reduced?Math.sin(t*1.5)*.035:0),.45);this.lower.scale.y=10.5-drop*.3
    this.lower.material.rotation=reduced?0:Math.sin(t*1.1)*.009
    this.head.position.set(0,22.5-drop*.85+breath,.35+lean*.6);this.head.material.rotation=reduced?0:Math.sin(t*.9)*.012
    if(e.clock<e.hurtUntil&&!reduced)this.head.position.x+=Math.sin(time/24)*.06
    for(let i=0;i<2;i++){
      const side=i?1:-1,palm=e.palms()[i]
      const shoulder=new T.Vector3(side*5.1,17.2-drop+breath,.25+lean)
      const hand=new T.Vector3(palm.x-e.position.x,palm.y,palm.z-e.position.z)
      const extended=this.elbow(shoulder,hand,side)
      const resting=new T.Vector3(side*7.2,13.5+(palm.y-9.7)*.4-drop*.3,.9+lean*.5)
      // Relaxed proportions in idle; the divine reach unfolds as the hand lowers.
      const reach=T.MathUtils.smoothstep(9.7-palm.y,0,6.7)
      const elbow=resting.lerp(extended,reach)
      const shoulderArt=this.shoulders[i];shoulderArt.position.copy(shoulder).add(new T.Vector3(0,.35,.2));shoulderArt.material.rotation=side*-.06+(reduced?0:breath*.3)
      const upperAnchors=i?manifest.limbAnchors.rightUpperArm:manifest.limbAnchors.leftUpperArm
      const foreAnchors=i?manifest.limbAnchors.rightForearm:manifest.limbAnchors.leftForearm
      this.link(this.upper[i],shoulder,elbow,upperAnchors);this.link(this.forearms[i],elbow,hand,foreAnchors)
      this.hands[i].position.copy(hand);this.hands[i].material.rotation=reduced?0:side*(palm.eligible ? .035 : .08)+Math.sin(t*1.2+i)*.012
    }
    this.root.rotation.z=death*-.08
  }
  dispose(){this.root.removeFromParent();this.materials.forEach(m=>m.dispose());this.maps.forEach(m=>m.dispose());this.atlas.dispose();this.root.clear()}
}
