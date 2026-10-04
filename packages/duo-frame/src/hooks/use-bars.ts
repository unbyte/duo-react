import * as React from "react"
import { useDuoScreen } from "../context/hooks"
import type { BarsLayoutRequest } from "../core/bar-types"
import { getBarsLayout } from "../core/layout/bars"

/** Resolve one complete set of bars within the current DuoFrame app window. */
export function useBars(request: BarsLayoutRequest = {}) {
  const screen = useDuoScreen()
  return React.useMemo(() => getBarsLayout(screen, request), [screen, request])
}
