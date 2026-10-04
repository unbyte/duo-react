import * as React from "react"
import { useDuoState, useDuoStore } from "../../context/hooks"
import { orientationRotation, rotatedSize } from "../../core/rotation"
import type { DuoZoom } from "../../core/types"
import { resolveZoom, validateZoom } from "../../core/zoom"
import { useBrowserLayoutEffect } from "../../hooks/use-browser-layout-effect"
import { useRotation } from "../../hooks/use-rotation"
import { DisplaySurface } from "./display-surface"
import { frameOutset } from "./hardware"
import "../../style.css"

export interface DuoFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  zoom?: DuoZoom
  onZoomChange?: (zoom: DuoZoom) => void
  fitPadding?: number
  showSystemUI?: boolean
}

export const DuoFrame = React.forwardRef<HTMLDivElement, DuoFrameProps>(function DuoFrame(
  {
    children,
    zoom,
    onZoomChange,
    fitPadding = 24,
    showSystemUI = true,
    className,
    style,
    ...props
  },
  forwardedRef,
) {
  const store = useDuoStore()
  const state = useDuoState((value) => value)
  const previousScreens = React.useRef(state.screens)
  useBrowserLayoutEffect(() => {
    const previous = previousScreens.current
    previousScreens.current = state.screens
    for (const display of ["inner", "outer"] as const) {
      if (previous[display] !== state.screens[display]) {
        store.emitWindowChange({
          display,
          previous: previous[display],
          current: state.screens[display],
        })
      }
    }
  }, [state.screens, store])
  const root = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState<{ width: number; height: number }>()
  React.useImperativeHandle(forwardedRef, () => root.current!, [])
  useBrowserLayoutEffect(() => store.connectFrame(), [store])
  useBrowserLayoutEffect(() => {
    store.configureZoom(zoom, onZoomChange)
  }, [store, zoom, onZoomChange])
  useBrowserLayoutEffect(() => {
    const node = root.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((current) =>
        current?.width === width && current.height === height ? current : { width, height },
      )
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const effectiveZoom = zoom ?? state.zoom
  validateZoom(effectiveZoom)
  if (!Number.isFinite(fitPadding) || fitPadding < 0)
    throw new RangeError("fitPadding must be a nonnegative finite number.")
  const active = state.screens[state.posture === "closed" ? "outer" : "inner"]
  const rotation = useRotation(state.rotation)
  const outset = frameOutset(active.display)
  const scale = resolveZoom(
    effectiveZoom,
    size ?? { width: 0, height: 0 },
    rotatedSize(
      { width: active.size.width + outset * 2, height: active.size.height + outset * 2 },
      rotation - orientationRotation[active.orientation],
    ),
    fitPadding,
  )
  useBrowserLayoutEffect(() => {
    if (size) store.reportRenderedZoom(scale)
  }, [store, scale, size])
  return (
    <div
      {...props}
      ref={root}
      className={["duo-frame", className].filter(Boolean).join(" ")}
      style={style}
    >
      <div className="duo-rotation" style={{ transform: `rotate(${rotation}deg)` }}>
        <DisplaySurface display={active.display} scale={scale} showSystemUI={showSystemUI}>
          {children}
        </DisplaySurface>
      </div>
    </div>
  )
})
