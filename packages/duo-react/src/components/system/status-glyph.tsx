import type { DuoSystem } from '@private/core'
import React from 'react'

const statusArtwork = { width: 104, height: 108 } as const

const center = 52

function arcOutline(
  radius: number,
  thickness: number,
  centerY: number,
  startDegrees: number,
  endDegrees: number,
) {
  const half = thickness / 2
  const outer = radius + half
  const inner = radius - half
  const large = endDegrees - startDegrees > 180 ? 1 : 0
  const point = (radius: number, degrees: number) => {
    const angle = (degrees * Math.PI) / 180
    return `${center + Math.cos(angle) * radius} ${centerY + Math.sin(angle) * radius}`
  }
  // Fill both edges and semicircular caps instead of relying on stroke tessellation.
  return `M${point(outer, startDegrees)} A${outer} ${outer} 0 ${large} 1 ${point(outer, endDegrees)} A${half} ${half} 0 0 1 ${point(inner, endDegrees)} A${inner} ${inner} 0 ${large} 0 ${point(inner, startDegrees)} A${half} ${half} 0 0 1 ${point(outer, startDegrees)} Z`
}

function batteryArc(level: number) {
  return arcOutline(47.5, 6.5, center, 150, 150 + level * 2.4)
}

const batteryTrack = batteryArc(100)
// Enclose the entire clearance circle, including the part above the viewport,
// so the even-odd clip cannot fill that protruding area back in.
const chargingClip =
  'path(evenodd, "M-104-108H208V216H-104Z M66 7a14 14 0 1 0-28 0a14 14 0 1 0 28 0Z") view-box'
const wifiArcs = [27, 15].map((radius) => arcOutline(radius, 6, 62, 225, 315))
const cellularDots = [-30, -10, 10, 30].map((degrees) => {
  const angle = (degrees * Math.PI) / 180
  return { x: center + Math.sin(angle) * 47, y: center + Math.cos(angle) * 47 }
})

export function StatusGlyph({
  battery,
  charging,
  wifiStrength,
  cellularStrength,
  layer = 'all',
  width = '100%',
  height = '100%',
}: Pick<DuoSystem, 'battery' | 'charging' | 'wifiStrength' | 'cellularStrength'> & {
  width?: number | string
  height?: number | string
  layer?: 'all' | 'adaptive' | 'accent'
}) {
  const showBattery = layer === 'all' || layer === (charging ? 'accent' : 'adaptive')
  return (
    <svg
      viewBox={`0 0 ${statusArtwork.width} ${statusArtwork.height}`}
      width={width}
      height={height}
      fill="currentColor"
      stroke="none"
      focusable="false"
      style={{ overflow: 'visible' }}
    >
      {showBattery && (
        <g
          fill={charging ? '#34c759' : 'currentColor'}
          style={charging ? { clipPath: chargingClip } : undefined}
        >
          {battery < 100 && <path d={batteryTrack} opacity={0.2} />}
          {battery > 0 && <path d={batteryArc(battery)} />}
        </g>
      )}
      {layer !== 'accent' && (
        <>
          {charging && (
            <path d="M56 -3 43 12h8l-3 11L61 7h-8z" opacity={0.5} transform="translate(0 -3)" />
          )}
          {wifiArcs.map((arc, index) => (
            <path key={arc} d={arc} opacity={wifiStrength >= 3 - index ? 1 : 0.25} />
          ))}
          <circle cx={center} cy={62} r={5} opacity={wifiStrength > 0 ? 1 : 0.25} />
          <g>
            {cellularDots.map(({ x, y }, index) => (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={4.5}
                opacity={index < cellularStrength ? 1 : 0.25}
              />
            ))}
          </g>
        </>
      )}
    </svg>
  )
}
