import * as React from "react"
import { DisplayIcon, PartialFoldIcon } from "./icons"
import { useDuoActions, useDuoState } from "../../context/hooks"
import { IconButton } from "./icon-button"
import type { DuoControlGroupProps } from "./types"

export const DuoDisplayControls = React.forwardRef<HTMLDivElement, DuoControlGroupProps>(
  function DuoDisplayControls(props, ref) {
    const posture = useDuoState((state) => state.posture)
    const { setPosture } = useDuoActions()
    return (
      <div role="group" aria-label="Posture" data-duo-toolbar-group="display" {...props} ref={ref}>
        <IconButton
          label="Closed"
          action="outer"
          aria-pressed={posture === "closed"}
          onClick={() => setPosture("closed")}
        >
          <DisplayIcon inner={false} />
        </IconButton>
        <IconButton
          label="Partially open"
          action="partially-open"
          aria-pressed={posture === "partially-open"}
          onClick={() => setPosture("partially-open")}
        >
          <PartialFoldIcon />
        </IconButton>
        <IconButton
          label="Fully open"
          action="inner"
          aria-pressed={posture === "open"}
          onClick={() => setPosture("open")}
        >
          <DisplayIcon inner />
        </IconButton>
      </div>
    )
  },
)
