'use client'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Cookie, PawPrint, RefreshCw, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { captureRequest } from './api'
import { realLedgerSchema, realWalletSchema } from './schemas'
import { useCaptureIdentity } from './workspace'

export function RealKibbleBalance({ actorId }: { actorId: string }) {
  const query = useQuery({ queryKey: ['capture', actorId, 'wallet'], queryFn: ({ signal }) => captureRequest('kibble/wallet', realWalletSchema, { signal }), retry: false })
  return <ButtonLink href="/spot/kibble" variant="outline" size="sm" aria-label="Open your real Kibble wallet"><Cookie className="size-4 text-primary" />{query.isPending ? 'Loading Kibble…' : query.error ? 'View real Kibble' : query.data.balance.toLocaleString('en-PH') + ' real Kibble'}</ButtonLink>
}

export function RealKibbleWallet() {
  const { actor } = useCaptureIdentity()
  const wallet = useQuery({ queryKey: ['capture', actor.id, 'wallet'], queryFn: ({ signal }) => captureRequest('kibble/wallet', realWalletSchema, { signal }), retry: false })
  const ledger = useInfiniteQuery({ queryKey: ['capture', actor.id, 'ledger'], initialPageParam: '',
    queryFn: ({ signal, pageParam }) => captureRequest('kibble/ledger?limit=20' + (pageParam ? '&cursor=' + encodeURIComponent(pageParam) : ''), realLedgerSchema, { signal }),
    getNextPageParam: (last) => last.nextCursor ?? undefined, retry: false,
  })
  const items = ledger.data?.pages.flatMap((page) => page.items) ?? []
  return <section aria-label="Kibble wallet" className="mx-auto max-w-[800px] space-y-7">
    <header className="space-y-2"><h1 className="text-3xl font-bold">Good care deserves recognition.</h1><p className="max-w-prose text-muted-foreground">Real Kibble records accepted contributions. It is non-cash recognition, separate from game progress and sample balances.</p></header>
    <Card><CardContent className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Cookie className="size-9 text-primary" /><div><p className="text-sm text-muted-foreground">Your real platform balance</p>{wallet.isPending ? <Skeleton className="mt-2 h-8 w-32" /> : wallet.error ? <p role="alert" className="max-w-prose text-sm text-destructive">{wallet.error.message}</p> : <p className="text-3xl font-bold tabular-nums">{wallet.data.balance.toLocaleString('en-PH')} <span className="text-base font-medium">Kibble</span></p>}</div></div><Button variant="outline" disabled={wallet.isFetching || ledger.isFetching} onClick={() => { void wallet.refetch(); void ledger.refetch() }}><RefreshCw className="size-4" />Refresh</Button></div>
      <div className="border-t pt-4 text-sm leading-relaxed text-muted-foreground">{wallet.data ? <p>Earn {wallet.data.policy.sightingReward} Kibble for an accepted recent encounter, once per animal per Manila day. Up to {wallet.data.policy.dailySightingLimit} sighting Kibble daily. Pending, duplicated or withdrawn evidence does not add credit.</p> : <p>Only the backend can award or reverse real Kibble. A photo upload alone does not earn points.</p>}</div>
    </CardContent></Card>
    <section className="space-y-4" aria-labelledby="real-kibble-history"><h2 id="real-kibble-history" className="text-xl font-bold">Your contribution history</h2>
      {ledger.isPending && <div className="space-y-3" aria-busy="true" aria-label="Loading Kibble entries">{[0, 1, 2].map((index) => <div key={index} className="flex items-center gap-3 rounded-xl border p-4"><Skeleton className="size-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div><Skeleton className="h-6 w-12" /></div>)}</div>}
      {ledger.error && <p role="alert" className="text-sm text-destructive">{ledger.error.message}</p>}
      {!ledger.isPending && !ledger.error && !items.length && <div className="space-y-3 rounded-xl border border-dashed p-7 text-center"><PawPrint className="mx-auto size-10 text-primary" /><h3 className="font-bold">Your first accepted encounter starts here.</h3><p className="mx-auto max-w-prose text-sm text-muted-foreground">No real Kibble entries yet. Photograph an animal and submit a helpful observation; rewards follow accepted evidence.</p><ButtonLink href="/spot">Spot an animal</ButtonLink></div>}
      <ol className="divide-y rounded-xl border bg-card">{items.map((entry) => <li key={entry.id} className="flex items-start gap-3 p-4"><span className={'mt-1 rounded-full p-2 ' + (entry.amount > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>{entry.amount > 0 ? <Cookie className="size-5" /> : <RotateCcw className="size-5" />}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{entry.description}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} · balance after entry: {entry.balanceAfter}</p><ButtonLink href={'/spot?observation=' + entry.contributionId} variant="link" className="mt-1 h-auto px-0 text-xs">View encounter</ButtonLink></div><strong className={'shrink-0 tabular-nums ' + (entry.amount > 0 ? 'text-primary' : 'text-muted-foreground')}>{entry.amount > 0 ? '+' : ''}{entry.amount}</strong></li>)}</ol>
      {ledger.hasNextPage && <Button variant="outline" disabled={ledger.isFetchingNextPage} onClick={() => void ledger.fetchNextPage()}>{ledger.isFetchingNextPage ? 'Loading entries…' : 'Load more entries'}</Button>}
    </section>
  </section>
}
