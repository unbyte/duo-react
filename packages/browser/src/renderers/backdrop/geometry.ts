import type { DuoRect, DuoSize } from '@private/profiles'

export function sameRect(a: DuoRect, b: DuoRect) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}

export function paddedRegion(area: DuoRect, padding: number, size: DuoSize) {
  const x = Math.max(0, Math.floor(area.x - padding))
  const y = Math.max(0, Math.floor(area.y - padding))
  const right = Math.min(size.width, Math.ceil(area.x + area.width + padding))
  const bottom = Math.min(size.height, Math.ceil(area.y + area.height + padding))
  if (right <= x || bottom <= y) return
  return { x, y, width: right - x, height: bottom - y }
}
