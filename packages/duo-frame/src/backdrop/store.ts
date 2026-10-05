import type { DuoRect, DuoScreenInfo } from "../core/types"
import { chooseIndicatorStyle, type ResolvedIndicatorStyle } from "./contrast"
import { blur, paddedRegion, samePixels, sameRect } from "./image"
import { iframeCapture } from "./iframe-capture"

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

const excluded = ".duo-accessory-window, .duo-status-material, .duo-system"

export class BackdropStore {
  private snapshot = initial
  private readonly requests = new Map<symbol, BackdropRequest>()
  private readonly listeners = new Set<() => void>()
  private source?: HTMLElement
  private screen?: DuoScreenInfo
  private observer?: MutationObserver
  private resize?: ResizeObserver
  private refresh?: ReturnType<typeof setInterval>
  private timer?: ReturnType<typeof setTimeout>
  private busy = false
  private dirty = false
  private generation = 0
  private lastStart = -Infinity

  getSnapshot = () => this.snapshot
  getServerSnapshot = () => initial

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  subscribeRegion(key: symbol, listener: () => void) {
    let region = this.snapshot.regions.get(key)
    return this.subscribe(() => {
      const next = this.snapshot.regions.get(key)
      if (next === region) return
      region = next
      listener()
    })
  }

  request(key: symbol, request: BackdropRequest) {
    const previous = this.requests.get(key)
    if (
      previous &&
      sameRect(previous.area, request.area) &&
      previous.blur === request.blur &&
      previous.indicator === request.indicator
    )
      return
    this.requests.set(key, request)
    this.invalidate()
  }

  release(key: symbol) {
    if (this.requests.delete(key)) this.invalidate()
  }

  updateScreen(screen: DuoScreenInfo) {
    this.screen = screen
    this.invalidate()
  }

  connect(source: HTMLElement) {
    this.source = source
    this.observer = new MutationObserver((records) => {
      if (
        records.some((record) => {
          const element =
            record.target instanceof Element ? record.target : record.target.parentElement
          return !element?.closest(excluded)
        })
      )
        this.schedule()
    })
    this.observer.observe(source, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    })
    // Frame CSS variables can alter the app without mutating its subtree.
    for (let parent = source.parentElement; parent; parent = parent.parentElement)
      this.observer.observe(parent, { attributes: true })
    this.resize = new ResizeObserver(this.schedule)
    this.resize.observe(source)
    source.addEventListener("scroll", this.schedule, true)
    source.addEventListener("input", this.schedule, true)
    source.addEventListener("load", this.schedule, true)
    document.addEventListener("visibilitychange", this.schedule)
    // CSSOM, canvas drawing, and iframe interiors have no parent DOM mutation signal.
    this.refresh = setInterval(this.schedule, 500)
    this.invalidate()
  }

  disconnect() {
    this.generation++
    clearTimeout(this.timer)
    this.timer = undefined
    clearInterval(this.refresh)
    this.observer?.disconnect()
    this.resize?.disconnect()
    this.source?.removeEventListener("scroll", this.schedule, true)
    this.source?.removeEventListener("input", this.schedule, true)
    this.source?.removeEventListener("load", this.schedule, true)
    document.removeEventListener("visibilitychange", this.schedule)
    this.source = undefined
  }

  private invalidate() {
    this.generation++
    this.schedule()
  }

  private schedule = () => {
    if (!this.source || document.hidden || !this.screen?.visible) return
    this.dirty = true
    if (this.busy || this.timer !== undefined) return
    this.timer = setTimeout(
      () => {
        void this.capture()
      },
      Math.max(0, Math.ceil(50 - (performance.now() - this.lastStart))),
    )
  }

  private async capture() {
    this.timer = undefined
    const { source, screen } = this
    if (!source || !screen?.visible || document.hidden) return
    this.busy = true
    this.dirty = false
    this.lastStart = performance.now()
    const generation = this.generation
    try {
      const requests = new Map<symbol, BackdropRequest>()
      for (const [key, request] of this.requests) {
        const area = paddedRegion(request.area, request.blur * 3, screen.size)
        if (area) requests.set(key, { ...request, area })
      }
      let next = this.snapshot
      if (requests.size) {
        const { snapdom } = await import("@zumer/snapdom")
        const canvas = await snapdom.toCanvas(source, {
          scale: 1,
          dpr: 1,
          exclude: excluded,
          excludeMode: "remove",
          fast: false,
          invalidate: true,
          plugins: [iframeCapture],
        })
        next = await this.prepare(canvas, requests)
      } else if (next.regions.size) {
        next = { ...next, regions: new Map() }
      }
      if (generation !== this.generation || next === this.snapshot) return
      this.snapshot = next
      this.listeners.forEach((listener) => listener())
    } catch {
      // Keep the last completed image if a resource cannot be captured.
    } finally {
      this.busy = false
      if (this.dirty) this.schedule()
    }
  }

  private async prepare(canvas: HTMLCanvasElement, requests: ReadonlyMap<symbol, BackdropRequest>) {
    const previous = this.snapshot
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
}
