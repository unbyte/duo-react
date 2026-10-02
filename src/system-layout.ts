import { getDuoGeometry } from "./geometry";
import type { DuoRect, DuoScreenInfo } from "./types";

// Artwork sizes are app CSS pixels; only the camera bounds come from measured regions.
export const systemMetrics = {
  glyphWidth: 44,
  glyphHeight: 52,
  timeWidth: 44,
  fontSize: 16,
  lineHeight: 20,
  gap: 6,
  top: 24,
  cameraGap: 8,
  homeWidth: 120,
  homeHeight: 5,
  homeBottom: 7,
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
    const center = camera
      ? camera.x + camera.width / 2
      : safeArea.left > 0
        ? safeArea.left / 2
        : size.width - safeArea.right / 2;
    const top =
      camera && camera.y < size.height / 2
        ? camera.y + camera.height + metrics.cameraGap
        : metrics.top;
    status = {
      x: center - metrics.glyphWidth / 2,
      y: top,
      width: metrics.glyphWidth,
      height: metrics.lineHeight + metrics.gap + metrics.glyphHeight,
    };
  }

  return {
    camera,
    status,
    horizontal,
    home: {
      x: screen.window.x + (screen.window.width - metrics.homeWidth) / 2,
      y: screen.window.y + screen.window.height - metrics.homeBottom - metrics.homeHeight,
      width: metrics.homeWidth,
      height: metrics.homeHeight,
    },
  };
}
