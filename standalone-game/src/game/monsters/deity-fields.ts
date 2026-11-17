import * as T from 'three'
import { DEITY_RULES } from './deity'
import type { DeityEncounter } from './deity-encounter'

/** Bounded warning disks/rings, active pillars, and reachable palm-seal markers. */
export class DeityFields {
  readonly root=new T.Group()
  private disks:T.Mesh<T.CircleGeometry,T.MeshBasicMaterial>[]=[]
  private rings:T.Mesh<T.RingGeometry,T.MeshBasicMaterial>[]=[]
  private pillars:T.Mesh<T.CylinderGeometry,T.MeshBasicMaterial>[]=[]
  private seals:T.Mesh<T.RingGeometry,T.MeshBasicMaterial>[]=[]
  constructor(){
    for(let i=0;i<5;i++){
      const disk=new T.Mesh(new T.CircleGeometry(1,64),this.material('#f4cd77',.35));disk.rotation.x=-Math.PI/2;disk.visible=false;disk.renderOrder=1;this.disks.push(disk);this.root.add(disk)
      const beam=new T.Mesh(new T.CylinderGeometry(.22,.9,8,8),this.material('#ffe5a0',.65));beam.visible=false;beam.renderOrder=2;this.pillars.push(beam);this.root.add(beam)
    }
    for(const rules of [DEITY_RULES.normal,DEITY_RULES.enraged]){
      const ring=new T.Mesh(new T.RingGeometry(rules.ringInner/rules.ringOuter,1,96),this.material('#f4cd77',.35));ring.rotation.x=-Math.PI/2;ring.visible=false;ring.renderOrder=1;this.rings.push(ring);this.root.add(ring)
    }
    for(let i=0;i<2;i++){
      const seal=new T.Mesh(new T.RingGeometry(.7,.9,24),this.material('#86efc3',.8));seal.rotation.x=-Math.PI/2;seal.visible=false;seal.renderOrder=3;this.seals.push(seal);this.root.add(seal)
    }
  }
  private material(color:string,opacity:number){return new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:T.DoubleSide,toneMapped:false})}
  update(e:DeityEncounter,reduced:boolean){
    for(const mesh of [...this.disks,...this.rings,...this.pillars,...this.seals])mesh.visible=false
    e.areas().forEach((area,index)=>{
      const mesh=area.effect==='halo'?this.rings[e.enraged?1:0]:this.disks[index]
      mesh.visible=true;mesh.position.set(area.x,-.01,area.z);mesh.scale.setScalar(area.outer)
      mesh.material.color.set(area.active?(e.enraged?'#ff9c67':'#fff1bc'):'#dca844')
      mesh.material.opacity=area.active ? .6 : reduced ? .38 : .34+Math.sin(e.clock/150)*.04
      if(area.active&&area.effect==='pillar'){
        const beam=this.pillars[index];beam.visible=true;beam.position.set(area.x,4,area.z)
        beam.scale.set(area.outer*.8,1,area.outer*.8);beam.material.opacity=reduced ? .55 : .6+Math.sin(e.clock/60)*.08
      }
    })
    e.palms().forEach((p,i)=>{if(p.eligible){const seal=this.seals[i];seal.visible=true;seal.position.set(p.x,.015,p.z);seal.material.opacity=reduced ? .8 : .7+Math.sin(e.clock/130)*.1}})
  }
  dispose(){this.root.removeFromParent();for(const mesh of [...this.disks,...this.rings,...this.pillars,...this.seals]){mesh.geometry.dispose();mesh.material.dispose()}this.root.clear()}
}
