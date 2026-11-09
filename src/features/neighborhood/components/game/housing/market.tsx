import { useState } from "react";
import { Coins, Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { action } from "@/features/neighborhood/game/housing/client";
import type { HomesState } from "@/features/neighborhood/game/housing/types";
import { GardenTools } from './garden-tools'
const supplies = [
  ["cat-food", "Cat food", 8],
  ["dog-food", "Dog food", 8],
  ["fish-treats", "Fish treats", 5],
  ["water-bottle", "Water bottle", 3],
  ["first-aid", "First-aid pouch", 20],
  ["toy-mouse", "Toy mouse", 10],
] as const;
export function MarketPanel({
  state,
  kind,
}: {
  state: HomesState;
  kind: "care-shop" | "garden-shop";
}) {
  const [query, setQuery] = useState(""),
    [confirm, setConfirm] = useState<{
      id: string;
      label: string;
      price: number;
    } | null>(null),
    data = state.data!;
  const pieces = data.catalog.filter(
    (i) =>
      i.id !== "community-bench" &&
      i.label.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-4">
      {kind === 'garden-shop' && <GardenTools state={state} />}
      <p className="text-sm leading-relaxed text-muted-foreground">
        {kind === "care-shop"
          ? "Care supplies for virtual animal interactions. Approach a resident pet before using them from your backpack."
          : "Furniture and garden pieces go into your shared storage. Arrange them at home using Decorate."}
      </p>
      <p className="flex items-center gap-2 text-sm font-bold">
        <Coins className="size-4 text-primary" />
        {data.player.wallet} game Kibble
      </p>
      {kind === "garden-shop" && (
        <Input
          aria-label="Search workshop pieces"
          placeholder="Find a bed, aquarium or garden piece…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      <div className="grid max-h-[44dvh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
        {(kind === "care-shop"
          ? supplies.map(([id, label, price]) => ({
              id,
              label,
              price,
              file: "/assets/game/inventory/items/" + id + ".png",
            }))
          : pieces
        ).map((i) => (
          <Button
            key={i.id}
            variant="outline"
            className="h-auto flex-col gap-2 whitespace-normal p-3 text-center"
            disabled={state.busy || state.status !== "online"}
            onClick={() => setConfirm(i)}
          >
            <img
              src={i.file}
              alt=""
              className="size-14 object-contain [image-rendering:pixelated]"
            />
            <span className="text-xs font-bold">{i.label}</span>
            <span className="text-xs text-muted-foreground">
              {i.price} game Kibble
            </span>
          </Button>
        ))}
        {kind === "garden-shop" && !pieces.length && (
          <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
            No pieces match. Try a shorter name.
          </p>
        )}
      </div>
      {confirm && (
        <div className="space-y-3 rounded-lg border bg-secondary/50 p-3">
          <p className="text-sm font-bold">
            Buy {confirm.label} for {confirm.price} game Kibble?
          </p>
          <div className="flex gap-2">
            <Button
              disabled={state.busy || data.player.wallet < confirm.price}
              onClick={() => {
                action({
                  type: kind === "care-shop" ? "buy-supply" : "buy",
                  target: confirm.id,
                });
                setConfirm(null);
              }}
            >
              <ShoppingBag className="size-4" />
              Buy one
            </Button>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
          </div>
          {data.player.wallet < confirm.price && (
            <p className="text-xs text-muted-foreground">
              You need more game Kibble. Optional social quests award game
              rewards.
            </p>
          )}
        </div>
      )}
      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Package className="mt-0.5 size-3.5 shrink-0" />
        Prices and stock are saved by the game service. These purchases do not
        spend your platform Kibble.
      </p>
    </div>
  );
}
