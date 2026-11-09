import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Download, ImagePlus, ImageIcon, Glasses } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { actorPreviews, type ActorPreview } from '@/game/runtime/actor-previews'

export function ActorPreviewReference({ appearance, onSelect, loading, kind }: {
  appearance?: ActorPreview; onSelect: (id: string) => void; loading: boolean; kind?: ActorPreview['kind']
}) {
  const entries = actorPreviews.filter(entry => !kind || entry.kind === kind)
  const feline = appearance?.kind === 'orange-tabby' || kind === 'orange-tabby'
  const input = useRef<HTMLInputElement>(null)
  const [local, setLocal] = useState<{url: string; name: string} | null>(null)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  useEffect(() => () => { if (local) URL.revokeObjectURL(local.url) }, [local])
  useEffect(() => { setFailed(false); setCopied(false) }, [local, appearance?.id])
  const reference = local?.url ?? appearance?.reference?.file
  const choose = (file?: File) => {
    if (!file) return
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) {
      setMessage('Choose a PNG, JPG or WebP image under 12 MB.'); return
    }
    setLocal({url: URL.createObjectURL(file), name: file.name}); setMessage('Reference stays in this browser. Attach it when requesting the next skin.')
  }
  const copyPrompt = async () => {
    const brief = local ? feline ? 'Interpret the visible breed silhouette, coat pattern, ears, tail and accessories from the attached image.' : 'Interpret the visible hair, clothing, colors and accessories from the attached image.' : appearance?.description ?? 'Keep the approved PawTrail pixel style.'
    const skill = feline ? '$pawtrail-cats' : '$pawtrail-actors'
    const prompt = `${skill} Create a preview-only appearance using ${local?.name ?? appearance?.reference?.source ?? 'my image reference'}. ${brief} Reuse the approved skeleton and shared actions, sounds and ground shadows. Build real geometry for its silhouette. Show it at /play?preview=${feline ? 'cats' : 'actors'} before adding it to the game roster.`
    try { await navigator.clipboard.writeText(prompt); setCopied(true); setMessage('Skill request copied. Include the reference image when you send it.') }
    catch { setMessage('Clipboard is unavailable. Invoke $pawtrail-actors with your reference and appearance brief.') }
  }
  const actionCount = appearance ? new Set(Object.keys(appearance.sheet.animations).map(key => key.slice(0,key.lastIndexOf('-')))).size : 0
  const portraitZoom = appearance && (appearance.sheet.frameWidth > 48 || appearance.sheet.frameHeight > 64) ? 1 : 2
  return (
    <aside className="order-2 min-w-0 space-y-4 lg:order-none" aria-label="Appearance reference and brief">
      <Card className="gap-4 rounded-md py-4">
        <CardHeader className="gap-3 px-4">
          <div className="flex items-center justify-between gap-2"><CardTitle className="font-heading text-xl">{feline ? 'Your cat' : 'Your character'}</CardTitle><Badge variant="secondary" className="rounded-md">Preview only</Badge></div>
          <label id="preview-appearance-label" className="sr-only">Appearance to preview</label>
          <Select value={appearance?.id ?? ''} onValueChange={onSelect} disabled={loading || !entries.length}>
            <SelectTrigger aria-labelledby="preview-appearance-label" className="w-full"><SelectValue placeholder="No exports yet" /></SelectTrigger>
            <SelectContent>{entries.map(entry => <SelectItem key={entry.id} value={entry.id}>{entry.name}</SelectItem>)}</SelectContent>
          </Select>
          {entries.length > 1 && <div className="grid grid-cols-2 gap-2" role="group" aria-label={feline ? 'Preview cat breeds and accessories' : 'Preview different character shapes'}>
            {entries.map(entry => <Button key={entry.id} variant="outline" disabled={loading} aria-pressed={entry.id === appearance?.id} onClick={() => onSelect(entry.id)} className={'h-auto min-w-0 flex-col gap-1 rounded-md px-2 py-2 ' + (entry.id === appearance?.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50')}>
              <span className="relative block h-16 w-full overflow-hidden"><img src={entry.portrait} width={entry.sheet.frameWidth} height={entry.sheet.frameHeight} alt="" className="absolute left-1/2 -translate-x-1/2 object-contain [image-rendering:pixelated]" style={{bottom:8-(entry.sheet.frameHeight-(entry.sheet.anchor.y*entry.sheet.frameHeight))}} /></span>
              <span className="w-full truncate font-heading text-sm font-semibold">{entry.name}</span>
            </Button>)}
          </div>}
        </CardHeader>
        <CardContent className="space-y-4 px-4">
          {appearance ? <>
            <div className="flex items-center gap-3">
              <div className="grid h-36 w-28 shrink-0 place-items-center rounded-md border bg-[#c9d6b5]"><img src={appearance.portrait} width={appearance.sheet.frameWidth*portraitZoom} height={appearance.sheet.frameHeight*portraitZoom} alt={`${appearance.name} pixel character`} className="object-contain [image-rendering:pixelated]" /></div>
              <div><p className="font-heading text-2xl font-bold">{appearance.name}</p><p className="mt-1 text-xs text-muted-foreground">{actionCount} actions · 8 directions</p>{appearance.accessories.glasses && <p className="mt-2 flex items-center gap-1.5 text-xs"><Glasses className="size-3.5" />Glasses on the shared rig</p>}</div>
            </div>
            <p className="text-sm leading-relaxed">{appearance.description}</p>
            {appearance.cat && <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-md bg-muted/50 p-3 text-xs">
              {Object.entries(appearance.cat).map(([slot,value]) => <div key={slot}><dt className="capitalize text-muted-foreground">{slot.replace('tailMotion','Tail motion')}</dt><dd className="mt-0.5 font-medium capitalize">{value.replaceAll('-',' ')}</dd></div>)}
            </dl>}
            {appearance.parts && <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-md bg-muted/50 p-3 text-xs">
              {([['hair','Hair'],['headwear','Headwear'],['outfit','Clothing'],['held','Held item']] as const).map(([slot,label]) => <div key={slot}><dt className="text-muted-foreground">{label}</dt><dd className="mt-0.5 font-medium capitalize">{appearance.parts?.[slot]?.replaceAll('-',' ') ?? 'Default'}</dd></div>)}
              {appearance.parts.wings && appearance.parts.wings !== 'none' && <div><dt className="text-muted-foreground">Wings</dt><dd className="mt-0.5 font-medium capitalize">{appearance.parts.wings}</dd></div>}
            </dl>}
            <div className="flex gap-2" aria-label="Appearance palette">
              {(['hair','jacket','shirt','shorts'] as const).filter(role => appearance.colors[role]).map(role => <span key={role} title={role + ': ' + appearance.colors[role]} className="size-7 rounded-md border shadow-sm" style={{backgroundColor: appearance.colors[role]}}><span className="sr-only">{role}: {appearance.colors[role]}</span></span>)}
            </div>
            <Button variant="outline" className="w-full" asChild><a href={appearance.sheet.file} download={`${appearance.id}-spritesheet.png`}><Download className="size-4" />Download spritesheet</a></Button>
          </> : <p className="text-sm text-muted-foreground">Use PawTrail Actors with an image reference to create your first preview.</p>}
        </CardContent>
      </Card>
      <Card className="gap-4 rounded-md py-4">
        <CardHeader className="px-4"><CardTitle className="flex items-center gap-2 font-heading text-xl"><ImageIcon className="size-4" />Image reference</CardTitle></CardHeader>
        <CardContent className="space-y-3 px-4">
          {reference && !failed ? <button type="button" onClick={() => setExpanded(true)} aria-label="Enlarge reference image" className="block w-full overflow-hidden rounded-md border bg-white p-2 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><img src={reference} alt={local ? local.name : 'Owner-provided classic RPG pixel-art style reference'} className="max-h-44 w-full object-contain [image-rendering:pixelated]" onError={() => setFailed(true)} /></button> : <div className="grid min-h-36 place-items-center rounded-md border border-dashed bg-muted/40 p-4 text-center text-sm text-muted-foreground"><span><ImageIcon className="mx-auto mb-2 size-6" />{failed ? 'This image could not be displayed.' : 'Choose an image to guide your next appearance.'}</span></div>}
          <p className="text-xs font-medium">{local ? local.name : 'Style reference + your appearance brief'}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{local ? 'Compare your reference here. The skill creates updated exports from your next request.' : appearance?.reference?.brief}</p>
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Choose appearance reference image" onChange={event => { choose(event.target.files?.[0]); event.currentTarget.value='' }} />
          <Button variant="outline" className="w-full" onClick={() => input.current?.click()}><ImagePlus className="size-4" />Choose reference</Button>
          <Button variant="secondary" className="w-full" onClick={() => void copyPrompt()}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? 'Request copied' : 'Copy skill request'}</Button>
          <p aria-live="polite" className="text-xs leading-relaxed text-muted-foreground">{message || 'A new reference does not alter this exported preview until the skill renders it.'}</p>
        </CardContent>
      </Card>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="pawtrail-game max-h-[90dvh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>Appearance reference</DialogTitle><DialogDescription>{local?.name ?? appearance?.reference?.source ?? 'Reference image'}</DialogDescription></DialogHeader>
          {reference && <img src={reference} alt="Enlarged character reference" className="mx-auto max-h-[70dvh] w-auto max-w-full object-contain [image-rendering:pixelated]" />}
        </DialogContent>
      </Dialog>
    </aside>
  )
}
