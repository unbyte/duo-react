import type { DuoRect } from "../core/types"
import { chooseIndicatorStyle, type ResolvedIndicatorStyle } from "./contrast"
import { samePixels, sameRect } from "./regions"

export type IndicatorSample = "time" | "glyph" | "home"
export interface BackdropRequest {
  readonly area: DuoRect
  readonly blur: number
  readonly indicator?: IndicatorSample
}
export interface BackdropRegion extends DuoRect {
  readonly indicator?: IndicatorSample
  readonly canvas: HTMLCanvasElement
  readonly blurred: HTMLCanvasElement
  readonly pixels: Uint8ClampedArray
  readonly blur: number
}
export interface BackdropSnapshot {
  readonly regions: ReadonlyMap<symbol, BackdropRegion>
  readonly colors: Readonly<Record<IndicatorSample, ResolvedIndicatorStyle>>
}

const initial: BackdropSnapshot = {
  regions: new Map(),
  colors: { time: "dark", glyph: "dark", home: "dark" },
}

export function createBackdropStore() {
  let snapshot = initial
  const requests = new Map<symbol, BackdropRequest>()
  const listeners = new Set<() => void>()
  const requestListeners = new Set<() => void>()
  function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initial,
    getRequests: () => new Map(requests),
    request: (key: symbol, request: BackdropRequest) => {
      const previous = requests.get(key)
      if (
        previous &&
        sameRect(previous.area, request.area) &&
        previous.blur === request.blur &&
        previous.indicator === request.indicator
      )
        return
      requests.set(key, request)
      requestListeners.forEach((listener) => listener())
    },
    release: (key: symbol) => {
      if (requests.delete(key)) requestListeners.forEach((listener) => listener())
    },
    subscribeRequests: (listener: () => void) => {
      requestListeners.add(listener)
      return () => {
        requestListeners.delete(listener)
      }
    },
    subscribe,
    subscribeRegion: (key: symbol, listener: () => void) => {
      let region = snapshot.regions.get(key)
      return subscribe(() => {
        const next = snapshot.regions.get(key)
        if (next === region) return
        region = next
        listener()
      })
    },
    publish: (next: BackdropSnapshot) => {
      if (next === snapshot) return
      snapshot = next
      listeners.forEach((listener) => listener())
    },
  }
}
export type BackdropStore = ReturnType<typeof createBackdropStore>

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
  requests: ReadonlyMap<symbol, BackdropRequest>,
  previous: BackdropSnapshot,
) {
  // Read the shared image once; reading separate GPU-backed crops repeats the
  // readback cost for every consumer, even when all of them are unchanged.
  const source = canvas.getContext("2d", { willReadFrequently: true })!
  const image = source.getImageData(0, 0, canvas.width, canvas.height)
  const regions = new Map<symbol, BackdropRegion>()
  const colors = { ...previous.colors }
  let changed = requests.size !== previous.regions.size
  await Promise.all(
    Array.from(requests, async ([key, request]) => {
      const { area } = request
      const pixels = new Uint8ClampedArray(area.width * area.height * 4)
      for (let y = 0; y < area.height; y++) {
        const offset = ((area.y + y) * image.width + area.x) * 4
        pixels.set(image.data.subarray(offset, offset + area.width * 4), y * area.width * 4)
      }
      const old = previous.regions.get(key)
      if (
        old &&
        sameRect(old, area) &&
        old.blur === request.blur &&
        old.indicator === request.indicator &&
        samePixels(old.pixels, pixels)
      ) {
        regions.set(key, old)
        return
      }
      changed = true
      const raw = document.createElement("canvas")
      raw.width = area.width
      raw.height = area.height
      const context = raw.getContext("2d")!
      const crop = context.createImageData(raw.width, raw.height)
      crop.data.set(pixels)
      context.putImageData(crop, 0, 0)
      const blurred = request.blur ? await blur(raw, request.blur) : raw
      regions.set(key, {
        ...area,
        canvas: raw,
        blurred,
        pixels,
        blur: request.blur,
        indicator: request.indicator,
      })
      if (request.indicator)
        colors[request.indicator] = chooseIndicatorStyle(pixels, colors[request.indicator])
    }),
  )
  return changed ? { regions, colors } : previous
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
