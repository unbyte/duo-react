import * as React from "react"
import { useDuoScreen } from "duo-react"

const initialPosition = { x: 0.6, y: 0.55 }
const initialSize = { width: 144, height: 144 }
const clamp = (value: number) => Math.max(0, Math.min(1, value))

export function DraggableBlock({ visible, color }: { visible: boolean; color: string }) {
  const screen = useDuoScreen()
  const { width, height } = screen.window
  const [size, setSize] = React.useState(initialSize)
  const blockWidth = Math.min(size.width, width)
  const blockHeight = Math.min(size.height, height)
  const rangeX = width - blockWidth
  const rangeY = height - blockHeight
  const [position, setPosition] = React.useState(initialPosition)
  const drag = React.useRef<
    | {
        pointerId: number
        mode: "move" | "resize"
        x: number
        y: number
        offsetX: number
        offsetY: number
      }
    | undefined
  >(undefined)
  const svg = React.useRef<SVGSVGElement>(null)
  const x = position.x * rangeX
  const y = position.y * rangeY

  React.useEffect(() => {
    drag.current = undefined
  }, [width, height, screen.orientation, visible])

  function localPoint(clientX: number, clientY: number) {
    const matrix = svg.current?.getScreenCTM()
    if (!matrix || !svg.current) return
    const point = svg.current.createSVGPoint()
    point.x = clientX
    point.y = clientY
    return point.matrixTransform(matrix.inverse())
  }

  function start(event: React.PointerEvent<SVGElement>, mode: "move" | "resize") {
    if (!event.isPrimary || event.button !== 0 || drag.current) return
    const point = localPoint(event.clientX, event.clientY)
    if (!point) return
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    svg.current!.setPointerCapture(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      mode,
      x,
      y,
      offsetX: point.x - (mode === "move" ? x : blockWidth),
      offsetY: point.y - (mode === "move" ? y : blockHeight),
    }
  }

  function resize(nextWidth: number, nextHeight: number, anchorX = x, anchorY = y) {
    const resizedWidth = Math.min(width - anchorX, Math.max(72, nextWidth))
    const resizedHeight = Math.min(height - anchorY, Math.max(72, nextHeight))
    setSize({ width: resizedWidth, height: resizedHeight })
    // Keep the top-left corner fixed while storing position relative to the new travel range.
    setPosition({
      x: width > resizedWidth ? clamp(anchorX / (width - resizedWidth)) : 0,
      y: height > resizedHeight ? clamp(anchorY / (height - resizedHeight)) : 0,
    })
  }

  function keyDown(event: React.KeyboardEvent<SVGElement>, mode: "move" | "resize") {
    if (["Home", "Enter", " "].includes(event.key)) {
      event.preventDefault()
      setPosition(initialPosition)
      setSize(initialSize)
      return
    }
    const step = event.shiftKey ? 1 : 10
    const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0
    const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0
    if (!dx && !dy) return
    event.preventDefault()
    if (mode === "resize") resize(blockWidth + dx, blockHeight + dy)
    else
      setPosition((current) => ({
        x: rangeX ? clamp(current.x + dx / rangeX) : 0,
        y: rangeY ? clamp(current.y + dy / rangeY) : 0,
      }))
  }

  if (!visible) return null

  return (
    <svg
      ref={svg}
      className="playground-block-layer pointer-events-none absolute inset-0 size-full select-none"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      onPointerMove={(event) => {
        const current = drag.current
        if (!current || current.pointerId !== event.pointerId) return
        const point = localPoint(event.clientX, event.clientY)
        if (!point) return
        if (current.mode === "resize")
          resize(point.x - current.offsetX, point.y - current.offsetY, current.x, current.y)
        else
          setPosition({
            x: rangeX ? clamp((point.x - current.offsetX) / rangeX) : 0,
            y: rangeY ? clamp((point.y - current.offsetY) / rangeY) : 0,
          })
      }}
      onPointerUp={(event) => {
        if (drag.current?.pointerId !== event.pointerId) return
        drag.current = undefined
        event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onPointerCancel={() => (drag.current = undefined)}
      onLostPointerCapture={() => (drag.current = undefined)}
    >
      <rect
        className="playground-color-block pointer-events-auto touch-none cursor-grab active:cursor-grabbing focus:outline-none"
        fill={color}
        x={x}
        y={y}
        width={blockWidth}
        height={blockHeight}
        rx={12}
        role="button"
        tabIndex={0}
        aria-label="Draggable color block"
        onPointerDown={(event) => start(event, "move")}
        onKeyDown={(event) => keyDown(event, "move")}
      >
        <title>Drag to move. Arrow keys move; Shift moves precisely; Home resets.</title>
      </rect>
      <text
        className="fill-white text-base font-semibold [text-anchor:middle] [dominant-baseline:central]"
        x={x + blockWidth / 2}
        y={y + blockHeight / 2}
        aria-hidden="true"
      >
        Drag me
      </text>
      <g
        className="playground-block-resize pointer-events-auto touch-none cursor-nwse-resize focus:outline-none"
        transform={`translate(${x + blockWidth - 28} ${y + blockHeight - 28})`}
        role="button"
        tabIndex={0}
        aria-label="Resize color block"
        onPointerDown={(event) => start(event, "resize")}
        onKeyDown={(event) => keyDown(event, "resize")}
      >
        <title>Drag to resize. Arrow keys resize; Shift adjusts precisely; Home resets.</title>
        <rect className="fill-transparent" width={28} height={28} rx={8} />
        <path
          className="pointer-events-none fill-none stroke-white stroke-2 [stroke-linecap:round]"
          d="M9 21 21 9 M15 21 21 15"
        />
      </g>
    </svg>
  )
}
