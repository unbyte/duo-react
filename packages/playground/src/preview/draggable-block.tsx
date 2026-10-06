import { useDuoScreen } from 'duo-react'
import * as React from 'react'

const initialPosition = { x: 0.6, y: 0.55 }
const initialSize = { width: 144, height: 144 }
const minimumSize = 128
const unitVisibilitySize = 160
const baseRadius = 8
const clamp = (value: number) => Math.max(0, Math.min(1, value))

export function DraggableBlock({ visible, color }: { visible: boolean; color: string }) {
  const screen = useDuoScreen()
  const { width, height } = screen.window
  const [size, setSize] = React.useState(initialSize)
  const blockWidth = Math.min(size.width, width)
  const blockHeight = Math.min(size.height, height)
  const unit =
    blockWidth >= unitVisibilitySize && blockHeight >= unitVisibilitySize ? (
      <tspan className="playground-block-unit fill-white/50"> pt</tspan>
    ) : undefined
  const rangeX = width - blockWidth
  const rangeY = height - blockHeight
  const [position, setPosition] = React.useState(initialPosition)
  const drag = React.useRef<
    | {
        pointerId: number
        mode: 'move' | 'resize'
        x: number
        y: number
        offsetX: number
        offsetY: number
      }
    | undefined
  >(undefined)
  const svg = React.useRef<SVGSVGElement>(null)
  const x = Math.round(position.x * rangeX)
  const y = Math.round(position.y * rangeY)
  const edgeDistances = { top: y, right: rangeX - x, bottom: rangeY - y, left: x }
  const gaps = [
    Math.max(x, y),
    Math.max(rangeX - x, y),
    Math.max(rangeX - x, rangeY - y),
    Math.max(x, rangeY - y),
  ]
  // Use the larger adjacent gap so rounding only grows near both edges of a corner.
  const radii = screen.windowCornerRadii.map((outerRadius, index) =>
    Math.min(blockWidth / 2, blockHeight / 2, Math.max(baseRadius, outerRadius - gaps[index])),
  )
  // Let the window clip a coincident corner once, avoiding an antialiased seam.
  const [topLeft, topRight, bottomRight, bottomLeft] = radii.map((value, index) =>
    gaps[index] === 0 && value === screen.windowCornerRadii[index] ? 0 : value,
  )
  const right = x + blockWidth
  const bottom = y + blockHeight
  const outline = [
    `M ${x + topLeft} ${y}`,
    `H ${right - topRight} A ${topRight} ${topRight} 0 0 1 ${right} ${y + topRight}`,
    `V ${bottom - bottomRight} A ${bottomRight} ${bottomRight} 0 0 1 ${right - bottomRight} ${bottom}`,
    `H ${x + bottomLeft} A ${bottomLeft} ${bottomLeft} 0 0 1 ${x} ${bottom - bottomLeft}`,
    `V ${y + topLeft} A ${topLeft} ${topLeft} 0 0 1 ${x + topLeft} ${y} Z`,
  ].join(' ')
  const radiusLabels = radii.map((value) => value.toFixed(1))
  const gripRadius = radii[2] - 3
  const gripHalfAngle = Math.min(Math.PI / 4, 12 / gripRadius)
  const gripStart = Math.PI / 4 - gripHalfAngle
  const gripEnd = Math.PI / 4 + gripHalfAngle
  const gripCenterX = right - radii[2]
  const gripCenterY = bottom - radii[2]
  const grip = [
    `M ${gripCenterX + gripRadius * Math.cos(gripStart)} ${gripCenterY + gripRadius * Math.sin(gripStart)}`,
    `A ${gripRadius} ${gripRadius} 0 0 1 ${gripCenterX + gripRadius * Math.cos(gripEnd)} ${gripCenterY + gripRadius * Math.sin(gripEnd)}`,
  ].join(' ')

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

  function start(event: React.PointerEvent<SVGElement>, mode: 'move' | 'resize') {
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
      offsetX: point.x - (mode === 'move' ? x : blockWidth),
      offsetY: point.y - (mode === 'move' ? y : blockHeight),
    }
  }

  function resize(nextWidth: number, nextHeight: number, anchorX = x, anchorY = y) {
    const resizedWidth = Math.min(width - anchorX, Math.max(minimumSize, Math.round(nextWidth)))
    const resizedHeight = Math.min(height - anchorY, Math.max(minimumSize, Math.round(nextHeight)))
    setSize({ width: resizedWidth, height: resizedHeight })
    // Keep the top-left corner fixed while storing position relative to the new travel range.
    setPosition({
      x: width > resizedWidth ? clamp(anchorX / (width - resizedWidth)) : 0,
      y: height > resizedHeight ? clamp(anchorY / (height - resizedHeight)) : 0,
    })
  }

  function keyDown(event: React.KeyboardEvent<SVGElement>, mode: 'move' | 'resize') {
    if (['Home', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      setPosition(initialPosition)
      setSize(initialSize)
      return
    }
    const step = event.shiftKey ? 1 : 10
    const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
    const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
    if (!dx && !dy) return
    event.preventDefault()
    if (mode === 'resize') resize(blockWidth + dx, blockHeight + dy)
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
        if (current.mode === 'resize')
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
      <path
        className="playground-color-block pointer-events-auto touch-none cursor-grab active:cursor-grabbing focus:outline-none"
        fill={color}
        d={outline}
        role="button"
        tabIndex={0}
        aria-label={`Draggable color block. Width ${blockWidth} points, height ${blockHeight} points. Edge distances in points: top ${edgeDistances.top}, right ${edgeDistances.right}, bottom ${edgeDistances.bottom}, left ${edgeDistances.left}. Corner radii in points: top left ${radiusLabels[0]}, top right ${radiusLabels[1]}, bottom right ${radiusLabels[2]}, bottom left ${radiusLabels[3]}.`}
        onPointerDown={(event) => start(event, 'move')}
        onKeyDown={(event) => keyDown(event, 'move')}
      >
        <title>
          Drag to move in whole points. Arrow keys move; Shift moves by 1 pt; Home resets.
        </title>
      </path>
      <text
        className="playground-block-size fill-white font-mono text-[11px] font-medium tabular-nums [text-anchor:middle] [dominant-baseline:central]"
        x={x + blockWidth / 2}
        y={y + blockHeight / 2}
        aria-hidden="true"
      >
        {`${blockWidth} × ${blockHeight}`}
        {unit}
      </text>
      <g
        className="playground-block-radii fill-white font-mono text-[9px] text-white tabular-nums [text-anchor:middle] [dominant-baseline:central]"
        aria-hidden="true"
      >
        {radiusLabels.map((value, index) => {
          const inset = Math.max(12, radii[index] * (1 - Math.SQRT1_2) + 10)
          const left = index === 0 || index === 3
          const top = index < 2
          const labelX = left ? x + inset - 4 : right - inset + 4
          const labelY = top ? y + inset : bottom - inset
          return (
            <text key={index} x={labelX} y={labelY} textAnchor={left ? 'start' : 'end'}>
              {value}
              {unit}
            </text>
          )
        })}
      </g>
      <g
        className="playground-block-position fill-white font-mono text-[9px] tabular-nums [text-anchor:middle] [dominant-baseline:central]"
        aria-hidden="true"
      >
        <text x={x + blockWidth / 2} y={y + 11}>
          {edgeDistances.top}
          {unit}
        </text>
        <text transform={`translate(${right - 11} ${y + blockHeight / 2}) rotate(90)`}>
          {edgeDistances.right}
          {unit}
        </text>
        <text x={x + blockWidth / 2} y={bottom - 11}>
          {edgeDistances.bottom}
          {unit}
        </text>
        <text transform={`translate(${x + 11} ${y + blockHeight / 2}) rotate(-90)`}>
          {edgeDistances.left}
          {unit}
        </text>
      </g>
      <g
        className="playground-block-resize pointer-events-auto touch-none cursor-nwse-resize focus:outline-none [&:focus-visible>path:last-child]:stroke-[3.5]"
        role="button"
        tabIndex={0}
        aria-label="Resize color block"
        onPointerDown={(event) => start(event, 'resize')}
        onKeyDown={(event) => keyDown(event, 'resize')}
      >
        <title>Drag to resize. Arrow keys resize; Shift adjusts precisely; Home resets.</title>
        <path
          d={grip}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          strokeLinecap="round"
          pointerEvents="stroke"
        />
        <path
          className="pointer-events-none fill-none stroke-white [stroke-linecap:round]"
          strokeWidth={2.5}
          d={grip}
        />
      </g>
    </svg>
  )
}
