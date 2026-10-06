import * as React from "react"
import { useDuoState, useDuoStore } from "../../context/hooks"
import {
  orientationRotation,
  rotatedSize,
  type DuoFitPadding,
  type DuoZoom,
  resolveFitPadding,
  resolveZoom,
} from "@duo-react/core"
import { useBrowserLayoutEffect } from "../../shared/use-browser-layout-effect"
import { useRotation } from "./use-rotation"
import { DisplaySurface } from "./display-surface"
import { frameOutset } from "@duo-react/profiles"

export interface DuoFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  zoom?: DuoZoom
  onZoomChange?: (zoom: DuoZoom) => void
  fitPadding?: DuoFitPadding
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
  const padding = resolveFitPadding(fitPadding)
  const active = state.screens[state.posture === "closed" ? "outer" : "inner"]
  const rotation = useRotation(state.rotation)
  const outset = frameOutset[active.display]
  const scale = resolveZoom(
    effectiveZoom,
    size ?? { width: 0, height: 0 },
    rotatedSize(
      { width: active.size.width + outset * 2, height: active.size.height + outset * 2 },
      rotation - orientationRotation[active.orientation],
    ),
    padding,
  )
  useBrowserLayoutEffect(() => {
    if (size) store.reportRenderedZoom(scale)
  }, [store, scale, size])
  return (
    <div
      {...props}
      ref={root}
      className={["duo-react-frame", className].filter(Boolean).join(" ")}
      style={style}
    >
      <div
        className="duo-react-rotation"
        style={{
          transform: `rotate(${rotation}deg)`,
          left:
            effectiveZoom === "fit"
              ? `calc(50% + ${(padding.left - padding.right) / 2}px)`
              : undefined,
          top:
            effectiveZoom === "fit"
              ? `calc(50% + ${(padding.top - padding.bottom) / 2}px)`
              : undefined,
        }}
      >
        <DisplaySurface display={active.display} scale={scale} showSystemUI={showSystemUI}>
          {children}
        </DisplaySurface>
      </div>
    </div>
  )
})
