import * as React from "react"
import { LayoutIcon } from "./icons"
import { useDuoActions, useDuoState } from "../../context/hooks"
import { IconButton } from "./icon-button"
import type { DuoControlGroupProps } from "./types"

export const DuoLayoutControls = React.forwardRef<HTMLDivElement, DuoControlGroupProps>(
  function DuoLayoutControls(props, ref) {
    const state = useDuoState((value) => value)
    const { setInnerPlacement } = useDuoActions()
    if (state.posture === "closed") return null
    return (
      <div
        role="group"
        aria-label="Inner layout"
        data-duo-control-group="layout"
        {...props}
        ref={ref}
      >
        {(["left", "full", "right"] as const).map((placement) => (
          <IconButton
            key={placement}
            label={
              placement === "full"
                ? "Full width"
                : `${placement === "left" ? "Left" : "Right"} layout`
            }
            action={`layout-${placement}`}
            aria-pressed={state.innerPlacement === placement}
            disabled={
              placement !== "full" && state.screens.inner.orientation.startsWith("portrait")
            }
            onClick={() => setInnerPlacement(placement)}
          >
            <LayoutIcon placement={placement} />
          </IconButton>
        ))}
      </div>
    )
  },
)
