import * as React from "react"
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector"
import { useBackdropStore } from "../../context/backdrop-context"
import type { IndicatorSample } from "../../backdrop/store"
import { useBackdropRegion } from "../../backdrop/use-region"
import type { DuoRect, DuoIndicatorStyle } from "../../core/types"

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
