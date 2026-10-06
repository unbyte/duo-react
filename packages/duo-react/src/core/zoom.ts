import type { DuoFitPadding, DuoZoom } from "./types"

export function validateZoom(zoom: DuoZoom) {
  if (zoom !== "fit" && (typeof zoom !== "number" || !Number.isFinite(zoom) || zoom <= 0)) {
    throw new RangeError('Duo zoom must be "fit" or a positive finite number.')
  }
}

export function resolveFitPadding(padding: DuoFitPadding = 24) {
  const insets =
    typeof padding === "number"
      ? { top: padding, right: padding, bottom: padding, left: padding }
      : {
          top: padding.top ?? 24,
          right: padding.right ?? 24,
          bottom: padding.bottom ?? 24,
          left: padding.left ?? 24,
        }
  if (Object.values(insets).some((value) => !Number.isFinite(value) || value < 0))
    throw new RangeError("fitPadding sides must be nonnegative finite numbers.")
  return insets
}

export function resolveZoom(
  zoom: DuoZoom,
  container: { width: number; height: number },
  device: { width: number; height: number },
  padding: DuoFitPadding = 24,
) {
  validateZoom(zoom)
  const { top, right, bottom, left } = resolveFitPadding(padding)
  if (container.width <= 0 || container.height <= 0) return 0
  return zoom === "fit"
    ? Math.max(
        0,
        Math.min(
          (container.width - left - right) / device.width,
          (container.height - top - bottom) / device.height,
        ),
      )
    : zoom
}
