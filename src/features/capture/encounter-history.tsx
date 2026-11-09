'use client'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Camera, PawPrint, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { IdentityStatus } from '@/features/sightings/identity-status'
import { captureRequest } from './api'
import { observationListSchema } from './schemas'
import { useCaptureIdentity } from './workspace'
import { RewardOutcome } from './reward-outcome'

export function EncounterHistory() {
  const { actor } = useCaptureIdentity()
  const query = useInfiniteQuery({ queryKey: ['capture', actor.id, 'observations'], initialPageParam: '',
    queryFn: ({ signal, pageParam }) => captureRequest('observations?limit=12' + (pageParam ? '&cursor=' + encodeURIComponent(pageParam) : ''), observationListSchema, { signal }),
    getNextPageParam: (last) => last.nextCursor ?? undefined, retry: false,
  })
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  return <section aria-label="Your animal encounters" className="space-y-6"><header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-bold">The animals you’ve met</h1><p className="mt-2 text-muted-foreground">Your real encounters, saved photos, and identification outcomes.</p></div><ButtonLink href="/spot"><Camera className="size-4" />Spot an animal</ButtonLink></header>
    {query.isPending && <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading your encounters">{[0, 1, 2, 3].map((key) => <div key={key} className="space-y-3 rounded-xl border p-4"><Skeleton className="aspect-[4/3] rounded-lg" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" /></div>)}</div>}
    {query.error && <div role="alert" className="space-y-3"><p>{query.error.message}</p><Button variant="outline" onClick={() => void query.refetch()}><RefreshCw className="size-4" />Try again</Button></div>}
    {!query.isPending && !query.error && !items.length && <Card><CardContent className="space-y-4 py-6 text-center"><PawPrint className="mx-auto size-12 text-primary" /><h2 className="text-xl font-bold">Your next encounter starts a story.</h2><p className="mx-auto max-w-prose text-muted-foreground">No real animal photos yet. Take a photo to help identify a neighborhood companion.</p><ButtonLink href="/spot">Take your first photo</ButtonLink></CardContent></Card>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <Card key={item.observationId} className="gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md"><img src={item.photoUrl} alt="Your animal encounter photograph" loading="lazy" className="aspect-[4/3] w-full object-cover" /><CardContent className="space-y-3 py-4"><h2 className="font-bold">{item.name}</h2><p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString('en-PH')}</p>{item.submittedAt ? <IdentityStatus identity={item.identityState} evidence={item.evidenceState} publication={item.publicationState} method={item.method} /> : <p className="text-sm text-muted-foreground">Draft encounter · private photo saved</p>}<RewardOutcome receipt={item} compact /><div className="flex flex-wrap gap-2"><ButtonLink variant="outline" href={'/spot?observation=' + item.observationId}>{item.submittedAt ? 'View outcome' : 'Continue encounter'}</ButtonLink>{item.animalId && <ButtonLink variant="ghost" href={'/spot/animals/' + item.animalId}>Animal record</ButtonLink>}</div></CardContent></Card>)}</div>
    {query.hasNextPage && <Button variant="outline" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading encounters…' : 'Load more encounters'}</Button>}
  </section>
}
