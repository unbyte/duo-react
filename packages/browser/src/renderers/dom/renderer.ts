import { paddedRegion } from '../backdrop/geometry'
import { BackdropStore } from '../backdrop/store'
import type { BackdropRequest } from '../backdrop/types'
import type { ContentRenderer, RendererScreen } from '../types'
import { DomBackdrops } from './backdrops'
import { captureDom } from './capture'

export class DomRenderer implements ContentRenderer {
  readonly backdrop = new BackdropStore(() => this.invalidate())
  private readonly backdrops = new DomBackdrops()
  private screen?: RendererScreen
  private source?: HTMLElement
  private observer?: MutationObserver
  private resize?: ResizeObserver
  private refresh?: ReturnType<typeof setInterval>
  private timer?: ReturnType<typeof setTimeout>
  private busy = false
  private dirty = false
  private generation = 0
  private lastStart = -Infinity

  updateScreen(screen: RendererScreen) {
    this.screen = screen
    this.invalidate()
  }

  connect(source: HTMLElement) {
    this.source = source
    this.observer = new MutationObserver(this.schedule)
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
    source.addEventListener('scroll', this.schedule, true)
    source.addEventListener('input', this.schedule, true)
    source.addEventListener('load', this.schedule, true)
    document.addEventListener('visibilitychange', this.schedule)
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
    this.source?.removeEventListener('scroll', this.schedule, true)
    this.source?.removeEventListener('input', this.schedule, true)
    this.source?.removeEventListener('load', this.schedule, true)
    document.removeEventListener('visibilitychange', this.schedule)
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
      for (const [key, request] of this.backdrop.getRequests()) {
        const area = paddedRegion(request.area, request.blur * 3, screen.size)
        if (area) requests.set(key, { ...request, area })
      }
      let next = this.backdrop.getSnapshot()
      if (requests.size) {
        const canvas = await captureDom(source)
        next = await this.backdrops.prepare(canvas, requests, this.backdrop.getSnapshot())
      } else if (next.regions.size) {
        next = { ...next, regions: new Map() }
      }
      if (generation !== this.generation || next === this.backdrop.getSnapshot()) return
      this.backdrop.publish(next)
    } catch {
      // Keep the last completed image if a resource cannot be captured.
    } finally {
      this.busy = false
      if (this.dirty) this.schedule()
    }
  }
}
