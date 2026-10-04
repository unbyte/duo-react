import type { CSSProperties } from "react"
import type { DuoRect } from "./types"

export interface ToolbarLayoutRequest {
  readonly id: string
  readonly placement: "top-leading" | "top-trailing" | "bottom"
  /** Defaults to adaptive; horizontal keeps the toolbar on a horizontal edge. */
  readonly axis?: "adaptive" | "horizontal"
}

export interface TabBarLayoutRequest {
  readonly distribution?: "packed" | "edges"
}

export interface BarsLayoutRequest {
  readonly toolbars?: readonly ToolbarLayoutRequest[]
  readonly tabbar?: TabBarLayoutRequest
}

/** Allocated drawing area in app-window CSS pixels, before frame transforms. */
export type BarRect = DuoRect
export type BarPlacement = "top" | "bottom" | "left" | "right"
export type BarAxis = "horizontal" | "vertical"

export interface BarContainerProps {
  readonly style: CSSProperties
  readonly "data-duo-bar-placement": BarPlacement
  readonly "data-duo-bar-axis": BarAxis
}

export interface ResolvedBarLayout {
  readonly placement: BarPlacement
  readonly axis: BarAxis
  readonly rect: BarRect
  readonly containerProps: BarContainerProps
}

export interface ResolvedToolbarLayout extends ResolvedBarLayout {
  readonly id: string
}

export interface BarsLayout {
  readonly toolbars: readonly ResolvedToolbarLayout[]
  readonly tabbar?: ResolvedBarLayout
}
