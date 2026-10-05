import * as React from "react"
import { useBackdropStore } from "../../context/backdrop-context"
import { useDuoState } from "../../context/hooks"
import { getSystemLayout, systemMetrics } from "../../core/layout/system"
import type { DuoRect, DuoScreenInfo } from "../../core/types"
import { StatusGlyph } from "./status-glyph"
import { SystemIndicator } from "./system-indicator"

function boundsStyle(bounds: DuoRect) {
  return { left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height }
}

export function SystemMaterial({ screen }: { screen: DuoScreenInfo }) {
  const store = useBackdropStore()
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const area = React.useMemo(() => getSystemLayout(screen).material, [screen])
  React.useEffect(() => {
    const draw = () => {
      const frame = store.getSnapshot().frame
      const output = canvas.current
      if (!frame || !output) return
      const scale = frame.canvas.width / frame.width
      output.width = Math.ceil(area.width * scale)
      output.height = Math.ceil(area.height * scale)
      const context = output.getContext("2d")!
      context.drawImage(
        frame.statusBlur,
        area.x * scale,
        area.y * scale,
        area.width * scale,
        area.height * scale,
        0,
        0,
        output.width,
        output.height,
      )
    }
    const unsubscribe = store.subscribe(draw)
    draw()
    return unsubscribe
  }, [area, store])
  return (
    <canvas
      ref={canvas}
      className="duo-status-material"
      style={boundsStyle(area)}
      aria-hidden="true"
    />
  )
}

export function SystemChrome({
  screen,
  showIndicators,
}: {
  screen: DuoScreenInfo
  showIndicators: boolean
}) {
  const {
    time,
    battery,
    charging,
    wifiStrength,
    cellularStrength,
    indicatorStyles,
    homeIndicatorVisible,
  } = useDuoState((state) => state.system)
  const appearance = indicatorStyles[screen.display]
  const showStatus = showIndicators && screen.statusBarVisible
  const layout = React.useMemo(() => getSystemLayout(screen), [screen])
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
                fontSize: systemMetrics.fontSize,
                lineHeight: `${systemMetrics.lineHeight}px`,
              }}
            >
              <SystemIndicator
                className="duo-status-time"
                sample="time"
                appearance={appearance.statusBar}
                width={systemMetrics.timeWidth}
                height={systemMetrics.lineHeight}
                style={{
                  position: "absolute",
                  left: layout.time.x - layout.status.x,
                  top: layout.time.y - layout.status.y,
                }}
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
                foreground={
                  charging ? (
                    <StatusGlyph
                      battery={battery}
                      charging={charging}
                      wifiStrength={wifiStrength}
                      cellularStrength={cellularStrength}
                      layer="accent"
                      width={systemMetrics.glyphWidth}
                      height={systemMetrics.glyphHeight}
                    />
                  ) : undefined
                }
                sample="glyph"
                appearance={appearance.statusBar}
                width={systemMetrics.glyphWidth}
                height={systemMetrics.glyphHeight}
                style={{
                  position: "absolute",
                  left: layout.glyph.x - layout.status.x,
                  top: layout.glyph.y - layout.status.y,
                }}
              >
                <StatusGlyph
                  layer="adaptive"
                  battery={battery}
                  charging={charging}
                  wifiStrength={wifiStrength}
                  cellularStrength={cellularStrength}
                  width={systemMetrics.glyphWidth}
                  height={systemMetrics.glyphHeight}
                />
              </SystemIndicator>
            </div>
          )}
          {homeIndicatorVisible && (
            <SystemIndicator
              className="duo-home"
              sample="home"
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
  )
}
