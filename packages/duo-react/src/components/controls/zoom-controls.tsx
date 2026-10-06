import * as React from "react"
import { useDuoActions, useDuoState } from "../../context/hooks"
import { FitIcon, ZoomInIcon, ZoomOutIcon } from "./icons"
import { IconButton } from "./icon-button"
import type { DuoControlGroupProps } from "./types"

export const DuoZoomControls = React.forwardRef<HTMLDivElement, DuoControlGroupProps>(
  function DuoZoomControls(props, ref) {
    const state = useDuoState((value) => value)
    const { zoomIn, zoomOut, setZoom } = useDuoActions()
    const scale = typeof state.zoom === "number" ? state.zoom : state.renderedZoom
    const canZoom = !state.zoomReadOnly && scale !== undefined && scale > 0
    return (
      <div role="group" aria-label="Zoom" data-duo-control-group="zoom" {...props} ref={ref}>
        <IconButton label="Zoom out" action="zoom-out" disabled={!canZoom} onClick={zoomOut}>
          <ZoomOutIcon />
        </IconButton>
        <IconButton label="Zoom in" action="zoom-in" disabled={!canZoom} onClick={zoomIn}>
          <ZoomInIcon />
        </IconButton>
        <IconButton
          label="Fit to view"
          action="fit"
          aria-pressed={state.zoom === "fit"}
          disabled={state.zoomReadOnly}
          onClick={() => setZoom("fit")}
        >
          <FitIcon />
        </IconButton>
      </div>
    )
  },
)
