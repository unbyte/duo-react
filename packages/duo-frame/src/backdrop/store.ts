import type { DuoRect, DuoScreenInfo } from "../core/types"
import { getSystemLayout } from "../core/layout/system"
import { chooseIndicatorStyle, type ResolvedIndicatorStyle } from "./contrast"

export type IndicatorSample = "time" | "glyph" | "home"
export interface BackdropFrame {
  readonly canvas: HTMLCanvasElement
  readonly tabBlur: HTMLCanvasElement
  readonly statusBlur: HTMLCanvasElement
  readonly width: number
  readonly height: number
}
export interface BackdropSnapshot {
  readonly frame?: BackdropFrame
  readonly colors: Readonly<Record<IndicatorSample, ResolvedIndicatorStyle>>
}

const initial: BackdropSnapshot = { colors: { time: "dark", glyph: "dark", home: "dark" } }

export function createBackdropStore() {
  let snapshot = initial
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initial,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    publish: (next: BackdropSnapshot) => {
      snapshot = next
      listeners.forEach((listener) => listener())
    },
  }
}
export type BackdropStore = ReturnType<typeof createBackdropStore>

export function sampleRect(
  canvas: HTMLCanvasElement,
  area: DuoRect,
  width: number,
  height: number,
) {
  const x = Math.max(0, Math.floor((area.x * canvas.width) / width))
  const y = Math.max(0, Math.floor((area.y * canvas.height) / height))
  const right = Math.min(canvas.width, Math.ceil(((area.x + area.width) * canvas.width) / width))
  const bottom = Math.min(
    canvas.height,
    Math.ceil(((area.y + area.height) * canvas.height) / height),
  )
  if (right <= x || bottom <= y) return
  const sample = document.createElement("canvas")
  sample.width = right - x
  sample.height = bottom - y
  const context = sample.getContext("2d", { willReadFrequently: true })!
  context.drawImage(canvas, x, y, sample.width, sample.height, 0, 0, sample.width, sample.height)
  return context.getImageData(0, 0, sample.width, sample.height).data
}

async function blur(canvas: HTMLCanvasElement, radius: number) {
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

export async function prepareBackdrop(
  canvas: HTMLCanvasElement,
  screen: DuoScreenInfo,
  previous: BackdropSnapshot,
) {
  const { width, height } = screen.size
  const [tabBlur, statusBlur] = await Promise.all([
    blur(canvas, (6 * canvas.width) / width),
    blur(canvas, (12 * canvas.width) / width),
  ])
  const frame: BackdropFrame = { canvas, width, height, tabBlur, statusBlur }
  const layout = getSystemLayout(screen)
  const colors = { ...previous.colors }
  for (const key of ["time", "glyph", "home"] as const) {
    const pixels = sampleRect(canvas, layout[key], width, height)
    if (pixels) colors[key] = chooseIndicatorStyle(pixels, colors[key])
  }
  return { frame, colors }
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
