function srgb(v: number) { return Math.max(0, Math.min(255, Math.round((v <= .0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - .055) * 255))) }
function linear(v: number) { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }

/** Exact palette matching with a fixed 256 KiB cache, including on animated full scenes. */
export class PixelFinish {
  private colors: number[][] = []
  private keys = new Int32Array(32768).fill(-1)
  private indices = new Uint32Array(32768)
  get cacheByteLength() { return this.keys.byteLength + this.indices.byteLength }
  constructor(palette: string[]) {
    const unique = new Map<string, number[]>()
    for (const hex of palette) for (const shade of [.68, .84, 1, 1.08]) {
      const color = [1, 3, 5].map(i => srgb(linear(parseInt(hex.slice(i, i + 2), 16)) * shade))
      unique.set(color.join(','), color)
    }
    for (const color of [[42, 28, 23], [58, 38, 29]]) unique.set(color.join(','), color)
    this.colors = [...unique.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])
  }
  finish(source: ImageData, contour = 1, preserveAlpha = false) {
    // Actor frame caches require independent results. Reuse is opt-in for live viewports.
    return this.finishInto(source, new ImageData(source.width, source.height), contour, preserveAlpha)
  }
  finishInto(source: ImageData, output: ImageData, contour = 1, preserveAlpha = false) {
    if (source.width !== output.width || source.height !== output.height || source.data === output.data) throw new Error('Pixel finishing needs a separate output buffer of matching size.')
    const { width: w, height: h, data: s } = source, d = output.data
    const radius = Math.max(1, Math.min(2, Math.round(contour)))
    d.fill(0)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (s[i + 3] >= (preserveAlpha ? 32 : 128)) {
        const key = s[i] * 65536 + s[i + 1] * 256 + s[i + 2]
        const slot = Math.imul(key, 0x9e3779b1) >>> 17
        let index = this.indices[slot]
        if (this.keys[slot] !== key) {
          let best = Infinity; index = 0
          for (let n = 0; n < this.colors.length; n++) {
            const color = this.colors[n], distance = (color[0] - s[i]) ** 2 + (color[1] - s[i + 1]) ** 2 + (color[2] - s[i + 2]) ** 2
            if (distance < best) { best = distance; index = n }
          }
          this.keys[slot] = key; this.indices[slot] = index
        }
        const color = this.colors[index]
        d[i] = color[0]; d[i + 1] = color[1]; d[i + 2] = color[2]; d[i + 3] = preserveAlpha ? s[i + 3] : 255
      } else {
        let adjacent = false
        for (let ny = Math.max(0, y - radius); ny <= Math.min(h - 1, y + radius) && !adjacent; ny++) for (let nx = Math.max(0, x - radius); nx <= Math.min(w - 1, x + radius); nx++) if (s[(ny * w + nx) * 4 + 3] >= 128) { adjacent = true; break }
        if (adjacent) {
          const lit = (x + 1 < w && s[i + 7] >= 128) || (y + 1 < h && s[i + w * 4 + 3] >= 128)
          d[i] = lit ? 58 : 42; d[i + 1] = lit ? 38 : 28; d[i + 2] = lit ? 29 : 23; d[i + 3] = 255
        }
      }
    }
    return output
  }
}
