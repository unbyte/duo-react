import type { DuoRect } from "../core/types"

export function sameRect(a: DuoRect, b: DuoRect) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}

export function paddedRegion(
  area: DuoRect,
  padding: number,
  size: { width: number; height: number },
) {
  const x = Math.max(0, Math.floor(area.x - padding))
  const y = Math.max(0, Math.floor(area.y - padding))
  const right = Math.min(size.width, Math.ceil(area.x + area.width + padding))
  const bottom = Math.min(size.height, Math.ceil(area.y + area.height + padding))
  if (right <= x || bottom <= y) return
  return { x, y, width: right - x, height: bottom - y }
}

export function samePixels(a: Uint8ClampedArray, b: Uint8ClampedArray) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}
