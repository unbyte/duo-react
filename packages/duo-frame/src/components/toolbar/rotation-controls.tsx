import * as React from "react"
import { RotateCcwSquare, RotateCwSquare } from "lucide-react"
import { iconProps } from "./icons"
import { useDuoActions } from "../../context/hooks"
import { IconButton } from "./icon-button"
import type { DuoControlGroupProps } from "./types"

export const DuoRotationControls = React.forwardRef<HTMLDivElement, DuoControlGroupProps>(
  function DuoRotationControls(props, ref) {
    const { rotate } = useDuoActions()
    return (
      <div
        role="group"
        aria-label="Rotation"
        data-duo-toolbar-group="rotation"
        {...props}
        ref={ref}
      >
        <IconButton label="Rotate left" action="rotate-left" onClick={() => rotate("left")}>
          <RotateCcwSquare {...iconProps} />
        </IconButton>
        <IconButton label="Rotate right" action="rotate-right" onClick={() => rotate("right")}>
          <RotateCwSquare {...iconProps} />
        </IconButton>
      </div>
    )
  },
)
