import type { DuoOrientation } from "./types"

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

function nearestRotation(rotation: number, target: number) {
  return target + Math.round((rotation - target) / 360) * 360
}

export function rotationStart(current: number, previousTarget: number, target: number) {
  // Rebase unfinished motion into the new target's turn, preserving its direction
  // across zero without accumulating full revolutions in the animation either.
  return target + ((current - nearestRotation(previousTarget, target)) % 360)
}

export function rotatedSize(size: { width: number; height: number }, rotation: number) {
  const radians = ((rotation % 360) * Math.PI) / 180
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  return {
    width: size.width * cos + size.height * sin,
    height: size.width * sin + size.height * cos,
  }
}
