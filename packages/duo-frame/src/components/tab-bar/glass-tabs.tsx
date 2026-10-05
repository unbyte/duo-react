import * as React from "react"
import { useLensMotion } from "./motion"
import { createRenderer } from "./renderer"
import { canvasPadding } from "./shaders"
import { clamp, makeArtwork, optics, type GlassVariant, type VariantProps } from "./shared"

function useMedia(query: string) {
  const [matches, setMatches] = React.useState(false)
  React.useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [query])
  return matches
}

export function GlassTabs({
  items,
  selectedId,
  onSelect,
  variant,
  dark = false,
}: VariantProps & { variant: GlassVariant }) {
  const root = React.useRef<HTMLDivElement>(null)
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const renderer = React.useRef<ReturnType<typeof createRenderer>>()
  const artwork = React.useRef<HTMLCanvasElement>()
  const [ready, setReady] = React.useState(false)
  const [artworkReady, setArtworkReady] = React.useState(false)
  const [generation, setGeneration] = React.useState(0)
  const [generationArtwork, setGenerationArtwork] = React.useState(0)
  const [expanded, setExpanded] = React.useState(false)
  const [detailed, setDetailed] = React.useState(false)
  const [target, setTarget] = React.useState<number>()
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)")
  const holdTimer = React.useRef<ReturnType<typeof setTimeout>>()
  const shrinkTimer = React.useRef<ReturnType<typeof setTimeout>>()
  const suppressClick = React.useRef(false)
  const gesture = React.useRef<{
    pointerId: number
    start: number
    anchor: number
    dragged: boolean
    started: number
  }>()
  const selected = items.findIndex((item) => item.id === selectedId)
  const { rest } = variant
  const selectedPosition = rest.first + Math.max(0, selected) * rest.pitch
  const motion = useLensMotion(target ?? selectedPosition, expanded, reducedMotion)
  const detail = useLensMotion(0, detailed, reducedMotion)
  const geometry = variant.geometry(
    clamp(detail.growth, 0, 1),
    clamp(motion.growth, 0, 1),
    motion.deformation,
  )
  const rawPosition = geometry.first + ((motion.x - rest.first) / rest.pitch) * geometry.pitch
  const lensLength = geometry.lensLength
  const position = rawPosition
  const latest = React.useRef({ items, variant })
  React.useEffect(() => {
    latest.current = { items, variant }
  }, [items, variant])

  React.useEffect(() => {
    const element = canvas.current!
    function lost(event: Event) {
      event.preventDefault()
      setReady(false)
    }
    function restored() {
      setGeneration((value) => value + 1)
    }
    element.addEventListener("webglcontextlost", lost)
    element.addEventListener("webglcontextrestored", restored)
    try {
      renderer.current = createRenderer(element, variant.vertical)
    } catch {
      renderer.current = undefined
    }
    return () => {
      element.removeEventListener("webglcontextlost", lost)
      element.removeEventListener("webglcontextrestored", restored)
      renderer.current?.dispose()
      renderer.current = undefined
    }
  }, [variant.vertical, generation])

  React.useEffect(() => {
    let disposed = false
    artwork.current = undefined
    const source = root.current!
    let revision = 0
    const load = () => {
      artwork.current = undefined
      setReady(false)
      const requested = ++revision
      const current = latest.current
      void makeArtwork(
        source,
        current.variant,
        current.items.map((item) => item.label),
      )
        .then((image) => {
          if (disposed || requested !== revision) return
          artwork.current = image
          setArtworkReady(true)
          setGenerationArtwork((value) => value + 1)
        })
        .catch(() => {
          if (!disposed && requested === revision) {
            artwork.current = document.createElement("canvas")
            artwork.current.width = artwork.current.height = 1
            setArtworkReady(false)
            setGenerationArtwork((value) => value + 1)
          }
        })
    }
    const request = requestAnimationFrame(load)
    const observer = new MutationObserver(load)
    source.querySelectorAll(".duo-tab-bar-icon").forEach((icon) =>
      observer.observe(icon, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      }),
    )
    return () => {
      disposed = true
      observer.disconnect()
      cancelAnimationFrame(request)
    }
  }, [items, rest.length, variant.vertical, generation])

  React.useEffect(() => {
    const request = requestAnimationFrame(() => {
      if (!renderer.current || !artwork.current) return
      try {
        const drawn = renderer.current.draw(
          {
            ...optics,
            width: geometry.length,
            crossSize: geometry.cross,
            firstCenter: geometry.first,
            pitch: geometry.pitch,
            count: items.length,
            itemWidth: geometry.itemLength,
            labels: geometry.labels,
            x: selected < 0 && target === undefined ? -1000 : position,
            lensWidth: lensLength,
            lensHeight: geometry.lensCross,
            growth: clamp(motion.growth, 0, 1),
            dark,
            accent: dark ? "#209bff" : "#0088ff",
          },
          artwork.current,
        )
        setReady(drawn)
      } catch {
        setReady(false)
      }
    })
    return () => cancelAnimationFrame(request)
  }, [
    geometry,
    items.length,
    position,
    lensLength,
    selected,
    target,
    motion.growth,
    dark,
    generationArtwork,
  ])

  React.useEffect(
    () => () => {
      clearTimeout(holdTimer.current)
      clearTimeout(shrinkTimer.current)
    },
    [],
  )

  function local(event: React.PointerEvent<HTMLDivElement>) {
    return variant.point(
      event.currentTarget.getBoundingClientRect(),
      event.clientX,
      event.clientY,
      geometry,
    )
  }
  function bounded(value: number) {
    return clamp(value, rest.first, rest.first + rest.pitch * (items.length - 1))
  }
  function pulse() {
    clearTimeout(shrinkTimer.current)
    setExpanded(true)
    shrinkTimer.current = setTimeout(() => setExpanded(false), 240)
  }
  function start(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0 || gesture.current) return
    clearTimeout(shrinkTimer.current)
    const point = local(event)
    const index = Math.round((bounded(point) - rest.first) / rest.pitch)
    gesture.current = {
      pointerId: event.pointerId,
      start: point,
      anchor: rest.first + index * rest.pitch,
      dragged: false,
      started: event.timeStamp,
    }
    suppressClick.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
    setTarget(rest.first + index * rest.pitch)
    setExpanded(true)
    if (variant.vertical) holdTimer.current = setTimeout(() => setDetailed(true), 320)
  }
  function move(event: React.PointerEvent<HTMLDivElement>) {
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId) return
    const delta = local(event) - active.start
    if (!active.dragged && Math.abs(delta) <= 3) return
    active.dragged = true
    clearTimeout(holdTimer.current)
    setDetailed(variant.vertical)
    const value = active.anchor + delta
    const excess = value - bounded(value)
    setTarget(bounded(value) + (excess * 0.35) / (1 + (Math.abs(excess) * 0.35) / 12))
  }
  function end(event: React.PointerEvent<HTMLDivElement>, cancel = false) {
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId) return
    gesture.current = undefined
    clearTimeout(holdTimer.current)
    setDetailed(false)
    setTarget(undefined)
    if (cancel) setExpanded(false)
    else
      shrinkTimer.current = setTimeout(
        () => setExpanded(false),
        Math.max(70, 220 - (event.timeStamp - active.started)),
      )
    suppressClick.current = true
    if (!cancel) {
      const value = active.anchor + (active.dragged ? local(event) - active.start : 0)
      const index = Math.round((bounded(value) - rest.first) / rest.pitch)
      onSelect(items[index].id)
      root.current
        ?.querySelectorAll<HTMLButtonElement>("button")
        [index]?.focus({ preventScroll: true })
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const canvasSize = variant.size({
    ...geometry,
    length: geometry.length + canvasPadding * 2,
    cross: geometry.cross + canvasPadding * 2,
  })
  return (
    <div className="duo-tab-bar-slot" style={variant.style}>
      <div
        ref={root}
        className="duo-tab-bar-surface"
        data-gl-ready={ready}
        data-gl-artwork={ready && artworkReady}
        data-expanded={expanded}
        data-label-reveal={geometry.labels}
        data-material-dark={dark}
        style={variant.size(geometry)}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={(event) => end(event, true)}
        onLostPointerCapture={(event) => end(event, true)}
      >
        <canvas
          ref={canvas}
          className="duo-tab-bar-glass"
          aria-hidden="true"
          style={{ width: canvasSize.width, height: canvasSize.height }}
        />
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="duo-tab-bar-item"
            style={variant.itemStyle(geometry, index)}
            aria-current={item.id === selectedId ? "page" : undefined}
            aria-label={item.label}
            title={item.label}
            onClick={(event) => {
              if (event.detail !== 0 && suppressClick.current) {
                suppressClick.current = false
                return
              }
              onSelect(item.id)
              pulse()
            }}
            onKeyDown={(event) => {
              let next = index
              if (event.key === (variant.vertical ? "ArrowDown" : "ArrowRight"))
                next = (index + 1) % items.length
              else if (event.key === (variant.vertical ? "ArrowUp" : "ArrowLeft"))
                next = (index + items.length - 1) % items.length
              else if (event.key === "Home") next = 0
              else if (event.key === "End") next = items.length - 1
              else return
              event.preventDefault()
              root.current
                ?.querySelectorAll<HTMLButtonElement>("button")
                [next]?.focus({ preventScroll: true })
            }}
          >
            <span className="duo-tab-bar-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="duo-tab-bar-label" style={{ opacity: geometry.labels }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
