import { sideControlMetrics } from "./control-metrics"
import { getDuoGeometry } from "../geometry"
import type { DuoRect, DuoScreenInfo } from "../types"

// Reference-image pixels mapped to app CSS pixels using the provisional camera cutout.
// This matches the supplied crop's proportions, not a confirmed physical-hole measurement.
const referenceScale = 37 / 94
export const systemMetrics = {
  glyphWidth: 104 * referenceScale,
  glyphHeight: 108 * referenceScale,
  glyphTopPadding: 1.25 * referenceScale,
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
} as const

export function getSystemLayout(screen: DuoScreenInfo) {
  const display = getDuoGeometry({ display: screen.display, orientation: screen.orientation })
  const { safeArea, size, reservedRegions } = display
  const metrics = systemMetrics
  const camera =
    screen.display === "outer"
      ? reservedRegions.find(
          (region) => region.type === "occlusion" && region.width === region.height,
        )
      : undefined
  const horizontal = safeArea.top > 0
  let time: DuoRect
  let glyph: DuoRect

  if (horizontal) {
    // iOS 27.1, 669 × 951: clock ink center (569.67, 48.33),
    // combined indicator ink bounds (601, 27.67, 41, 41.33).
    time = {
      x: size.width - 99.5 - metrics.timeWidth / 2,
      y: 48 + 1 / 3 - metrics.lineHeight / 2,
      width: metrics.timeWidth,
      height: metrics.lineHeight,
    }
    glyph = {
      x: size.width - 47.5 - metrics.glyphWidth / 2,
      y: 27 + 2 / 3 - metrics.glyphTopPadding,
      width: metrics.glyphWidth,
      height: metrics.glyphHeight,
    }
  } else {
    const calibrated = screen.display === "inner" || screen.orientation === "portrait"
    const height = metrics.lineHeight + metrics.gap + metrics.glyphHeight
    const sideCenter = size.width - sideControlMetrics.edgeInset - sideControlMetrics.width / 2
    const center = calibrated ? sideCenter : camera ? camera.x + camera.width / 2 : sideCenter
    // Explicitly shown outer-landscape status retains the provisional camera-relative layout.
    const fallbackTop = camera
      ? camera.y < size.height / 2
        ? camera.y + camera.height + metrics.cameraGap
        : camera.y - metrics.cameraGap - height
      : metrics.top
    const inner = screen.display === "inner"
    time = {
      x: center - metrics.timeWidth / 2,
      y: calibrated ? (inner ? 30 : 82 + 2 / 3) : fallbackTop,
      width: metrics.timeWidth,
      height: metrics.lineHeight,
    }
    // Native ink starts at y = 57 (inner) or 109.67 (outer); SVG padding
    // is separate from that measured coordinate. Artwork size stays unchanged.
    glyph = {
      x: center + (calibrated ? 1 / 6 : 0) - metrics.glyphWidth / 2,
      y: calibrated
        ? (inner ? 57 : 109 + 2 / 3) - metrics.glyphTopPadding
        : fallbackTop + metrics.lineHeight + metrics.gap,
      width: metrics.glyphWidth,
      height: metrics.glyphHeight,
    }
  }

  const status: DuoRect = {
    x: Math.min(time.x, glyph.x),
    y: Math.min(time.y, glyph.y),
    width: Math.max(time.x + time.width, glyph.x + glyph.width) - Math.min(time.x, glyph.x),
    height: Math.max(time.y + time.height, glyph.y + glyph.height) - Math.min(time.y, glyph.y),
  }

  const left = Math.min(status.x, camera?.x ?? status.x)
  const top = Math.min(status.y, camera?.y ?? status.y)
  const right = Math.max(status.x + status.width, camera ? camera.x + camera.width : 0)
  const bottom = Math.max(status.y + status.height, camera ? camera.y + camera.height : 0)
  const paddingX = horizontal ? metrics.materialEndPadding : metrics.materialSidePadding
  const paddingY = horizontal ? metrics.materialSidePadding : metrics.materialEndPadding

  return {
    camera,
    status,
    time,
    glyph,
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
  }
}
