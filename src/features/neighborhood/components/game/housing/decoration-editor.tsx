import { useEffect, useRef, useState } from "react";
import {
  Armchair,
  BedDouble,
  Boxes,
  Cat,
  Check,
  Flower2,
  Lamp,
  Package,
  Redo2,
  RotateCcw,
  RotateCw,
  Search,
  ShoppingBag,
  Sprout,
  Table,
  Undo2,
  X,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  action,
  editCancel,
  editSave,
  history,
  scene,
  homes,
  patch,
  reapplyDraft,
} from "@/features/neighborhood/game/housing/client";
import { editorViewport, screenPoint } from "@/features/neighborhood/game/runtime/session";
import type { HomesState } from "@/features/neighborhood/game/housing/types";
import { FurnitureConstruction } from './furniture-construction'
import { SofaColorControl } from '../sofa-color-control'
import { SOFA_DEFAULT_COLOR } from '@/features/neighborhood/game/furniture/palette-color'
const categories = [
  { id: "all", label: "All furniture", Icon: Package, match: /.*/ },
  {
    id: "seating",
    label: "Seating",
    Icon: Armchair,
    match: /chair|sofa|couch|bench|loveseat|chaise/,
  },
  { id: "tables", label: "Tables", Icon: Table, match: /table|desk/ },
  {
    id: "beds",
    label: "Beds & rugs",
    Icon: BedDouble,
    match: /bed|rug|runner|blanket/,
  },
  {
    id: "cats",
    label: "Cat furniture",
    Icon: Cat,
    match: /cat|scratch|perch|hammock|tower|tunnel/,
  },
  {
    id: "bowls",
    label: "Food & water",
    Icon: Cat,
    match: /bowl|feed|water|food/,
  },
  {
    id: "storage",
    label: "Storage",
    Icon: Boxes,
    match: /cabinet|wardrobe|shelf|dresser|box|storage/,
  },
  {
    id: "plants",
    label: "Plants",
    Icon: Flower2,
    match: /plant|flower|banana|pot/,
  },
  {
    id: "lighting",
    label: "Lighting",
    Icon: Lamp,
    match: /lamp|light|lantern|candle/,
  },
  {
    id: "outdoor",
    label: "Outdoor",
    Icon: Sprout,
    match: /garden|outdoor|fence/,
  },
];
export function DecorationEditor({ state }: { state: HomesState }) {
  const host = useRef<HTMLDivElement>(null),
    [category, setCategory] = useState("all"),
    [query, setQuery] = useState(""),
    [shop, setShop] = useState(false),
    [preview, setPreview] = useState(false),
    [purchase, setPurchase] = useState<string | null>(null);
  useEffect(() => {
    if (!state.decoration || !host.current) return;
    return editorViewport(host.current);
  }, [state.decoration, preview]);
  const data = state.data;
  if (!data || !state.decoration) return null;
  const house = data.house,
    zone = house.zone,
    filter = categories.find((c) => c.id === category)!,
    others =
      zone === "yard"
        ? [...house.layout, ...house.upstairsLayout]
        : zone === "upstairs"
          ? [...house.layout, ...house.yardLayout]
          : [...house.upstairsLayout, ...house.yardLayout],
    available = (id: string) =>
      Math.max(
        0,
        (house.inventory[id] ?? 0) -
          state.draft.filter((p) => p.item === id).length -
          others.filter((p) => p.item === id).length,
      ),
    selected =
      state.placementPreview ??
      state.draft.find((p) => p.id === state.selectedFurniture),
    definition = data.catalog.find((d) => d.id === selected?.item),
    items = data.catalog.filter(
      (d) =>
        d.id !== "community-bench" &&
        d.zones.includes(zone === "upstairs" ? "interior" : zone) &&
        filter.match.test(d.id) &&
        d.label.toLowerCase().includes(query.toLowerCase()) &&
        (shop || (house.inventory[d.id] ?? 0) > 0),
    ),
    rotations =
      definition?.supportedRotations ??
      (definition?.rotatable ? [0, 90, 180, 270] : [0]);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) editCancel();
      }}
    >
      <DialogContent
        className="pawtrail-game flex h-[94dvh] w-[96vw] max-w-none flex-col gap-0 overflow-hidden rounded-lg p-0 text-foreground sm:max-w-[96vw]"
        onEscapeKeyDown={(event) => {
          if (homes.get().selectedFurniture) {
            event.preventDefault();
            scene({ type: "cancel" });
            patch({ selectedFurniture: null });
          }
        }}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12">
          <DialogTitle className="font-heading text-2xl">
            Make {zone === "yard" ? "your yard" : "your home"} yours
          </DialogTitle>
          <DialogDescription>
            Choose a piece, then drag it into the live view or click to place
            it. Your arrangement stays a draft until you save.
          </DialogDescription>
        </DialogHeader>
        <div className="flex shrink-0 gap-2 border-b px-3 py-2 lg:hidden">
          <Button
            variant={!preview ? "secondary" : "ghost"}
            className="flex-1 rounded-md"
            onClick={() => setPreview(false)}
          >
            Furniture
          </Button>
          <Button
            variant={preview ? "secondary" : "ghost"}
            className="flex-1 rounded-md"
            onClick={() => setPreview(true)}
          >
            Live room
          </Button>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-[9rem_minmax(0,1fr)] lg:grid-cols-[10rem_18rem_minmax(0,1fr)] xl:grid-cols-[11rem_21rem_minmax(0,1fr)]">
          <nav
            aria-label="Furniture categories"
            className={
              (preview ? "hidden lg:flex " : "flex ") +
              "min-h-0 flex-col gap-1 overflow-y-auto border-r bg-secondary/20 p-2"
            }
          >
            {categories.map(({ id, label, Icon }) => (
              <Button
                key={id}
                variant={category === id ? "secondary" : "ghost"}
                className="h-auto justify-start whitespace-normal rounded-md px-2 py-2.5 text-left text-xs"
                aria-pressed={category === id}
                onClick={() => setCategory(id)}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Button>
            ))}
          </nav>
          <section
            aria-label="Furniture catalog"
            className={
              (preview ? "hidden lg:flex " : "flex ") +
              "min-h-0 flex-col border-r"
            }
          >
            <div className="space-y-2 border-b p-3">
              <div className="flex gap-2">
                <Button
                  variant={!shop ? "secondary" : "ghost"}
                  size="sm"
                  className="flex-1 rounded-md"
                  onClick={() => setShop(false)}
                >
                  <Package className="size-4" />
                  Owned
                </Button>
                <Button
                  variant={shop ? "secondary" : "ghost"}
                  size="sm"
                  className="flex-1 rounded-md"
                  disabled={house.id !== data.player.id}
                  onClick={() => setShop(true)}
                >
                  <ShoppingBag className="size-4" />
                  Shop
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find furniture…"
                  aria-label="Find furniture"
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {items.length} pieces · {data.player.wallet} game Kibble
              </p>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto p-3">
              {items.map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  className="relative h-auto min-w-0 flex-col gap-2 whitespace-normal rounded-md p-2 text-center"
                  disabled={state.busy || (!shop && available(item.id) < 1)}
                  draggable={!shop && available(item.id) > 0}
                  onDragStart={(event) =>
                    event.dataTransfer.setData(
                      "application/pawtrail-furniture",
                      item.id,
                    )
                  }
                  onClick={() => {
                    if (shop) setPurchase(item.id);
                    else {
                      scene({ type: "place", item: item.id });
                      setPreview(true);
                    }
                  }}
                >
                  <img
                    src={item.file}
                    alt=""
                    className="h-20 w-full object-contain [image-rendering:pixelated]"
                  />
                  <span className="text-xs font-semibold">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {shop
                      ? item.price + " game Kibble"
                      : available(item.id) + " available"}
                  </span>
                </Button>
              ))}
              {!items.length && (
                <div className="col-span-2 py-10 text-center">
                  <img
                    src="/pawtrail-game/discovery/cat-placeholder-v1.webp"
                    alt=""
                    className="mx-auto size-20 object-contain"
                  />
                  <p className="mt-3 text-xs text-muted-foreground">
                    No pieces here yet. Try another category or visit the shop.
                  </p>
                </div>
              )}
            </div>
            {purchase && (
              <div className="max-h-[50dvh] space-y-2 overflow-y-auto border-t p-3">
                {data.catalog.find(d => d.id === purchase)?.construction ? <FurnitureConstruction definition={data.catalog.find(d => d.id === purchase)!} data={data} busy={state.busy} /> : <><p className="text-sm">
                  Buy {data.catalog.find((d) => d.id === purchase)?.label}?
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={
                      state.busy ||
                      data.player.wallet <
                        (data.catalog.find((d) => d.id === purchase)?.price ??
                          Infinity)
                    }
                    onClick={() => {
                      action({ type: "buy", target: purchase });
                      setPurchase(null);
                    }}
                  >
                    Buy one
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPurchase(null)}
                  >
                    Cancel
                  </Button>
                </div></>}
              </div>
            )}
          </section>
          <section
            className={
              (preview ? "col-span-2 flex lg:col-span-1 " : "hidden lg:flex ") +
              "relative min-h-0 flex-col bg-muted"
            }
            aria-label="Live decoration view"
          >
            <div
              ref={host}
              className="relative min-h-0 flex-1 overflow-hidden"
              onDragOver={(event) => {
                if (
                  event.dataTransfer.types.includes(
                    "application/pawtrail-furniture",
                  )
                )
                  event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const item = event.dataTransfer.getData(
                    "application/pawtrail-furniture",
                  ),
                  point = screenPoint(event.clientX, event.clientY);
                if (item && point) {
                  scene({ type: "place", item, at: point });
                  scene({ type: "commit" });
                }
              }}
            />
            <div
              className="flex max-h-24 shrink-0 flex-wrap gap-1 overflow-y-auto border-t bg-background p-2"
              aria-label="Placed furniture"
            >
              {state.draft.map((p) => (
                <Button
                  key={p.id}
                  size="sm"
                  variant={selected?.id === p.id ? "secondary" : "ghost"}
                  className="h-8 rounded-md text-xs"
                  onClick={() => {
                    scene({ type: "select", id: p.id });
                    setPreview(true);
                  }}
                >
                  {data.catalog.find((d) => d.id === p.item)?.label ?? p.item}
                </Button>
              ))}
              {!state.draft.length && (
                <p className="p-2 text-xs text-muted-foreground">
                  Choose a piece to begin your arrangement.
                </p>
              )}
            </div>
          </section>
        </div>
        <div className="max-h-[55dvh] shrink-0 space-y-2 overflow-y-auto border-t bg-background px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-auto text-sm font-semibold">
              {definition?.label ?? "Select a placed piece"}
              {selected && (
                <span className="ml-2 text-xs font-normal tabular-nums text-muted-foreground">
                  {selected.rotation}°
                </span>
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={!definition || rotations.length < 2}
              onClick={() => scene({ type: "rotate", direction: -1 })}
            >
              <RotateCcw className="size-4" />
              Rotate left
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!definition || rotations.length < 2}
              onClick={() => scene({ type: "rotate", direction: 1 })}
            >
              <RotateCw className="size-4" />
              Rotate right · R
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selected}
              onClick={() => scene({ type: "store" })}
            >
              Store
            </Button>
            {definition?.styles?.map(style => <Button key={style.id} variant={(selected?.style ?? definition.defaultStyle) === style.id ? 'secondary' : 'outline'} size="sm" onClick={() => scene({ type: 'style', style: style.id })}><span aria-hidden="true" className="size-3 rounded-sm border" style={{ backgroundColor: style.color }} />{style.label}</Button>)}
            <Button
              size="sm"
              disabled={!selected}
              onClick={() => scene({ type: "commit" })}
            >
              <Check className="size-4" />
              Place
            </Button>
          </div>
          {definition && rotations.length < 2 && (
            <p className="text-xs text-muted-foreground">
              This piece has one authored facing. Other directions need matching
              artwork.
            </p>
          )}
          {selected?.item === 'sofa' && <SofaColorControl color={selected.upholsteryColor ?? SOFA_DEFAULT_COLOR}
            onChange={color => scene({ type: 'upholstery-color', color })} disabled={state.busy}
            description="Choose a color for this sofa, then Save arrangement to keep it after reloading." />}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1">
              {[
                { Icon: ArrowLeft, x: -1, y: 0, label: "Move left" },
                { Icon: ArrowUp, x: 0, y: -1, label: "Move up" },
                { Icon: ArrowDown, x: 0, y: 1, label: "Move down" },
                { Icon: ArrowRight, x: 1, y: 0, label: "Move right" },
              ].map(({ Icon, x, y, label }) => (
                <Button
                  key={label}
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-md"
                  disabled={!selected}
                  aria-label={label}
                  onClick={() => scene({ type: "nudge", x, y })}
                >
                  <Icon className="size-4" />
                </Button>
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-md"
                aria-label="Undo"
                onClick={() => history("undo")}
              >
                <Undo2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-md"
                aria-label="Redo"
                onClick={() => history("redo")}
              >
                <Redo2 className="size-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-md"
                disabled={state.busy}
                onClick={editCancel}
              >
                <X className="size-4" />
                Cancel
              </Button>
              <Button
                className="rounded-md"
                disabled={state.busy || state.status !== "online"}
                onClick={() => void editSave()}
              >
                <Check className="size-4" />
                {state.busy ? "Saving…" : "Save arrangement"}
              </Button>
            </div>
          </div>
          {state.error && (
            <p role="alert" className="text-xs text-destructive">
              {state.error}
            </p>
          )}
          {state.editConflict && (
            <div className="flex items-center gap-2 text-xs">
              <p>This space changed. Your draft is still here.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void reapplyDraft()}
              >
                Keep my draft
              </Button>
              <Button variant="ghost" size="sm" onClick={editCancel}>
                Discard
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
