import * as React from "react";
import { useDuoActions, useDuoState } from "./provider";
import type { DuoOrientation, DuoPlacement } from "./types";

export const DuoToolbar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function DuoToolbar({ className, ...props }, ref) {
    const state = useDuoState((value) => value);
    const actions = useDuoActions();
    return (
      <div
        role="group"
        aria-label="Device preview controls"
        {...props}
        ref={ref}
        className={["duo-toolbar", className].filter(Boolean).join(" ")}
      >
        <label>
          Display
          <select
            value={state.posture === "open" ? "inner" : "outer"}
            onChange={(event) =>
              actions.setPosture(event.currentTarget.value === "inner" ? "open" : "closed")
            }
          >
            <option value="inner">Inner display</option>
            <option value="outer">Outer display</option>
          </select>
        </label>
        <label>
          Orientation
          <select
            value={state.orientation}
            onChange={(event) =>
              actions.setOrientation(event.currentTarget.value as DuoOrientation)
            }
          >
            <option value="landscape-left">Landscape left</option>
            <option value="landscape-right">Landscape right</option>
            <option value="portrait" disabled={state.innerPlacement !== "full"}>
              Portrait (full screen)
            </option>
          </select>
        </label>
        <label>
          Inner window
          <select
            value={state.innerPlacement}
            onChange={(event) =>
              actions.setInnerPlacement(event.currentTarget.value as DuoPlacement)
            }
          >
            <option value="full">Full</option>
            <option value="left" disabled={state.orientation === "portrait"}>
              Left
            </option>
            <option value="right" disabled={state.orientation === "portrait"}>
              Right
            </option>
          </select>
        </label>
        <label>
          Zoom
          <select
            value={state.zoom}
            disabled={state.zoomReadOnly}
            onChange={(event) =>
              actions.setZoom(
                event.currentTarget.value === "fit" ? "fit" : Number(event.currentTarget.value),
              )
            }
          >
            <option value="fit">Fit</option>
            {[
              ...new Set([
                0.25,
                0.5,
                0.75,
                1,
                1.5,
                2,
                ...(typeof state.zoom === "number" ? [state.zoom] : []),
              ]),
            ]
              .sort((a, b) => a - b)
              .map((zoom) => (
                <option key={zoom} value={zoom}>
                  {Math.round(zoom * 100)}%
                </option>
              ))}
          </select>
        </label>
        <button type="button" onClick={actions.resetDevice}>
          Reset device
        </button>
      </div>
    );
  },
);
