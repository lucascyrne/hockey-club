/** 1 unit = 1 meter. Mesa no plano XZ, Y up. */
import { THEME } from '../theme/palette'

export const TABLE_WIDTH = 2
export const TABLE_DEPTH = 1
export const TABLE_SURFACE_THICKNESS = 0.02
export const TABLE_BORDER_HEIGHT = 0.085
export const TABLE_BORDER_THICKNESS = 0.05

export const AIR_HOLE_SPACING = 0.09
export const AIR_HOLE_RADIUS = 0.0028
export const AIR_HOLE_CENTER_EXCLUSION_X = 0.42
export const AIR_HOLE_CENTER_EXCLUSION_Z = 0.28

export const COLORS = {
  ...THEME.colors,
} as const

export const DEFAULT_CAMERA = {
  position: [0, 2.2, 1.8] as [number, number, number],
  fov: 48,
  near: 0.1,
  far: 50,
}
