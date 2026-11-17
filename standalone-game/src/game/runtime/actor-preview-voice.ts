import registry from './actor-voices.json'
import { audio } from '../systems/audio'
import type { PortraitExpression } from '../actor-rig/portrait-state'

export type ActorVoiceCueId = 'hi' | 'bye' | 'attack' | 'hurt' | 'thanks' | 'encouragement'
export type ActorVoiceCue = {
  id: ActorVoiceCueId
  text: string
  romanization: string
  translation: string
  file: string
  durationSeconds: number
  bytes: number
  portraitEmotion: PortraitExpression
  action: string
  actionLabel: string
}
export type ActorVoicePack = {
  actorId: string; name: string; language: string; profileId: string
  totalBytes: number; cues: ActorVoiceCue[]
}
export const actorVoicePacks = registry as ActorVoicePack[]
export function previewVoiceActorId(model: string) {
  return model === 'amber' ? 'amber-outrider' : model === 'yae' ? 'yae-miko' : ''
}
type VoiceState = {
  actorId: string; status: 'idle' | 'loading' | 'playing' | 'error'
  cue?: ActorVoiceCue; message: string; automatic: boolean
}

/** Speech is preview-only, bounded to one line and routed through the shared mixer. */
class ActorPreviewVoice {
  private state: VoiceState = { actorId: '', status: 'idle', message: '', automatic: true }
  private listeners = new Set<() => void>()
  private controller?: AbortController
  private pending?: ActorVoiceCue
  private sequence = 0
  private lastPlayed = new Map<ActorVoiceCueId, number>()
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private patch(value: Partial<VoiceState>) {
    this.state = { ...this.state, ...value }
    for (const listener of this.listeners) listener()
  }
  pack() { return actorVoicePacks.find(pack => pack.actorId === this.state.actorId) }
  configure(actorId: string) {
    this.stop()
    this.lastPlayed.clear()
    this.patch({ actorId, cue: undefined, message: '' })
  }
  stop(message = '') {
    ++this.sequence
    this.controller?.abort()
    this.controller = undefined
    this.pending = undefined
    this.patch({ status: 'idle', message })
  }
  fail(message: string) { this.stop(); this.patch({ status: 'error', message }) }
  automatic(value: boolean) { this.stop(); this.patch({ automatic: value }) }
  /** A button stages a cue; only the scene's accepted gesture may start it. */
  prepare(id: ActorVoiceCueId) {
    const cue = this.pack()?.cues.find(cue => cue.id === id)
    if (!cue) return false
    this.stop()
    this.pending = cue
    this.patch({ status: 'loading', cue, message: 'Preparing ' + cue.id + '…' })
    return true
  }
  accepted(action: string, resetOnly = false) {
    if (action === 'idle' && this.state.status === 'error') return
    const pending = this.pending
    if (pending?.action === action) {
      this.pending = undefined
      void this.play(pending, true)
      return
    }
    this.stop()
    if (resetOnly || !this.state.automatic) return
    // These are deliberate authoring gestures, not damage or reward receipts.
    const intent: Partial<Record<string, ActorVoiceCueId>> = {
      wave: 'hi', power_up: 'attack', power_run: 'attack', rescue_dash: 'attack',
      sick: 'hurt', clap: 'thanks', give_gift: 'thanks', cheer: 'encouragement',
    }
    const cue = this.pack()?.cues.find(cue => cue.id === intent[action])
    if (cue) void this.play(cue, false)
  }
  private async play(cue: ActorVoiceCue, explicit: boolean) {
    if (!audio.unlocked || audio.settings.muted || audio.settings.master === 0 || audio.settings.effects === 0) {
      if (explicit) this.fail('Sound is muted or unavailable. Enable sound, then try again.')
      return
    }
    const now = performance.now(), cooldown = cue.id === 'attack' || cue.id === 'hurt' ? 1800 : 800
    if (now - (this.lastPlayed.get(cue.id) ?? -Infinity) < cooldown) {
      this.patch({ status: 'idle', message: 'Give ' + (this.pack()?.name ?? 'the speaker') + ' a moment before repeating this line.' })
      return
    }
    const sequence = ++this.sequence, controller = new AbortController()
    this.controller = controller
    this.patch({ cue, status: 'loading', message: 'Loading voice…' })
    const started = await audio.playSpeech(cue.file, .95, controller.signal, {
      onStart: () => {
        if (sequence !== this.sequence) return
        this.lastPlayed.set(cue.id, performance.now())
        this.patch({ status: 'playing', message: cue.translation })
      },
      onEnd: () => {
        if (sequence !== this.sequence) return
        this.controller = undefined
        this.patch({ status: 'idle', message: 'Finished · ' + cue.translation })
      },
    })
    if (!started && sequence === this.sequence) this.fail('The voice could not play. Try the cue again.')
  }
}
export const actorPreviewVoice = new ActorPreviewVoice()
