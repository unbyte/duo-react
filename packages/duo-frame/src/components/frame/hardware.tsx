import * as React from "react"
import type { DuoDisplay, DuoOrientation } from "../../core/types"

export const frameBezel = { inner: 18, outer: 12 } as const

export function frameOutset(display: DuoDisplay) {
  return frameBezel[display] + (display === "inner" ? 3 : 12)
}

// Projected silhouettes from docs/calibration/sources/inner-hardware.png,
// measured against its 951 × 669 display; physical thickness is unknown.
const innerButtons = [
  { name: "volume-left", x: 698, y: -21, width: 64, height: 4 },
  { name: "volume-right", x: 778, y: -21, width: 64, height: 4 },
  { name: "side", x: 968, y: 186, width: 4, height: 108 },
] as const

// Folded positions follow the projected meshes recorded in
// docs/calibration/hardware-measurements.json; protrusion follows our CSS rim.
const outerButtons = [
  { name: "volume-left", x: 210, y: -15, width: 64, height: 4 },
  { name: "volume-right", x: 291, y: -15, width: 64, height: 4 },
  { name: "side", x: 477, y: 186, width: 4, height: 110 },
] as const

const rotation: Record<DuoDisplay, Record<DuoOrientation, number>> = {
  inner: { "landscape-left": 0, "landscape-right": 180, portrait: -90, "portrait-upside-down": 90 },
  outer: { "landscape-left": 90, "landscape-right": -90, portrait: 0, "portrait-upside-down": 180 },
}

export function Hardware({
  display,
  orientation,
}: {
  display: DuoDisplay
  orientation: DuoOrientation
}) {
  const inner = display === "inner"
  const buttons = inner ? innerButtons : outerButtons
  return (
    <div
      className="duo-hardware"
      aria-hidden="true"
      style={{
        width: inner ? 951 : 466,
        height: inner ? 669 : 678,
        transform: `translate(-50%, -50%) rotate(${rotation[display][orientation]}deg)`,
      }}
    >
      {!inner && (
        <>
          <span className="duo-hinge-spine" />
          <span className="duo-outer-body" />
          <span className="duo-outer-glass" />
        </>
      )}
      {buttons.map(({ name, x, y, width, height }) => (
        <span
          key={name}
          className="duo-hardware-button"
          data-duo-hardware={name}
          style={{ left: x, top: y, width, height }}
        />
      ))}
      {inner && (
        <>
          <span className="duo-hinge-cap duo-hinge-cap-top" />
          <span className="duo-hinge-cap duo-hinge-cap-bottom" />
        </>
      )}
    </div>
  )
}
