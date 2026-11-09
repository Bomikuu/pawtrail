import type Phaser from 'phaser'
import { audio } from '../systems/audio'
import { actionSound, type ActionSoundVoice } from '../systems/action-sounds'
import { immersionPreferences } from '../immersion-preferences'
import { jetpackEnvelope } from '../actor-rig/action-playback'
import { catActionSample } from './cat-action-sounds'
import clips from '../actor-rig/actions.json'

/** Per-actor lifecycle shared by live models, exported sprites and the creator. */
export class ActorActionAudio {
  private voice?: ActionSoundVoice
  private sound = ''
  private stage = ''
  private since = 0
  private last = 0
  private sample?: AbortController
  private sampleId = ''
  private sampleAction = ''
  private nextSample = 0
  private trackedAction = ''
  private actionSince = 0
  private trackedTime = 0
  constructor(private kind: 'player' | 'cat') {}

  update(target: Phaser.GameObjects.Sprite, action: string, time: number, enabled = true) {
    if (action !== this.trackedAction || time < this.trackedTime) { this.trackedAction = action; this.actionSince = time }
    this.trackedTime = time
    const clip = this.kind === 'cat' ? (clips['orange-tabby'] as Record<string, {frames?: number;fps: number;repeat: number}>)[action] : undefined
    if (clip?.repeat === 0 && time - this.actionSince >= (clip.frames ?? 8) / clip.fps * 1000) { this.stop(); return }
    const prefs = immersionPreferences.get()
    const view = target.scene.cameras.main.worldView
    const local = !!target.getData('actorLocalAudio')
    const listener = target.scene.data.get('actorAudioListener') as Phaser.GameObjects.Sprite | undefined
    const center = target.scene.cameras.main.midPoint
    const distance = local ? 0 : Math.hypot(target.x - (listener?.x ?? center.x), target.y - (listener?.y ?? center.y))
    const gain = prefs.soundboardVolume * (local ? 1 : Math.max(0, 1 - distance / prefs.audioRange))
    const sound = actionSound(action, this.kind)
    if (!enabled || !sound || !target.visible || target.alpha <= 0 || document.hidden ||
      target.x < view.x - 80 || target.x > view.right + 80 || target.y < view.y - 80 || target.y > view.bottom + 80 ||
      !audio.unlocked || audio.settings.muted || audio.settings.effects === 0 || gain <= .001 ||
      (target.getData('actorRemoteAudio') && prefs.muteOthers)) {
      this.stop()
      return
    }
    if (this.sound !== sound || time < this.last) {
      this.stop()
      this.sound = sound
    }
    if (action !== this.stage || time < this.last) { this.stage = action; this.since = time }
    this.last = time
    if (!this.voice?.alive) this.voice = audio.createActionVoice(sound, this.kind === 'cat')
    const sample = this.kind === 'cat' ? catActionSample(action) : undefined
    if ((sample ?? '') !== this.sampleId || action !== this.sampleAction) {
      this.sample?.abort(); this.sample = undefined; this.sampleId = sample ?? ''; this.sampleAction = action; this.nextSample = 0
    }
    if (sample && time >= this.nextSample) {
      this.sample?.abort()
      this.sample = new AbortController()
      this.nextSample = clip?.repeat === 0 ? Infinity : time + 4200
      void audio.playSample('/assets/game/soundboard/audio/' + sample + '.wav', gain * .65, false, 0, this.sample.signal)
    }
    const thrust = sound === 'jetpack' ? .25 + .75 * jetpackEnvelope(action, Math.max(0, time - this.since)).thrust : 1
    this.voice?.setVolume(gain * thrust, action)
  }

  stop() {
    this.voice?.stop()
    this.voice = undefined
    this.sound = ''
    this.stage = ''
    this.sample?.abort(); this.sample = undefined; this.sampleId = ''; this.sampleAction = ''; this.nextSample = 0
  }
}
