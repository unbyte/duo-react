import { getDuoGeometry } from "../geometry"
import type { DuoPosture, DuoRect, DuoScreenInfo } from "../types"

export interface MaskRegion extends DuoRect {
  id: string
  name: string
  kind: "safe-area" | "top" | "right" | "bottom" | "left" | "occlusion" | "division" | "gap"
  scope: "window" | "display"
}

export function getMaskRegions(screen: DuoScreenInfo, cameraActive: boolean, posture: DuoPosture) {
  const { window: bounds, safeArea: inset } = screen
  const { x, y, width, height } = bounds
  const options = {
    display: screen.display,
    orientation: screen.orientation,
    cameraActive,
    posture,
  }
  const display = getDuoGeometry(options)
  const regions: MaskRegion[] = [
    {
      id: "safe-area",
      kind: "safe-area",
      name: "Safe area",
      scope: "window",
      x: x + inset.left,
      y: y + inset.top,
      width: width - inset.left - inset.right,
      height: height - inset.top - inset.bottom,
    },
    { id: "top", kind: "top", name: "Top inset", scope: "window", x, y, width, height: inset.top },
    {
      id: "right",
      kind: "right",
      name: "Right inset",
      scope: "window",
      x: x + width - inset.right,
      y,
      width: inset.right,
      height,
    },
    {
      id: "bottom",
      kind: "bottom",
      name: "Bottom inset",
      scope: "window",
      x,
      y: y + height - inset.bottom,
      width,
      height: inset.bottom,
    },
    {
      id: "left",
      kind: "left",
      name: "Left inset",
      scope: "window",
      x,
      y,
      width: inset.left,
      height,
    },
    ...display.reservedRegions.map((region) => ({
      ...region,
      id: `${region.type}-${region.x}-${region.y}-${region.width}-${region.height}`,
      name: region.type,
      kind: region.type,
      scope: "display" as const,
    })),
  ]
  if (screen.display === "inner" && screen.placement !== "full") {
    const left = getDuoGeometry({ ...options, placement: "left" }).window
    const right = getDuoGeometry({ ...options, placement: "right" }).window
    const gapStart = left.x + left.width
    regions.push({
      id: "split-gap",
      kind: "gap",
      name: "Split View gap",
      scope: "display",
      x: gapStart,
      y: 0,
      width: right.x - gapStart,
      height: screen.size.height,
    })
  }
  return regions.filter((region) => region.width > 0 && region.height > 0)
}

export function roundedBoundary(bounds: DuoRect, radii: DuoScreenInfo["cornerRadii"]) {
  const { x, y, width, height } = bounds
  const right = x + width
  const bottom = y + height
  const [tl, tr, br, bl] = radii
  return `M ${x + tl} ${y} H ${right - tr} A ${tr} ${tr} 0 0 1 ${right} ${y + tr}
    V ${bottom - br} A ${br} ${br} 0 0 1 ${right - br} ${bottom}
    H ${x + bl} A ${bl} ${bl} 0 0 1 ${x} ${bottom - bl}
    V ${y + tl} A ${tl} ${tl} 0 0 1 ${x + tl} ${y} Z`
}
