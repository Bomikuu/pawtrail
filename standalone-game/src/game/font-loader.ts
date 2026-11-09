let fontsReady: Promise<unknown> | null = null
/** Load in parallel with Phaser so canvas labels use the same self-hosted faces. */
export function loadGameFonts() {
  if (typeof document === 'undefined' || !document.fonts)
    return Promise.resolve()
  fontsReady ??= Promise.allSettled([
    document.fonts.load('400 12px "Saira Condensed"'),
    document.fonts.load('700 12px "Saira Condensed"'),
    document.fonts.load('400 12px "Instrument Sans"'),
  ])
  return fontsReady
}
