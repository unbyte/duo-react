import * as React from "react"
import {
  hardwareProfiles,
  hardwareRotation,
  type DuoDisplay,
  type DuoOrientation,
} from "@duo-react/profiles"

export function Hardware({
  display,
  orientation,
}: {
  display: DuoDisplay
  orientation: DuoOrientation
}) {
  const inner = display === "inner"
  const { width, height, buttons } = hardwareProfiles[display]
  return (
    <div
      className="duo-react-hardware"
      aria-hidden="true"
      style={{
        width,
        height,
        transform: `translate(-50%, -50%) rotate(${hardwareRotation[display][orientation]}deg)`,
      }}
    >
      {!inner && (
        <>
          <span className="duo-react-hinge-spine" />
          <span className="duo-react-outer-body" />
          <span className="duo-react-outer-glass" />
        </>
      )}
      {buttons.map(({ name, x, y, width, height }) => (
        <span
          key={name}
          className="duo-react-hardware-button"
          data-duo-react-hardware={name}
          style={{ left: x, top: y, width, height }}
        />
      ))}
      {inner && (
        <>
          <span className="duo-react-hinge-cap duo-react-hinge-cap-top" />
          <span className="duo-react-hinge-cap duo-react-hinge-cap-bottom" />
        </>
      )}
    </div>
  )
}
