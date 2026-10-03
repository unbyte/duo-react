import * as React from "react";
import { useDuoScreen } from "duo-frame";

const initialPosition = { x: 0.6, y: 0.55 };
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function DraggableBlock({ visible }: { visible: boolean }) {
  const screen = useDuoScreen();
  const { width, height } = screen.window;
  const size = Math.min(144, width, height);
  const rangeX = width - size;
  const rangeY = height - size;
  const [position, setPosition] = React.useState(initialPosition);
  const drag = React.useRef<{ pointerId: number; offsetX: number; offsetY: number }>();
  const svg = React.useRef<SVGSVGElement>(null);
  const x = position.x * rangeX;
  const y = position.y * rangeY;

  React.useEffect(() => {
    drag.current = undefined;
  }, [width, height, screen.orientation, visible]);

  function localPoint(clientX: number, clientY: number) {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix || !svg.current) return;
    const point = svg.current.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(matrix.inverse());
  }

  if (!visible) return null;

  return (
    <svg
      ref={svg}
      className="demo-block-layer"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <rect
        className="demo-color-block"
        x={x}
        y={y}
        width={size}
        height={size}
        rx={12}
        role="button"
        tabIndex={0}
        aria-label="Draggable color block"
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0 || drag.current) return;
          const point = localPoint(event.clientX, event.clientY);
          if (!point) return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            pointerId: event.pointerId,
            offsetX: point.x - x,
            offsetY: point.y - y,
          };
        }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current || current.pointerId !== event.pointerId) return;
          const point = localPoint(event.clientX, event.clientY);
          if (!point) return;
          setPosition({
            x: rangeX ? clamp((point.x - current.offsetX) / rangeX) : 0,
            y: rangeY ? clamp((point.y - current.offsetY) / rangeY) : 0,
          });
        }}
        onPointerUp={(event) => {
          if (drag.current?.pointerId !== event.pointerId) return;
          drag.current = undefined;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => (drag.current = undefined)}
        onLostPointerCapture={() => (drag.current = undefined)}
        onKeyDown={(event) => {
          if (["Home", "Enter", " "].includes(event.key)) {
            event.preventDefault();
            setPosition(initialPosition);
            return;
          }
          const step = event.shiftKey ? 1 : 10;
          const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
          const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
          if (!dx && !dy) return;
          event.preventDefault();
          setPosition((current) => ({
            x: rangeX ? clamp(current.x + dx / rangeX) : 0,
            y: rangeY ? clamp(current.y + dy / rangeY) : 0,
          }));
        }}
      >
        <title>Drag to move. Arrow keys move; Shift moves precisely; Home resets.</title>
      </rect>
      <text x={x + size / 2} y={y + size / 2} aria-hidden="true">
        Drag me
      </text>
    </svg>
  );
}
