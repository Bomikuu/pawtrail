/** Selection zoom and camera space for floating panels; the canvas stays full width. */
export const SELECTED_ITEM_ZOOM = 16

export function discoveryPadding(
  width: number,
  height: number,
  wide: boolean,
  detail: boolean,
  sidebarOpen: boolean,
) {
  return {
    top: wide ? 112 : Math.min(288, height * 0.4),
    left:
      wide && sidebarOpen
        ? Math.min(388, width * 0.34)
        : Math.min(100, width * 0.25),
    right:
      wide && detail
        ? Math.min(512, width * 0.45)
        : Math.min(100, width * 0.25),
    bottom: detail && !wide ? Math.min(360, height * 0.4) : 80,
  }
}
