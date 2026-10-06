import type { DuoDisplay, DuoOrientation } from './types'

export const frameBezel = { inner: 18, outer: 12 } as const
// Clearance includes the projected buttons and folded body beyond the bezel.
export const frameOutset = { inner: frameBezel.inner + 3, outer: frameBezel.outer + 12 } as const

// Projected button silhouettes measured against a 951 × 669 display;
// physical thickness is unknown.
const innerButtons = [
  { name: 'volume-left', x: 698, y: -21, width: 64, height: 4 },
  { name: 'volume-right', x: 778, y: -21, width: 64, height: 4 },
  { name: 'side', x: 968, y: 186, width: 4, height: 108 },
] as const

// Folded positions use measured mesh projections; protrusion follows the CSS rim.
const outerButtons = [
  { name: 'volume-left', x: 210, y: -15, width: 64, height: 4 },
  { name: 'volume-right', x: 291, y: -15, width: 64, height: 4 },
  { name: 'side', x: 477, y: 186, width: 4, height: 110 },
] as const

export const hardwareRotation: Record<DuoDisplay, Record<DuoOrientation, number>> = {
  inner: { 'landscape-left': 0, 'landscape-right': 180, portrait: -90, 'portrait-upside-down': 90 },
  outer: { 'landscape-left': 90, 'landscape-right': -90, portrait: 0, 'portrait-upside-down': 180 },
}

export const hardwareProfiles = {
  inner: { width: 951, height: 669, buttons: innerButtons },
  outer: { width: 466, height: 678, buttons: outerButtons },
} as const
