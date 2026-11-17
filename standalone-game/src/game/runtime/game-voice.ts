import { audio } from '../systems/audio'
import { actorVoicePacks, type ActorVoiceCue, type ActorVoiceCueId } from './actor-preview-voice'
import { featuredActors } from './featured-actors'
import { getSavedCharacter } from '../creator/library'
import { appearanceSignature } from '../actor-rig/appearance'

export function voiceActor(identity?: string) {
  if (!identity) return ''
  if (featuredActors[identity]) return identity
  const byCollection = Object.entries(featuredActors).find(([, actor]) => actor.collection === identity || actor.model === identity)
  if (byCollection) return byCollection[0]
  const saved = getSavedCharacter(identity)
  if (!saved) return ''
  return Object.entries(featuredActors).find(([, actor]) =>
    appearanceSignature(actor.appearance) === appearanceSignature(saved.appearance))?.[0] ?? ''
}
type VoiceState = { actorId: string; localActorId: string; scene: string; owner: string; cue?: ActorVoiceCue; status: 'idle' | 'loading' | 'playing' | 'error'; priority: number; action: string; message: string }
class GameVoice {
  private state: VoiceState = { actorId: '', localActorId: '', scene: '', owner: '', status: 'idle', priority: 0, action: 'idle', message: '' }
  private listeners = new Set<() => void>()
  private controller?: AbortController
  private serial = 0
  private cooldowns = new Map<string, number>()
  getSnapshot = () => this.state
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  private patch(value: Partial<VoiceState>) { this.state = { ...this.state, ...value }; this.listeners.forEach(fn => fn()) }
  stop(owner?: string) {
    if (owner && this.state.owner !== owner) return
    ++this.serial; this.controller?.abort(); this.controller = undefined
    this.patch({ status: 'idle', priority: 0, message: '' })
  }
  action(identity: string, action: string) {
    const actorId = voiceActor(identity)
    if (this.state.localActorId !== actorId) { this.stop(); this.patch({ localActorId: actorId, cue: undefined }) }
    if (this.state.action !== action) this.patch({ action })
  }
  async speak(identity: string, id: ActorVoiceCueId, owner: string, priority = 1) {
    const actorId = voiceActor(identity), pack = actorVoicePacks.find(pack => pack.actorId === actorId)
    const cue = pack?.cues.find(cue => cue.id === id)
    if (!cue || !audio.unlocked || audio.settings.muted || audio.settings.master === 0 || audio.settings.effects === 0 || document.hidden) return false
    if (['loading','playing'].includes(this.state.status) && priority <= this.state.priority) return false
    const key = actorId + ':' + id, now = performance.now()
    if (now < (this.cooldowns.get(key) ?? 0)) return false
    this.stop()
    const token = ++this.serial, controller = new AbortController()
    this.controller = controller
    this.patch({ actorId, owner, cue, priority, status: 'loading', message: 'Loading voice…' })
    const started = await audio.playSpeech(cue.file, .95, controller.signal, {
      onStart: () => {
        if (token !== this.serial) return
        this.cooldowns.set(key, performance.now() + (id === 'hurt' || id === 'attack' ? 2200 : 1200))
        this.patch({ status: 'playing', message: cue.translation })
      },
      onEnd: () => {
        if (token !== this.serial) return
        this.controller = undefined; this.patch({ status: 'idle', priority: 0, message: '' })
      },
    })
    if (!started && token === this.serial) this.patch({ status: 'error', priority: 0, message: 'Character voice unavailable.' })
    return !!started
  }
  accepted(identity: string, action: string, owner: string) {
    const intent: Partial<Record<string, ActorVoiceCueId>> = { wave: 'hi', clap: 'thanks', give_gift: 'thanks', cheer: 'encouragement', power_up: 'attack', power_run: 'attack', rescue_dash: 'attack' }
    const cue = intent[action]
    if (cue) void this.speak(identity, cue, owner)
  }
  enterScene(owner: string) {
    this.stop()
    this.patch({ owner, scene: owner, localActorId: '', action: 'idle' })
    const hidden = () => { if (document.hidden) this.stop() }
    const blur = () => this.stop()
    document.addEventListener('visibilitychange', hidden);window.addEventListener('blur',blur)
    const release = audio.subscribePreferences(() => {
      if(audio.settings.muted || !audio.settings.master || !audio.settings.effects)this.stop()
    })
    return () => { this.stop();release();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('blur',blur) }
  }
}
export const gameVoice = new GameVoice()
