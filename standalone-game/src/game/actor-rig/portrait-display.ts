/** Fit visible artwork at integer zoom; transparent margins may extend offstage. */
export function fitPortraitDisplay(viewportWidth: number, viewportHeight: number, size: number[], bounds?: number[],smooth=false) {
  const [width, height] = size
  const valid = bounds?.length === 4 && bounds.every(Number.isFinite)
    && bounds[0] >= 0 && bounds[1] >= 0 && bounds[2] > 0 && bounds[3] > 0
    && bounds[0] + bounds[2] <= width && bounds[1] + bounds[3] <= height
  const [x, y, visibleWidth, visibleHeight] = valid ? bounds! : [0, 0, width, height]
  const fit=Math.min(viewportWidth / visibleWidth,viewportHeight / visibleHeight)
  const zoom = smooth?Math.max(.25,fit):Math.max(1,Math.floor(fit))
  return {
    width: width * zoom,
    height: height * zoom,
    left: Math.floor((viewportWidth - visibleWidth * zoom) / 2) - x * zoom,
    bottom: -(height - y - visibleHeight) * zoom,
    imageRendering:smooth?'auto' as const:'pixelated' as const,
  }
}
