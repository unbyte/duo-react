import * as React from "react";
import { useDuoState } from "./provider";
import { getSystemLayout, systemMetrics } from "./system-layout";
import type { DuoRect, DuoScreenInfo } from "./types";
import { StatusGlyph } from "./status-glyph";
import { useIndicatorContrast } from "./use-indicator-contrast";

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
  const { time, battery, charging, indicatorStyles, homeIndicatorVisible } = useDuoState(
    (state) => state.system,
  );
  const appearance = indicatorStyles[screen.display];
  const layout = React.useMemo(() => getSystemLayout(screen), [screen]);
  const chrome = React.useRef<HTMLDivElement>(null);
  const contrast = useIndicatorContrast(
    chrome,
    screen,
    showIndicators && appearance.statusBar === "auto",
    showIndicators && homeIndicatorVisible && appearance.homeIndicator === "auto",
  );
  const statusColor = (control: "time" | "glyph") =>
    appearance.statusBar === "auto" ? contrast.colors[control] : appearance.statusBar;
  return (
    <div ref={chrome} className="duo-system" aria-hidden="true">
      {showIndicators && (
        <div className="duo-status-material" style={boundsStyle(layout.material)} />
      )}
      {layout.camera && <div className="duo-camera-cutout" style={boundsStyle(layout.camera)} />}
      {showIndicators && (
        <>
          {layout.divider && <div className="duo-divider" style={boundsStyle(layout.divider)} />}
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
            <span
              ref={contrast.time}
              className="duo-status-time"
              data-duo-indicator-style={appearance.statusBar}
              data-duo-resolved-style={statusColor("time")}
              style={{ width: systemMetrics.timeWidth }}
            >
              {time}
            </span>
            <span
              ref={contrast.glyph}
              className="duo-status-glyph"
              data-duo-indicator-style={appearance.statusBar}
              data-duo-resolved-style={statusColor("glyph")}
              style={{ width: systemMetrics.glyphWidth, height: systemMetrics.glyphHeight }}
            >
              <StatusGlyph battery={battery} charging={charging} />
            </span>
          </div>
          {homeIndicatorVisible && (
            <div
              ref={contrast.home}
              className="duo-home"
              data-duo-indicator-style={appearance.homeIndicator}
              data-duo-resolved-style={
                appearance.homeIndicator === "auto"
                  ? contrast.colors.home
                  : appearance.homeIndicator
              }
              style={boundsStyle(layout.home)}
            />
          )}
        </>
      )}
    </div>
  );
}
