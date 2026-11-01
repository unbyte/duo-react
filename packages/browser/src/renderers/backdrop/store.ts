import { sameRect } from './geometry'
import type { BackdropRequest, BackdropSnapshot, BackdropSource } from './types'

const initial: BackdropSnapshot = {
  regions: new Map(),
  colors: { time: 'dark', glyph: 'dark', home: 'dark' },
}

export class BackdropStore implements BackdropSource {
  private snapshot = initial
  private readonly requests = new Map<symbol, BackdropRequest>()
  private readonly listeners = new Set<() => void>()

  constructor(private readonly invalidate: () => void) {}

  getRequests(): ReadonlyMap<symbol, BackdropRequest> {
    return this.requests
  }

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

  publish(snapshot: BackdropSnapshot) {
    this.snapshot = snapshot
    this.listeners.forEach((listener) => {
      listener()
    })
  }
}
