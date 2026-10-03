import { getSystemLayout } from "./system-layout";
import type { DuoScreenInfo } from "./types";

// HIG images place the control axis about 48 logical pixels from the edge,
// with approximately 48px controls. See docs/calibration/app-bars.md.
const sideInset = 24;
const controlWidth = 48;
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
    left: railLeft,
    right: window.width - railRight,
    top,
    bottom,
  } as const;
}
