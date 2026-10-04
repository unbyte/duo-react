import * as React from "react";
import { useDuoState } from "../../context/hooks";
import { useBrowserLayoutEffect } from "../../hooks/use-browser-layout-effect";
import { getMaskRegions, roundedBoundary } from "../../core/layout/regions";
import type { DuoRect } from "../../core/types";
import "../../style.css";

export interface DuoRegionMaskProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  frameRef: React.RefObject<HTMLDivElement | null>;
  theme?: "auto" | "light" | "dark";
}

let nextMaskId = 0;

function relativeRect(node: Element, origin: DOMRect): DuoRect {
  const rect = node.getBoundingClientRect();
  return {
    x: rect.left - origin.left,
    y: rect.top - origin.top,
    width: rect.width,
    height: rect.height,
  };
}

export function DuoRegionMask({
  frameRef,
  theme = "auto",
  className,
  ...props
}: DuoRegionMaskProps) {
  const root = React.useRef<HTMLDivElement>(null);
  const [id] = React.useState(() => `duo-region-mask-${nextMaskId++}`);
  const screen = useDuoState(
    (state) => state.screens[state.posture === "closed" ? "outer" : "inner"],
  );
  const cameraActive = useDuoState((state) => state.system.cameraActive);
  const posture = useDuoState((state) => state.posture);
  const [hovered, setHovered] = React.useState<string>();
  const [focused, setFocused] = React.useState<string>();
  const [layout, setLayout] = React.useState<{
    transform: DOMMatrix;
    frame: DuoRect;
    width: number;
    height: number;
  }>();

  useBrowserLayoutEffect(() => {
    const container = root.current;
    const frame = frameRef.current;
    const display = frame?.querySelector(`[data-duo-display="${screen.display}"]`);
    const rotation = frame?.querySelector(".duo-rotation");
    if (!container || !frame || !display || !rotation) return;
    let pending = 0;
    const measure = () => {
      const origin = container.getBoundingClientRect();
      const bounds = relativeRect(display, origin);
      // Display and rotation transforms share a center; preserve it during animated turns.
      const transform = new DOMMatrix()
        .translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
        .multiply(new DOMMatrix(getComputedStyle(rotation).transform))
        .multiply(new DOMMatrix(getComputedStyle(display).transform))
        .translate(-screen.size.width / 2, -screen.size.height / 2);
      setLayout({
        transform,
        frame: relativeRect(frame, origin),
        width: origin.width,
        height: origin.height,
      });
    };
    const schedule = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(measure);
    };
    measure();
    const resize = new ResizeObserver(schedule);
    resize.observe(container);
    resize.observe(frame);
    const mutation = new MutationObserver(schedule);
    mutation.observe(display, { attributes: true, attributeFilter: ["style"] });
    mutation.observe(rotation, { attributes: true, attributeFilter: ["style"] });
    return () => {
      cancelAnimationFrame(pending);
      resize.disconnect();
      mutation.disconnect();
    };
  }, [frameRef, screen]);

  useBrowserLayoutEffect(() => {
    setHovered(undefined);
    if (!root.current?.contains(document.activeElement)) setFocused(undefined);
  }, [screen]);

  const regions = getMaskRegions(screen, cameraActive, posture);
  const highlighted = hovered ?? focused;
  const below = layout && layout.width < 640;
  const labelTop = layout
    ? below
      ? layout.frame.y + layout.frame.height + 8
      : layout.frame.y + 8
    : 0;
  return (
    <div
      role="group"
      aria-label="Layout regions"
      {...props}
      ref={root}
      className={["duo-region-mask", className].filter(Boolean).join(" ")}
      data-theme={theme}
      data-inspecting={regions.some((region) => region.id === highlighted)}
    >
      {layout && (
        <>
          <svg className="duo-region-shapes" aria-hidden="true">
            <defs>
              <clipPath id={`${id}-frame`}>
                <rect {...layout.frame} />
              </clipPath>
              <clipPath id={`${id}-display`}>
                <path d={roundedBoundary({ x: 0, y: 0, ...screen.size }, screen.cornerRadii)} />
              </clipPath>
              <clipPath id={`${id}-window`}>
                <path d={roundedBoundary(screen.window, screen.windowCornerRadii)} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id}-frame)`}>
              <g transform={layout.transform.toString()}>
                <g clipPath={`url(#${id}-display)`}>
                  {[...regions]
                    .sort((a, b) => b.width * b.height - a.width * a.height)
                    .map((region) => (
                      <g key={region.id} clipPath={`url(#${id}-${region.scope})`}>
                        <rect
                          className="duo-region-fill"
                          data-region={region.id}
                          data-kind={region.kind}
                          data-highlighted={highlighted === region.id}
                          x={region.x}
                          y={region.y}
                          width={region.width}
                          height={region.height}
                          vectorEffect="non-scaling-stroke"
                          onMouseEnter={() => setHovered(region.id)}
                          onMouseLeave={() => setHovered(undefined)}
                        />
                      </g>
                    ))}
                </g>
              </g>
            </g>
          </svg>
          <div
            className="duo-region-labels"
            role="group"
            aria-label="Active layout regions"
            data-below={below}
            style={{
              left: below ? 16 : layout.frame.x + layout.frame.width + 16,
              top: labelTop,
              width: below ? Math.max(0, layout.width - 32) : 196,
              maxHeight: Math.max(0, layout.height - labelTop - 8),
            }}
          >
            {[...regions]
              .sort((a, b) => a.y + a.height / 2 - b.y - b.height / 2)
              .map((region) => (
                <button
                  key={region.id}
                  type="button"
                  className="duo-region-label"
                  data-region={region.id}
                  data-kind={region.kind}
                  data-highlighted={highlighted === region.id}
                  onMouseEnter={() => setHovered(region.id)}
                  onMouseLeave={() => setHovered(undefined)}
                  onFocus={() => setFocused(region.id)}
                  onBlur={() => setFocused(undefined)}
                >
                  <span>{region.name}</span>
                  <small>
                    {Number(region.width.toFixed(2))} × {Number(region.height.toFixed(2))} pt
                  </small>
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
