import * as T from 'three'
import manifest from '../../../assets/monster-studio/kurogane-neon-bastion/manifest.json'
import { ROBOT } from './robot'
import type { RobotEncounter } from './robot-encounter'

/** Registered robot armor plus independent remote pods driven by encounter data. */
export class RobotRig {
  readonly root = new T.Group()
  private maps: T.Texture[] = []
  private materials: T.SpriteMaterial[] = []
  private head: T.Sprite
  private torso: T.Sprite
  private arms: T.Sprite[] = []
  private legs: T.Sprite[] = []
  private pods: T.Sprite[] = []
  private emitter: T.Sprite
  private shield: T.Mesh<T.CylinderGeometry,T.MeshBasicMaterial>
  private links: T.Line<T.BufferGeometry,T.LineBasicMaterial>[] = []
  static async create() {
    const atlas=await new T.TextureLoader().loadAsync(ROBOT.assets+manifest.atlas)
    atlas.magFilter=atlas.minFilter=T.NearestFilter;atlas.generateMipmaps=false;atlas.colorSpace=T.SRGBColorSpace
    try{return new RobotRig(atlas)}catch(error){atlas.dispose();throw error}
  }
  private constructor(private atlas:T.Texture) {
    this.root.name=ROBOT.id+'-registered-rig'
    for(let i=0;i<16;i++){
      const map=atlas.clone();map.repeat.set(.25,.25);map.offset.set(i%4/4,1-(Math.floor(i/4)+1)/4);map.needsUpdate=true;this.maps.push(map)
    }
    const p=manifest.parts
    this.torso=this.part(p.torso,4,5,4.4);this.head=this.part(p.head,7,2.5,2.5)
    for(let i=0;i<2;i++){
      const arm=this.part(i?p.rightArm:p.leftArm,5,2,4)
      arm.center.set(...manifest.anchors.armShoulder as [number,number]);this.arms.push(arm)
      const leg=this.part(i?p.rightLeg:p.leftLeg,2,2.1,3.4)
      leg.center.set(...manifest.anchors.legFoot as [number,number]);this.legs.push(leg)
    }
    for(let i=0;i<4;i++){
      this.pods.push(this.part(p.funnel,9,1.8,1.8))
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(6),3))
      const line=new T.Line(geometry,new T.LineBasicMaterial({color:'#61e5ef',transparent:true,opacity:.38,depthWrite:false,toneMapped:false}));line.renderOrder=1
      this.links.push(line);this.root.add(line)
    }
    this.emitter=this.part(p.emitter,8,.9,.9)
    this.shield=new T.Mesh(new T.CylinderGeometry(2.65,2.65,6,12,1,true),new T.MeshBasicMaterial({color:'#5de6f1',transparent:true,opacity:.11,wireframe:true,depthWrite:false,toneMapped:false}))
    this.shield.position.y=3.1;this.shield.renderOrder=10;this.root.add(this.shield)
  }
  private part(frame:number,order:number,width:number,height:number){
    const material=new T.SpriteMaterial({map:this.maps[frame],transparent:true,alphaTest:.5,depthWrite:false,toneMapped:false})
    material.userData.frame=frame;this.materials.push(material)
    const sprite=new T.Sprite(material);sprite.scale.set(width,height,1);sprite.renderOrder=order;this.root.add(sprite);return sprite
  }
  pose(time:number,e:RobotEncounter,reduced:boolean){
    const t=time/1000,offset=e.enraged?8:0,death=Math.min(1,e.deathElapsed/1300)
    const breath=reduced?0:Math.sin(t*2.3)*.025,state=e.window(),attack=e.cast
    const windup=attack&&state==='warning'?Math.min(1,attack.elapsed/700):0
    const recoil=attack&&state==='striking'&&!reduced?Math.sin(attack.elapsed/65)*.08:0
    for(const material of this.materials){material.map=this.maps[(material.userData.frame as number)+offset];material.opacity=1-death}
    this.torso.position.set(recoil,4+breath-death*1.5,0);this.torso.material.rotation=reduced?0:-death*.2
    this.head.position.set(recoil*.5,6.35+breath-death*1.5,.1);this.head.material.rotation=reduced?0:Math.sin(t*.7)*.012-death*.15
    for(let i=0;i<2;i++){
      const side=i?1:-1
      this.legs[i].position.set(side*.8,.03,-.1);this.legs[i].material.rotation=reduced?0:side*death*.15
      this.arms[i].position.set(side*2.05,5.05+breath-death,.1)
      this.arms[i].material.rotation=side*(.035+windup*(attack?.id==='reactor-sweep'?.55:.18))+(reduced?0:Math.sin(t*1.3+i)*.012+recoil)
    }
    this.emitter.position.set(0,4.15+breath,.22);this.emitter.scale.setScalar(e.shielded?.9:1.1)
    this.shield.visible=e.shielded&&e.hp>0
    this.shield.material.opacity=e.clock<e.blockedUntil?.32:reduced?.11:.1+Math.sin(t*3)*.025
    this.shield.rotation.y=reduced?0:Math.sin(t*.35)*.05
    const components=e.components()
    for(let i=0;i<4;i++){
      const f=components[i],sprite=this.pods[i],source=e.funnels[i]
      sprite.visible=f.hp>0&&e.hp>0
      sprite.position.set(f.x-e.position.x,f.height,f.z-e.position.z)
      sprite.material.rotation=reduced?0:Math.sin(t*1.5+i)*.07+(state==='warning'&&attack?.id==='crossfire-lattice'?.13:0)
      sprite.material.color.set(e.clock<source.hurtUntil?'#ffb2d9':'#ffffff')
      const line=this.links[i];line.visible=sprite.visible&&e.shielded
      const points=line.geometry.getAttribute('position') as T.BufferAttribute
      points.setXYZ(0,0,4.15,0);points.setXYZ(1,sprite.position.x,sprite.position.y,sprite.position.z);points.needsUpdate=true
      line.geometry.computeBoundingSphere()
    }
  }
  dispose(){
    this.root.removeFromParent();this.materials.forEach(m=>m.dispose());this.maps.forEach(m=>m.dispose());this.atlas.dispose()
    this.links.forEach(l=>{l.geometry.dispose();l.material.dispose()});this.shield.geometry.dispose();this.shield.material.dispose();this.root.clear()
  }
}
