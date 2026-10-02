import { getSystemLayout } from "./system-layout";
import type { DuoScreenInfo } from "./types";

// The guide defines edge placement, not these gaps. The 84px rail follows the
// measured side inset; Split View's left rail uses the same width by convention.
const edgeGap = 16;
const railWidth = 84;

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
  const width = Math.max(safeArea[side], railWidth);
  const railLeft = side === "left" ? 0 : window.width - width;
  const railRight = railLeft + width;
  let top = edgeGap;
  let bottom = Math.max(edgeGap, safeArea.bottom);
  const status = getSystemLayout(screen).status;
  const obstacles = [
    ...screen.reservedRegions,
    { ...status, x: status.x - window.x, y: status.y - window.y },
  ];
  for (const region of obstacles) {
    if (region.x >= railRight || region.x + region.width <= railLeft) continue;
    if (region.y + region.height / 2 < window.height / 2)
      top = Math.max(top, region.y + region.height + edgeGap);
    else bottom = Math.max(bottom, window.height - region.y + edgeGap);
  }
  return {
    side,
    left: railLeft + edgeGap,
    right: window.width - railRight + edgeGap,
    top,
    bottom,
  } as const;
}
