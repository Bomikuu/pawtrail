/** Shared editable face palette for human and feline rigs. */
export type FaceColors = { leftEye: string; rightEye: string; nose: string; marking: string }
export const FACE_STYLE_REVISION = 'noseless-dark-eyes-v1'
export const FACE_COLOR_KEYS = ['leftEye', 'rightEye', 'nose', 'marking'] as const
export const DEFAULT_CHARACTER_FACE: FaceColors = { leftEye: '#6b4b36', rightEye: '#6b4b36', nose: '#c28864', marking: '#3e2923' }
