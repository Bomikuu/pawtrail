import { useState } from 'react'
import { BookOpen, Check, ChevronDown, ChevronUp, MapPin, Pin, X, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { QUESTS, ANIMALS, NPCS } from '@/features/neighborhood/game/data'
import { questKey, questState } from '@/features/neighborhood/game/systems/quests'
import { petPortrait } from '@/features/neighborhood/game/immersion-data'
import type { Progress as GameProgress } from '@/features/neighborhood/game/types'
import type { Boot } from '@/features/neighborhood/game/housing/types'

export type MissionView = { id: string; title: string; description: string; pet: string; category: string; difficulty: string; reward: number; status: string; location: string; guide?: string; objectives: { text: string; count: number; target: number }[] }
const categories = ['All', 'Missing Pets', 'Feeding Requests', 'Animal Rescue', 'Pet Care', 'Exploration', 'Community Help', 'Daily Missions', 'Special Events']
export function localMissions(p: GameProgress): MissionView[] {
  return QUESTS.filter((q) => questState(p, q) !== 'locked').map((q) => {
    const progress = p.quests[questKey(q, p)]
    const animal = ANIMALS.find((a) => q.objectives.some((o) => o.target === a.id))
    return { id: q.id, title: q.title, description: q.description, pet: animal?.sprite ?? 'orange_tabby',
      category: q.category === 'daily' ? 'Daily Missions' : q.category === 'event' ? 'Special Events' : q.id.includes('missing') ? 'Missing Pets' : q.objectives.some((o) => o.type === 'rescue') ? 'Animal Rescue' : q.id.includes('feeding') ? 'Feeding Requests' : q.category === 'exploration' ? 'Exploration' : q.category === 'community' ? 'Community Help' : 'Pet Care',
      difficulty: q.objectives.length > 4 ? 'A little adventure' : 'Easy', reward: q.reward,
      status: progress?.state === 'active' && !progress.counts.some((n)=>n>0) ? 'accepted' : progress?.state ?? 'available', location: q.giver ? 'Start with ' + (NPCS[q.giver]?.name ?? 'your volunteer') : 'Explore the neighborhood',
      guide: q.id === 'welcome' ? 'maya' : q.id === 'feeding-project' ? 'feeding-station' : q.id === 'shelter-home' ? 'lina' : undefined,
      objectives: q.objectives.map((o, i) => ({ text: o.text, count: progress?.counts[i] ?? 0, target: o.count ?? 1 })),
    }
  })
}
export function homeMissions(data: Boot): MissionView[] {
  return data.quests.map((q) => ({ id: q.id, title: q.title,
    description: 'Make a little progress through genuine in-game visits, decorating, and virtual care. Rewards stay in the game.',
    pet: 'orange_tabby', category: 'Community Help', difficulty: 'Together', reward: q.reward,
    status: data.player.claimed.includes(q.id) ? 'claimed' : q.facts.every((f) => data.player.facts.includes(f)) ? 'completed' : data.player.facts.includes('mission-accepted:' + q.id) || q.facts.some((f) => data.player.facts.includes(f)) ? 'active' : 'available',
    location: 'Your home and the community', objectives: q.facts.map((f) => ({ text: f.replace('world-find:', 'Find ').replaceAll('-', ' '), count: data.player.facts.includes(f) ? 1 : 0, target: 1 })),
  }))
}
const labels: Record<string, string> = { available: 'Available', accepted: 'Accepted', active: 'In progress', completed: 'Completed', claimed: 'Reward claimed' }
export function MissionBoard({ missions, onAccept, onClaim, onPin, pinned, onGuide }: { missions: MissionView[]; onAccept: (id: string) => void; onClaim: (id: string) => void; onPin: (id: string) => void; pinned?: string; onGuide?: (target: string) => void }) {
  const [category, setCategory] = useState('All'), [selection, setSelection] = useState('')
  const visible = missions.filter((m) => category === 'All' || m.category === category)
  const selected = visible.find((m) => m.id === selection) ?? visible[0]
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Mission categories">{categories.map((c) => <Button key={c} size="sm" className="h-7 rounded-full px-2.5 text-[11px]" variant={c === category ? 'default' : 'outline'} aria-pressed={c === category} onClick={() => setCategory(c)}>{c}</Button>)}</div>
    <div className="grid gap-4 rounded-xl border border-[#ad8052] p-3 sm:grid-cols-[1fr_1.15fr]" style={{ backgroundImage: 'url(/assets/game/missions/board/cork-tile.png)', backgroundSize: '64px 64px', imageRendering: 'pixelated' }}>
      <div className="max-h-96 space-y-2 overflow-y-auto">{visible.map((m) => <Button key={m.id} variant="outline" onClick={() => setSelection(m.id)} aria-pressed={selected?.id === m.id} className="relative h-auto w-full justify-start gap-3 whitespace-normal rounded-lg bg-card p-3 pr-5 text-left aria-pressed:border-primary aria-pressed:bg-secondary">
        <img src="/assets/game/missions/board/pushpin.png" alt="" className="absolute top-1 right-1 size-4 [image-rendering:pixelated]" /><img src={petPortrait(m.pet)} alt="" width={48} height={48} className="size-12 shrink-0 [image-rendering:pixelated]" /><span className="min-w-0"><strong className="block text-sm">{m.title}</strong><span className="mt-1 block text-[11px] font-normal">{labels[m.status]} · {m.reward} game Kibble</span></span>
      </Button>)}{!visible.length && <p className="rounded-lg bg-card p-5 text-sm">No notices in this category yet. Try another category, or return as your story grows.</p>}</div>
      {selected && <section className="space-y-3 rounded-lg border bg-card p-4" aria-label="Mission details">
        <div className="flex items-center gap-3"><img src={petPortrait(selected.pet)} alt="Mission animal portrait" width={64} height={64} className="size-16 [image-rendering:pixelated]" /><div><h3 className="font-heading text-lg font-extrabold">{selected.title}</h3><Badge variant="secondary">{labels[selected.status]}</Badge></div></div>
        <p className="text-sm leading-relaxed">{selected.description}</p><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" />{selected.location} · {selected.difficulty}</p>
        <ul className="space-y-2">{selected.objectives.map((o, i) => <li key={i} className="flex items-start gap-2 text-xs leading-relaxed"><Check className={`mt-0.5 size-3.5 shrink-0 ${o.count >= o.target ? 'text-emerald-700' : 'text-muted-foreground/40'}`} /><span>{o.text} <span className="tabular-nums text-muted-foreground">{o.count}/{o.target}</span></span></li>)}</ul>
        <p className="flex items-center gap-2 text-sm font-bold"><Trophy className="size-4 text-primary" />{selected.reward} game Kibble</p>
        <div className="flex flex-wrap gap-2">{selected.status === 'available' && <Button onClick={() => onAccept(selected.id)}>Accept mission</Button>}{selected.status === 'completed' && <Button onClick={() => onClaim(selected.id)}>Claim reward</Button>}{['active','accepted'].includes(selected.status) && <Button variant="outline" onClick={() => onPin(pinned === selected.id ? '' : selected.id)}><Pin className="size-3.5" />{pinned === selected.id ? 'Unpin' : 'Pin mission'}</Button>}{selected.guide && onGuide && <Button variant="outline" size="sm" onClick={() => onGuide(selected.guide!)}>Track known location</Button>}</div>
      </section>}
    </div>
  </div>
}

export function MissionList({ missions, pinned, onPin, onDetails, onGuide }: { missions: MissionView[]; pinned?: string; onPin: (id: string) => void; onDetails: () => void; onGuide?: (target: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const active = missions.filter((m) => ['active','accepted','completed'].includes(m.status)).sort((a, b) => Number(b.id === pinned) - Number(a.id === pinned))
  return <div className="space-y-3"><h2 className="font-heading text-sm font-extrabold">Active missions <span className="ml-1 tabular-nums text-muted-foreground">{active.length}</span></h2>{active.slice(0, 5).map((m) => {
    const done = m.objectives.reduce((n, o) => n + Math.min(o.count, o.target), 0), total = m.objectives.reduce((n, o) => n + o.target, 0)
    return <section key={m.id} className={`rounded-lg border p-2.5 ${pinned === m.id ? 'border-primary/60 bg-primary/5' : 'bg-background'}`}>
      <div className="flex items-start gap-2"><img src={petPortrait(m.pet)} alt="" className="size-8 shrink-0 [image-rendering:pixelated]" /><Button variant="ghost" className="h-auto min-w-0 flex-1 justify-between whitespace-normal p-0 text-left text-xs" onClick={() => setExpanded(expanded === m.id ? null : m.id)} aria-expanded={expanded === m.id}><span>{m.title}</span>{expanded === m.id ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}</Button><Button variant="ghost" size="icon" className="size-6 shrink-0" aria-label={(pinned === m.id ? 'Unpin ' : 'Pin ') + m.title} onClick={() => onPin(pinned === m.id ? '' : m.id)}><Pin className={`size-3 ${pinned === m.id ? 'fill-current text-primary' : ''}`} /></Button></div>
      <p className="my-2 text-[11px] leading-relaxed">{m.objectives.find((o) => o.count < o.target)?.text ?? 'Ready to claim at the community board.'}</p><Progress value={total ? done / total * 100 : 0} className="h-1" /><p className="mt-1 text-right text-[10px] tabular-nums">{done}/{total}</p>
      {expanded === m.id && <div className="mt-2 space-y-2 border-t pt-2">{m.objectives.map((o, i) => <p key={i} className="text-[11px]">{o.count >= o.target ? '✓' : '○'} {o.text}</p>)}{m.guide && onGuide && <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => onGuide(m.guide!)}>Track location</Button>}<Button variant="link" size="sm" className="h-6 px-0 text-[11px]" onClick={onDetails}>Mission details</Button></div>}
    </section>
  })}{!active.length && <p className="text-xs leading-relaxed text-muted-foreground">Visit the wooden community board to choose your next little kindness.</p>}<Button variant="outline" size="sm" className="w-full text-xs" onClick={onDetails}>Community board</Button></div>
}
export function MissionTracker(props: Parameters<typeof MissionList>[0] & { onModalChange?: (open:boolean)=>void }) {
  const [hidden, setHidden] = useState(false)
  const [dialogOpen,setDialogOpen]=useState(false)
  return <><div className="absolute top-4 right-16 z-10 hidden max-h-[65dvh] w-72 overflow-y-auto rounded-xl border bg-card p-3 shadow-sm md:block">{hidden ? <Button variant="ghost" size="sm" onClick={() => setHidden(false)}><BookOpen className="size-4" />Active missions</Button> : <><Button variant="ghost" size="icon" className="absolute top-1 right-1 size-6" aria-label="Hide mission tracker" onClick={() => setHidden(true)}><X className="size-3" /></Button><MissionList {...props} /></>}</div><Dialog open={dialogOpen} onOpenChange={(open)=>{setDialogOpen(open);props.onModalChange?.(open)}}><DialogTrigger asChild><Button variant="secondary" size="sm" className="absolute top-3 right-14 z-10 border shadow-sm md:hidden"><BookOpen className="size-4" />Missions</Button></DialogTrigger><DialogContent className="top-auto bottom-0 max-h-[80dvh] translate-y-0 overflow-y-auto rounded-t-2xl bg-card"><DialogHeader><DialogTitle>Active missions</DialogTitle><DialogDescription>Choose one to follow while you explore.</DialogDescription></DialogHeader><MissionList {...props} onDetails={()=>{setDialogOpen(false);props.onModalChange?.(false);props.onDetails()}} /></DialogContent></Dialog></>
}
