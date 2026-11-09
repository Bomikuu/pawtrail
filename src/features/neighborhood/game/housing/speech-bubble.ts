import Phaser from 'phaser'
/** Compact world-space balloon; one owned lifetime per message. */
export class SpeechBubble {
  private container: Phaser.GameObjects.Container
  private timer: Phaser.Time.TimerEvent
  private disposed=false
  constructor(scene:Phaser.Scene,text:string,onExpire:()=>void) {
    const value=text.replace(/\s+/g,' ').trim(),short=Array.from(value).slice(0,55).join('')+(Array.from(value).length>55?'…':'')
    const label=scene.add.text(0,-9,short,{fontFamily:'Instrument Sans',fontSize:'11px',color:'#45362a',wordWrap:{width:130,useAdvancedWrap:true},lineSpacing:1}).setOrigin(.5,1)
    const width=Math.ceil(label.width)+14,height=Math.ceil(label.height)+12,top=-height-7
    const shape=scene.add.graphics()
    shape.fillStyle(0x30241b,.13).fillRoundedRect(-width/2+1,top+2,width,height,5)
    shape.fillStyle(0xfffcf3,1).lineStyle(1,0xc9b99d,1)
    shape.fillRoundedRect(-width/2,top,width,height,5).strokeRoundedRect(-width/2,top,width,height,5)
    shape.fillTriangle(-4,-8,4,-8,0,-1).lineBetween(-4,-7,0,-1).lineBetween(0,-1,4,-7)
    this.container=scene.add.container(0,0,[shape,label]).setDepth(20000)
    this.timer=scene.time.delayedCall(4500,()=>{this.destroy();onExpire()})
  }
  follow(x:number,y:number){if(!this.disposed&&this.container.scene)this.container.setScale(1/this.container.scene.cameras.main.zoom).setPosition(Math.round(x),Math.round(y)-51)}
  destroy(){if(this.disposed)return;this.disposed=true;this.timer?.remove(false);if(this.container.scene)this.container.destroy(true)}
}
