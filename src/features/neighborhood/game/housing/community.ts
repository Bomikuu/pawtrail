import data from "./community-layout.json";
import { structuralCells, protectedCells } from "./presets";
export const COMMUNITY = data;
export const EXTERIORS = [
  "starter-house",
  "garden-house",
  "pastel-house",
] as const;
export type Zone = "interior" | "yard" | "upstairs";
export function fixedCells(
  zone: Zone = "interior",
  hub = false,
  preset = "studio",
) {
  const set = new Set<string>();
  const rect = (x: number, y: number, w: number, h: number) => {
    for (let a = x; a < x + w; a++)
      for (let b = y; b < y + h; b++) set.add(a + "," + b);
  };
  if (hub) {
    for (const o of data.objects)
      if (o.asset !== "bench")
        rect(...(o.solid as [number, number, number, number]));
    for (const r of [...data.water, ...data.plots])
      rect(...(r as [number, number, number, number]));
    const [cx, cy, cw, ch] = data.courtyard;
    for (let x = cx; x < cx + cw; x++) {
      set.add(x + "," + cy);
      if (x !== cx + 2 && x !== cx + 3) set.add(x + "," + (cy + ch - 1));
    }
    for (let y = cy; y < cy + ch; y++) {
      set.add(cx + "," + y);
      set.add(cx + cw - 1 + "," + y);
    }
    for (const r of data.picnic.solids)
      rect(...(r as [number, number, number, number]));
    for (const [x, y] of data.trees) {
      set.add(x - 1 + "," + (y - 1));
      set.add(x + "," + (y - 1));
    }
  } else if (zone === "yard") rect(5, 2, 4, 4);
  else structuralCells(preset, zone).forEach((k) => set.add(k));
  return set;
}
export function reservedCells(zone: Zone = "interior", preset = "studio") {
  const set = new Set<string>();
  if (zone === "yard")
    for (let y = 6; y < 13; y++) for (const x of [6, 7]) set.add(x + "," + y);
  else protectedCells(preset, zone).forEach((k) => set.add(k));
  return set;
}
