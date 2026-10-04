import type { DuoZoom } from "./types"

export function validateZoom(zoom: DuoZoom) {
  if (zoom !== "fit" && (typeof zoom !== "number" || !Number.isFinite(zoom) || zoom <= 0)) {
    throw new RangeError('Duo zoom must be "fit" or a positive finite number.')
  }
}

export function resolveZoom(
  zoom: DuoZoom,
  container: { width: number; height: number },
  device: { width: number; height: number },
  padding = 24,
) {
  validateZoom(zoom)
  if (container.width <= 0 || container.height <= 0) return 0
  return zoom === "fit"
    ? Math.max(
        0,
        Math.min(
          (container.width - padding * 2) / device.width,
          (container.height - padding * 2) / device.height,
        ),
      )
    : zoom
}
