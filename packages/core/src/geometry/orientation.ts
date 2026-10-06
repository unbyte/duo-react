import type { DuoOrientation } from "@duo-react/profiles"

export const orientationRotation: Record<DuoOrientation, number> = {
  portrait: 0,
  "landscape-left": 90,
  "portrait-upside-down": 180,
  "landscape-right": 270,
}

export function normalizeRotation(rotation: number) {
  return ((rotation % 360) + 360) % 360
}

export function orientationAtRotation(rotation: number): DuoOrientation {
  const index = normalizeRotation(rotation) / 90
  return (["portrait", "landscape-left", "portrait-upside-down", "landscape-right"] as const)[index]
}
