import * as React from "react";
import { useDuoState } from "./provider";
import { getSystemLayout, systemMetrics } from "./system-layout";
import type { DuoRect, DuoScreenInfo } from "./types";
import { StatusGlyph } from "./status-glyph";

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
  const { time, battery, charging, indicatorStyles } = useDuoState((state) => state.system);
  const appearance = indicatorStyles[screen.display];
  const layout = React.useMemo(() => getSystemLayout(screen), [screen]);
  return (
    <div className="duo-system" aria-hidden="true">
      {layout.camera && <div className="duo-camera-cutout" style={boundsStyle(layout.camera)} />}
      {showIndicators && (
        <>
          <div
            className="duo-status"
            data-duo-indicator-style={appearance.statusBar}
            style={{
              ...boundsStyle(layout.status),
              flexDirection: layout.horizontal ? "row" : "column",
              gap: systemMetrics.gap,
              fontSize: systemMetrics.fontSize,
              lineHeight: `${systemMetrics.lineHeight}px`,
            }}
          >
            <span style={{ width: systemMetrics.timeWidth }}>{time}</span>
            <span
              className="duo-status-glyph"
              style={{ width: systemMetrics.glyphWidth, height: systemMetrics.glyphHeight }}
            >
              <StatusGlyph battery={battery} charging={charging} />
            </span>
          </div>
          <div
            className="duo-home"
            data-duo-indicator-style={appearance.homeIndicator}
            style={boundsStyle(layout.home)}
          />
        </>
      )}
    </div>
  );
}
