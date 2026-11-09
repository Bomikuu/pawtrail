import { Shovel, Sprout, Hand } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { action, scene } from '@/game/housing/client'
import type { HomesState } from '@/game/housing/types'

const tools = [
  { id: 'shovel', label: 'Garden shovel', price: 30, Icon: Shovel },
  { id: 'lawn-mower', label: 'Lawn mower', price: 120, Icon: Sprout },
]
export function GardenTools({ state }: { state: HomesState }) {
  const data = state.data!
  const equipped = data.environment?.tool ?? ''
  const canDig =
    data.house.zone === 'yard' &&
    data.house.id === data.player.id &&
    !state.decoration
  return (
    <section
      className="space-y-3 border-b pb-4"
      aria-labelledby="garden-tools-title"
    >
      <div>
        <h3 id="garden-tools-title" className="font-heading text-xl font-bold">
          Garden tools
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Equip a mower and walk over grass, or face a tile and use the shovel.
          Changes are saved in your own yard; paths and buildings stay intact.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tools.map(({ id, label, price, Icon }) => {
          const owned = (data.player.supplies?.[id] ?? 0) > 0
          return (
            <Button
              key={id}
              size="sm"
              variant={equipped === id ? 'secondary' : 'outline'}
              disabled={
                state.busy ||
                state.status !== 'online' ||
                (!owned && data.player.wallet < price)
              }
              aria-pressed={equipped === id}
              onClick={() =>
                action({
                  type: owned ? 'equip-tool' : 'buy-supply',
                  target: owned && equipped === id ? '' : id,
                })
              }
            >
              <Icon className="size-4" />
              {owned
                ? equipped === id
                  ? `${label} equipped`
                  : `Equip ${label.toLowerCase()}`
                : `${label} · ${price} Kibble`}
            </Button>
          )
        })}
      </div>
      {equipped && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={state.busy}
            onClick={() => action({ type: 'equip-tool', target: '' })}
          >
            <Hand className="size-4" />
            Put tool away
          </Button>
          {equipped === 'shovel' && (
            <Button
              size="sm"
              disabled={!canDig || state.status !== 'online'}
              onClick={() => scene({ type: 'dig' })}
            >
              <Shovel className="size-4" />
              Dig facing tile
            </Button>
          )}
        </div>
      )}
      {equipped === 'shovel' && (
        <p className="text-xs text-muted-foreground">
          In your yard: E digs the tile you face. Put the shovel away to use
          normal E interactions.
        </p>
      )}
    </section>
  )
}
