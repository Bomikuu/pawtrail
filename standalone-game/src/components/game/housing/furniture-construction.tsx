import { useEffect, useMemo, useState } from 'react'
import { Clock3, Hammer, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { act } from '@/game/housing/client'
import type { Boot, Furniture } from '@/game/housing/types'

export function FurnitureConstruction({
  definition,
  data,
  busy,
}: {
  definition: Furniture
  data: Boot
  busy: boolean
}) {
  const [mode, setMode] = useState<'instant' | 'timed' | 'recipe'>('instant')
  const [clock, setClock] = useState(Date.now)
  const serverClock = useMemo(
    () => ({
      server: data.serverTime,
      local: data.clientReceivedAt ?? data.serverTime * 1000,
    }),
    [data.serverTime, data.clientReceivedAt],
  )
  const recipe = definition.construction
  const jobs = (data.builds ?? []).filter((job) => job.item === definition.id)
  useEffect(() => {
    if (!jobs.length) return
    const timer = setInterval(() => setClock(Date.now()), 500)
    return () => clearInterval(timer)
  }, [jobs.length])
  if (!recipe) return null
  const haveMaterials = recipe.materials.every(
    (material) => (data.player.supplies?.[material.id] ?? 0) >= material.amount,
  )
  const enough =
    mode === 'recipe' ? haveMaterials : data.player.wallet >= definition.price
  const now = serverClock.server + (clock - serverClock.local) / 1000
  const send = (body: Record<string, unknown>) => {
    void act(body).catch(() => {})
  }
  return (
    <div className="space-y-3">
      <p className="font-heading text-lg font-bold">Make {definition.label}</p>
      <div className="flex flex-wrap gap-1" aria-label="Construction method">
        {(['instant', 'timed', 'recipe'] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={mode === value ? 'secondary' : 'outline'}
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
          >
            {value === 'instant'
              ? 'Buy now'
              : value === 'timed'
                ? 'Timed build'
                : 'Recipe'}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {mode === 'instant'
          ? `${definition.price} Game Kibble · ready immediately`
          : mode === 'timed'
            ? `${definition.price} Game Kibble · ${recipe.seconds}s build time`
            : `Materials below · ${recipe.seconds}s build time`}
      </p>
      {mode === 'recipe' && (
        <div className="space-y-1">
          {recipe.materials.map((material) => {
            const held = data.player.supplies?.[material.id] ?? 0,
              missing = Math.max(0, material.amount - held)
            return (
              <div
                key={material.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span>
                  {material.label} · {Math.min(held, material.amount)}/
                  {material.amount}
                </span>
                {missing > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={
                      busy || data.player.wallet < missing * material.price
                    }
                    onClick={() =>
                      send({
                        type: 'buy-supply',
                        target: material.id,
                        quantity: missing,
                      })
                    }
                  >
                    Get {missing} · {missing * material.price} Kibble
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
      <Button
        size="sm"
        className="w-full"
        disabled={
          busy ||
          !enough ||
          (mode !== 'instant' && (data.builds?.length ?? 0) >= 10)
        }
        onClick={() =>
          send(
            mode === 'instant'
              ? { type: 'buy', target: definition.id }
              : { type: 'furniture-build', target: definition.id, mode },
          )
        }
      >
        <Hammer className="size-4" />
        {mode === 'instant' ? 'Buy one' : 'Start build'}
      </Button>
      {jobs.map((job) => {
        const remaining = Math.max(0, Math.ceil(job.readyAt - now)),
          ready = remaining === 0
        return (
          <div key={job.id} className="space-y-1.5 border-t pt-2">
            <div className="flex items-center gap-1 text-xs">
              {ready ? (
                <PackageCheck className="size-3.5" />
              ) : (
                <Clock3 className="size-3.5" />
              )}
              <span>
                {ready ? 'Ready to collect' : `Building · ${remaining}s`}
              </span>
            </div>
            <Progress
              value={Math.min(
                100,
                Math.max(
                  0,
                  ((now - job.started) /
                    Math.max(1, job.readyAt - job.started)) *
                    100,
                ),
              )}
            />
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={busy || !ready}
              onClick={() => send({ type: 'furniture-claim', target: job.id })}
            >
              Collect couch
            </Button>
          </div>
        )
      })}
      <p className="text-[10px] text-muted-foreground">
        Builds and materials are saved by the game service. Game Kibble is
        separate from verified community rewards.
      </p>
    </div>
  )
}
