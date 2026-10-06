import { type DuoScreenInfo, getSystemLayout } from '@private/core'
import { type DuoRect, systemMetrics } from '@private/profiles'
import React from 'react'
import { useBackdropStore } from '../../backdrop/backdrop-context'
import { useBackdropRegion } from '../../backdrop/use-backdrop-region'
import { useDuoState } from '../../context/hooks'
import { StatusGlyph } from './status-glyph'
import { SystemIndicator } from './system-indicator'

function boundsStyle(bounds: DuoRect) {
  return { left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height }
}

export function SystemMaterial({ screen }: { screen: DuoScreenInfo }) {
  const store = useBackdropStore()
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const area = React.useMemo(() => getSystemLayout(screen).material, [screen])
  const region = useBackdropRegion(() => ({ area, blur: 12 }))
  React.useEffect(() => {
    const draw = () => {
      const frame = store.getSnapshot().regions.get(region)
      const output = canvas.current
      if (!frame || !output) return
      const scale = frame.canvas.width / frame.width
      output.width = Math.ceil(area.width * scale)
      output.height = Math.ceil(area.height * scale)
      const context = output.getContext('2d')!
      context.drawImage(
        frame.blurred,
        (area.x - frame.x) * scale,
        (area.y - frame.y) * scale,
        area.width * scale,
        area.height * scale,
        0,
        0,
        output.width,
        output.height,
      )
    }
    const unsubscribe = store.subscribeRegion(region, draw)
    draw()
    return unsubscribe
  }, [area, store, region])
  return (
    <canvas
      ref={canvas}
      className="duo-react-status-material"
      style={boundsStyle(area)}
      aria-hidden="true"
    />
  )
}

export function SystemUI({
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
    <div className="duo-react-system" aria-hidden="true">
      {layout.camera && (
        <div className="duo-react-camera-cutout" style={boundsStyle(layout.camera)} />
      )}
      {showIndicators && (
        <>
          {layout.divider && (
            <div className="duo-react-divider" style={boundsStyle(layout.divider)} />
          )}
          {showStatus && (
            <div
              className="duo-react-status"
              style={{
                ...boundsStyle(layout.status),
                fontSize: systemMetrics.fontSize,
                lineHeight: `${systemMetrics.lineHeight}px`,
              }}
            >
              <SystemIndicator
                className="duo-react-status-time"
                sample="time"
                area={layout.time}
                appearance={appearance.statusBar}
                width={systemMetrics.timeWidth}
                height={systemMetrics.lineHeight}
                style={{
                  position: 'absolute',
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
                className="duo-react-status-glyph"
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
                area={layout.glyph}
                appearance={appearance.statusBar}
                width={systemMetrics.glyphWidth}
                height={systemMetrics.glyphHeight}
                style={{
                  position: 'absolute',
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
              className="duo-react-home"
              sample="home"
              area={layout.home}
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
