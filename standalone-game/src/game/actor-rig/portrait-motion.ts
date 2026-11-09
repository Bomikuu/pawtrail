export type PortraitBreathing = { periodMs: number; risePixels: number; torsoStartY: number; anchorRows: number }

/** Native RPG breathing: move intact head pixels, expand chest, anchor the bust. */
export function drawPortraitBreathing(source: HTMLCanvasElement, target: CanvasRenderingContext2D, time: number, profile: PortraitBreathing) {
  const { width, height } = source
  const phase = (time % profile.periodMs) / profile.periodMs
  const rise = phase >= 0.2 && phase < 0.65 ? Math.max(0, Math.round(profile.risePixels)) : 0
  target.clearRect(0, 0, width, height)
  target.imageSmoothingEnabled = false
  if (!rise) { target.drawImage(source, 0, 0); return }
  const torso = Math.max(rise + 1, Math.min(height - profile.anchorRows - 1, profile.torsoStartY))
  const anchored = Math.max(1, Math.min(height - torso - 1, profile.anchorRows))
  const chest = height - anchored - torso
  target.drawImage(source, 0, 0, width, torso, 0, -rise, width, torso)
  target.drawImage(source, 0, torso, width, chest, 0, torso - rise, width, chest + rise)
  target.drawImage(source, 0, height - anchored, width, anchored, 0, height - anchored, width, anchored)
}
