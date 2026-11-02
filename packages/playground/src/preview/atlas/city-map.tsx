import { useDuoScreen } from 'duo-react'
import * as React from 'react'
import { MapArt } from './map-art'
import type { initialCenter, Place } from './places'

export function CityMap({
  places,
  selected,
  onSelect,
  zoom,
  center,
  onCenterChange,
  showLabels,
  interactive,
}: {
  places: readonly Place[]
  selected?: string
  onSelect: (place: Place) => void
  zoom: number
  center: typeof initialCenter
  onCenterChange: (center: typeof initialCenter) => void
  showLabels: boolean
  interactive: boolean
}) {
  const { window: size } = useDuoScreen()
  const svg = React.useRef<SVGSVGElement>(null)
  const drag = React.useRef<
    | { pointerId: number; x: number; y: number; center: typeof initialCenter; moved: boolean }
    | undefined
  >(undefined)
  const suppressClick = React.useRef(false)
  function point(clientX: number, clientY: number) {
    const matrix = svg.current?.getScreenCTM()
    if (!matrix) return
    return new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse())
  }
  function clampCenter(x: number, y: number) {
    const halfWidth = Math.min(1200, size.width / zoom / 2)
    const halfHeight = Math.min(1200, size.height / zoom / 2)
    return {
      x: Math.max(halfWidth, Math.min(2400 - halfWidth, x)),
      y: Math.max(halfHeight, Math.min(2400 - halfHeight, y)),
    }
  }
  const viewCenter = clampCenter(center.x, center.y)
  return (
    <svg
      ref={svg}
      className="atlas-map"
      viewBox={`0 0 ${size.width} ${size.height}`}
      role="application"
      aria-label="City map. Drag to explore, or use arrow keys to pan."
      tabIndex={interactive ? 0 : -1}
      aria-hidden={!interactive}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return
        const local = point(event.clientX, event.clientY)
        if (!local) return
        suppressClick.current = false
        drag.current = {
          pointerId: event.pointerId,
          x: local.x,
          y: local.y,
          center: viewCenter,
          moved: false,
        }
      }}
      onPointerMove={(event) => {
        const current = drag.current
        if (!current || current.pointerId !== event.pointerId) return
        const local = point(event.clientX, event.clientY)
        if (!local) return
        const dx = local.x - current.x,
          dy = local.y - current.y
        if (!current.moved && Math.hypot(dx, dy) < 4) return
        current.moved = true
        suppressClick.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
        onCenterChange(clampCenter(current.center.x - dx / zoom, current.center.y - dy / zoom))
      }}
      onPointerUp={(event) => {
        drag.current = undefined
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onPointerCancel={() => {
        drag.current = undefined
      }}
      onLostPointerCapture={() => {
        drag.current = undefined
      }}
      onClickCapture={(event) => {
        if (suppressClick.current) {
          event.stopPropagation()
          suppressClick.current = false
        }
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        const dx = event.key === 'ArrowLeft' ? -60 : event.key === 'ArrowRight' ? 60 : 0
        const dy = event.key === 'ArrowUp' ? -60 : event.key === 'ArrowDown' ? 60 : 0
        if (dx || dy) {
          event.preventDefault()
          onCenterChange(clampCenter(viewCenter.x + dx / zoom, viewCenter.y + dy / zoom))
        }
      }}
    >
      <g
        transform={`translate(${size.width / 2 - viewCenter.x * zoom} ${size.height / 2 - viewCenter.y * zoom}) scale(${zoom})`}
      >
        <MapArt />
        {places.map((place, index) => (
          <g
            key={place.id}
            transform={`translate(${place.x} ${place.y})`}
            className="atlas-marker"
            role="button"
            tabIndex={interactive ? 0 : -1}
            aria-label={`${place.name}, ${place.neighborhood}`}
            aria-pressed={selected === place.id}
            onClick={() => onSelect(place)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(place)
              }
            }}
          >
            <circle
              r={selected === place.id ? 24 : 18}
              fill={place.color}
              stroke="var(--atlas-road)"
              strokeWidth={4}
            />
            <text textAnchor="middle" dy={5} className="atlas-marker-icon">
              {place.category === 'Cafés' ? '☕' : place.category === 'Culture' ? '✦' : '♣'}
            </text>
            {showLabels && (selected === place.id || index % 4 === 0 || zoom >= 1.25) && (
              <text y={36} textAnchor="middle" className="atlas-place-label">
                {place.name}
              </text>
            )}
          </g>
        ))}
      </g>
    </svg>
  )
}
