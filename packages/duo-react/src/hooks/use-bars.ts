import * as React from "react"
import { useDuoScreen } from "../context/hooks"
import type {
  BarsLayout,
  BarsLayoutRequest,
  ResolvedBarLayout,
  TabBarLayoutRequest,
} from "../core/bar-types"
import { getBarsLayout } from "../core/layout/bars"

/** Resolve one complete set of bars within the current DuoFrame app window. */
export function useBars(
  request: BarsLayoutRequest & { readonly tabbar: TabBarLayoutRequest },
): BarsLayout & { readonly tabbar: ResolvedBarLayout }
export function useBars(
  request?: BarsLayoutRequest & { readonly tabbar?: undefined },
): BarsLayout & { readonly tabbar?: undefined }
export function useBars(request?: BarsLayoutRequest): BarsLayout
export function useBars(request: BarsLayoutRequest = {}) {
  const screen = useDuoScreen()
  return React.useMemo(() => getBarsLayout(screen, request), [screen, request])
}
