import { Check, LoaderCircle, PawPrint } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
const stages = ['Upload photo', 'Check animal and photo', 'Compare existing animals']
export function AnalysisProgress({ stage }: { stage: string }) {
  const current = stage === 'uploading' ? 0 : stage === 'finding_matches' ? 2 : 1
  return <section aria-live="polite" aria-busy="true" className="space-y-5 rounded-2xl border bg-card p-5">
    <div className="flex items-center gap-3"><PawPrint className="size-6 animate-pulse text-primary motion-reduce:animate-none" /><h2 className="text-lg font-bold">Getting to know this little face</h2></div>
    <ol className="space-y-3">{stages.map((label, index) => <li key={label} className={'flex items-center gap-3 text-sm ' + (index > current ? 'text-muted-foreground' : '')}>{index < current ? <Check className="size-4 text-emerald-700 dark:text-emerald-400" /> : index === current ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <span className="size-4 rounded-full border" />}{label}</li>)}</ol>
    <div className="grid grid-cols-2 gap-3" aria-hidden="true">{[0, 1].map((key) => <div key={key} className="space-y-2"><Skeleton className="aspect-[4/3] w-full rounded-xl" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-full" /></div>)}</div>
    <p className="text-xs leading-relaxed text-muted-foreground">Photos are checked on the server. We keep uncertain identities open rather than guess.</p>
  </section>
}
