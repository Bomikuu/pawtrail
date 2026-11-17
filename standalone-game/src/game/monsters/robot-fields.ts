import * as T from 'three'
import type { RobotEncounter, RobotField } from './robot-encounter'

type View={group:T.Group;surface:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>;caps:T.Mesh<T.CircleGeometry,T.MeshBasicMaterial>[];key:string}
/** Bounded exact beam capsules, sectors/disks and square funnel hurtbox brackets. */
export class RobotFields {
  readonly root=new T.Group()
  private views:View[]=[]
  private brackets:T.LineSegments<T.BufferGeometry,T.LineBasicMaterial>[]=[]
  constructor(){
    for(let i=0;i<5;i++){
      const material=new T.MeshBasicMaterial({color:'#59ddeb',transparent:true,opacity:.35,depthWrite:false,side:T.DoubleSide,toneMapped:false})
      const surface=new T.Mesh(new T.PlaneGeometry(1,1),material),group=new T.Group()
      const caps=[0,1].map(()=>new T.Mesh(new T.CircleGeometry(.5,32),material))
      group.add(surface,...caps);group.visible=false;group.renderOrder=1;this.root.add(group);this.views.push({group,surface,caps,key:''})
    }
    for(let i=0;i<4;i++){
      const points:number[]=[]
      for(const x of [-1,1])for(const z of [-1,1])points.push(x*.62,0,z*.62,x*.38,0,z*.62,x*.62,0,z*.62,x*.62,0,z*.38)
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points,3))
      const line=new T.LineSegments(geometry,new T.LineBasicMaterial({color:'#71f3f5',transparent:true,opacity:.85,depthWrite:false,toneMapped:false}));line.renderOrder=3;this.brackets.push(line);this.root.add(line)
    }
  }
  private pose(view:View,field:RobotField){
    view.group.visible=true;view.group.position.y=.01
    view.surface.rotation.set(-Math.PI/2,0,0);view.caps.forEach(c=>c.visible=false)
    if(field.kind==='beam'){
      if(view.key!=='beam'){view.surface.geometry.dispose();view.surface.geometry=new T.PlaneGeometry(1,1);view.key='beam'}
      const dx=field.endX-field.x,dz=field.endZ-field.z
      view.surface.position.set((field.x+field.endX)/2,0,(field.z+field.endZ)/2)
      view.surface.rotation.z=-Math.atan2(dz,dx);view.surface.scale.set(Math.hypot(dx,dz),field.width,1)
      view.caps.forEach((cap,i)=>{cap.visible=true;cap.rotation.x=-Math.PI/2;cap.position.set(i?field.endX:field.x,0,i?field.endZ:field.z);cap.scale.setScalar(field.width)})
    }else{
      const key=field.inner/field.outer+':'+field.angle
      if(view.key!==key){view.surface.geometry.dispose();view.surface.geometry=new T.RingGeometry(field.inner/field.outer,1,64,1,field.kind==='sector'?-field.angle/2:0,field.angle);view.key=key}
      view.surface.position.set(field.x,0,field.z);view.surface.scale.set(field.outer,field.outer,1)
      view.surface.rotation.z=field.kind==='sector'?field.facing-Math.PI/2:0
    }
    view.surface.material.color.set(field.active?'#ff65c9':'#63e4ee');view.surface.material.opacity=field.active?.64:.3
  }
  update(e:RobotEncounter,reduced:boolean){
    this.views.forEach(v=>v.group.visible=false)
    e.fields().forEach((f,i)=>{this.pose(this.views[i],f);if(!f.active&&!reduced)this.views[i].surface.material.opacity=.3+Math.sin(e.clock/140)*.05})
    e.components().forEach((f,i)=>{const line=this.brackets[i];line.visible=f.hp>0&&e.hp>0;line.position.set(f.x,.02,f.z)})
  }
  dispose(){
    this.root.removeFromParent()
    for(const v of this.views){v.surface.geometry.dispose();v.surface.material.dispose();v.caps.forEach(c=>c.geometry.dispose())}
    this.brackets.forEach(b=>{b.geometry.dispose();b.material.dispose()});this.root.clear()
  }
}
