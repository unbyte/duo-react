import type { DuoRect } from '@private/profiles'
import type { ResolvedIndicatorStyle } from './contrast'

export type IndicatorSample = 'time' | 'glyph' | 'home'
export interface BackdropRequest {
  readonly area: DuoRect
  readonly blur: number
  readonly indicator?: IndicatorSample
}
export interface BackdropRegion extends DuoRect {
  readonly indicator?: IndicatorSample
  readonly canvas: HTMLCanvasElement
  readonly blurred: HTMLCanvasElement
  readonly blur: number
}
export interface BackdropSnapshot {
  readonly regions: ReadonlyMap<symbol, BackdropRegion>
  readonly colors: Readonly<Record<IndicatorSample, ResolvedIndicatorStyle>>
}

export interface BackdropSource {
  getSnapshot(): BackdropSnapshot
  getServerSnapshot(): BackdropSnapshot
  subscribe(listener: () => void): () => void
  subscribeRegion(key: symbol, listener: () => void): () => void
  request(key: symbol, request: BackdropRequest): void
  release(key: symbol): void
}
