import React from 'react'
import { useBackdropStore } from '../../backdrop/backdrop-context'
import { useBackdropRegion } from '../../backdrop/use-backdrop-region'
import { makeArtwork } from './artwork'
import { clamp, TabLayout } from './layout'
import { useLensMotion } from './motion'
import { GlassRenderer } from './renderer'
import { canvasPadding } from './shaders'
import type { TabContent } from './types'

/** Offset-parent coordinates exclude the frame's presentation zoom and rotation. */
function backdropOrigin(element: HTMLElement) {
  let x = 0
  let y = 0
  let current: HTMLElement | null = element
  while (current && !current.classList.contains('duo-react-screen')) {
    x += current.offsetLeft
    y += current.offsetTop
    current = current.offsetParent as HTMLElement | null
  }
  return { x, y }
}

function useMedia(query: string) {
  const [matches, setMatches] = React.useState(false)
  React.useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])
  return matches
}

export function GlassTabs({
  items,
  selectedId,
  onSelect,
  vertical,
  dark = false,
}: TabContent & {
  vertical: boolean
  dark?: boolean
}) {
  const layout = React.useMemo(
    () => new TabLayout(vertical, items.length),
    [vertical, items.length],
  )
  const backdrop = useBackdropStore()
  const root = React.useRef<HTMLDivElement>(null)
  const region = useBackdropRegion(() => {
    const origin = backdropOrigin(root.current!.parentElement!)
    const expanded = layout.geometry(1, 1, 0)
    // Reserve the expanded platter, canvas overscan, and refraction reach once.
    const padding = canvasPadding + 12
    const width = vertical ? expanded.cross : expanded.length
    const height = vertical ? expanded.length : expanded.cross
    return {
      area: {
        x: origin.x - (vertical ? (expanded.cross - layout.rest.cross) / 2 : 0) - padding,
        y: origin.y - (vertical ? expanded.length - layout.rest.length : 0) - padding,
        width: width + padding * 2,
        height: height + padding * 2,
      },
      blur: 6,
    }
  })
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const renderer = React.useRef<GlassRenderer>()
  const artwork = React.useRef<HTMLCanvasElement>()
  const [ready, setReady] = React.useState(false)
  const [artworkReady, setArtworkReady] = React.useState(false)
  const [generation, setGeneration] = React.useState(0)
  const [generationArtwork, setGenerationArtwork] = React.useState(0)
  const [expanded, setExpanded] = React.useState(false)
  const [detailed, setDetailed] = React.useState(false)
  const [target, setTarget] = React.useState<number>()
  const reducedMotion = useMedia('(prefers-reduced-motion: reduce)')
  const holdTimer = React.useRef<ReturnType<typeof setTimeout>>()
  const shrinkTimer = React.useRef<ReturnType<typeof setTimeout>>()
  const suppressClick = React.useRef(false)
  const gesture = React.useRef<{
    pointerId: number
    x: number
    y: number
    value: number
    dragged: boolean
    started: number
  }>()
  const selected = items.findIndex((item) => item.id === selectedId)
  const defaultAccent = dark ? '#209bff' : '#0088ff'
  const { rest } = layout
  const selectedPosition = rest.first + Math.max(0, selected) * rest.pitch
  const motion = useLensMotion(target ?? selectedPosition, expanded, reducedMotion)
  const detail = useLensMotion(0, detailed, reducedMotion)
  const geometry = layout.geometry(
    clamp(detail.growth, 0, 1),
    clamp(motion.growth, 0, 1),
    motion.deformation,
  )
  const position = geometry.first + ((motion.x - rest.first) / rest.pitch) * geometry.pitch

  React.useEffect(() => {
    const element = canvas.current!
    function lost(event: Event) {
      event.preventDefault()
      setReady(false)
    }
    function restored() {
      setGeneration((value) => value + 1)
    }
    element.addEventListener('webglcontextlost', lost)
    element.addEventListener('webglcontextrestored', restored)
    try {
      renderer.current = new GlassRenderer(element, vertical)
    } catch {
      renderer.current = undefined
    }
    return () => {
      element.removeEventListener('webglcontextlost', lost)
      element.removeEventListener('webglcontextrestored', restored)
      renderer.current?.dispose()
      renderer.current = undefined
    }
  }, [vertical, generation])

  React.useEffect(() => {
    let disposed = false
    artwork.current = undefined
    const source = root.current!
    let revision = 0
    const load = () => {
      artwork.current = undefined
      setReady(false)
      const requested = ++revision
      void makeArtwork(
        source,
        layout,
        items.map((item) => item.label),
      )
        .then((image) => {
          if (disposed || requested !== revision) return
          artwork.current = image
          setArtworkReady(true)
          setGenerationArtwork((value) => value + 1)
        })
        .catch(() => {
          if (!disposed && requested === revision) {
            artwork.current = document.createElement('canvas')
            artwork.current.width = artwork.current.height = 1
            setArtworkReady(false)
            setGenerationArtwork((value) => value + 1)
          }
        })
    }
    const request = requestAnimationFrame(load)
    const observer = new MutationObserver(load)
    source.querySelectorAll('.duo-react-tab-bar-icon').forEach((icon) => {
      observer.observe(icon, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      })
    })
    return () => {
      disposed = true
      observer.disconnect()
      cancelAnimationFrame(request)
    }
  }, [items, layout, generation])

  React.useEffect(() => {
    const draw = () => {
      if (!renderer.current || !artwork.current) return
      try {
        const drawn = renderer.current.draw(
          {
            backdrop: backdrop.getSnapshot().regions.get(region),
            origin: backdropOrigin(root.current!),
            geometry,
            count: items.length,
            x: selected < 0 && target === undefined ? -1000 : position,
            growth: clamp(motion.growth, 0, 1),
            dark,
            accents: Array.from(
              root.current!.querySelectorAll('button'),
              (button) => getComputedStyle(button).color,
            ),
          },
          artwork.current,
        )
        setReady(drawn)
      } catch {
        setReady(false)
      }
    }
    const unsubscribe = backdrop.subscribeRegion(region, draw)
    const request = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(request)
      unsubscribe()
    }
  }, [
    backdrop,
    region,
    geometry,
    items,
    position,
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
    return layout.point(
      event.currentTarget.getBoundingClientRect(),
      event.clientX,
      event.clientY,
      geometry,
    )
  }
  function bounded(value: number) {
    return clamp(value, rest.first, rest.first + rest.pitch * (items.length - 1))
  }
  function dragPosition(event: React.PointerEvent<HTMLDivElement>) {
    const active = gesture.current!
    return (
      active.value +
      layout.movement(
        event.currentTarget.getBoundingClientRect(),
        event.clientX - active.x,
        event.clientY - active.y,
        geometry,
      )
    )
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
      x: event.clientX,
      y: event.clientY,
      value: rest.first + index * rest.pitch,
      dragged: false,
      started: event.timeStamp,
    }
    suppressClick.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
    setTarget(rest.first + index * rest.pitch)
    setExpanded(true)
    if (vertical) holdTimer.current = setTimeout(() => setDetailed(true), 320)
  }
  function move(event: React.PointerEvent<HTMLDivElement>) {
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId) return
    const value = dragPosition(event)
    if (!active.dragged && Math.abs(value - active.value) <= 3) return
    active.dragged = true
    active.x = event.clientX
    active.y = event.clientY
    active.value = value
    clearTimeout(holdTimer.current)
    setDetailed(vertical)
    const excess = value - bounded(value)
    setTarget(bounded(value) + (excess * 0.35) / (1 + (Math.abs(excess) * 0.35) / 12))
  }
  function end(event: React.PointerEvent<HTMLDivElement>, cancel = false) {
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId) return
    const value = !cancel && active.dragged ? dragPosition(event) : active.value
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
      const index = Math.round((bounded(value) - rest.first) / rest.pitch)
      onSelect(items[index].id)
      root.current
        ?.querySelectorAll<HTMLButtonElement>('button')
        [index]?.focus({ preventScroll: true })
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const canvasSize = layout.size({
    ...geometry,
    length: geometry.length + canvasPadding * 2,
    cross: geometry.cross + canvasPadding * 2,
  })
  return (
    <div
      className="duo-react-tab-bar-slot"
      style={{
        width: vertical ? rest.cross : rest.length,
        height: vertical ? rest.length : rest.cross,
      }}
    >
      <div
        ref={root}
        className="duo-react-tab-bar-surface"
        data-duo-react-gl-ready={ready}
        data-duo-react-gl-artwork={ready && artworkReady}
        data-duo-react-expanded={expanded}
        data-duo-react-label-reveal={geometry.labels}
        data-duo-react-material-dark={dark}
        style={layout.size(geometry)}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={(event) => end(event, true)}
        onLostPointerCapture={(event) => end(event, true)}
      >
        <canvas
          ref={canvas}
          className="duo-react-tab-bar-glass"
          aria-hidden="true"
          style={{ width: canvasSize.width, height: canvasSize.height }}
        />
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="duo-react-tab-bar-item"
            style={{
              ...layout.itemStyle(geometry, index),
              color: item.selectedColor ?? defaultAccent,
            }}
            aria-current={item.id === selectedId ? 'page' : undefined}
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
              if (event.key === (vertical ? 'ArrowDown' : 'ArrowRight'))
                next = (index + 1) % items.length
              else if (event.key === (vertical ? 'ArrowUp' : 'ArrowLeft'))
                next = (index + items.length - 1) % items.length
              else if (event.key === 'Home') next = 0
              else if (event.key === 'End') next = items.length - 1
              else return
              event.preventDefault()
              root.current
                ?.querySelectorAll<HTMLButtonElement>('button')
                [next]?.focus({ preventScroll: true })
            }}
          >
            <span className="duo-react-tab-bar-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="duo-react-tab-bar-label" style={{ opacity: geometry.labels }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
