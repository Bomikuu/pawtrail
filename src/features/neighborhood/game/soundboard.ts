import Phaser from 'phaser'
import { audio } from './systems/audio'
import { CAT_EMOTES } from './immersion-data'
import { immersionPreferences } from './immersion-preferences'

export function preloadCatFaces(scene: Phaser.Scene) {
  for (const id of CAT_EMOTES) scene.load.spritesheet('cat-face:'+id, `/assets/game/soundboard/animations/${id}.png`, { frameWidth:32,frameHeight:32 })
}
export function catReaction(scene: Phaser.Scene, position: {x:number;y:number}, id: string, local = true, distance = 0) {
  if (!(CAT_EMOTES as readonly string[]).includes(id)) return
  const prefs=immersionPreferences.get()
  if (distance>prefs.audioRange) return
  if (local || !prefs.muteOthers) void audio.playSample(`/assets/game/soundboard/audio/${id}.wav`,prefs.soundboardVolume*.6,false,distance/prefs.audioRange*300)
  if (!prefs.emoteEffects || !scene.textures.exists('cat-face:'+id)) return
  const key='cat-face:'+id
  if (!scene.anims.exists(key)) scene.anims.create({key,frames:scene.anims.generateFrameNumbers(key,{start:0,end:3}),frameRate:5,repeat:2})
  const icon=scene.add.sprite(position.x,position.y-58,key).setDepth(21000).play(key)
  const reduced=prefs.reducedEffects || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  scene.tweens.add({targets:icon,y:icon.y-(reduced?0:18),alpha:0,duration:1800,ease:'Sine.easeOut',onComplete:()=>icon.destroy()})
  if(!reduced)scene.tweens.add({targets:icon,scaleX:1.15,scaleY:1.15,yoyo:true,duration:130,ease:'Back.easeOut'})
  if (!reduced && ['confused','angry','surprised'].includes(id)) scene.tweens.add({targets:icon,x:icon.x+3,yoyo:true,repeat:3,duration:90})
}
