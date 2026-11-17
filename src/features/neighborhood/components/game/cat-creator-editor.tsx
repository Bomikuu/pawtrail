import { useEffect, useState, useSyncExternalStore } from 'react'
import { BookOpen, Cat, Cloud, Copy, Download, Eye, HardDrive, LoaderCircle, Palette, Save, Shapes, Shirt, Trash2, Wind } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { catCreator, catTemplates, catPreviewCapture } from '@/features/neighborhood/game/cat-creator/state'
import { catLibrary, loadCatLibrary, saveCat, deleteCat } from '@/features/neighborhood/game/cat-creator/library'
import { CAT_LIBRARY_LIMIT, readCatAppearance, type SavedCat, type CatAppearance } from '@/features/neighborhood/game/cat-creator/appearance'
import { CAT_CHOICES, type CatOptions, type CatBreed } from '@/features/neighborhood/game/actor-rig/cat-appearance'
import { actorComparison, toggleFaceInspection, type ComparisonAction } from '@/features/neighborhood/game/runtime/actor-comparison-state'
import { FaceDetailsEditor } from './shared/face-details-editor'
import { CreatorPortrait } from './shared/living-portrait'
import { audio } from '@/features/neighborhood/game/systems/audio'

const label = (value: string) => value.replaceAll('-', ' ').replaceAll('_', ' ')
const fieldNames: Partial<Record<keyof CatOptions, string>> = { breed: 'Breed & body shape', bodySize: 'Body size', faceMarking: 'Face markings', pattern: 'Fur pattern', fur: 'Fur length', tail: 'Tail shape', tailMotion: 'Tail movement', hat: 'Hat', shoes: 'Shoes', wings: 'Wings', collar: 'Collar' }
function Choice({ slot, appearance }: { slot: keyof CatOptions; appearance: CatAppearance }) {
  return <fieldset className="space-y-2"><legend className="text-xs font-semibold">{fieldNames[slot]}</legend><div className="grid grid-cols-2 gap-2" role="group" aria-label={fieldNames[slot]}>
    {CAT_CHOICES[slot].map(value => <Button key={value} type="button" variant="outline" className="h-auto min-h-10 justify-start whitespace-normal rounded-md px-3 py-2 text-left text-xs capitalize aria-pressed:border-primary aria-pressed:bg-primary/10" aria-pressed={appearance.cat[slot] === value} onClick={() => slot === 'breed' ? catCreator.breed(value as CatBreed) : catCreator.edit({ cat: { ...appearance.cat, [slot]: value } })}>{label(value)}</Button>)}
  </div></fieldset>
}

export function CatCreatorEditor() {
  const draft = useSyncExternalStore(catCreator.subscribe, catCreator.getSnapshot, catCreator.getSnapshot)
  const library = useSyncExternalStore(catLibrary.subscribe, catLibrary.getSnapshot, catLibrary.getSnapshot)
  const preview = useSyncExternalStore(actorComparison.subscribe, actorComparison.getSnapshot, actorComparison.getSnapshot)
  const [scope, setScope] = useState<SavedCat['scope']>('device')
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [showLibrary, setShowLibrary] = useState(false)
  const [sound, setSound] = useState(!audio.settings.muted)
  const [confirm, setConfirm] = useState<{ title: string; description: string; run: () => void; destructive?: boolean } | null>(null)
  const a = draft.appearance, dirty = catCreator.dirty()
  useEffect(() => { void loadCatLibrary() }, [])
  function replace(run: () => void) {
    if (dirty) setConfirm({ title: 'Replace your current changes?', description: 'Save this cat first if you want to keep the changes.', run })
    else run()
  }
  async function attempt(run: () => Promise<void>) {
    setBusy(true); catCreator.error(''); setNotice('')
    try { await run() } catch (error) { catCreator.error(error instanceof Error ? error.message : 'The cat could not be saved. Please retry.') }
    finally { setBusy(false) }
  }
  async function save(asNew = false) {
    await attempt(async () => {
      const existing = !asNew && draft.selected?.scope === scope ? draft.selected : undefined
      const thumbnail = catPreviewCapture.take()
      if (!thumbnail) throw new Error('Wait for the cat preview to finish opening, then save again.')
      const row = await saveCat({ id: existing?.id, revision: existing?.revision, name: draft.name, appearance: a, scope, thumbnail })
      catCreator.saved(row); setNotice(scope === 'account' ? 'Cat saved to your PawTrail account.' : 'Cat saved on this device.')
    })
  }
  const action = (value: ComparisonAction) => actorComparison.patch({ action: value, paused: false, restart: preview.restart + 1 })
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ format: 'pawtrail-cat', version: 1, name: draft.name, appearance: a }, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = (draft.name.trim().replace(/[^a-z0-9-]/gi, '-') || 'my-cat') + '.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function importFile(file?: File) {
    if (!file) return
    try {
      if (file.size > 100000) throw new Error('Choose a PawTrail cat JSON file under 100 KB.')
      const value = JSON.parse(await file.text()), appearance = readCatAppearance(value.appearance)
      if (value.format !== 'pawtrail-cat' || value.version !== 1 || !appearance || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 64) throw new Error('This file is not a supported PawTrail cat.')
      replace(() => { catCreator.import(value.name, appearance); setNotice('Cat imported. Save it to keep it in your library.') })
    } catch (error) { catCreator.error(error instanceof Error ? error.message : 'This file could not be opened.') }
  }
  const colors: [keyof CatAppearance['colors'], string][] = [['orange', 'Main fur'], ['furLight', 'Fur highlights'], ['stripe', 'Markings & points'], ['cream', 'Pale fur'], ['hat', 'Hat'], ['leather', 'Boots'], ['ribbon', 'Ribbon'], ['feather', 'Wings']]
  return <aside className="order-2 min-w-0 space-y-4 lg:order-none" aria-label="Create your cat">
    <CreatorPortrait subject={{kind:'cat',appearance:a}} name={draft.name} action={preview.portraitAction}/>
    <section className="space-y-4 rounded-md border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-heading text-2xl font-bold">Create your cat</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Shape their coat, tail and little extras. Every change appears live.</p></div><Cat className="mt-1 size-5 shrink-0 text-primary" /></div>
      <div className="space-y-1.5"><label htmlFor="cat-template" className="text-xs font-semibold">Start with a look</label><Select value="" onValueChange={id => replace(() => { catCreator.template(id); setNotice('') })}><SelectTrigger id="cat-template" className="w-full"><SelectValue placeholder="Choose a template" /></SelectTrigger><SelectContent>{catTemplates.map(row => <SelectItem key={row.id} value={row.id}>{row.name}</SelectItem>)}</SelectContent></Select></div>
      <Tabs defaultValue="body" className="gap-4">
        <TabsList className="grid h-auto w-full grid-cols-4 gap-1 rounded-md"><TabsTrigger value="body" className="min-h-9 rounded-md"><Cat className="size-3.5" />Body</TabsTrigger><TabsTrigger value="coat" className="min-h-9 rounded-md"><Shapes className="size-3.5" />Coat</TabsTrigger><TabsTrigger value="face" className="min-h-9 rounded-md"><Eye className="size-3.5" />Face</TabsTrigger><TabsTrigger value="tail" className="min-h-9 rounded-md">Tail</TabsTrigger><TabsTrigger value="extras" className="min-h-9 rounded-md"><Shirt className="size-3.5" />Extras</TabsTrigger><TabsTrigger value="wings" className="min-h-9 rounded-md"><Wind className="size-3.5" />Wings</TabsTrigger><TabsTrigger value="colors" className="min-h-9 rounded-md"><Palette className="size-3.5" />Colors</TabsTrigger></TabsList>
        <TabsContent value="body" className="space-y-4"><Choice slot="breed" appearance={a} /><p className="text-xs leading-relaxed text-muted-foreground">Breeds change face, ears and body shape, with a matching coat and tail to start from. Your accessories stay on.</p><Choice slot="bodySize" appearance={a} /><Choice slot="fur" appearance={a} /></TabsContent>
        <TabsContent value="face" className="space-y-4"><Choice slot="faceMarking" appearance={a} />
          <FaceDetailsEditor value={a.face} onChange={face=>catCreator.edit({face})} inspecting={preview.catDetail} onInspect={()=>toggleFaceInspection('cat')} markingLabel="Mustache / freckles"/>
        </TabsContent>
        <TabsContent value="coat" className="space-y-4"><Choice slot="pattern" appearance={a} /><Choice slot="fur" appearance={a} /><p className="text-xs leading-relaxed text-muted-foreground">Tabby markings, colorpoints and patches follow the skin through every pose.</p></TabsContent>
        <TabsContent value="tail" className="space-y-4"><Choice slot="tail" appearance={a} /><Choice slot="tailMotion" appearance={a} /><Button variant="outline" className="w-full" onClick={() => action('tail_wag')}>Preview tail swish</Button></TabsContent>
        <TabsContent value="extras" className="space-y-4"><Choice slot="hat" appearance={a} /><Choice slot="shoes" appearance={a} /><Choice slot="collar" appearance={a} /></TabsContent>
        <TabsContent value="wings" className="space-y-4"><Choice slot="wings" appearance={a} /><p className="text-xs leading-relaxed text-muted-foreground">Wings move with your cat, fold during rest and rolling, and flap while hovering.</p><Button variant="outline" className="w-full" disabled={a.cat.wings === 'none'} onClick={() => action('fly')}>Preview wing flight</Button></TabsContent>
        <TabsContent value="colors" className="space-y-3"><div className="grid grid-cols-2 gap-3">{colors.map(([key, title]) => <label key={key} className="flex items-center gap-2 text-xs"><Input type="color" value={a.colors[key]} aria-label={title + ' color'} className="size-10 shrink-0 cursor-pointer rounded-md p-1" onChange={event => catCreator.edit({ colors: { ...a.colors, [key]: event.target.value } })} /><span>{title}</span></label>)}</div></TabsContent>
      </Tabs>
      <label className="flex items-center justify-between gap-4 border-t pt-3 text-xs font-medium"><span>Action sounds</span><Switch checked={sound} onCheckedChange={value => { setSound(value); audio.update({ muted: !value }); if (value) void audio.unlock() }} /></label>
    </section>
    <section className="space-y-3 rounded-md border bg-card p-4 shadow-sm" aria-label="Save your cat">
      <div className="flex items-center justify-between gap-2"><h3 className="font-heading text-xl font-bold">Your cat</h3><span className="text-xs text-muted-foreground">{dirty ? 'Unsaved changes' : draft.selected ? 'Saved' : 'New cat'}</span></div>
      <div className="space-y-1.5"><label htmlFor="cat-name" className="text-xs font-semibold">Name</label><Input id="cat-name" maxLength={64} value={draft.name} onChange={event => catCreator.name(event.target.value)} placeholder="Give your cat a name" /></div>
      <div className="space-y-1.5"><label id="cat-scope-label" className="text-xs font-semibold">Save location</label><Select value={scope} onValueChange={value => setScope(value as SavedCat['scope'])}><SelectTrigger aria-labelledby="cat-scope-label" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="device"><HardDrive className="size-4" />This device</SelectItem><SelectItem value="account" disabled={library.status !== 'ready'}><Cloud className="size-4" />My PawTrail account</SelectItem></SelectContent></Select></div>
      <p className="text-xs leading-relaxed text-muted-foreground">{scope === 'device' ? 'Saved in this browser. Export a backup to keep a copy.' : 'A private cat appearance in your PawTrail account, available across devices.'}</p>
      {library.status === 'loading' && <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-3 motion-safe:animate-spin" />Opening account library…</p>}
      {library.status === 'guest' && <p className="text-xs text-muted-foreground">Sign in for account saves. Device saves work as a guest.</p>}
      {library.status === 'error' && <div className="rounded-md border p-2 text-xs"><p>{library.error}</p><Button variant="ghost" size="sm" onClick={() => void loadCatLibrary()}>Retry account library</Button></div>}
      <Button className="w-full rounded-md" disabled={busy || preview.status !== 'ready' || !draft.name.trim() || scope === 'account' && library.status !== 'ready'} onClick={() => void save()}>{busy ? <LoaderCircle className="size-4 motion-safe:animate-spin" /> : <Save className="size-4" />}{draft.selected?.scope === scope ? 'Save changes' : 'Save cat'}</Button>
      <div className="grid grid-cols-2 gap-2"><Button variant="outline" size="sm" disabled={busy || preview.status !== 'ready' || !draft.name.trim() || scope === 'account' && library.status !== 'ready'} onClick={() => void save(true)}><Copy className="size-3.5" />Save as new</Button><Button variant="outline" size="sm" onClick={() => setShowLibrary(true)}><BookOpen className="size-3.5" />My cats</Button></div>
      {draft.error && <p role="alert" className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{draft.error}</p>}
      {notice && <p role="status" className="rounded-md bg-primary/10 p-2 text-xs">{notice}</p>}
      <div className="flex flex-wrap items-center gap-2 border-t pt-3"><Button variant="ghost" size="sm" onClick={download}><Download className="size-3.5" />Export JSON</Button><label className="cursor-pointer text-xs font-medium underline underline-offset-4 focus-within:ring-2">Import JSON<Input type="file" accept=".json,application/json" className="sr-only" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = '' }} /></label></div>
    </section>
    <Dialog open={showLibrary} onOpenChange={setShowLibrary}><DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle className="font-heading text-3xl">Your cat collection</DialogTitle><DialogDescription>Open a saved cat to edit its appearance and try its actions.</DialogDescription></DialogHeader><Button variant="outline" size="sm" className="w-fit" disabled={library.status === 'loading'} onClick={() => void loadCatLibrary()}>Refresh account library</Button>
      {draft.error && <p role="alert" className="text-sm text-destructive">{draft.error}</p>}
      {(['account', 'device'] as const).map(group => <section key={group} className="space-y-3"><h3 className="flex items-center gap-2 font-heading text-xl font-bold">{group === 'account' ? <Cloud className="size-4" /> : <HardDrive className="size-4" />}{group === 'account' ? 'PawTrail account' : 'This device'}<span className="ml-auto font-body text-xs font-normal text-muted-foreground">{library[group].length} / {CAT_LIBRARY_LIMIT}</span></h3>
        {!library[group].length ? <div className="rounded-md border border-dashed p-5 text-center text-xs text-muted-foreground">{group === 'account' && library.status === 'guest' ? 'Sign in to keep cats across devices.' : 'No cats saved here yet. Make a look, give it a name, and save your first cat.'}</div> : <div className="grid gap-3 sm:grid-cols-2">{library[group].map(row => <article key={row.id} className="flex items-center gap-3 rounded-md border p-3"><div className="grid size-20 shrink-0 place-items-center rounded-md bg-[#d8dfc7]">{row.thumbnail ? <img src={row.thumbnail} width={80} height={80} alt={row.name} className="[image-rendering:pixelated]" /> : <Cat className="size-8 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><h4 className="truncate font-heading text-lg font-bold">{row.name}</h4><p className="mb-2 text-[11px] capitalize text-muted-foreground">{label(row.appearance.cat.breed)} · {label(row.appearance.cat.pattern)}</p><div className="flex flex-wrap gap-1.5"><Button size="sm" variant="outline" disabled={busy} onClick={() => replace(() => { catCreator.load(row); setScope(row.scope); setShowLibrary(false); setNotice('') })}>Edit</Button><Button variant="ghost" size="icon" disabled={busy} className="size-8 text-muted-foreground hover:text-destructive" aria-label={'Delete ' + row.name} onClick={() => setConfirm({ title: 'Delete this cat?', description: 'This removes the saved appearance. Export it first if you want a backup.', destructive: true, run: () => { void attempt(async () => { await deleteCat(row); if (draft.selected?.id === row.id) catCreator.template('orange_tabby'); setConfirm(null); setNotice('Cat removed from your library.') }) } })}><Trash2 className="size-3.5" /></Button></div></div></article>)}</div>}
      </section>)}
    </DialogContent></Dialog>
    <Dialog open={!!confirm} onOpenChange={open => { if (!open && !busy) setConfirm(null) }}><DialogContent><DialogHeader><DialogTitle>{confirm?.title}</DialogTitle><DialogDescription>{confirm?.description}</DialogDescription></DialogHeader>{draft.error && <p role="alert" className="text-sm text-destructive">{draft.error}</p>}<DialogFooter><Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>Keep editing</Button><Button variant={confirm?.destructive ? 'destructive' : 'default'} disabled={busy} onClick={() => { const pending = confirm; if (!pending?.destructive) setConfirm(null); pending?.run() }}>{confirm?.destructive ? 'Delete cat' : 'Replace changes'}</Button></DialogFooter></DialogContent></Dialog>
  </aside>
}
