import type { CSSProperties } from "react"
import type {
  BarAxis,
  BarPlacement,
  BarsLayout,
  BarsLayoutRequest,
  ResolvedBarLayout,
  ToolbarLayoutRequest,
} from "../bar-types"
import { barProfile as profile } from "../profiles/bars"
import type { DuoRect, DuoScreenInfo } from "../types"
import { getAccessoryLayout } from "./accessories"

function validate(request: BarsLayoutRequest) {
  const ids = new Set<string>()
  for (const bar of request.toolbars ?? []) {
    if (typeof bar.id !== "string" || !bar.id.trim())
      throw new Error("useBars: each toolbar needs a non-empty id.")
    if (ids.has(bar.id)) throw new Error(`useBars: duplicate toolbar id ${JSON.stringify(bar.id)}.`)
    ids.add(bar.id)
    if (!["top-leading", "top-trailing", "bottom"].includes(bar.placement))
      throw new Error(`useBars: unsupported placement for toolbar ${JSON.stringify(bar.id)}.`)
    if (bar.axis !== undefined && bar.axis !== "adaptive" && bar.axis !== "horizontal")
      throw new Error(`useBars: unsupported axis for toolbar ${JSON.stringify(bar.id)}.`)
  }
  const distribution = request.tabbar?.distribution
  if (distribution !== undefined && distribution !== "packed" && distribution !== "edges")
    throw new Error("useBars: unsupported tabbar distribution.")
}

function resolve(
  rect: DuoRect,
  placement: BarPlacement,
  axis: BarAxis,
  justifyContent: CSSProperties["justifyContent"],
): ResolvedBarLayout {
  if (rect.width <= 0 || rect.height <= 0)
    throw new Error(`useBars: no space for the requested bars at the ${placement} edge.`)
  return {
    placement,
    axis,
    rect,
    containerProps: {
      "data-duo-bar-placement": placement,
      "data-duo-bar-axis": axis,
      style: {
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: axis === "horizontal" ? "row" : "column",
        alignItems: "center",
        justifyContent,
      },
    },
  }
}

// A rectangle cannot describe disconnected areas. Use the longest unobstructed
// span, retaining the first span on ties. Reservations are already window-local.
function freeSpan(area: DuoRect, axis: BarAxis, obstacles: readonly DuoRect[]) {
  const vertical = axis === "vertical"
  const start = vertical ? area.y : area.x
  const extent = vertical ? area.height : area.width
  let spans = [{ start, end: start + extent }]
  for (const obstacle of obstacles) {
    if (
      obstacle.x >= area.x + area.width ||
      obstacle.x + obstacle.width <= area.x ||
      obstacle.y >= area.y + area.height ||
      obstacle.y + obstacle.height <= area.y
    )
      continue
    const before = vertical ? obstacle.y : obstacle.x
    const after = before + (vertical ? obstacle.height : obstacle.width)
    spans = spans.flatMap((span) => {
      if (after <= span.start || before >= span.end) return [span]
      return [
        { start: span.start, end: Math.min(span.end, before) },
        { start: Math.max(span.start, after), end: span.end },
      ].filter((part) => part.end > part.start)
    })
  }
  const best = spans.reduce(
    (longest, span) => (span.end - span.start > longest.end - longest.start ? span : longest),
    { start, end: start },
  )
  return vertical
    ? { ...area, y: best.start, height: best.end - best.start }
    : { ...area, x: best.start, width: best.end - best.start }
}

function toolbarAlignment(bar: ToolbarLayoutRequest, axis: BarAxis) {
  if (axis === "vertical") return bar.placement === "bottom" ? "flex-end" : "flex-start"
  if (bar.placement === "bottom") return "center"
  return bar.placement === "top-leading" ? "flex-start" : "flex-end"
}

export function getBarsLayout(screen: DuoScreenInfo, request: BarsLayoutRequest): BarsLayout {
  validate(request)
  const toolbars = request.toolbars ?? []
  if (!toolbars.length && !request.tabbar) return { toolbars: [] }
  const bounds = getAccessoryLayout(screen)
  const horizontal = bounds.side === "horizontal"
  const leading = toolbars.filter((bar) => bar.placement === "top-leading")
  const trailing = toolbars.filter((bar) => bar.placement === "top-trailing")
  const bottom = toolbars.filter((bar) => bar.placement === "bottom")
  const ordered = [...leading, ...trailing, ...bottom]
  const topBars = ordered.filter(
    (bar) => bar.placement !== "bottom" && (horizontal || bar.axis === "horizontal"),
  )
  const bottomBars = bottom.filter((bar) => horizontal || bar.axis === "horizontal")
  const sideBars = horizontal ? [] : ordered.filter((bar) => bar.axis !== "horizontal")
  const hasRail = !horizontal && (sideBars.length > 0 || !!request.tabbar)
  const results = new Map<string, ResolvedBarLayout>()
  let tabbar: ResolvedBarLayout | undefined

  const horizontalObstacles: DuoRect[] = [...screen.reservedRegions]
  if (hasRail) {
    horizontalObstacles.push({
      x: bounds.left - profile.sectionGap,
      y: 0,
      width: profile.railWidth + profile.sectionGap * 2,
      height: screen.window.height,
    })
  }
  const row = (y: number, height: number, inset: number = profile.horizontalInset) =>
    freeSpan(
      { x: inset, y, width: screen.window.width - inset * 2, height },
      "horizontal",
      horizontalObstacles,
    )
  const allocateRow = (
    bars: readonly ToolbarLayoutRequest[],
    area: DuoRect,
    placement: "top" | "bottom",
  ) => {
    if (!bars.length) return
    const width = (area.width - profile.groupGap * (bars.length - 1)) / bars.length
    bars.forEach((bar, index) => {
      const rect = { ...area, x: area.x + index * (width + profile.groupGap), width }
      results.set(
        bar.id,
        resolve(rect, placement, "horizontal", toolbarAlignment(bar, "horizontal")),
      )
    })
  }

  allocateRow(topBars, row(profile.top, profile.toolbarThickness), "top")
  const bottomInset = horizontal ? profile.bottomToolbarInset : bounds.bottom
  let bottomY = screen.window.height - bottomInset
  if (horizontal && request.tabbar) {
    const edges = request.tabbar.distribution === "edges"
    const height = edges ? profile.toolbarThickness : profile.tabThickness
    const tabBottom = screen.window.height - (edges ? profile.edgeTabBottom : profile.bottom)
    const area = row(
      tabBottom - height,
      height,
      edges ? profile.edgeTabInset : profile.horizontalInset,
    )
    const width = edges ? area.width : Math.min(area.width, profile.packedTabWidth)
    tabbar = resolve(
      { ...area, x: area.x + (area.width - width) / 2, width },
      "bottom",
      "horizontal",
      edges ? "space-between" : "center",
    )
    bottomY = tabbar.rect.y - profile.sectionGap
  }
  allocateRow(
    bottomBars,
    row(bottomY - profile.toolbarThickness, profile.toolbarThickness),
    "bottom",
  )

  if (hasRail) {
    const area = freeSpan(
      {
        x: bounds.left,
        y: bounds.top,
        width: profile.railWidth,
        height: screen.window.height - bounds.top - bounds.bottom,
      },
      "vertical",
      screen.reservedRegions,
    )
    const gaps = sideBars.map((bar, index) => {
      if (index === 0) return 0
      return bar.placement === "bottom" && sideBars[index - 1].placement !== "bottom"
        ? profile.sectionGap
        : profile.groupGap
    })
    const tabGap = request.tabbar
      ? profile.tabExpansion + (sideBars.length ? profile.sectionGap : 0)
      : 0
    const count = sideBars.length + (request.tabbar ? 1 : 0)
    const height = (area.height - gaps.reduce<number>((sum, gap) => sum + gap, tabGap)) / count
    let y = area.y
    const side = bounds.side === "left" ? "left" : "right"
    sideBars.forEach((bar, index) => {
      y += gaps[index]
      results.set(
        bar.id,
        resolve({ ...area, y, height }, side, "vertical", toolbarAlignment(bar, "vertical")),
      )
      y += height
    })
    if (request.tabbar)
      tabbar = resolve(
        { ...area, y: y + tabGap, height },
        side,
        "vertical",
        request.tabbar.distribution === "edges" ? "space-between" : "flex-end",
      )
  }

  return {
    toolbars: toolbars.map((bar) => ({ id: bar.id, ...results.get(bar.id)! })),
    tabbar,
  }
}
