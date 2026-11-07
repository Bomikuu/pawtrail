import { useState } from 'react'
import {
  Check,
  Coins,
  Package,
  Redo2,
  RotateCw,
  Search,
  ShoppingBag,
  Undo2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  action,
  editCancel,
  editSave,
  history,
  scene,
} from '@/features/neighborhood/game/housing/client'
import type { Furniture, HomesState } from '@/features/neighborhood/game/housing/types'
export function DecorationPanel({ state }: { state: HomesState }) {
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState('All'),
    [shop, setShop] = useState(false),
    [purchase, setPurchase] = useState<Furniture | null>(null),
    data = state.data!
  const categories = ['All', ...new Set(data.catalog.map((i) => i.category))]
  const items = data.catalog.filter(
    (i) =>
      (category === 'All' || i.category === category) &&
      i.label.toLowerCase().includes(query.toLowerCase()) &&
      (shop || data.house.inventory[i.id] > 0),
  )
  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-extrabold">
              Make it yours
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Snap to a tile. Leave a little room to roam.
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Cancel decoration changes"
            onClick={editCancel}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={shop ? 'outline' : 'default'}
            onClick={() => setShop(false)}
          >
            <Package className="size-3.5" />
            Your pieces
          </Button>
          <Button
            size="sm"
            variant={shop ? 'default' : 'outline'}
            disabled={data.house.id !== data.player.id}
            onClick={() => setShop(true)}
          >
            <ShoppingBag className="size-3.5" />
            Shop
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a piece…"
            aria-label="Find furniture"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={c === category ? 'secondary' : 'ghost'}
              className="shrink-0 text-xs"
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto p-3">
        {items.map((i) => {
          const used = state.draft.filter((p) => p.item === i.id).length,
            owned = data.house.inventory[i.id] || 0,
            remaining = owned - used
          return (
            <Button
              key={i.id}
              variant="ghost"
              className="h-auto flex-col gap-2 whitespace-normal rounded-xl border bg-card p-2.5 text-center"
              disabled={
                (!shop && remaining <= 0) ||
                state.busy ||
                state.status !== 'online'
              }
              onClick={() =>
                shop ? setPurchase(i) : scene({ type: 'place', item: i.id })
              }
            >
              <img
                src={i.file}
                alt=""
                className="size-16 object-contain [image-rendering:pixelated]"
              />
              <span className="text-xs font-bold leading-tight">{i.label}</span>
              <span className="text-[10px] text-muted-foreground">
                {shop
                  ? `${i.price} game Kibble · ${owned} owned`
                  : `${Math.max(0, remaining)} in storage`}
              </span>
            </Button>
          )
        })}
        {!items.length && (
          <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
            No pieces match. Try another category or visit the shop.
          </p>
        )}
      </div>
      {purchase && (
        <div className="space-y-2 border-t bg-muted/50 p-3">
          <p className="text-sm font-bold">Buy {purchase.label}?</p>
          <p className="text-xs text-muted-foreground">
            {purchase.price} game Kibble · Balance {data.player.wallet}. The
            piece goes into your storage.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={state.busy || data.player.wallet < purchase.price}
              onClick={() => {
                action({ type: 'buy', target: purchase.id })
                setPurchase(null)
              }}
            >
              <Coins className="size-3.5" />
              Confirm purchase
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPurchase(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      <footer className="space-y-3 border-t p-3">
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="ghost"
            aria-label="Undo placement"
            onClick={() => history('undo')}
          >
            <Undo2 className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Redo placement"
            onClick={() => history('redo')}
          >
            <Redo2 className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => scene({ type: 'rotate' })}
          >
            <RotateCw className="size-3.5" />
            Rotate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!state.selectedFurniture}
            onClick={() => scene({ type: 'store' })}
          >
            <Package className="size-3.5" />
            Store
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => scene({ type: 'cancel' })}
          >
            Cancel move
          </Button>
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Drag to move · arrows to adjust · R to rotate · Enter to place · Esc
          to cancel. Green is clear; red needs another spot.
        </p>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={state.busy || state.status !== 'online'}
            onClick={() => void editSave()}
          >
            <Check className="size-4" />
            {state.busy ? 'Saving…' : 'Save home'}
          </Button>
          <Button variant="outline" onClick={editCancel}>
            Discard
          </Button>
        </div>
      </footer>
    </section>
  )
}
