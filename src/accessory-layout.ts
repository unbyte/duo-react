import { getSystemLayout } from "./system-layout";
import { sideControlMetrics } from "./control-metrics";
import type { DuoScreenInfo } from "./types";

const { edgeInset: sideInset, width: controlWidth } = sideControlMetrics;
const edgeGap = 16;

export function getAccessoryLayout(screen: DuoScreenInfo) {
  const { window, safeArea, placement } = screen;
  const horizontal = screen.display === "inner" && screen.orientation.startsWith("portrait");
  if (horizontal) {
    return {
      side: "horizontal" as const,
      left: edgeGap,
      right: edgeGap,
      top: safeArea.top + edgeGap,
      bottom: Math.max(edgeGap, safeArea.bottom),
    };
  }
  const side = placement === "left" || safeArea.left > 0 ? "left" : "right";
  const railLeft = side === "left" ? sideInset : window.width - sideInset - controlWidth;
  const railRight = railLeft + controlWidth;
  const inner = screen.display === "inner";
  let top = inner ? sideControlMetrics.innerTop : edgeGap;
  let bottom = Math.max(edgeGap, safeArea.bottom);
  const displayStatus = getSystemLayout(screen).status;
  const status = { ...displayStatus, x: displayStatus.x - window.x, y: displayStatus.y - window.y };
  // Inner status reservations include their clearance. Adding the physical
  // obstacle gap again moves the toolbar below its position in Apple's images.
  const obstacles = [
    ...screen.reservedRegions.map((region) => ({
      ...region,
      gap:
        inner &&
        region.x <= status.x &&
        region.y <= status.y &&
        region.x + region.width >= status.x + status.width &&
        region.y + region.height >= status.y + status.height
          ? 0
          : edgeGap,
    })),
    { ...status, gap: edgeGap },
  ];
  for (const region of obstacles) {
    if (region.x >= railRight || region.x + region.width <= railLeft) continue;
    if (region.y + region.height / 2 < window.height / 2)
      top = Math.max(top, region.y + region.height + region.gap);
    else bottom = Math.max(bottom, window.height - region.y + region.gap);
  }
  return {
    side,
    left: railLeft,
    right: window.width - railRight,
    top,
    bottom,
  } as const;
}
