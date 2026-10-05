import * as React from "react"
import { createPortal } from "react-dom"
import { useAccessoryHost } from "../../context/accessory-context"
import { useDuoScreen } from "../../context/hooks"
import { getAccessoryLayout } from "../../core/layout/accessories"

export type DuoBarProps = React.HTMLAttributes<HTMLDivElement>

export const DuoAppToolbar = React.forwardRef<HTMLDivElement, DuoBarProps>(function DuoAppToolbar(
  { className, ...props },
  ref,
) {
  const host = useAccessoryHost()
  const screen = useDuoScreen()
  const { side, toolbarEndInset, ...bounds } = getAccessoryLayout(screen)
  if (!host) return null
  return createPortal(
    <div
      className="duo-accessory-layout"
      data-duo-bar-axis={side === "horizontal" ? "horizontal" : "vertical"}
      style={bounds}
    >
      <div className="duo-accessory-toolbar" style={{ marginRight: toolbarEndInset }}>
        <div
          {...props}
          ref={ref}
          className={["duo-app-bar", className].filter(Boolean).join(" ")}
          data-duo-bar="toolbar"
          data-duo-bar-placement={side === "horizontal" ? "top" : side}
        />
      </div>
    </div>,
    host,
  )
})
