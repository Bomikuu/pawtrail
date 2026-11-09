let zoom: number | undefined;
export function worldZoom(width = window.innerWidth) {
  if (zoom !== undefined) return zoom;
  try {
    const saved = Number(localStorage.getItem("pawtrail:world-zoom"));
    if (Number.isInteger(saved) && saved >= 1 && saved <= 4)
      return (zoom = saved);
  } catch {}
  return (zoom = width < 720 ? 1 : 2);
}
export function setWorldZoom(value: number) {
  zoom = Math.max(1, Math.min(4, Math.round(value)));
  try {
    localStorage.setItem("pawtrail:world-zoom", String(zoom));
  } catch {}
  return zoom;
}
