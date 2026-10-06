import * as React from "react"
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector"
import { useBackdropStore } from "../../backdrop/backdrop-context"
import type { IndicatorSample } from "@duo-react/browser"
import { useBackdropRegion } from "../../backdrop/use-backdrop-region"
import type { DuoRect } from "@duo-react/profiles"
import type { DuoIndicatorStyle } from "@duo-react/core"

export function SystemIndicator({
  width,
  height,
  appearance,
  sample,
  area,
  className,
  style,
  children,
  foreground,
}: {
  width: number
  height: number
  appearance: DuoIndicatorStyle
  sample: IndicatorSample
  area: DuoRect
  className: string
  style?: React.CSSProperties
  children: React.ReactNode
  foreground?: React.ReactNode
}) {
  const store = useBackdropStore()
  useBackdropRegion(() => ({ area, blur: 0, indicator: sample }))
  const resolved = useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
    (snapshot) => (appearance === "auto" ? snapshot.colors[sample] : appearance),
  )
  return (
    <span
      className={`duo-react-indicator ${className}`}
      data-duo-react-indicator-style={appearance}
      data-duo-react-resolved-style={resolved}
      style={{ width, height, ...style }}
    >
      <span className="duo-react-indicator-fixed">{children}</span>
      {foreground && <span className="duo-react-indicator-foreground">{foreground}</span>}
    </span>
  )
}
