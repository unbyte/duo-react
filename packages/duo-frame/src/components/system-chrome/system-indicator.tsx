import * as React from "react"
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector"
import { useBackdropStore } from "../../context/backdrop-context"
import type { IndicatorSample } from "../../backdrop/store"
import type { DuoIndicatorStyle } from "../../core/types"

export function SystemIndicator({
  width,
  height,
  appearance,
  sample,
  className,
  style,
  children,
  foreground,
}: {
  width: number
  height: number
  appearance: DuoIndicatorStyle
  sample: IndicatorSample
  className: string
  style?: React.CSSProperties
  children: React.ReactNode
  foreground?: React.ReactNode
}) {
  const store = useBackdropStore()
  const resolved = useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
    (snapshot) => (appearance === "auto" ? snapshot.colors[sample] : appearance),
  )
  return (
    <span
      className={`duo-indicator ${className}`}
      data-duo-indicator-style={appearance}
      data-duo-resolved-style={resolved}
      style={{ width, height, ...style }}
    >
      <span className="duo-indicator-fixed">{children}</span>
      {foreground && <span className="duo-indicator-foreground">{foreground}</span>}
    </span>
  )
}
