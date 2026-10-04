import * as React from "react";
import { useDuoState } from "../../context/hooks";
import { getSystemLayout, systemMetrics } from "../../core/layout/system";
import type { DuoRect, DuoScreenInfo } from "../../core/types";
import { StatusGlyph } from "./status-glyph";
import { SystemIndicator } from "./system-indicator";

function boundsStyle(bounds: DuoRect) {
  return { left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height };
}

export function SystemMaterial({ screen }: { screen: DuoScreenInfo }) {
  return (
    <div className="duo-status-material" style={boundsStyle(getSystemLayout(screen).material)} />
  );
}

export function SystemChrome({
  screen,
  showIndicators,
  scale,
}: {
  screen: DuoScreenInfo;
  showIndicators: boolean;
  scale: number;
}) {
  const { time, battery, charging, indicatorStyles, homeIndicatorVisible } = useDuoState(
    (state) => state.system,
  );
  const appearance = indicatorStyles[screen.display];
  const showStatus = showIndicators && screen.statusBarVisible;
  const layout = React.useMemo(() => getSystemLayout(screen), [screen]);
  return (
    <div className="duo-system" aria-hidden="true">
      {layout.camera && <div className="duo-camera-cutout" style={boundsStyle(layout.camera)} />}
      {showIndicators && (
        <>
          {layout.divider && <div className="duo-divider" style={boundsStyle(layout.divider)} />}
          {showStatus && (
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
              <SystemIndicator
                className="duo-status-time"
                scale={scale}
                appearance={appearance.statusBar}
                width={systemMetrics.timeWidth}
                height={systemMetrics.lineHeight}
              >
                <svg
                  width={systemMetrics.timeWidth}
                  height={systemMetrics.lineHeight}
                  focusable="false"
                >
                  <text
                    x="50%"
                    y="50%"
                    dominantBaseline="central"
                    textAnchor="middle"
                    fill="currentColor"
                  >
                    {time}
                  </text>
                </svg>
              </SystemIndicator>
              <SystemIndicator
                className="duo-status-glyph"
                scale={scale}
                appearance={appearance.statusBar}
                width={systemMetrics.glyphWidth}
                height={systemMetrics.glyphHeight}
              >
                <StatusGlyph
                  battery={battery}
                  charging={charging}
                  width={systemMetrics.glyphWidth}
                  height={systemMetrics.glyphHeight}
                />
              </SystemIndicator>
            </div>
          )}
          {homeIndicatorVisible && (
            <SystemIndicator
              className="duo-home"
              scale={scale}
              appearance={appearance.homeIndicator}
              width={layout.home.width}
              height={layout.home.height}
              style={{ left: layout.home.x, top: layout.home.y }}
            >
              <svg width={layout.home.width} height={layout.home.height} focusable="false">
                <rect
                  width={layout.home.width}
                  height={layout.home.height}
                  rx={3}
                  fill="currentColor"
                />
              </svg>
            </SystemIndicator>
          )}
        </>
      )}
    </div>
  );
}
