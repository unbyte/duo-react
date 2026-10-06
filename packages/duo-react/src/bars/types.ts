import type { CSSProperties } from "react"
import type { BarAxis, BarPlacement, BarRect } from "@duo-react/core"

export interface BarContainerProps {
  readonly style: CSSProperties
  readonly "data-duo-react-bar-placement": BarPlacement
  readonly "data-duo-react-bar-axis": BarAxis
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
