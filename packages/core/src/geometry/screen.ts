import {
  foldingRegions,
  geometryProfiles,
  splitWindowRadius,
  type DuoPosture,
} from "@duo-react/profiles"
import type { DuoGeometryOptions, DuoScreenInfo } from "./types"

export function getDuoGeometry({
  display,
  orientation,
  placement = "full",
  cameraActive = false,
  posture = "open",
}: DuoGeometryOptions): Omit<DuoScreenInfo, "visible"> {
  validatePosture(posture)
  const profile = geometryProfiles.find(
    (entry) =>
      entry.display === display &&
      entry.orientation === orientation &&
      entry.placement === placement &&
      entry.cameraActive === (display === "inner" && cameraActive),
  )
  if (!profile)
    throw new RangeError(`No measured Duo profile for ${display}/${orientation}/${placement}.`)
  // Outer profiles store radii in portrait order even in landscape.
  // Rotate them into the same oriented coordinates as the screen and camera.
  const [topLeft, topRight, bottomRight, bottomLeft] = profile.cornerRadii
  const cornerRadii: DuoScreenInfo["cornerRadii"] =
    display === "outer" && orientation === "landscape-left"
      ? [bottomLeft, topLeft, topRight, bottomRight]
      : display === "outer" && orientation === "landscape-right"
        ? [topRight, bottomRight, bottomLeft, topLeft]
        : [...profile.cornerRadii]
  const windowCornerRadii: DuoScreenInfo["windowCornerRadii"] =
    placement === "left"
      ? [cornerRadii[0], splitWindowRadius, splitWindowRadius, cornerRadii[3]]
      : placement === "right"
        ? [splitWindowRadius, cornerRadii[1], cornerRadii[2], splitWindowRadius]
        : [...cornerRadii]
  const fold = display === "inner" ? foldingRegions[orientation] : undefined
  const active = posture === "partially-open"
  const reservedRegions = profile.reservedRegions.map((region) => Object.freeze({ ...region }))
  if (fold && active) {
    const bounds = profile.window
    const x = Math.max(fold.frame.x, bounds.x)
    const y = Math.max(fold.frame.y, bounds.y)
    const width = Math.min(fold.frame.x + fold.frame.width, bounds.x + bounds.width) - x
    const height = Math.min(fold.frame.y + fold.frame.height, bounds.y + bounds.height) - y
    if (width > 0 && height > 0) {
      reservedRegions.push(
        Object.freeze({ type: "division", x: x - bounds.x, y: y - bounds.y, width, height }),
      )
    }
  }
  return {
    display,
    orientation,
    placement,
    statusBarVisible: display === "inner" || orientation === "portrait",
    size: Object.freeze({ ...profile.size }),
    window: Object.freeze({ ...profile.window }),
    safeArea: Object.freeze({ ...profile.safeArea }),
    cornerRadii: Object.freeze(cornerRadii),
    windowCornerRadii: Object.freeze(windowCornerRadii),
    foldingRegion: fold
      ? Object.freeze({
          ...fold,
          active,
          frame: Object.freeze({ ...fold.frame }),
          margins: Object.freeze({ ...fold.margins }),
        })
      : undefined,
    reservedRegions: Object.freeze(reservedRegions),
  }
}

export function validatePosture(posture: DuoPosture) {
  if (posture !== "open" && posture !== "closed" && posture !== "partially-open")
    throw new RangeError("Unsupported Duo posture.")
}
