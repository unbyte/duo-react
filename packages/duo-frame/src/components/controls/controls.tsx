import * as React from "react"
import type { DuoControlsProps } from "./types"

export const DuoControls = React.forwardRef<HTMLDivElement, DuoControlsProps>(function DuoControls(
  { className, ...props },
  ref,
) {
  return (
    <div
      role="group"
      aria-label="Device preview controls"
      {...props}
      ref={ref}
      className={["duo-controls", className].filter(Boolean).join(" ")}
    />
  )
})
