import * as React from "react";
import { Maximize, RotateCcwSquare, RotateCwSquare, ZoomIn, ZoomOut } from "lucide-react";
import { useDuoActions, useDuoState } from "./provider";
import { rotatedOrientation } from "./view-controls";
import type { DuoPlacement } from "./types";

export type DuoToolbarProps = React.HTMLAttributes<HTMLDivElement>;
export type DuoControlGroupProps = Omit<DuoToolbarProps, "children">;

function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function DisplayIcon({ inner }: { inner: boolean }) {
  const outline = inner
    ? "M4.5 5h15A2.5 2.5 0 0 1 22 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 16.5v-9A2.5 2.5 0 0 1 4.5 5Z"
    : "M5.5 2H15a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H5.5a.5.5 0 0 1-.5-.5v-19a.5.5 0 0 1 .5-.5Z";
  return (
    <Glyph>
      <path
        d={outline}
        fill="currentColor"
        fillOpacity="0.14"
        stroke="none"
        data-duo-icon-tone="secondary"
      />
      <path d={outline} />
      {inner ? (
        <path d="M9.5 16.5h5" strokeWidth="1.25" />
      ) : (
        <circle cx="15.5" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
      )}
    </Glyph>
  );
}

function LayoutIcon({ placement }: { placement: DuoPlacement }) {
  return (
    <Glyph>
      <rect
        x={placement === "right" ? 12 : 3}
        y="4"
        width={placement === "full" ? 18 : 9}
        height="16"
        rx="2"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="none"
        data-duo-icon-tone="secondary"
      />
      <rect x="3" y="4" width="18" height="16" rx="2" />
      {placement !== "full" && <path d="M12 4v16" />}
    </Glyph>
  );
}

function IconButton({
  label,
  action,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  action: string;
}) {
  return (
    <button type="button" aria-label={label} title={label} data-duo-action={action} {...props}>
      {children}
    </button>
  );
}

const iconProps = { size: 24, strokeWidth: 1.75, "aria-hidden": true, focusable: false } as const;

export const DuoToolbar = React.forwardRef<HTMLDivElement, DuoToolbarProps>(function DuoToolbar(
  { className, ...props },
  ref,
) {
  return (
    <div
      role="group"
      aria-label="Device preview controls"
      {...props}
      ref={ref}
      className={["duo-toolbar", className].filter(Boolean).join(" ")}
    />
  );
});

export const DuoDisplayControls = React.forwardRef<HTMLDivElement, DuoControlGroupProps>(
  function DuoDisplayControls(props, ref) {
    const inner = useDuoState((state) => state.posture === "open");
    const { setPosture } = useDuoActions();
    return (
      <div role="group" aria-label="Display" data-duo-toolbar-group="display" {...props} ref={ref}>
        <IconButton
          label="Inner display"
          action="inner"
          aria-pressed={inner}
          onClick={() => setPosture("open")}
        >
          <DisplayIcon inner />
        </IconButton>
        <IconButton
          label="Outer display"
          action="outer"
          aria-pressed={!inner}
          onClick={() => setPosture("closed")}
        >
          <DisplayIcon inner={false} />
        </IconButton>
      </div>
    );
  },
);

export const DuoRotationControls = React.forwardRef<HTMLDivElement, DuoControlGroupProps>(
  function DuoRotationControls(props, ref) {
    const orientation = useDuoState((state) => state.orientation);
    const { rotate } = useDuoActions();
    return (
      <div
        role="group"
        aria-label="Rotation"
        data-duo-toolbar-group="rotation"
        {...props}
        ref={ref}
      >
        <IconButton
          label="Rotate left"
          action="rotate-left"
          disabled={!rotatedOrientation(orientation, "left")}
          onClick={() => rotate("left")}
        >
          <RotateCcwSquare {...iconProps} />
        </IconButton>
        <IconButton
          label="Rotate right"
          action="rotate-right"
          disabled={!rotatedOrientation(orientation, "right")}
          onClick={() => rotate("right")}
        >
          <RotateCwSquare {...iconProps} />
        </IconButton>
      </div>
    );
  },
);

export const DuoLayoutControls = React.forwardRef<HTMLDivElement, DuoControlGroupProps>(
  function DuoLayoutControls(props, ref) {
    const state = useDuoState((value) => value);
    const { setInnerPlacement } = useDuoActions();
    if (state.posture !== "open") return null;
    return (
      <div
        role="group"
        aria-label="Inner layout"
        data-duo-toolbar-group="layout"
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
            disabled={placement !== "full" && state.orientation === "portrait"}
            onClick={() => setInnerPlacement(placement)}
          >
            <LayoutIcon placement={placement} />
          </IconButton>
        ))}
      </div>
    );
  },
);

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
