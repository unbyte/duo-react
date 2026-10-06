import type { DuoRect } from "../core/types"

export function sameRect(a: DuoRect, b: DuoRect) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}

export function paddedRegion(
  area: DuoRect,
  padding: number,
  size: { width: number; height: number },
) {
  const x = Math.max(0, Math.floor(area.x - padding))
  const y = Math.max(0, Math.floor(area.y - padding))
  const right = Math.min(size.width, Math.ceil(area.x + area.width + padding))
  const bottom = Math.min(size.height, Math.ceil(area.y + area.height + padding))
  if (right <= x || bottom <= y) return
  return { x, y, width: right - x, height: bottom - y }
}

export function samePixels(a: Uint8ClampedArray, b: Uint8ClampedArray) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

export async function blur(canvas: HTMLCanvasElement, radius: number) {
  const output = document.createElement("canvas")
  output.width = canvas.width
  output.height = canvas.height
  const context = output.getContext("2d")!
  // Extend the source edges so a blur near a display boundary stays opaque.
  const padding = Math.ceil(radius * 3)
  const padded = document.createElement("canvas")
  padded.width = canvas.width + padding * 2
  padded.height = canvas.height + padding * 2
  const p = padded.getContext("2d")!
  p.drawImage(canvas, padding, padding)
  p.drawImage(canvas, 0, 0, canvas.width, 1, padding, 0, canvas.width, padding)
  p.drawImage(
    canvas,
    0,
    canvas.height - 1,
    canvas.width,
    1,
    padding,
    padding + canvas.height,
    canvas.width,
    padding,
  )
  p.drawImage(padded, padding, 0, 1, padded.height, 0, 0, padding, padded.height)
  p.drawImage(
    padded,
    padding + canvas.width - 1,
    0,
    1,
    padded.height,
    padding + canvas.width,
    0,
    padding,
    padded.height,
  )
  // SVG filters work in WebKit too, where CanvasRenderingContext2D.filter is absent.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="${padding} ${padding} ${canvas.width} ${canvas.height}"><defs><filter id="blur" filterUnits="userSpaceOnUse" x="0" y="0" width="${padded.width}" height="${padded.height}" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${radius}" /></filter></defs><image width="${padded.width}" height="${padded.height}" href="${padded.toDataURL()}" filter="url(#blur)" /></svg>`
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await image.decode()
  context.drawImage(image, 0, 0)
  return output
}

/** Offset-parent coordinates exclude the frame's presentation zoom and rotation. */
export function backdropOrigin(element: HTMLElement) {
  let x = 0
  let y = 0
  let current: HTMLElement | null = element
  while (current && !current.classList.contains("duo-screen")) {
    x += current.offsetLeft
    y += current.offsetTop
    current = current.offsetParent as HTMLElement | null
  }
  return { x, y }
}
