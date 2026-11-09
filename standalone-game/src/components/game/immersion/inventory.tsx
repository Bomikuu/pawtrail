import { useState } from 'react'
import { LockKeyhole, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PACK_ITEMS, itemArt } from '@/game/immersion-data'
import { ITEMS } from '@/game/data'
import type { Progress } from '@/game/types'

export function InventoryPanel({ stock, legacy, onUse, useLabel = 'Add to care supplies', allowUse = true }: { stock: Record<string, number>; legacy?: Progress['inventory']; onUse?: (id: string) => void; useLabel?: string; allowUse?: boolean }) {
  const [category,setCategory]=useState('All'),[chosen,setChosen]=useState('')
  const entries = [
    ...PACK_ITEMS.map((item)=>({...item,count:stock[item.id]??0,art:itemArt(item.id),usable:!!item.resource})),
    ...Object.entries(legacy??{}).filter(([id])=>id in ITEMS).map(([id,count])=>({id:'legacy:'+id,name:ITEMS[id as keyof typeof ITEMS].name,description:ITEMS[id as keyof typeof ITEMS].description,category:id==='food'?'Food':id==='toy'?'Toys':ITEMS[id as keyof typeof ITEMS].category==='materials'?'Materials':ITEMS[id as keyof typeof ITEMS].category==='collectibles'?'Collectibles':'Pet Care',count,art:'/pawtrail-game/game-assets/portraits/'+ITEMS[id as keyof typeof ITEMS].sprite+'.png',usable:false,protected:false})),
  ].filter((item)=>item.count>0)
  const visible=entries.filter((item)=>category==='All'||item.category===category)
  const selected=visible.find((item)=>item.id===chosen)??visible[0]
  return <div className="space-y-4"><div className="flex flex-wrap gap-1.5" role="group" aria-label="Inventory categories">{['All','Food','Pet Care','Toys','Materials','Collectibles','Quest Items'].map((c)=><Button key={c} variant={category===c?'default':'outline'} size="sm" className="h-7 rounded-full px-2.5 text-xs" onClick={()=>setCategory(c)} aria-pressed={category===c}>{c}</Button>)}</div><div className="grid gap-4 sm:grid-cols-[1.2fr_1fr]">
    <div className="grid content-start grid-cols-4 gap-2">{visible.map((item)=><Button key={item.id} variant="outline" className="relative h-20 flex-col gap-1 bg-background p-1 aria-pressed:border-primary aria-pressed:bg-secondary" onClick={()=>setChosen(item.id)} aria-pressed={selected?.id===item.id} aria-label={item.name+', '+item.count}><img src={item.art} alt="" className="size-8 [image-rendering:pixelated]" /><span className="max-w-full truncate text-[9px] capitalize">{item.name}</span><span className="absolute right-1 top-0.5 text-[10px] font-bold tabular-nums">{item.count}</span></Button>)}</div>
    {selected?<section className="space-y-3 rounded-xl border bg-secondary/30 p-4"><img src={selected.art} alt="" className="size-16 [image-rendering:pixelated]" /><h3 className="font-heading text-lg font-extrabold capitalize">{selected.name}</h3><Badge variant="secondary">{selected.category}</Badge><p className="text-sm leading-relaxed">{selected.description}</p><p className="text-xs">Quantity: {selected.count}</p>{selected.protected&&<p className="flex items-center gap-1 text-xs"><LockKeyhole className="size-3" />Protected quest item</p>}{selected.usable&&onUse&&<Button size="sm" disabled={!allowUse} onClick={()=>onUse(selected.id)}>{useLabel}</Button>}{selected.id.startsWith('legacy:')&&<p className="text-xs text-muted-foreground">Use your care supplies from the animal interaction buttons.</p>}</section>:<div className="col-span-full rounded-xl border border-dashed p-7 text-center"><Package className="mx-auto mb-3 size-8 text-primary" /><p className="text-sm font-bold">A little room for discoveries</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Inspect bushes, look near benches, and visit the community mailbox. Found items will appear here.</p></div>}
  </div></div>
}
