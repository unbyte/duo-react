import { sideControlMetrics } from "./control-metrics";
import { getDuoGeometry } from "../geometry";
import type { DuoRect, DuoScreenInfo } from "../types";

// Reference-image pixels mapped to app CSS pixels using the provisional camera cutout.
// This matches the supplied crop's proportions, not a confirmed physical-hole measurement.
const referenceScale = 37 / 94;
export const systemMetrics = {
  glyphWidth: 104 * referenceScale,
  glyphHeight: 108 * referenceScale,
  timeWidth: 44,
  fontSize: 16,
  lineHeight: 20,
  gap: 7,
  top: 24,
  cameraGap: 18,
  materialEndPadding: 8,
  materialSidePadding: 5,
  homeWidth: 120,
  homeHeight: 5,
  homeBottom: 7,
  dividerWidth: 4,
  dividerHeight: 48,
} as const;

export function getSystemLayout(screen: DuoScreenInfo) {
  const display = getDuoGeometry({ display: screen.display, orientation: screen.orientation });
  const { safeArea, size, reservedRegions } = display;
  const metrics = systemMetrics;
  const camera =
    screen.display === "outer"
      ? reservedRegions.find(
          (region) => region.type === "occlusion" && region.width === region.height,
        )
      : undefined;
  const horizontal = safeArea.top > 0;
  let status: DuoRect;

  if (horizontal) {
    const region = reservedRegions.find((entry) => entry.y === 0 && entry.height === safeArea.top);
    if (!region) throw new Error("Missing measured top status region.");
    const width = metrics.timeWidth + metrics.gap + metrics.glyphWidth;
    status = {
      x: region.x + (region.width - width) / 2,
      y: region.y + (region.height - metrics.glyphHeight) / 2,
      width,
      height: metrics.glyphHeight,
    };
  } else {
    const height = metrics.lineHeight + metrics.gap + metrics.glyphHeight;
    const center = camera
      ? camera.x + camera.width / 2
      : size.width - sideControlMetrics.edgeInset - sideControlMetrics.width / 2;
    const top = camera
      ? camera.y < size.height / 2
        ? camera.y + camera.height + metrics.cameraGap
        : camera.y - metrics.cameraGap - height
      : screen.display === "inner"
        ? sideControlMetrics.innerStatusTop
        : metrics.top;
    status = {
      x: center - metrics.timeWidth / 2,
      y: top,
      width: metrics.timeWidth,
      height,
    };
  }

  const left = Math.min(status.x, camera?.x ?? status.x);
  const top = Math.min(status.y, camera?.y ?? status.y);
  const right = Math.max(status.x + status.width, camera ? camera.x + camera.width : 0);
  const bottom = Math.max(status.y + status.height, camera ? camera.y + camera.height : 0);
  const paddingX = horizontal ? metrics.materialEndPadding : metrics.materialSidePadding;
  const paddingY = horizontal ? metrics.materialSidePadding : metrics.materialEndPadding;

  return {
    camera,
    status,
    horizontal,
    material: {
      x: left - paddingX,
      y: top - paddingY,
      width: right - left + paddingX * 2,
      height: bottom - top + paddingY * 2,
    },
    divider:
      screen.display === "inner" && screen.placement !== "full"
        ? {
            x: (size.width - metrics.dividerWidth) / 2,
            y: (size.height - metrics.dividerHeight) / 2,
            width: metrics.dividerWidth,
            height: metrics.dividerHeight,
          }
        : undefined,
    home: {
      x: screen.window.x + (screen.window.width - metrics.homeWidth) / 2,
      y: screen.window.y + screen.window.height - metrics.homeBottom - metrics.homeHeight,
      width: metrics.homeWidth,
      height: metrics.homeHeight,
    },
  };
}
