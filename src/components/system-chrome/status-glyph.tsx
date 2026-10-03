import * as React from "react";
import type { DuoSystem } from "../../core/types";

export const statusArtwork = { width: 104, height: 108 } as const;

const center = 52;
const radius = 47.5;
const endX = (radius * Math.sqrt(3)) / 2;
const endY = center + radius / 2;
function batteryArc(level: number) {
  const angle = ((150 + level * 2.4) * Math.PI) / 180;
  return `M${center - endX} ${endY} A${radius} ${radius} 0 ${level > 75 ? 1 : 0} 1 ${center + Math.cos(angle) * radius} ${center + Math.sin(angle) * radius}`;
}

const batteryTrack = batteryArc(100);
const wifiArcs = [27, 15].map((radius) => {
  const offset = radius / Math.SQRT2;
  return `M${center - offset} ${62 - offset} A${radius} ${radius} 0 0 1 ${center + offset} ${62 - offset}`;
});
const cellularDots = [-30, -10, 10, 30].map((degrees) => {
  const angle = (degrees * Math.PI) / 180;
  return { x: center + Math.sin(angle) * 47, y: center + Math.cos(angle) * 47 };
});

export function StatusGlyph({
  battery,
  charging,
  width = "100%",
  height = "100%",
}: Pick<DuoSystem, "battery" | "charging"> & {
  width?: number | string;
  height?: number | string;
}) {
  return (
    <svg
      viewBox={`0 0 ${statusArtwork.width} ${statusArtwork.height}`}
      width={width}
      height={height}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      focusable="false"
    >
      {battery < 100 && <path d={batteryTrack} strokeWidth={6.5} opacity={0.2} />}
      {battery > 0 && <path d={batteryArc(battery)} strokeWidth={6.5} />}
      {charging ? (
        <path d="m55 32-18 27h13l-4 22 21-32H53z" fill="currentColor" stroke="none" />
      ) : (
        <>
          {wifiArcs.map((arc) => (
            <path key={arc} d={arc} strokeWidth={6} />
          ))}
          <circle cx={center} cy={62} r={5} fill="currentColor" stroke="none" />
        </>
      )}
      <g fill="currentColor" stroke="none" opacity={0.25}>
        {cellularDots.map(({ x, y }, index) => (
          <circle key={index} cx={x} cy={y} r={4.5} />
        ))}
      </g>
    </svg>
  );
}
