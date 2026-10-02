import * as React from "react";
import { useDuoState } from "./provider";
import { getSystemLayout, systemMetrics } from "./system-layout";
import type { DuoRect, DuoScreenInfo } from "./types";

// Ring, Wi-Fi, and cellular paths adapted from Doan Labs' Duo. See THIRD_PARTY_NOTICES.md.
const batteryArc = "M9.8 39.6a17 17 0 1 1 24.4 0";

function StatusGlyph() {
  const { battery, charging } = useDuoState((state) => state.system);
  return (
    <svg
      viewBox="0 0 44 52"
      width={systemMetrics.glyphWidth}
      height={systemMetrics.glyphHeight}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    >
      <path d={batteryArc} strokeWidth={3} opacity={0.2} />
      {battery > 0 && (
        <path d={batteryArc} strokeWidth={3} pathLength={100} strokeDasharray={`${battery} 100`} />
      )}
      {charging ? (
        <path d="M24 14 15 27h7l-2 11 10-15h-7z" fill="currentColor" stroke="none" />
      ) : (
        <g strokeWidth={2.5}>
          <path d="M13.4 21.8a13 13 0 0 1 17.2 0" />
          <path d="M16.9 26.3a8 8 0 0 1 10.2 0" />
          <path d="M20.4 30.8a3 3 0 0 1 3.2 0" />
        </g>
      )}
      <g fill="currentColor" stroke="none">
        <circle cx="13.4" cy="46.6" r="2" />
        <circle cx="19.1" cy="48.4" r="2" />
        <circle cx="24.9" cy="48.4" r="2" />
        <circle cx="30.6" cy="46.6" r="2" />
      </g>
    </svg>
  );
}

function boundsStyle(bounds: DuoRect) {
  return { left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height };
}

export function SystemChrome({
  screen,
  showIndicators,
}: {
  screen: DuoScreenInfo;
  showIndicators: boolean;
}) {
  const time = useDuoState((state) => state.system.time);
  const layout = React.useMemo(() => getSystemLayout(screen), [screen]);
  return (
    <div className="duo-system" aria-hidden="true">
      {layout.camera && <div className="duo-camera-cutout" style={boundsStyle(layout.camera)} />}
      {showIndicators && (
        <>
          <div
            className="duo-status"
            style={{
              ...boundsStyle(layout.status),
              flexDirection: layout.horizontal ? "row" : "column",
              gap: systemMetrics.gap,
              fontSize: systemMetrics.fontSize,
              lineHeight: `${systemMetrics.lineHeight}px`,
            }}
          >
            <span style={{ width: systemMetrics.timeWidth }}>{time}</span>
            <StatusGlyph />
          </div>
          <div className="duo-home" style={boundsStyle(layout.home)} />
        </>
      )}
    </div>
  );
}
