import * as React from "react"
import { useDuoActions } from "../../context/hooks"
import { RotateLeftIcon, RotateRightIcon } from "./icons"
import { IconButton } from "./icon-button"
import type { DuoControlGroupProps } from "./types"

export const DuoRotationControls = React.forwardRef<HTMLDivElement, DuoControlGroupProps>(
  function DuoRotationControls(props, ref) {
    const { rotate } = useDuoActions()
    return (
      <div
        role="group"
        aria-label="Rotation"
        data-duo-control-group="rotation"
        {...props}
        ref={ref}
      >
        <IconButton label="Rotate left" action="rotate-left" onClick={() => rotate("left")}>
          <RotateLeftIcon />
        </IconButton>
        <IconButton label="Rotate right" action="rotate-right" onClick={() => rotate("right")}>
          <RotateRightIcon />
        </IconButton>
      </div>
    )
  },
)
