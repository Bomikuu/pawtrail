import { useState } from 'react'
import { Check, Columns2, Image as ImageIcon, MessageCircle, Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PHOTO_PORTRAIT_STYLES, PHOTO_PORTRAIT_CHARACTERS, PHOTO_PORTRAIT_POSES, PHOTO_PORTRAIT_EMOTIONS, PHOTO_PORTRAIT_BLINKS, photoPortraitPoses, type PhotoPortraitEmotion, type PhotoPortraitPose, type PortraitBlink, type PortraitMouth } from '@/features/neighborhood/game/actor-rig/photo-portrait-catalog'
import { LivingPortrait } from './shared/living-portrait'
import { usePortraitDialogue } from './shared/use-portrait-dialogue'
import { NativePortraitReference } from './shared/native-portrait-reference'
import { PortraitFrameStrip } from './shared/portrait-frame-strip'
import portraitStyleDefinitions from '@/features/neighborhood/game/actor-rig/portrait-style-definitions.json'

const defaultLine = 'Every little act of kindness makes this neighborhood a better home. Shall we check on our animal friends?'
const backgrounds = { sage: 'bg-[#cdd0c2]', cream: 'bg-[#fff9ef]', dark: 'bg-[#202020]' }
const initialCharacter = PHOTO_PORTRAIT_CHARACTERS.find(entry => entry.id === 'amber') ?? PHOTO_PORTRAIT_CHARACTERS[0]
const initialStyle = PHOTO_PORTRAIT_STYLES.find(entry => entry.characterId === initialCharacter.id && entry.name === 'Refined cel') ?? PHOTO_PORTRAIT_STYLES.find(entry => entry.characterId === initialCharacter.id)!

export function PhotoPortraitStudio() {
  const [characterId, setCharacterId] = useState(initialCharacter.id)
  const [styleId, setStyleId] = useState(initialStyle.id)
  const [pose, setPose] = useState<PhotoPortraitPose>('front-pout')
  const [emotion, setEmotion] = useState<PhotoPortraitEmotion>('idle')
  const [blink, setBlink] = useState<PortraitBlink>('auto')
  const [paused, setPaused] = useState(false)
  const [breathing, setBreathing] = useState(true)
  const [mouth, setMouth] = useState<PortraitMouth>('auto')
  const [reference, setReference] = useState(false)
  const [loopTalking, setLoopTalking] = useState(false)
  const [compare, setCompare] = useState(false)
  const [background, setBackground] = useState<keyof typeof backgrounds>('sage')
  const [line, setLine] = useState(defaultLine)
  const dialogue = usePortraitDialogue(line, paused)
  const styles = PHOTO_PORTRAIT_STYLES.filter(entry => entry.characterId === characterId)
  const style = styles.find(entry => entry.id === styleId) ?? styles[0]
  const poses = photoPortraitPoses(style)
  const activePose = poses.some(entry => entry.id === pose) ? pose : poses[0].id
  const completeFrames = 'playback' in style && style.playback === 'complete-frames'
  const referenceOnly = 'playback' in style && style.playback === 'reference-only'
  const motionDisabled = reference || referenceOnly
  const design = Object.values(portraitStyleDefinitions).find(entry => entry.name === style.name)
  const chooseStyle = (id: string) => {
    setStyleId(id); setPose('front-pout'); setReference(false); setPaused(false); setLoopTalking(false); dialogue.stop()
    setBlink('auto'); setMouth('auto'); setBreathing(true)
  }
  const chooseCharacter = (id: string) => {
    const next = PHOTO_PORTRAIT_STYLES.filter(entry => entry.characterId === id)
    setCharacterId(id); setPose('front-pout'); setStyleId((next.find(entry => entry.name === style.name) ?? next[0]).id)
    setLoopTalking(false); dialogue.stop()
  }
  const talking = loopTalking || dialogue.speaking
  const poseName = poses.find(entry => entry.id === activePose)!.label
  const referenceUrl = (angle: PhotoPortraitPose) => `${style.folder}/reference/${angle}-${completeFrames || emotion === 'idle' ? 'neutral' : emotion}.png?v=${style.revision}`
  const portrait = (angle: PhotoPortraitPose) => referenceOnly || (reference && !completeFrames)
    ? <NativePortraitReference src={referenceUrl(angle)} size={style.nativeCell} bounds={style.contentBounds} name={`${style.name}, ${emotion}`}/>
    : <LivingPortrait
    collection={style.id} collectionRevision={style.revision} pose={angle} expression={emotion} blink={reference ? 'open' : blink} talking={!reference && talking}
    mouth={reference ? 'rest' : mouth} breathing={!reference && breathing}
    paused={reference || paused} onPausedChange={setPaused} controls={false} inspectable={false}
    name={`${style.name}, ${PHOTO_PORTRAIT_POSES.find(entry => entry.id === angle)!.label}`}
    fallback={referenceUrl(angle)}
  />
  const reset = () => {
    setReference(false); setPose('front-pout'); setEmotion('idle'); setBlink('auto'); setMouth('auto'); setBreathing(true); setLoopTalking(false); dialogue.stop()
    setPaused(false)
  }
  const togglePaused = () => {
    if (paused && completeFrames) { setBlink('auto'); setMouth('auto'); setBreathing(true) }
    setPaused(value => !value)
  }

  return <div className="space-y-6">
    {PHOTO_PORTRAIT_CHARACTERS.length > 1 && <section aria-label="Choose a portrait character" className="flex flex-col gap-3 rounded-md border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="font-heading text-xl font-semibold">{style.characterName}</h2><p className="mt-1 text-xs text-muted-foreground">{styles.length} art styles · {poses.length} angles · six emotions</p></div>
      <div className="space-y-1.5 sm:w-64"><Label htmlFor="portrait-character">Character</Label><Select value={characterId} onValueChange={chooseCharacter}><SelectTrigger id="portrait-character" className="w-full rounded-md text-foreground"><SelectValue/></SelectTrigger><SelectContent>{PHOTO_PORTRAIT_CHARACTERS.map(entry => <SelectItem key={entry.id} value={entry.id}>{entry.name}</SelectItem>)}</SelectContent></Select></div>
    </section>}
    <section aria-label="Choose a pixel art style" className={`flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 ${styles.length > 5 ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-5'}`}>
      {styles.map(entry => <Button key={entry.id} variant="outline" aria-pressed={style.id === entry.id}
        onClick={() => chooseStyle(entry.id)} className={`relative h-auto w-44 min-w-0 shrink-0 justify-start gap-3 rounded-md p-3 text-left text-foreground sm:w-auto ${style.id === entry.id ? 'border-primary bg-accent' : 'bg-card hover:bg-accent/60'}`}>
        <span className="flex h-20 w-18 shrink-0 items-end justify-center overflow-hidden" aria-hidden="true"><img
          src={`${entry.folder}/reference/front-pout-neutral.png?v=${entry.revision}`} alt="" loading="lazy" className="max-w-none [image-rendering:pixelated]"
          style={{ width: entry.nativeCell[0] * (entry.nativeCell[1] <= 72 ? 1 : .5), height: entry.nativeCell[1] * (entry.nativeCell[1] <= 72 ? 1 : .5) }} /></span>
        <span className="min-w-0 whitespace-normal"><span className="block font-heading text-lg font-semibold leading-tight">{entry.name}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{entry.nativeCell[0]} × {entry.nativeCell[1]}</span></span>
        {style.id === entry.id && <Check aria-hidden="true" className="absolute right-2 top-2 size-3.5 text-primary"/>}
      </Button>)}
    </section>

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-label="Live portrait preview" className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-heading text-2xl font-semibold">{style.name}</h2><p className="text-xs text-muted-foreground">{compare ? `All ${poses.length} angles` : poseName} · {referenceOnly ? 'Original reference · animation pending' : reference ? completeFrames ? 'Resting asset frame' : 'Authored source' : paused ? 'Paused' : talking ? 'Talking' : 'Living portrait'}</p></div>
          <div className="flex flex-wrap gap-2"><Button disabled={referenceOnly} variant={reference ? 'secondary' : 'outline'} size="sm" className="rounded-md text-foreground" aria-pressed={reference} onClick={() => setReference(value => !value)}><ImageIcon className="size-4"/>{referenceOnly ? 'Original reference' : reference ? 'Show animation' : completeFrames ? 'Hold resting frame' : 'Show authored source'}</Button><Button variant={compare ? 'secondary' : 'outline'} size="sm" className="rounded-md text-foreground" aria-pressed={compare} onClick={() => setCompare(value => !value)}><Columns2 className="size-4"/>{compare ? 'Single portrait' : 'Compare angles'}</Button></div>
        </div>
        {design && <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{design.summary}</p>}
        {compare ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {poses.map(angle => <div key={angle.id} className={`overflow-hidden rounded-md border ${backgrounds[background]}`}>
            <div className="h-90">{portrait(angle.id)}</div><p className="bg-card px-3 py-2 text-center text-xs font-medium text-foreground">{angle.label}</p>
          </div>)}
        </div> : <div className={`h-90 overflow-hidden rounded-md border ${backgrounds[background]}`}>{portrait(activePose)}</div>}
        <fieldset><legend className="mb-2 text-sm font-semibold">Pose</legend><div className={`grid grid-cols-2 gap-2 ${poses.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
          {poses.map(angle => <Button key={angle.id} variant={activePose === angle.id ? 'secondary' : 'outline'}
            className="rounded-md px-2 text-xs text-foreground" aria-label={angle.description} aria-pressed={activePose === angle.id} onClick={() => { setPose(angle.id); setCompare(false) }}>{angle.label}</Button>)}
        </div></fieldset>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{referenceOnly ? `${(style.referenceBytes / 1000).toFixed(1)} KB original artwork · all ${poses.length} angles` : `${(style.runtimeBytes / 1000).toFixed(1)} KB animation pack · all ${poses.length} angles`}</span>
          <div className="flex gap-1" aria-label="Preview background">{(['sage', 'cream', 'dark'] as const).map(value => <Button key={value} variant={background === value ? 'secondary' : 'ghost'} size="sm" className="rounded-md capitalize text-foreground" aria-pressed={background === value} onClick={() => setBackground(value)}>{value}</Button>)}</div>
        </div>
        {completeFrames && !compare && <PortraitFrameStrip collectionId={style.id} revision={style.revision} pose={activePose} emotion={emotion}
          onSelect={state => {
            setReference(false); setPaused(true); setBreathing(false); setLoopTalking(false); dialogue.stop()
            setBlink(state === 'half' || state === 'closed' ? state : 'open')
            setMouth(state === 'small' ? 'small' : state === 'open' ? 'round' : 'rest')
          }}/>} 
      </section>

      <section aria-label="Portrait controls" className="space-y-6 rounded-md border bg-card p-4 sm:p-5">
        <fieldset><legend className="mb-3 font-heading text-xl font-semibold">Emotion</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
          {PHOTO_PORTRAIT_EMOTIONS.map(value => <Button key={value} variant={emotion === value ? 'secondary' : 'outline'} className="rounded-md capitalize text-foreground" aria-pressed={emotion === value} onClick={() => setEmotion(value)}>{value === 'idle' ? 'Neutral' : value}</Button>)}
        </div></fieldset>
        <div className="space-y-2"><Label htmlFor="photo-portrait-blink">Eyes</Label><Select disabled={motionDisabled} value={blink} onValueChange={value => { setBlink(value as PortraitBlink); if (completeFrames) setMouth(value === 'half' || value === 'closed' ? 'rest' : 'auto') }}><SelectTrigger id="photo-portrait-blink" className="w-full rounded-md text-foreground"><SelectValue/></SelectTrigger><SelectContent>{PHOTO_PORTRAIT_BLINKS.map(value => <SelectItem key={value.id} value={value.id}>{value.label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="photo-portrait-mouth">Mouth</Label><Select disabled={motionDisabled || (completeFrames && (blink === 'half' || blink === 'closed'))} value={mouth} onValueChange={value => setMouth(value as PortraitMouth)}><SelectTrigger id="photo-portrait-mouth" className="w-full rounded-md text-foreground"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="auto">Follow speech</SelectItem><SelectItem value="rest">Resting mouth</SelectItem><SelectItem value="small">Small speech shape</SelectItem><SelectItem value="round">Open speech shape</SelectItem></SelectContent></Select></div>
        <div className="flex items-center justify-between gap-3"><Label htmlFor="photo-portrait-breathing">Breathing</Label><Switch id="photo-portrait-breathing" disabled={motionDisabled} checked={breathing} onCheckedChange={setBreathing}/></div>
        <div className="flex items-center justify-between gap-3"><Label htmlFor="photo-portrait-talk-loop">Keep talking</Label><Switch id="photo-portrait-talk-loop" disabled={motionDisabled} checked={loopTalking} onCheckedChange={setLoopTalking}/></div>
        <div className="flex flex-wrap gap-2"><Button disabled={motionDisabled} variant="outline" className="rounded-md text-foreground" aria-pressed={paused} onClick={togglePaused}>{paused ? <Play className="size-4"/> : <Pause className="size-4"/>}{paused ? 'Play' : 'Pause'}</Button><Button variant="ghost" className="rounded-md text-foreground" onClick={reset}><RotateCcw className="size-4"/>Reset</Button></div>
        <p className="text-xs leading-relaxed text-muted-foreground">{referenceOnly ? 'Original Sharp cel artwork is preserved here. Matching complete-frame animation is pending.' : completeFrames
          ? 'Complete asset frames only. A blink briefly pauses speech, then speech resumes. Breathing uses pre-exported frames; no facial parts are drawn or moved at runtime.'
          : 'Compare each authored expression with its animation. Breathing lifts the chest one native pixel; it never stretches the face.'}</p>
        <div className="border-t pt-4 text-xs leading-relaxed text-muted-foreground"><p><span className="font-semibold text-foreground">{(style.completeBytes / 1000).toFixed(1)} KB complete style</span> · {referenceOnly ? 'original pose and expression images; matching animation is pending.' : <>includes all poses, emotions, {completeFrames ? 'complete animation frames' : 'animation layers'}, posters and metadata. Within the {((style.budgetBytes ?? 300000) / 1000).toFixed(0)} KB limit.</>}</p></div>
      </section>
    </div>

    <section className="grid gap-5 border-t pt-6 sm:grid-cols-2" aria-labelledby="photo-dialogue-heading">
      <div className="space-y-3"><h2 id="photo-dialogue-heading" className="font-heading text-2xl font-semibold">Try a conversation</h2><Label htmlFor="photo-portrait-dialogue" className="sr-only">Dialogue to preview</Label><Textarea id="photo-portrait-dialogue" value={line} onChange={event => setLine(event.target.value)} maxLength={320} className="min-h-24 resize-y rounded-md bg-card text-foreground"/><Button disabled={!line.trim() || paused || motionDisabled} className="rounded-md" onClick={() => { setLoopTalking(false); dialogue.play() }}><MessageCircle className="size-4"/>{dialogue.speaking ? 'Restart dialogue' : 'Play dialogue'}</Button></div>
      <div className="flex flex-col justify-between rounded-md border bg-card p-5"><p className="min-h-20 text-sm leading-relaxed" aria-hidden="true">{dialogue.visibleText || '…'}</p><span className="sr-only">{line}</span><p role="status" className="mt-4 text-xs text-muted-foreground">{referenceOnly ? 'Original design reference · animation pending' : paused ? 'Playback paused' : talking ? 'Speaking…' : 'Resting expression restored'}</p></div>
    </section>
  </div>
}
