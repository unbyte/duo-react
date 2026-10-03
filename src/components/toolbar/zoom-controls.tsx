import * as React from "react";
import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { iconProps } from "./icons";
import { useDuoActions, useDuoState } from "../../context/hooks";
import { IconButton } from "./icon-button";
import type { DuoControlGroupProps } from "./types";

export const DuoZoomControls = React.forwardRef<HTMLDivElement, DuoControlGroupProps>(
  function DuoZoomControls(props, ref) {
    const state = useDuoState((value) => value);
    const { zoomIn, zoomOut, setZoom } = useDuoActions();
    const scale = typeof state.zoom === "number" ? state.zoom : state.renderedZoom;
    const canZoom = !state.zoomReadOnly && scale !== undefined && scale > 0;
    return (
      <div role="group" aria-label="Zoom" data-duo-toolbar-group="zoom" {...props} ref={ref}>
        <IconButton label="Zoom out" action="zoom-out" disabled={!canZoom} onClick={zoomOut}>
          <ZoomOut {...iconProps} />
        </IconButton>
        <IconButton label="Zoom in" action="zoom-in" disabled={!canZoom} onClick={zoomIn}>
          <ZoomIn {...iconProps} />
        </IconButton>
        <IconButton
          label="Fit to view"
          action="fit"
          aria-pressed={state.zoom === "fit"}
          disabled={state.zoomReadOnly}
          onClick={() => setZoom("fit")}
        >
          <Maximize {...iconProps} />
        </IconButton>
      </div>
    );
  },
);
