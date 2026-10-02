import * as React from "react";
import type { DuoSystem } from "./types";

export const statusArtwork = { width: 104, height: 108 } as const;

const center = 52;
const radius = 47.5;
const endX = (radius * Math.sqrt(3)) / 2;
const endY = center + radius / 2;
const batteryArc = `M${center - endX} ${endY} A${radius} ${radius} 0 1 1 ${center + endX} ${endY}`;
const cellularDots = [-30, -10, 10, 30].map((degrees) => {
  const angle = (degrees * Math.PI) / 180;
  return { x: center + Math.sin(angle) * 48.5, y: center + Math.cos(angle) * 48.5 };
});

export function StatusGlyph({ battery, charging }: Pick<DuoSystem, "battery" | "charging">) {
  return (
    <svg
      viewBox={`0 0 ${statusArtwork.width} ${statusArtwork.height}`}
      width="100%"
      height="100%"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      focusable="false"
    >
      <path d={batteryArc} strokeWidth={6} opacity={0.2} />
      {battery > 0 && (
        <path d={batteryArc} strokeWidth={6} pathLength={100} strokeDasharray={`${battery} 100`} />
      )}
      {charging ? (
        <path d="m55 32-18 27h13l-4 22 21-32H53z" fill="currentColor" stroke="none" />
      ) : (
        <>
          <path d="M34 44a26 26 0 0 1 36 0" strokeWidth={6} />
          <path d="M41.5 54.5a15 15 0 0 1 21 0" strokeWidth={6} />
          <circle cx={center} cy={64} r={5} fill="currentColor" stroke="none" />
        </>
      )}
      <g fill="currentColor" stroke="none">
        {cellularDots.map(({ x, y }, index) => (
          <circle key={index} cx={x} cy={y} r={4.5} />
        ))}
      </g>
    </svg>
  );
}
