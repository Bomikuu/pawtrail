import { normalizePaletteColor, SOFA_DEFAULT_COLOR } from './palette-color'

const key = 'pawtrail:sofa-upholstery:v1'

/** Authoring preference for new placements; existing room colors belong to the server. */
export function readSofaColor() {
  try { return normalizePaletteColor(localStorage.getItem(key) ?? SOFA_DEFAULT_COLOR) }
  catch { return SOFA_DEFAULT_COLOR }
}

export function saveSofaColor(value: string) {
  const color = normalizePaletteColor(value)
  localStorage.setItem(key, color)
  return color
}
