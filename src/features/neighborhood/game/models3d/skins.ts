import { canonicalSkinId } from './skin-ids'
export { canonicalSkinId } from './skin-ids'
import * as T from "three";
import manifest from "./uv-manifest.json";
export type SkinPart = keyof typeof manifest.parts;
export type SkinPalette = Record<string, string>;
type Entry = {
  file: string;
  mask: string;
  kind: string;
  palette: SkinPalette;
  reference: string;
};
const entries = manifest.entries as unknown as Record<string, Entry>;
export const catSkinOptions = Object.entries(entries)
  .filter(([, e]) => e.kind === "cat")
  .map(([id]) => id);
export function skinPalette(id: string) {
  return entries[canonicalSkinId(id)].palette;
}
export function characterColors(id: string) {
  const p = entries[canonicalSkinId(id)].palette;
  return {
    hair: p.hair,
    outfit: p.outfit,
    shirt: p.shirt,
    skin: p.skin,
    trousers: p.pants,
    shoes: p.shoes,
  };
}
export function skinUV(part: SkinPart, face: number, u: number, v: number) {
  const tile = manifest.parts[part] + face,
    x = tile % 16,
    y = Math.floor(tile / 16);
  return [
    (x * 16 + 0.5 + T.MathUtils.clamp(u, 0, 1) * 15) / manifest.width,
    (manifest.height - y * 16 - 0.5 - (1 - T.MathUtils.clamp(v, 0, 1)) * 15) /
      manifest.height,
  ];
}
function rgb(hex: string) {
  const c = Number.parseInt(hex.slice(1), 16);
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
}
const loads = new Map<
  string,
  Promise<{ pixels: Uint8ClampedArray; roles: Uint8ClampedArray }>
>();
function imagePixels(path: string) {
  return new Promise<Uint8ClampedArray>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = manifest.width;
        c.height = manifest.height;
        const context = c.getContext("2d")!;
        context.drawImage(image, 0, 0);
        resolve(context.getImageData(0, 0, c.width, c.height).data);
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("UV skin could not load"));
    image.src = "/pawtrail-game/game-assets/actor-uv-v2/" + path;
  });
}
function load(id: string) {
  let promise = loads.get(id);
  if (!promise) {
    const e = entries[id];
    promise = Promise.all([imagePixels(e.file), imagePixels(e.mask)]).then(
      ([pixels, roles]) => ({ pixels, roles }),
    );
    loads.set(id, promise);
  }
  return promise;
}
/** Dedicated atlas UVs, authored for each surface. No source sprites are sampled at runtime. */
export function paintedSkin(
  identity: string,
  kind: "player" | "cat",
  options: { hair?: string; outfit?: string; coat?: string },
) {
  const id = canonicalSkinId(identity, kind),
    entry = entries[id],
    palette = entry.palette,
    data = new Uint8Array(manifest.width * manifest.height * 4);
  const fallback = rgb(kind === "player" ? palette.skin : palette.coat);
  for (let i = 0; i < data.length; i += 4) data.set([...fallback, 255], i);
  const texture = new T.DataTexture(
    data,
    manifest.width,
    manifest.height,
    T.RGBAFormat,
  );
  texture.colorSpace = T.SRGBColorSpace;
  texture.magFilter = T.NearestFilter;
  texture.minFilter = T.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  const faceTexture = texture.clone();
  faceTexture.needsUpdate = true;
  let disposed = false,
    lastBlink = false;
  load(id)!
    .then(({ pixels, roles }) => {
      if (disposed) return;
      data.set(pixels);
      const overrides: Record<number, { from: number[]; to: number[] }> = {};
      for (const [role, n] of Object.entries(manifest.roles)) {
        const target = options[role as keyof typeof options];
        if (target && palette[role])
          overrides[n] = { from: rgb(palette[role]), to: rgb(target) };
      }
      for (let i = 0; i < data.length; i += 4) {
        const override = overrides[roles[i]];
        if (!override) continue;
        const shade = Math.max(
          0.45,
          Math.min(
            1.3,
            (data[i] + data[i + 1] + data[i + 2]) /
              Math.max(
                1,
                override.from.reduce((a, b) => a + b, 0),
              ),
          ),
        );
        for (let channel = 0; channel < 3; channel++)
          data[i + channel] = Math.min(
            255,
            Math.round(override.to[channel] * shade),
          );
      }
      // PNG rows are top-down; DataTexture UVs are bottom-up. Flip once after painting.
      const rowBytes = manifest.width * 4;
      const row = new Uint8Array(rowBytes);
      for (let y = 0; y < manifest.height / 2; y++) {
        const top = y * rowBytes,
          bottom = (manifest.height - 1 - y) * rowBytes;
        row.set(data.subarray(top, top + rowBytes));
        data.copyWithin(top, bottom, bottom + rowBytes);
        data.set(row, bottom);
      }
      texture.needsUpdate = true;
      faceTexture.needsUpdate = true;
    })
    .catch(() => {
      /* Keep a visible palette fallback if an export is missing. */
    });
  return {
    texture,
    faceTexture,
    palette,
    identity: id,
    setBlink(value: boolean) {
      if (lastBlink === value) return;
      lastBlink = value;
      faceTexture.offset.x = value ? (6 * 16) / manifest.width : 0;
    },
    dispose() {
      disposed = true;
      texture.dispose();
      faceTexture.dispose();
    },
  };
}
