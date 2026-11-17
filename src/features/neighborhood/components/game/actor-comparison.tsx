import {useAbilities} from './shared/ability-status';
import {isAbility,abilitySeconds} from '@/features/neighborhood/game/abilities/state';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye, Minus, Pause, PawPrint, Play, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlayHeader, PlayShell } from './shared/play-chrome'
import { actorComparison, comparisonActions, previewActions, comparisonDirections, toggleFaceInspection, type ComparisonAction, type ComparisonDirection } from '@/features/neighborhood/game/runtime/actor-comparison-state'
import { actorPreviews } from '@/features/neighborhood/game/runtime/actor-previews'
import { ActorPreviewReference } from './actor-preview-reference'
import { loadGameFonts } from '@/features/neighborhood/game/font-loader'
import { navigatePlay, navigateSkinStudio } from '@/features/neighborhood/game/play-navigation'
import { gameStore } from '@/features/neighborhood/game/store'
import { CharacterCreatorEditor } from './character-creator-editor'
import { characterCreator } from '@/features/neighborhood/game/creator/state'
import actions from '@/features/neighborhood/game/actor-rig/actions.json'
import { audio } from '@/features/neighborhood/game/systems/audio'
import { CatCreatorEditor } from './cat-creator-editor'
import { catCreator } from '@/features/neighborhood/game/cat-creator/state'
import { ActorDialoguePreview } from './actor-dialogue-preview'

const directions = [
  { label: 'Move left', Icon: ArrowLeft, x: -1, y: 0 },
  { label: 'Move up', Icon: ArrowUp, x: 0, y: -1 },
  { label: 'Move down', Icon: ArrowDown, x: 0, y: 1 },
  { label: 'Move right', Icon: ArrowRight, x: 1, y: 0 },
]

export default function ActorComparisonPage({ preview = false, creator = false, cats = false }: { preview?: boolean; creator?: boolean; cats?: boolean }) {
  useAbilities();
  const draft = useSyncExternalStore(characterCreator.subscribe, characterCreator.getSnapshot, characterCreator.getSnapshot)
  const catDraft = useSyncExternalStore(catCreator.subscribe, catCreator.getSnapshot, catCreator.getSnapshot)
  const editing = creator || cats
  const state = useSyncExternalStore(actorComparison.subscribe, actorComparison.getSnapshot, actorComparison.getSnapshot)
  const inspecting = editing && (cats ? state.catDetail : state.actorDetail)
  const progress = useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot, gameStore.getSnapshot).progress
  const host = useRef<HTMLDivElement>(null)
  const [attempt, setAttempt] = useState(0)
  const available = actorPreviews.filter(entry => !cats || entry.kind === 'orange-tabby')
  const [appearanceId, setAppearanceId] = useState(() => {
    const requested = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search).get('skin')
    return available.some(entry => entry.id === requested) ? requested! : available[0]?.id ?? ''
  })
  const appearance = preview && !creator ? available.find(entry => entry.id === appearanceId) ?? available[0] : undefined
  const refined=creator&&draft.previewModel!=='shared'
  const choices = useMemo(() => cats ? previewActions.filter(action => (action.value === 'feed' ? 'eat' : action.value === 'water' ? 'drink' : action.value) in actions['orange-tabby']) : creator ? previewActions.filter(action=>action.value in actions.rescuer) : preview ? previewActions.filter(action => {
    const name = appearance?.sheet.kind === 'cat' ? ({feed:'eat',water:'drink'} as Record<string,string>)[action.value] ?? action.value : action.value
    return !!appearance?.sheet.animations[name + '-down'] && (action.value !== 'fly' || !!appearance.cat?.wings && appearance.cat.wings !== 'none')
  }) : comparisonActions, [preview, appearance, creator, cats, refined])

  useEffect(() => {
    let canceled = false
    let release: (() => void) | undefined
    actorComparison.patch({ mode: cats ? 'cat-creator' : creator ? 'creator' : preview ? 'skin' : 'legacy', appearance: appearance?.id ?? '', status: 'loading', load: 0, error: '', portraitAction:'idle', inputX: 0, inputY: 0 })
    if (preview && !editing && !appearance) { actorComparison.patch({status:'ready'}); return }
    const query = new URLSearchParams(window.location.search)
    const pose = query.get('pose'), facing = query.get('facing')
    if (choices.some(action => action.value === pose)) actorComparison.patch({ action: pose as ComparisonAction })
    else if (!choices.some(action => action.value === actorComparison.getSnapshot().action)) actorComparison.patch({action:'idle'})
    if (comparisonDirections.some(direction => direction.value === facing)) actorComparison.patch({ direction: facing as ComparisonDirection })
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) actorComparison.patch({ paused: true })
    const failed = (event: Event) => {
      sessionStorage.setItem('pawtrail:canvas-recovery', '1')
      actorComparison.patch({ status: 'error', error: String((event as CustomEvent).detail) })
    }
    window.addEventListener('pawtrail:renderer-error', failed)
    Promise.all([import('@/features/neighborhood/game/runtime/session'), loadGameFonts()]).then(async ([session]) => {
      if (canceled || !host.current) return
      if(creator){const {prepareCreatorModel}=await import('@/features/neighborhood/game/creator/preview-models');await prepareCreatorModel(draft.previewModel);if(canceled||!host.current)return}
      if (attempt) session.resetWorldRenderer()
      const cleanup = await session.mountWorld(host.current, 'ActorCompare', () => {
        if (!canceled && actorComparison.getSnapshot().status !== 'error') {
          actorComparison.patch({ status: 'ready', load: 1 })
        }
      })
      if (canceled) cleanup()
      else release = cleanup
    }).catch(() => {
      if (!canceled) actorComparison.patch({ status: 'error', error: 'The comparison field could not open. Please retry.' })
    })
    return () => {
      canceled = true
      release?.()
      actorComparison.patch({ inputX: 0, inputY: 0 })
      window.removeEventListener('pawtrail:renderer-error', failed)
    }
  }, [attempt, preview, creator, cats, editing ? undefined : appearance, choices, creator?draft.previewModel:undefined])

  useEffect(() => { if(!creator)return; const id=new URLSearchParams(window.location.search).get('skin');if(id)characterCreator.template(id==='amber'?'amber-outrider':id==='yae'?'yae-miko':id) }, [creator])
  useEffect(() => { if(!cats)return; const id=new URLSearchParams(window.location.search).get('skin');if(id)catCreator.template(id) }, [cats])
  useEffect(() => { if(cats && catDraft.appearance.cat.wings==='none' && state.action==='fly')actorComparison.patch({action:'idle'}) }, [cats, catDraft.appearance.cat.wings, state.action])

  const stop = () => actorComparison.patch({ inputX: 0, inputY: 0 })
  return (
    <PlayShell>
      <PlayHeader location={cats ? 'Cat creator' : creator ? 'Character creator' : preview ? 'Character preview' : 'Character & cat comparison'} balance={progress.kibble} scope="local">
        <Button variant="outline" className="rounded-md" onClick={() => { if(!editing || !(cats ? catCreator.dirty() : characterCreator.dirty()) || window.confirm('Leave the creator? Your draft stays on this device, but save it to keep it in your library.')) navigatePlay('explore') }}>
          <ArrowLeft className="size-4" /><span className="hidden sm:inline">Back to Explore</span>
        </Button>
      </PlayHeader>
      <main onPointerDownCapture={() => { void audio.unlock() }} onKeyDownCapture={() => { void audio.unlock() }} className={'min-h-0 flex-1 overflow-y-auto p-3 md:p-5 ' + (editing ? 'grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]' : preview ? 'grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]' : '')}>
        {cats && <CatCreatorEditor />}
        {creator && <CharacterCreatorEditor />}
        {preview && !editing && <ActorPreviewReference appearance={appearance} loading={state.status === 'loading'} onSelect={id => {
          setAppearanceId(id)
          const query = new URLSearchParams(window.location.search); query.set('skin',id)
          window.history.replaceState(null,'',window.location.pathname+'?'+query.toString())
        }} />}
        <div className={'order-1 min-w-0 lg:order-none ' + (editing ? 'lg:sticky lg:top-0' : '')}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-3xl font-bold leading-none">{cats ? 'Make a cat of your own.' : creator ? 'Meet your next adventurer.' : preview ? 'A new look, ready to explore.' : 'Original & current, together'}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{cats ? 'Their shape, coat and personality—live beside the approved tabby. Try every action with sounds and shadows.' : creator ? 'Your look, with every movement. Changes appear here as you create.' : preview ? 'Review your reference-guided character using the approved movement set.' : 'One rescuer and one orange tabby. The same ground, scale and controls.'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {creator && <Button variant="outline" onClick={navigateSkinStudio}>Paint a skin</Button>}
            {creator && <ActorDialoguePreview name={draft.name || 'Your character'} appearance={draft.appearance} model={draft.previewModel} />}
            {creator&&draft.previewModel!=='shared'&&<Button variant="outline" onClick={()=>{window.history.pushState(null,'',window.location.pathname+'?compare='+(draft.previewModel==='yae'?'yae':'amber'));window.dispatchEvent(new PopStateEvent('popstate'))}}>Model study</Button>}
            {editing && <Button variant={inspecting?'secondary':'outline'} aria-pressed={inspecting} onClick={()=>toggleFaceInspection(cats?'cat':'actor')}><Eye className="size-4" />{inspecting?'Full body':'Inspect face'}</Button>}
            {creator && state.presentationAction==='jetpack_land' && <span role="status" className="text-xs text-muted-foreground">Landing…</span>}
            <Button variant="outline" disabled={preview && !editing && !appearance} onClick={() => actorComparison.patch({ paused: !state.paused })}>
              {state.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              {state.paused ? 'Play' : 'Pause'}
            </Button>
            {(creator || cats) && !['idle','walk','run'].includes(state.action) && <Button variant="secondary" onClick={()=>actorComparison.patch({action:'idle'})}>{state.action.startsWith('jetpack')?'Land':state.action==='power_up'?'End power up':'End action'}</Button>}
            <Button variant="outline" onClick={() => actorComparison.patch({ restart: state.restart + 1, inputX: 0, inputY: 0 })}>
              <RotateCcw className="size-4" />Reset
            </Button>
          </div>
        </div>
        <div className="mb-3 grid grid-cols-2 items-end gap-3 md:flex md:flex-wrap">
          <div className="min-w-0 space-y-1.5 md:w-44">
            <label id="compare-action-label" className="text-xs font-semibold">Action</label>
            <Select value={state.action} disabled={!choices.length} onValueChange={value => actorComparison.patch({ action: value as ComparisonAction })}>
              <SelectTrigger aria-labelledby="compare-action-label" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{choices.map(action => <SelectItem key={action.value} value={action.value} disabled={cats && action.value==='fly' && catDraft.appearance.cat.wings==='none' || isAbility(action.value==='power_run'?'power_up':action.value)&&abilitySeconds((action.value==='power_run'?'power_up':action.value) as import('@/features/neighborhood/game/abilities/state').AbilityId)>0}>{action.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1.5 md:w-44">
            <label id="compare-facing-label" className="text-xs font-semibold">Model angle</label>
            <Select value={state.direction} onValueChange={value => actorComparison.patch({ direction: value as ComparisonDirection })}>
              <SelectTrigger aria-labelledby="compare-facing-label" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{comparisonDirections.map(direction => <SelectItem key={direction.value} value={direction.value}>{direction.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1.5 md:w-48">
            <label id="compare-timing-label" className="text-xs font-semibold">Timing</label>
            <Select value={state.timing} onValueChange={value => actorComparison.patch({ timing: value as 'synchronized' | 'native' })}>
              <SelectTrigger aria-labelledby="compare-timing-label" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="synchronized">Synchronized cycles</SelectItem>
                <SelectItem value="native">Game timing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-end gap-2 md:ml-auto" role="group" aria-label="Comparison zoom">
            <Button variant="outline" size="icon" disabled={state.zoom <= 1} aria-label="Zoom out" onClick={() => actorComparison.patch({ zoom: state.zoom - 1 })}><Minus className="size-4" /></Button>
            <span className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{state.zoom}×</span>
            <Button variant="outline" size="icon" disabled={state.zoom >= state.zoomLimit} aria-label="Zoom in" onClick={() => actorComparison.patch({ zoom: state.zoom + 1 })}><Plus className="size-4" /></Button>
          </div>
        </div>
        <section className="overflow-hidden rounded-md border" aria-label={preview ? 'Approved rig and new appearance preview' : 'Side by side character and cat comparison'}>
          <div className="grid grid-cols-2 divide-x border-b bg-muted/50 text-center">
            {!(inspecting)&&<div className="px-3 py-2.5"><h3 className="font-heading text-xl font-bold">{preview ? 'Approved base' : 'Original 2D'}</h3><p className="text-xs text-muted-foreground">{preview ? 'Shared rig and movements' : 'Original game sprites'}</p></div>}
            <div className={'px-3 py-2.5 '+(inspecting?'col-span-2':'')}><h3 className="font-heading text-xl font-bold">{cats ? catDraft.name || 'Your cat' : creator ? draft.name || 'Your character' : preview ? appearance?.name ?? 'Your next appearance' : 'Current appearance'}</h3><p className="text-xs text-muted-foreground">{inspecting?'Face details':editing ? 'Live pixel preview' : preview ? 'Reference-guided skin' : 'New pixel renders from the 3D rigs'}</p></div>
          </div>
          <div className={'relative h-[58dvh] max-h-[720px] bg-[#6a9039] ' + (editing ? 'min-h-[360px]' : state.zoom === 4 ? 'min-h-[640px]' : 'min-h-[480px]')}>
            <div ref={host} className="absolute inset-0 overflow-hidden [&_canvas]:[image-rendering:pixelated]" onPointerDown={() => host.current?.querySelector('canvas')?.focus({ preventScroll: true })} />
            {preview && !editing && !appearance && <div className="absolute inset-0 grid place-items-center bg-background/95 p-6 text-center"><div><PawPrint className="mx-auto mb-3 size-8" /><p className="font-heading text-xl font-bold">Your next character starts here.</p><p className="mt-2 max-w-sm text-sm text-muted-foreground">Use PawTrail Actors with your image reference to create an appearance for this preview.</p></div></div>}
            {state.status === 'loading' && (!preview || editing || appearance) && (
              <div className="absolute inset-0 grid place-items-center bg-background/95" role="status">
                <div className="w-56 text-center"><PawPrint className="mx-auto mb-3 size-8 motion-safe:animate-bounce" /><p className="mb-3 text-sm">Preparing both appearances…</p><Progress value={state.load * 100} /></div>
              </div>
            )}
            {state.status === 'error' && (
              <div className="absolute inset-0 grid place-items-center bg-background/95 p-5" role="alert">
                <div className="max-w-sm text-center"><p className="mb-4 text-sm">{state.error}</p><Button onClick={() => setAttempt(value => value + 1)}>Retry comparison</Button></div>
              </div>
            )}
          </div>
        </section>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div id="actor-comparison-help" className="space-y-1 text-xs text-muted-foreground">
            <p>{inspecting?'Close view of your eyes and face details. Choose Full body to return to the comparison.':<>Click the field, then use WASD or arrow keys. Or hold the arrow controls to move {preview ? 'both appearances' : 'both pairs'}.</>}</p>
            {editing && !['idle','walk','run'].includes(state.action) && <p className="font-medium text-foreground">{state.action.startsWith('jetpack')?'Steer while flying. Choose Land to touch down and return to normal.':cats?'Your selected action stays active while moving. One-shot actions land and settle; choose End action to return to idle.':'Your selected action stays active while you move. Timed abilities end automatically; you can also end them here.'}</p>}
            <p>{state.timing === 'synchronized' ? 'Action cycles are synchronized; each version keeps its own frames.' : 'Each version uses its own game animation speed.'} {preview ? 'Both appearances use the same base animations and eight directions.' : 'Original walking has four directions; some original actions have a fixed facing.'}</p>
            {preview && !inspecting && state.zoomLimit < 4 && <p>Zoom is fitted to keep both silhouettes in view.</p>}
            {!preview && state.action === 'sleep' && <p role="status" className="font-medium text-foreground">The original rescuer has no sleeping clip, so its idle pose is shown.</p>}
            {!preview && ['sad', 'happy', 'angry', 'dance', 'float', 'tired', 'surprised', 'play', 'laugh', 'sick', 'ride'].includes(state.action) && <p role="status" className="font-medium text-foreground">New effects appear on the current side. Original sheets without this emote show idle.</p>}
            {state.action === 'ride' && <p className="text-muted-foreground">A cosmetic rooftop ride with animated wheels. Your selected action stays active while moving.</p>}
          </div>
          <div className="flex gap-1.5" role="group" aria-label="Move comparison actors">
            {directions.map(({ label, Icon, x, y }) => (
              <Button key={label} variant="outline" size="icon" aria-label={label} disabled={state.paused || state.status !== 'ready' || (preview && !editing && !appearance)}
                onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); actorComparison.patch({ inputX: x, inputY: y }) }}
                onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
                onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); actorComparison.patch({ inputX: x, inputY: y }) } }}
                onKeyUp={stop} onBlur={stop}>
                <Icon className="size-4" />
              </Button>
            ))}
          </div>
        </div>
        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">{refined ? 'Refined actor preview with the shared action set. Choose another template to create and save a custom look.' : creator ? 'Save a look to your library, then choose Use in game. Keep several characters and switch whenever you like.' : preview ? 'Appearance preview only. This character has not been added to your game roster.' : 'Comparison only. Your saved character, animals, care progress and Kibble stay unchanged.'}</p>
        </div>
      </main>
    </PlayShell>
  )
}
