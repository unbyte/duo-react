import { getSystemLayout } from "./system"
import { sideControlMetrics } from "./control-metrics"
import type { DuoScreenInfo } from "../types"

const { edgeInset: sideInset, width: controlWidth } = sideControlMetrics
const edgeGap = 16

export function getAccessoryLayout(screen: DuoScreenInfo) {
  const { window, safeArea, placement } = screen
  const horizontal = screen.display === "inner" && screen.orientation.startsWith("portrait")
  if (horizontal) {
    const statusRegion = screen.reservedRegions.find(
      (region) => region.y === 0 && region.height === safeArea.top,
    )
    return {
      side: "horizontal" as const,
      left: 20,
      right: 20,
      top: 24,
      bottom: 21,
      toolbarEndInset: Math.max(0, window.width - (statusRegion?.x ?? window.width) - 20),
    }
  }
  const side = placement === "left" || safeArea.left > 0 ? "left" : "right"
  const railLeft = side === "left" ? sideInset : window.width - sideInset - controlWidth
  const railRight = railLeft + controlWidth
  const inner = screen.display === "inner"
  let top = inner ? sideControlMetrics.innerTop : edgeGap
  const calibrated = inner || screen.orientation === "portrait"
  let bottom = calibrated && placement === "full" ? 24 : Math.max(edgeGap, safeArea.bottom)
  const displayStatus = getSystemLayout(screen).status
  const status = { ...displayStatus, x: displayStatus.x - window.x, y: displayStatus.y - window.y }
  // The measured status reservations include clearance: inner y = 120,
  // outer portrait y = 170. Physical camera obstacles still need a gap.
  const obstacles = [
    ...screen.reservedRegions.map((region) => ({
      ...region,
      gap:
        calibrated &&
        region.x <= status.x &&
        region.y <= status.y &&
        region.x + region.width >= status.x + status.width &&
        region.y + region.height >= status.y + status.height
          ? 0
          : edgeGap,
    })),
    { ...status, gap: edgeGap },
  ]
  for (const region of obstacles) {
    if (region.x >= railRight || region.x + region.width <= railLeft) continue
    if (region.y + region.height / 2 < window.height / 2)
      top = Math.max(top, region.y + region.height + region.gap)
    else bottom = Math.max(bottom, window.height - region.y + region.gap)
  }
  return {
    side,
    left: railLeft,
    right: window.width - railRight,
    top,
    bottom,
    toolbarEndInset: 0,
  } as const
}
