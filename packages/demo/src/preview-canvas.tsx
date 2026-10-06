import * as React from "react"
import { useDuoActions, useDuoState, type DuoInsets } from "duo-frame"

interface Point {
  x: number
  y: number
}

type Gesture =
  | { kind: "pan"; pointerId: number; start: Point; offset: Point }
  | { kind: "pinch"; center: Point; distance: number; scale: number; offset: Point }

const origin = { x: 0, y: 0 }
const overlaySelector = ".demo-preview-controls, .demo-region-labels"

function pinchPoints(points: Map<number, Point>) {
  const [first, second] = [...points.values()]
  return {
    center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
    distance: Math.hypot(second.x - first.x, second.y - first.y),
  }
}

export function PreviewCanvas({
  children,
  onFitPaddingChange,
}: {
  children: React.ReactNode
  onFitPaddingChange: (padding: DuoInsets) => void
}) {
  const { setZoom } = useDuoActions()
  const scale = useDuoState((state) =>
    typeof state.zoom === "number" ? state.zoom : state.renderedZoom,
  )
  const latestScale = React.useRef(scale)
  const fitting = useDuoState((state) => state.zoom === "fit")
  const canvas = React.useRef<HTMLDivElement>(null)
  const pointers = React.useRef(new Map<number, Point & { canPan: boolean }>())
  const gesture = React.useRef<Gesture | undefined>(undefined)
  const offset = React.useRef(origin)
  const suppressClick = React.useRef(false)
  const [panning, setPanning] = React.useState(false)

  React.useLayoutEffect(() => {
    const node = canvas.current
    const controls = node?.querySelector(".demo-preview-controls")
    const page = node?.closest(".demo")
    const sidebar = page?.querySelector(".demo-sidebar")
    const inspector = page?.querySelector(".demo-inspector-dock")
    if (!node || !controls || !sidebar || !inspector) return
    const measure = () => {
      const bounds = node.getBoundingClientRect()
      const narrow = bounds.width < 640
      const gap = narrow ? 16 : 24
      onFitPaddingChange({
        top: gap,
        right: narrow ? gap : Math.ceil(inspector.getBoundingClientRect().width) + gap,
        bottom: Math.ceil(bounds.bottom - controls.getBoundingClientRect().top) + gap,
        left: narrow ? gap : Math.ceil(sidebar.getBoundingClientRect().width) + gap,
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    observer.observe(controls)
    observer.observe(sidebar)
    observer.observe(inspector)
    return () => observer.disconnect()
  }, [onFitPaddingChange])

  const moveTo = React.useCallback((next: Point) => {
    offset.current = next
    // Translate only the device so its viewport and the canvas overlays stay fixed.
    const rotation = canvas.current?.querySelector<HTMLElement>(".duo-rotation")
    if (rotation) rotation.style.translate = `${next.x}px ${next.y}px`
  }, [])

  React.useLayoutEffect(() => {
    if (fitting) moveTo(origin)
  }, [fitting, moveTo])

  React.useLayoutEffect(() => {
    latestScale.current = scale
  }, [scale])

  const zoomOffset = React.useCallback(() => {
    const frame = canvas.current?.querySelector(".duo-frame")?.getBoundingClientRect()
    const rotation = canvas.current?.querySelector(".duo-rotation")?.getBoundingClientRect()
    return frame && rotation
      ? { x: rotation.x - frame.x - frame.width / 2, y: rotation.y - frame.y - frame.height / 2 }
      : offset.current
  }, [])

  const zoomAt = React.useCallback(
    (scale: number, start: Point, end: Point, startScale: number, pan: Point) => {
      const frame = canvas.current?.querySelector(".duo-frame")?.getBoundingClientRect()
      if (!frame || !Number.isFinite(scale) || scale <= 0) return
      const center = { x: frame.left + frame.width / 2, y: frame.top + frame.height / 2 }
      const ratio = scale / startScale
      moveTo({
        x: end.x - center.x - (start.x - center.x - pan.x) * ratio,
        y: end.y - center.y - (start.y - center.y - pan.y) * ratio,
      })
      latestScale.current = scale
      setZoom(scale)
    },
    [setZoom, moveTo],
  )

  React.useEffect(() => {
    const node = canvas.current
    if (!node) return
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey || (event.target as Element).closest(overlaySelector)) return
      event.preventDefault()
      const scale = latestScale.current
      if (!scale || gesture.current) return
      const point = { x: event.clientX, y: event.clientY }
      const delta =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.clientHeight : 1)
      zoomAt(scale * Math.exp(-delta * 0.01), point, point, scale, zoomOffset())
    }
    node.addEventListener("wheel", onWheel, { passive: false })
    return () => node.removeEventListener("wheel", onWheel)
  }, [zoomAt, zoomOffset])

  function start(event: React.PointerEvent<HTMLDivElement>) {
    if (pointers.current.size === 0) suppressClick.current = false
    const target = event.target as Element
    if (event.button !== 0 || target.closest(overlaySelector)) return
    const empty = !target.closest(".duo-display, .duo-hardware, .duo-region-fill")
    if (event.pointerType !== "touch" && (!empty || pointers.current.size > 0)) return
    const point = { x: event.clientX, y: event.clientY }
    pointers.current.set(event.pointerId, { ...point, canPan: empty })
    if (pointers.current.size === 2) {
      const scale = latestScale.current
      const pinch = pinchPoints(pointers.current)
      if (!scale || !pinch.distance) return
      gesture.current = { kind: "pinch", ...pinch, scale, offset: zoomOffset() }
      suppressClick.current = true
      for (const id of pointers.current.keys()) event.currentTarget.setPointerCapture(id)
    } else if (pointers.current.size === 1 && empty) {
      gesture.current = {
        kind: "pan",
        pointerId: event.pointerId,
        start: point,
        offset: offset.current,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    } else if (gesture.current) event.currentTarget.setPointerCapture(event.pointerId)
    else return
    event.preventDefault()
    event.stopPropagation()
    setPanning(true)
  }

  function move(event: React.PointerEvent<HTMLDivElement>) {
    const pointer = pointers.current.get(event.pointerId)
    if (!pointer) return
    const point = { x: event.clientX, y: event.clientY }
    pointers.current.set(event.pointerId, { ...pointer, ...point })
    const active = gesture.current
    if (!active) return
    if (active.kind === "pan") {
      if (active.pointerId !== event.pointerId) return
      const dx = point.x - active.start.x
      const dy = point.y - active.start.y
      if (Math.hypot(dx, dy) > 3) suppressClick.current = true
      moveTo({ x: active.offset.x + dx, y: active.offset.y + dy })
    } else {
      const pinch = pinchPoints(pointers.current)
      zoomAt(
        (active.scale * pinch.distance) / active.distance,
        active.center,
        pinch.center,
        active.scale,
        active.offset,
      )
    }
    event.preventDefault()
    event.stopPropagation()
  }

  function end(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.delete(event.pointerId)) return
    if (gesture.current) {
      event.stopPropagation()
      const remaining = [...pointers.current.entries()]
      if (remaining.length >= 2) {
        const scale = latestScale.current
        const pinch = pinchPoints(pointers.current)
        gesture.current =
          scale && pinch.distance
            ? { kind: "pinch", ...pinch, scale, offset: zoomOffset() }
            : undefined
      } else if (remaining.length === 1) {
        const [pointerId, point] = remaining[0]
        gesture.current = point.canPan
          ? { kind: "pan", pointerId, start: point, offset: offset.current }
          : undefined
      } else gesture.current = undefined
      setPanning(gesture.current !== undefined)
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <div
      ref={canvas}
      className="demo-canvas absolute inset-0 isolate cursor-grab data-[panning=true]:cursor-grabbing data-[panning=true]:select-none"
      data-panning={panning}
      onPointerDownCapture={start}
      onPointerMoveCapture={move}
      onPointerUpCapture={end}
      onPointerCancelCapture={end}
      onLostPointerCapture={(event) => {
        if (event.target === event.currentTarget) end(event)
      }}
      onClickCapture={(event) => {
        if (suppressClick.current && event.detail > 0) {
          event.preventDefault()
          event.stopPropagation()
          suppressClick.current = false
        } else {
          const action = (event.target as Element)
            .closest("[data-duo-action]")
            ?.getAttribute("data-duo-action")
          if (action === "fit") moveTo(origin)
          else if (fitting && (action === "zoom-in" || action === "zoom-out")) moveTo(zoomOffset())
        }
      }}
    >
      {children}
    </div>
  )
}
