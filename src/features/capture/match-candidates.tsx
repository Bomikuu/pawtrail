import { Check, PawPrint, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Candidate } from './schemas'
const explanations: Record<string, string> = {
  visual_reference_similarity: 'Similar appearance in reference photos', similar_coat_colors: 'Similar coat colors',
  near_recent_reports: 'Near previous reported areas', relocation_check: 'Different area; location needs a closer look',
}
export function MatchCandidates({ candidates, selected, onSelect, automaticId, disabled }: {
  candidates: Candidate[]
  selected: string | null
  onSelect(id: string | null): void
  automaticId: string | null
  disabled: boolean
}) {
  return <section className="space-y-4" aria-labelledby="capture-matches-heading">
    <div><h2 id="capture-matches-heading" className="text-xl font-bold">{candidates.length ? 'Do any of these faces look familiar?' : 'A face we haven’t identified yet'}</h2><p className="mt-2 text-sm text-muted-foreground">{candidates.length ? 'These are possible identities, not confirmed sightings. Compare markings as well as color.' : 'No useful existing match was found. You can start a provisional profile or leave the identity open.'}</p></div>
    <div className="grid gap-3 sm:grid-cols-2">{candidates.map((candidate) => <Button key={candidate.animalId} type="button" variant="outline" aria-pressed={selected === candidate.animalId} disabled={disabled} onClick={() => onSelect(candidate.animalId)} className={'h-auto min-w-0 items-start whitespace-normal p-3 text-left transition-colors hover:border-primary ' + (selected === candidate.animalId ? 'border-primary bg-primary/5 ring-1 ring-primary' : '')}>
      <div className="w-full min-w-0 space-y-3"><div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">{candidate.photo ? <img src={candidate.photo.url} alt={candidate.photo.alt} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><PawPrint className="size-10 text-muted-foreground" /></div>}{selected === candidate.animalId && <span className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground"><Check className="size-4" /></span>}</div><div className="flex flex-wrap items-center gap-2"><span className="text-base font-bold">{candidate.name}</span>{automaticId === candidate.animalId && <Badge variant="secondary">Strong match</Badge>}</div>{candidate.areaLabel && <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3 shrink-0" />{candidate.areaLabel}</p>}<ul className="space-y-1 text-xs font-normal leading-relaxed text-muted-foreground">{candidate.reasons.map((reason) => <li key={reason}>{explanations[reason] ?? 'Additional comparison needed'}</li>)}</ul></div>
    </Button>)}</div>
    {candidates.length > 0 && <Button variant="outline" onClick={() => onSelect(null)} disabled={disabled} aria-pressed={selected === null}>None of these / I’m not sure</Button>}
  </section>
}
