import type { DuoRect } from '@private/profiles'

export interface ToolbarLayoutRequest {
  readonly id: string
  readonly placement: 'top-leading' | 'top-trailing' | 'bottom'
  /** Defaults to adaptive; horizontal keeps the toolbar on a horizontal edge. */
  readonly axis?: 'adaptive' | 'horizontal'
}

export interface TabBarLayoutRequest {
  readonly distribution?: 'packed' | 'edges'
}

export interface BarsLayoutRequest {
  readonly toolbars?: readonly ToolbarLayoutRequest[]
  readonly tabbar?: TabBarLayoutRequest
}

/** Allocated drawing area in app-window CSS pixels, before frame transforms. */
export type BarRect = DuoRect
export type BarPlacement = 'top' | 'bottom' | 'left' | 'right'
export type BarAxis = 'horizontal' | 'vertical'

export type BarAlignment = 'start' | 'end' | 'center' | 'spread'

export interface BarAllocation {
  readonly placement: BarPlacement
  readonly axis: BarAxis
  readonly rect: BarRect
  readonly alignment: BarAlignment
}

export interface ToolbarAllocation extends BarAllocation {
  readonly id: string
}

export interface BarsAllocation {
  readonly toolbars: readonly ToolbarAllocation[]
  readonly tabbar?: BarAllocation
}
