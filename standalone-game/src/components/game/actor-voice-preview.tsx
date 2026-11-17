import { useEffect, useSyncExternalStore } from 'react'
import { LoaderCircle, Play, Square, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { actorPreviewVoice, actorVoicePacks, previewVoiceActorId, type ActorVoiceCue } from '@/game/runtime/actor-preview-voice'
import { actorComparison, type ComparisonAction } from '@/game/runtime/actor-comparison-state'
import { audio } from '@/game/systems/audio'
import type { CreatorPreviewModel } from '@/game/creator/preview-models'

const labels = { hi: 'Greeting', bye: 'Farewell', attack: 'Attack', hurt: 'Hurt reaction', thanks: 'Thanks', encouragement: 'Encouragement' }
const subscribeAudio = (listener: () => void) => audio.subscribePreferences(listener)
const audioSnapshot = () => audio.settings

export function ActorVoicePreview({ model }: { model: CreatorPreviewModel }) {
  const voice = useSyncExternalStore(actorPreviewVoice.subscribe, actorPreviewVoice.getSnapshot, actorPreviewVoice.getSnapshot)
  const comparison = useSyncExternalStore(actorComparison.subscribe, actorComparison.getSnapshot, actorComparison.getSnapshot)
  const settings = useSyncExternalStore(subscribeAudio, audioSnapshot, audioSnapshot)
  const actorId = previewVoiceActorId(model)
  const pack = actorVoicePacks.find(pack => pack.actorId === actorId)
  const enabled = !settings.muted && settings.master > 0 && settings.effects > 0
  useEffect(() => {
    actorPreviewVoice.configure(actorId)
    const visibility = () => { if (document.hidden) actorPreviewVoice.stop() }
    const release = audio.subscribePreferences(() => {
      if (audio.settings.muted || audio.settings.master === 0 || audio.settings.effects === 0) actorPreviewVoice.stop('Sound muted.')
    })
    document.addEventListener('visibilitychange', visibility)
    return () => { release(); document.removeEventListener('visibilitychange', visibility); actorPreviewVoice.configure('') }
  }, [actorId])
  useEffect(() => {
    if (comparison.paused || comparison.status !== 'ready') actorPreviewVoice.stop()
  }, [comparison.paused, comparison.status])
  if (!pack) return null

  const perform = async (cue: ActorVoiceCue) => {
    const active = actorPreviewVoice.getSnapshot()
    if (active.cue?.id === cue.id && (active.status === 'playing' || active.status === 'loading')) {
      actorPreviewVoice.stop('Voice stopped.')
      return
    }
    if (!await audio.unlock()) { actorPreviewVoice.fail('Audio is unavailable. Try enabling sound again.'); return }
    if (actorPreviewVoice.getSnapshot().actorId !== actorId || actorComparison.getSnapshot().status !== 'ready') return
    if (actorPreviewVoice.prepare(cue.id)) actorComparison.patch({
      action: cue.action as ComparisonAction, paused: false,
      restart: actorComparison.getSnapshot().restart + 1,
    })
  }
  return <section className="mt-5 space-y-3 rounded-md border bg-card p-4" aria-labelledby="actor-voice-heading">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 id="actor-voice-heading" className="flex items-center gap-2 font-heading text-xl font-semibold"><Volume2 className="size-4" />{pack.name}’s voice</h3><p className="mt-1 text-xs text-muted-foreground">Japanese · {pack.cues.length} short cues · {(pack.totalBytes / 1000).toFixed(1)} KB</p></div>
      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-xs"><Switch checked={voice.automatic} onCheckedChange={value => actorPreviewVoice.automatic(value)} />Voice with actions</label>
        <label className="flex cursor-pointer items-center gap-2 text-xs"><Switch checked={enabled} onCheckedChange={value => {
          audio.update({ muted: !value, ...(value && settings.effects === 0 ? { effects: .45 } : {}), ...(value && settings.master === 0 ? { master: .55 } : {}) })
          if (value) void audio.unlock()
        }} />Sound</label>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6" role="group" aria-label="Perform a voiced action">
      {pack.cues.map(cue => {
        const active = voice.actorId === actorId && voice.cue?.id === cue.id && ['loading', 'playing'].includes(voice.status)
        return <Button key={cue.id} type="button" variant={active ? 'secondary' : 'outline'} className="h-auto min-h-14 flex-col items-start gap-1 rounded-md px-3 py-2 text-left" disabled={comparison.status !== 'ready'} onClick={() => void perform(cue)} aria-label={(active ? 'Stop ' : 'Play ') + labels[cue.id]} aria-pressed={active}>
          <span className="flex items-center gap-1.5 text-xs font-semibold">{active ? voice.status === 'loading' ? <LoaderCircle className="size-3.5 motion-safe:animate-spin" /> : <Square className="size-3 fill-current" /> : <Play className="size-3.5" />}{labels[cue.id]}</span>
          <span className="text-[11px] font-normal text-muted-foreground">{cue.actionLabel} · {cue.durationSeconds.toFixed(1)}s</span>
        </Button>
      })}
    </div>
    {voice.cue && voice.actorId === actorId && <div className="rounded-md bg-muted/40 px-3 py-2.5 text-sm">
      <p lang="ja" className="font-medium">{voice.cue.text}</p><p className="mt-1 text-xs text-muted-foreground">{voice.cue.romanization}</p><p className="mt-1 text-xs">{voice.cue.translation}</p>
    </div>}
    <p role={voice.status === 'error' ? 'alert' : 'status'} aria-live="polite" className="min-h-4 text-xs text-muted-foreground">{voice.message || `Choose a cue to hear ${pack.name} and perform its gesture. Action selection can play a matching line once.`}</p>
    <p className="text-xs leading-relaxed text-muted-foreground">Wave greets, clap thanks, cheer encourages, and an accepted power-up or dash uses the attack call. Hurt is a reaction rehearsal. Farewell has its own wave button above.</p>
  </section>
}
