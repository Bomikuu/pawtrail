export const PORTRAIT_EXPRESSIONS = ['idle', 'smile', 'happy', 'talking'] as const
export type PortraitExpression = typeof PORTRAIT_EXPRESSIONS[number] | 'sad' | 'angry' | 'surprised'
export type PortraitView = {
  yaw: number
  expression: PortraitExpression
  talking?: boolean
  steady?: boolean
  headTilt?: number
  pose?: import('./photo-portrait-catalog').PhotoPortraitPose
  blink?: import('./photo-portrait-catalog').PortraitBlink
  mouth?: import('./photo-portrait-catalog').PortraitMouth
  breathing?: boolean
}
export const defaultPortraitView: PortraitView = { yaw: 0, expression: 'idle' }
export const portraitYaw = (yaw: number) => Number.isFinite(yaw) ? Math.atan2(Math.sin(yaw), Math.cos(yaw)) : 0
