import type { DuoScreenInfo } from '@private/core'
import type { DuoRect } from '@private/profiles'
import React from 'react'
import { useDuoState } from '../../context/hooks'
import { useDuoRegions } from '../../inspection/use-duo-regions'
import { useBrowserLayoutEffect } from '../../shared/use-browser-layout-effect'

export interface DuoRegionMaskProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  frameRef: React.RefObject<HTMLDivElement | null>
  highlightedRegionId?: string
  onHighlightedRegionChange?: (regionId: string | undefined) => void
  theme?: 'auto' | 'light' | 'dark'
}

let nextMaskId = 0

function roundedBoundary(bounds: DuoRect, radii: DuoScreenInfo['cornerRadii']) {
  const { x, y, width, height } = bounds
  const right = x + width
  const bottom = y + height
  const [tl, tr, br, bl] = radii
  return `M ${x + tl} ${y} H ${right - tr} A ${tr} ${tr} 0 0 1 ${right} ${y + tr}
    V ${bottom - br} A ${br} ${br} 0 0 1 ${right - br} ${bottom}
    H ${x + bl} A ${bl} ${bl} 0 0 1 ${x} ${bottom - bl}
    V ${y + tl} A ${tl} ${tl} 0 0 1 ${x + tl} ${y} Z`
}

function relativeRect(node: Element, origin: DOMRect): DuoRect {
  const rect = node.getBoundingClientRect()
  return {
    x: rect.left - origin.left,
    y: rect.top - origin.top,
    width: rect.width,
    height: rect.height,
  }
}

export function DuoRegionMask({
  frameRef,
  highlightedRegionId,
  onHighlightedRegionChange,
  theme = 'auto',
  className,
  ...props
}: DuoRegionMaskProps) {
  const root = React.useRef<HTMLDivElement>(null)
  const [id] = React.useState(() => `duo-react-region-mask-${nextMaskId++}`)
  const screen = useDuoState(
    (state) => state.screens[state.posture === 'closed' ? 'outer' : 'inner'],
  )
  const regions = useDuoRegions()
  const sortedRegions = React.useMemo(
    () => [...regions].sort((a, b) => b.width * b.height - a.width * a.height),
    [regions],
  )
  const [layout, setLayout] = React.useState<{
    transform: DOMMatrix
    frame: DuoRect
  }>()

  useBrowserLayoutEffect(() => {
    const container = root.current
    const frame = frameRef.current
    const display = frame?.querySelector(`[data-duo-react-display="${screen.display}"]`)
    const rotation = frame?.querySelector('.duo-react-rotation')
    if (!container || !frame || !display || !rotation) return
    let pending = 0
    const measure = () => {
      const origin = container.getBoundingClientRect()
      const bounds = relativeRect(display, origin)
      // Display and rotation transforms share a center; preserve it during animated turns.
      const transform = new DOMMatrix()
        .translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
        .multiply(new DOMMatrix(getComputedStyle(rotation).transform))
        .multiply(new DOMMatrix(getComputedStyle(display).transform))
        .translate(-screen.size.width / 2, -screen.size.height / 2)
      setLayout({
        transform,
        frame: relativeRect(frame, origin),
      })
    }
    const schedule = () => {
      cancelAnimationFrame(pending)
      pending = requestAnimationFrame(measure)
    }
    measure()
    const resize = new ResizeObserver(schedule)
    resize.observe(container)
    resize.observe(frame)
    const mutation = new MutationObserver(schedule)
    mutation.observe(display, { attributes: true, attributeFilter: ['style'] })
    mutation.observe(rotation, { attributes: true, attributeFilter: ['style'] })
    return () => {
      cancelAnimationFrame(pending)
      resize.disconnect()
      mutation.disconnect()
    }
  }, [frameRef, screen])

  useBrowserLayoutEffect(() => {
    const frame = frameRef.current
    const svg = root.current?.querySelector('svg')
    if (!frame || !svg || !layout || !onHighlightedRegionChange) return
    const frameBoundary = svg.querySelector<SVGRectElement>(`[id="${id}-frame"] rect`)!
    const displayBoundary = svg.querySelector<SVGPathElement>(`[id="${id}-display"] path`)!
    const windowBoundary = svg.querySelector<SVGPathElement>(`[id="${id}-window"] path`)!
    let hoveredRegionId = highlightedRegionId
    const highlight = (regionId: string | undefined) => {
      if (hoveredRegionId === regionId) return
      hoveredRegionId = regionId
      onHighlightedRegionChange(regionId)
    }
    const leave = () => highlight(undefined)
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const matrix = svg.getScreenCTM()
      if (!matrix) return leave()
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
      const local = point.matrixTransform(layout.transform.inverse())
      if (!frameBoundary.isPointInFill(point) || !displayBoundary.isPointInFill(local))
        return leave()
      const insideWindow = windowBoundary.isPointInFill(local)
      // Match SVG paint order and clipping without intercepting the app's pointer events.
      for (let index = sortedRegions.length - 1; index >= 0; index--) {
        const region = sortedRegions[index]
        if (
          (region.scope === 'display' || insideWindow) &&
          local.x >= region.x &&
          local.x <= region.x + region.width &&
          local.y >= region.y &&
          local.y <= region.y + region.height
        )
          return highlight(region.id)
      }
      leave()
    }
    frame.addEventListener('pointermove', move, { capture: true, passive: true })
    frame.addEventListener('pointerleave', leave)
    frame.addEventListener('pointercancel', leave)
    return () => {
      frame.removeEventListener('pointermove', move, true)
      frame.removeEventListener('pointerleave', leave)
      frame.removeEventListener('pointercancel', leave)
    }
  }, [frameRef, id, layout, sortedRegions, highlightedRegionId, onHighlightedRegionChange])

  const inspecting = regions.some((region) => region.id === highlightedRegionId)
  return (
    <div
      role="group"
      aria-label="Layout regions"
      {...props}
      ref={root}
      className={['duo-react-region-mask', className].filter(Boolean).join(' ')}
      data-duo-react-theme={theme}
      data-duo-react-inspecting={inspecting}
    >
      {layout && (
        <svg className="duo-react-region-shapes" aria-hidden="true">
          <defs>
            <clipPath id={`${id}-frame`}>
              <rect {...layout.frame} />
            </clipPath>
            <clipPath id={`${id}-display`}>
              <path d={roundedBoundary({ x: 0, y: 0, ...screen.size }, screen.cornerRadii)} />
            </clipPath>
            <clipPath id={`${id}-window`}>
              <path d={roundedBoundary(screen.window, screen.windowCornerRadii)} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-frame)`}>
            <g transform={layout.transform.toString()}>
              <g clipPath={`url(#${id}-display)`}>
                {sortedRegions.map((region) => (
                  <g key={region.id} clipPath={`url(#${id}-${region.scope})`}>
                    <rect
                      className="duo-react-region-fill"
                      data-duo-react-region={region.id}
                      data-duo-react-kind={region.kind}
                      data-duo-react-highlighted={highlightedRegionId === region.id}
                      x={region.x}
                      y={region.y}
                      width={region.width}
                      height={region.height}
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                ))}
              </g>
            </g>
          </g>
        </svg>
      )}
    </div>
  )
}
