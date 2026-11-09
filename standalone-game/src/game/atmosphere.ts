import Phaser from 'phaser'
import { immersionPreferences } from './immersion-preferences'
import { audio } from './systems/audio'
import { dayPhase } from './systems/time'
import type { WorldConditions } from './immersion-data'

const weatherFiles: Record<string,string> = {
  'rain-light':'rain/rain-light','rain-heavy':'rain/rain-heavy',
  'splash-0':'rain/splash-0','splash-1':'rain/splash-1','splash-2':'rain/splash-2','splash-3':'rain/splash-3',
  'puddle-0':'puddles/puddle-0','puddle-1':'puddles/puddle-1',
  'cloud-small':'clouds/cloud-small','cloud-medium':'clouds/cloud-medium','cloud-large':'clouds/cloud-large',
  'cloud-thin':'clouds/cloud-thin','cloud-dark':'clouds/cloud-dark','cloud-overcast':'clouds/cloud-overcast','cloud-shadow':'clouds/cloud-shadow',
}
export function preloadAtmosphere(scene: Phaser.Scene) {
  for (const [key,file] of Object.entries(weatherFiles)) scene.load.image('weather:'+key,'/assets/game/weather/'+file+'.png')
  for (const name of ['streetlamp-on','window-on','lantern-on','indoor-lamp-on','moon','stars']) scene.load.image('night:'+name,'/assets/game/environment/night/'+name+'.png')
}
/** Pooled canvas-only atmosphere. No DOM particles and no whole-world dark rectangle. */
export class Atmosphere {
  private rain: Phaser.GameObjects.Image[]=[]
  private clouds: Phaser.GameObjects.Image[]=[]
  private shadows: Phaser.GameObjects.Image[]=[]
  private splashes: Phaser.GameObjects.Image[]=[]
  private puddles: Phaser.GameObjects.Image[]=[]
  private lights: Phaser.GameObjects.Image[]=[]
  private moon: Phaser.GameObjects.Image
  private stars: Phaser.GameObjects.Image
  private intensity=0
  private cloudiness=0
  private nextTint=0
  private nextAudio=0
  private indoor=false
  private systemReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
  constructor(private scene: Phaser.Scene, private width: number, private height: number, private sources: {x:number;y:number;kind?:'window'|'lamp'}[]=[]) {
    for(let i=0;i<150;i++) this.rain.push(scene.add.image(Math.random()*width,Math.random()*height,'weather:rain-light').setDisplaySize(5,12).setDepth(16000).setVisible(false).setData('speed',160+Math.random()*160))
    for(let i=0;i<6;i++) this.clouds.push(scene.add.image(Math.random()*width,Math.random()*200,'weather:cloud-'+['small','medium','large','thin','dark','overcast'][i]).setScale(2+i%2).setDepth(14500).setAlpha(0).setScrollFactor(0))
    for(let i=0;i<6;i++) this.shadows.push(scene.add.image(0,0,'weather:cloud-shadow').setScale(2+i%2).setDepth(-80).setAlpha(0).setScrollFactor(0))
    for(let i=0;i<12;i++) this.splashes.push(scene.add.image(0,0,'weather:splash-0').setDisplaySize(13,9).setDepth(50).setVisible(false))
    for(const [x,y] of [[.25,.48],[.52,.64],[.72,.45]]) this.puddles.push(scene.add.image(width*x,height*y,'weather:puddle-1').setDisplaySize(42,22).setDepth(-60).setAlpha(0))
    for(const point of sources) this.lights.push(scene.add.image(point.x,point.y-(point.kind==='window'?32:0),'night:'+(point.kind==='window'?'window-on':'lantern-on')).setScale(point.kind==='window' ? .5 : 1).setOrigin(.5,1).setDepth(point.y+1).setAlpha(0).setData('noTint',true))
    this.moon=scene.add.image(42,45,'night:moon').setScrollFactor(0).setScale(.5).setDepth(17000).setAlpha(0)
    this.stars=scene.add.image(105,30,'night:stars').setScrollFactor(0).setScale(.8).setDepth(17000).setAlpha(0)
  }
  get raining() { return this.intensity>.15 && !this.indoor }
  get puddleLocations() { return this.puddles }
  splash(x:number,y:number) {
    const sprite=this.splashes.find((p)=>!p.visible)
    if(!sprite)return
    sprite.setPosition(x,y).setVisible(true).setAlpha(.6)
    this.scene.tweens.addCounter({from:0,to:3,duration:360,onUpdate:(t)=>sprite.setTexture('weather:splash-'+Math.floor(t.getValue()??0)),onComplete:()=>sprite.setVisible(false)})
  }
  step(time:number,delta:number,world:WorldConditions,indoors:boolean) {
    this.indoor=indoors
    const prefs=immersionPreferences.get(),reduced=prefs.reducedEffects||this.systemReduced
    const target=world.weather==='heavy-rain' ? 1 : world.weather==='light-rain' ? .45 : 0
    const blend=Math.min(1,delta/8000)
    this.intensity+=(target-this.intensity)*blend
    this.cloudiness+=((world.weather==='clear' ? .08 : world.weather==='cloudy' ? .45 : .8)-this.cloudiness)*blend
    const camera=this.scene.cameras.main, view=camera.worldView
    const count=indoors?0:Math.round(this.intensity*(reduced?28:150))
    for(let i=0;i<this.rain.length;i++) {
      const drop=this.rain[i];drop.setVisible(i<count)
      if(i>=count)continue
      drop.setAlpha(.35+this.intensity*.2)
      drop.y+=(Number(drop.getData('speed'))*(1+this.intensity)*Math.min(delta,50))/1000;drop.x-=delta*.025
      if(drop.y>view.bottom||drop.x<view.left||drop.x>view.right||drop.y<view.top) {
        if(!reduced&&i%14===0)this.splash(drop.x,Math.min(drop.y,view.bottom-8))
        drop.setPosition(view.left+Math.random()*view.width,view.top-Math.random()*60)
      }
    }
    this.clouds.forEach((cloud,i)=>{cloud.setVisible(!indoors);cloud.setAlpha(this.cloudiness*.17);if(!reduced)cloud.x+=(5+i)*delta/1000;if(cloud.x>camera.width/camera.zoom+160)cloud.x=-140;this.shadows[i].setVisible(!indoors).setPosition(cloud.x,cloud.y+100).setAlpha(this.cloudiness*.035)})
    this.puddles.forEach((p)=>p.setAlpha(indoors?0:this.intensity*.6))
    const phase=dayPhase(world.minute),night=phase==='night',evening=phase==='evening'
    this.moon.setAlpha(!indoors&&night ? .65 : 0);this.stars.setAlpha(!indoors&&night ? .5 : 0)
    this.lights.forEach((light,index)=>{if(this.sources[index]?.kind!=='window')light.setTexture(indoors?'night:indoor-lamp-on':'night:streetlamp-on');light.setAlpha(night||evening ? .9 : .12)})
    if(time>this.nextAudio){this.nextAudio=time+800;void audio.setRain(prefs.weatherSounds?this.intensity:0,indoors)}
    if(time>this.nextTint) {
      this.nextTint=time+800
      const nightAmount=(Math.cos((world.minute-60)/1440*Math.PI*2)+1)/2
      const dim=(indoors ? .12 : .32)*nightAmount+this.cloudiness*(indoors ? .015 : .08)
      const base=evening?[245,221,196]:[Math.round(255*(1-dim*.9)),Math.round(255*(1-dim*.62)),Math.round(255*(1-dim*.15))]
      for(const object of this.scene.children.list) {
        const child=object as Phaser.GameObjects.Image
        if(child.getData?.('noTint')||child.depth>=9000||child.type==='Graphics'||child.type==='Text')continue
        if('forEachTile' in child) {
          const layer=child as unknown as Phaser.Tilemaps.TilemapLayer
          layer.forEachTile((tile)=>{tile.tint=(base[0]<<16)|(base[1]<<8)|base[2]})
        } else if(typeof child.setTint==='function') {
          const lit=this.sources.some((s)=>Math.hypot(child.x-s.x,child.y-s.y)<78)
          const color=lit&&night?[255,235,205]:base
          const original=Number(child.getData('baseTint')??child.tintTopLeft??0xffffff)
          child.setData('baseTint',original)
          child.setTint((Math.round(((original>>16)&255)*color[0]/255)<<16)|(Math.round(((original>>8)&255)*color[1]/255)<<8)|Math.round((original&255)*color[2]/255))
        }
      }
    }
  }
  destroy() { [...this.rain,...this.clouds,...this.shadows,...this.splashes,...this.puddles,...this.lights,this.moon,this.stars].forEach((o)=>{if(o.scene)o.destroy()});void audio.setRain(0,false) }
}
