import raw from './catalog.json'
import type { Furniture, Placement } from './types'
export const catalogue = raw as unknown as {
  items: Furniture[]
  players: Record<string, { file: string; rows: Record<string, number> }>
  cats: Record<string, { file: string; animations: Record<string, number[][]> }>
  effects: Record<string, { file: string; frames: number }>
}
export const furniture = Object.fromEntries(
  catalogue.items.map((i) => [i.id, i]),
)
export function occupied(p: Placement) {
  const d = furniture[p.item],
    result: string[] = []
  if (!d?.blocking) return result
  let [fx, fy, w, h] = d.footprint
  const [ax, ay] = d.anchor
  if (p.rotation % 180) [fx, fy, w, h] = [ax - h / 2, ay - w, h, w]
  const left = p.x * 32 + 16 - ax + fx,
    top = p.y * 32 + 32 - ay + fy
  for (let x = Math.floor(left / 32); x < Math.ceil((left + w) / 32); x++)
    for (let y = Math.floor(top / 32); y < Math.ceil((top + h) / 32); y++)
      result.push(x + ',' + y)
  return result
}
export function solids(layout: Placement[], hub = false) {
  const set = new Set<string>()
  for (let x = 0; x < 24; x++)
    for (let y = 0; y < 18; y++)
      if (x === 0 || x === 23 || y === 0 || y === 17) set.add(x + ',' + y)
  layout.forEach((p) => occupied(p).forEach((key) => set.add(key)))
  if (hub)
    set.add('10,10')
  if (hub)
    for (const center of [110, 242, 374, 506, 638])
      for (
        let x = Math.floor((center - 40) / 32);
        x < Math.ceil((center + 40) / 32);
        x++
      )
        for (let y = 4; y <= 5; y++) set.add(x + ',' + y)
  return set
}
export function valid(p: Placement, layout: Placement[]) {
  if (p.x < 1 || p.x > 22 || p.y < 2 || p.y > 16) return false
  const blocked = solids(layout.filter((a) => a.id !== p.id))
  return occupied(p).every((key) => !blocked.has(key) && key !== '12,16')
}
