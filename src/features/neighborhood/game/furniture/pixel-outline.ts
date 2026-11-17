/** Character-matched one-native-pixel contour without recoloring painted art.
 * Apply once to the furniture layer, before adding separately finished actors.
 */
export function furnitureOutline(source: ImageData) {
  const { width, height, data } = source
  const result = new ImageData(width, height), output = result.data
  output.set(data)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const at = (y * width + x) * 4
    if (data[at + 3] >= 128) continue
    let adjacent = false
    for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1) && !adjacent; yy++) {
      for (let xx = Math.max(0, x - 1); xx <= Math.min(width - 1, x + 1); xx++) {
        if (data[(yy * width + xx) * 4 + 3] >= 128) { adjacent = true; break }
      }
    }
    if (!adjacent) continue
    const lit = x + 1 < width && data[at + 7] >= 128 || y + 1 < height && data[at + width * 4 + 3] >= 128
    output.set(lit ? [58, 38, 29, 255] : [42, 28, 23, 255], at)
  }
  return result
}
