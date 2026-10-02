import * as React from "react";
import { getDuoGeometry, useDuoState } from "duo-frame";
import type { DuoRect, DuoScreenInfo } from "duo-frame";

interface Region extends DuoRect {
  name: string;
  color: string;
  scope?: "display";
}

function getRegions(screen: DuoScreenInfo, cameraActive: boolean): Region[] {
  const { window: bounds, safeArea: inset } = screen;
  const { x, y, width, height } = bounds;
  const display = getDuoGeometry({
    display: screen.display,
    orientation: screen.orientation,
    cameraActive,
  });
  return [
    {
      name: "App safe area",
      color: "#21834b",
      x: x + inset.left,
      y: y + inset.top,
      width: width - inset.left - inset.right,
      height: height - inset.top - inset.bottom,
    },
    { name: "Top safe inset", color: "#b16b00", x, y, width, height: inset.top },
    {
      name: "Right safe inset",
      color: "#2563cc",
      x: x + width - inset.right,
      y,
      width: inset.right,
      height,
    },
    {
      name: "Bottom safe inset",
      color: "#a13dac",
      x,
      y: y + height - inset.bottom,
      width,
      height: inset.bottom,
    },
    { name: "Left safe inset", color: "#00828b", x, y, width: inset.left, height },
    ...display.reservedRegions.map((region, index) => ({
      ...region,
      name: `${region.type === "occlusion" ? "Occlusion" : "Division"} ${index + 1}`,
      color: ["#d94b42", "#7954cc", "#957126"][index % 3]!,
      scope: "display" as const,
    })),
  ].filter((region) => region.width > 0 && region.height > 0);
}

function roundedBoundary(bounds: DuoRect, radii: DuoScreenInfo["cornerRadii"], inset = 0) {
  const x = bounds.x + inset;
  const y = bounds.y + inset;
  const right = bounds.x + bounds.width - inset;
  const bottom = bounds.y + bounds.height - inset;
  const [tl, tr, br, bl] = radii.map((radius) => Math.max(0, radius - inset));
  const topLeft = `M ${x} ${y + tl} A ${tl} ${tl} 0 0 1 ${x + tl} ${y}`;
  const topRight = `M ${right - tr} ${y} A ${tr} ${tr} 0 0 1 ${right} ${y + tr}`;
  const bottomRight = `M ${right} ${bottom - br} A ${br} ${br} 0 0 1 ${right - br} ${bottom}`;
  const bottomLeft = `M ${x + bl} ${bottom} A ${bl} ${bl} 0 0 1 ${x} ${bottom - bl}`;
  return {
    outline: `M ${x + tl} ${y} H ${right - tr} A ${tr} ${tr} 0 0 1 ${right} ${y + tr}
      V ${bottom - br} A ${br} ${br} 0 0 1 ${right - br} ${bottom}
      H ${x + bl} A ${bl} ${bl} 0 0 1 ${x} ${bottom - bl}
      V ${y + tl} A ${tl} ${tl} 0 0 1 ${x + tl} ${y} Z`,
    corners: `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`,
  };
}

function relativeRect(node: Element, origin: DOMRect): DuoRect {
  const rect = node.getBoundingClientRect();
  return {
    x: rect.left - origin.left,
    y: rect.top - origin.top,
    width: rect.width,
    height: rect.height,
  };
}

export function RegionOverlay({
  frameRef,
  stageRef,
}: {
  frameRef: React.RefObject<HTMLDivElement>;
  stageRef: React.RefObject<HTMLDivElement>;
}) {
  const screen = useDuoState(
    (state) => state.screens[state.posture === "open" ? "inner" : "outer"],
  );
  const cameraActive = useDuoState((state) => state.system.cameraActive);
  const [layout, setLayout] = React.useState<{
    transform: DOMMatrix;
    frame: DuoRect;
    width: number;
  }>();

  React.useLayoutEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    const display = frame?.querySelector(`[data-duo-display="${screen.display}"]`);
    const rotation = frame?.querySelector(".duo-rotation");
    if (!stage || !frame || !display || !rotation) return;
    let pending = 0;
    const measure = () => {
      const origin = stage.getBoundingClientRect();
      const bounds = relativeRect(display, origin);
      // Both transforms share the display center. Map logical coordinates through
      // the same matrix as the frame, including turns between calibrated layouts.
      const transform = new DOMMatrix()
        .translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
        .multiply(new DOMMatrix(getComputedStyle(rotation).transform))
        .multiply(new DOMMatrix(getComputedStyle(display).transform))
        .translate(-screen.size.width / 2, -screen.size.height / 2);
      setLayout({
        transform,
        frame: relativeRect(frame, origin),
        width: origin.width,
      });
    };
    const schedule = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(measure);
    };
    measure();
    const resize = new ResizeObserver(schedule);
    resize.observe(stage);
    resize.observe(frame);
    // A zoom transform changes viewport bounds without resizing the logical display.
    const mutation = new MutationObserver(schedule);
    mutation.observe(display, { attributes: true, attributeFilter: ["style"] });
    mutation.observe(rotation, { attributes: true, attributeFilter: ["style"] });
    return () => {
      cancelAnimationFrame(pending);
      resize.disconnect();
      mutation.disconnect();
    };
  }, [frameRef, stageRef, screen]);

  if (!layout) return null;
  const { transform, frame, width } = layout;
  const regions = getRegions(screen, cameraActive);
  const boundaries = {
    display: { bounds: { x: 0, y: 0, ...screen.size }, radii: screen.cornerRadii },
    window: { bounds: screen.window, radii: screen.windowCornerRadii },
  };
  const below = width < 640;
  const labels = [...regions]
    .sort((a, b) => a.y + a.height / 2 - b.y - b.height / 2)
    .map((region, index) => {
      const x = below ? 24 : frame.x + frame.width + 24;
      const y = (below ? frame.y + frame.height + 28 : 32) + index * 36;
      const corners = [
        { x: region.x, y: region.y },
        { x: region.x + region.width, y: region.y },
        { x: region.x + region.width, y: region.y + region.height },
        { x: region.x, y: region.y + region.height },
      ].map((point) => transform.transformPoint(point));
      const left = Math.max(frame.x, Math.min(...corners.map((point) => point.x)));
      const top = Math.max(frame.y, Math.min(...corners.map((point) => point.y)));
      const right = Math.min(frame.x + frame.width, Math.max(...corners.map((point) => point.x)));
      const bottom = Math.min(frame.y + frame.height, Math.max(...corners.map((point) => point.y)));
      return {
        region,
        x,
        y,
        targetX: (left + right) / 2,
        targetY: (top + bottom) / 2,
        visible: right > left && bottom > top,
      };
    });

  return (
    <svg className="demo-regions" role="img" aria-label="Safe area and reserved region overlay">
      <title>
        App safe area and insets for the current window; reserved regions for the whole display.
        Dimensions are logical pixels. Fills show exact bounds; dashed outlines are inset by 2
        pixels.
      </title>
      <defs>
        <clipPath id="demo-frame-clip">
          <rect {...frame} />
        </clipPath>
        {Object.entries(boundaries).map(([name, { bounds, radii }]) => (
          <React.Fragment key={name}>
            <clipPath id={`demo-${name}-clip`}>
              <path d={roundedBoundary(bounds, radii).outline} />
            </clipPath>
            <clipPath id={`demo-${name}-outline-clip`}>
              <path d={roundedBoundary(bounds, radii, 2).outline} />
            </clipPath>
          </React.Fragment>
        ))}
        {regions.map((region, index) => (
          <clipPath key={region.name} id={`demo-region-${index}-clip`}>
            <rect
              x={region.x + 2}
              y={region.y + 2}
              width={region.width - 4}
              height={region.height - 4}
            />
          </clipPath>
        ))}
      </defs>
      <g clipPath="url(#demo-frame-clip)">
        <g transform={transform.toString()}>
          <g clipPath="url(#demo-display-clip)">
            {regions.map((region, index) => (
              <g
                key={region.name}
                data-region={region.name}
                clipPath={`url(#demo-${region.scope ?? "window"}-clip)`}
              >
                <rect
                  x={region.x}
                  y={region.y}
                  width={region.width}
                  height={region.height}
                  fill={region.color}
                  fillOpacity={0.14}
                />
                <rect
                  x={region.x + 2}
                  y={region.y + 2}
                  width={Math.max(0, region.width - 4)}
                  height={Math.max(0, region.height - 4)}
                  fill="none"
                  stroke={region.color}
                  strokeWidth={1}
                  strokeDasharray="6 4"
                  clipPath={`url(#demo-${region.scope ?? "window"}-outline-clip)`}
                />
                <path
                  d={
                    roundedBoundary(
                      boundaries[region.scope ?? "window"].bounds,
                      boundaries[region.scope ?? "window"].radii,
                      2,
                    ).corners
                  }
                  clipPath={`url(#demo-region-${index}-clip)`}
                  fill="none"
                  stroke={region.color}
                  strokeWidth={1}
                  strokeDasharray="6 4"
                />
              </g>
            ))}
          </g>
        </g>
      </g>
      {labels.map(
        ({ region, x, y, targetX, targetY, visible }) =>
          visible && (
            <g key={region.name} stroke={region.color} fill="none" strokeWidth={1} opacity={0.7}>
              <path d={`M ${targetX} ${targetY} L ${x - 12} ${y - 4} H ${x - 4}`} />
              <circle cx={targetX} cy={targetY} r={2} fill={region.color} />
            </g>
          ),
      )}
      {labels.map(({ region, x, y, visible }) => {
        const size = `${Number(region.width.toFixed(2))} × ${Number(region.height.toFixed(2))} px`;
        return (
          <g key={region.name}>
            <rect x={x - 4} y={y - 16} width={190} height={34} fill="white" fillOpacity={0.95} />
            <text x={x} y={y} fill={region.color} fontSize={13} fontWeight={600}>
              {region.name}
            </text>
            <text x={x} y={y + 14} fill="#555" fontSize={11}>
              {size}
              {!visible && " · offscreen"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
