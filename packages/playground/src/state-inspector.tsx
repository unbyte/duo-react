import * as React from "react"
import { cn } from "cn"
import {
  IconRadiusTopLeft,
  IconRadiusTopRight,
  IconRadiusBottomLeft,
  IconRadiusBottomRight,
  IconBorderTop,
  IconBorderRight,
  IconBorderBottom,
  IconBorderLeft,
} from "@tabler/icons-react"
import {
  useDuoState,
  useDuoRegions,
  type BarsLayout,
  type BarsLayoutRequest,
  type DuoRect,
  type DuoRegion,
  type DuoScreenInfo,
} from "duo-frame"
import { InspectorTabs, ToggleSetting, IconHint, PinOverlay, ScrollSurface } from "./playground-ui"
import { CopyableNumber } from "./components/copyable-number"

const headingRow =
  "flex items-center justify-between gap-2 @max-[280px]:flex-wrap @max-[280px]:gap-y-0"
const heading = "m-0 text-xs/normal font-semibold text-foreground"
const metric = "flex min-w-0 items-center justify-between gap-2 whitespace-nowrap"
const metricLabel =
  "inline-flex items-center gap-[5px] text-[11px] font-normal capitalize text-muted-foreground [&>svg]:shrink-0"
const metricValue = "m-0 text-xs/normal font-normal tabular-nums text-[#526174]"
const regionColors: Record<DuoRegion["kind"], string> = {
  "safe-area": "#21834b",
  top: "#966000",
  right: "#2563cc",
  bottom: "#a13dac",
  left: "#00828b",
  occlusion: "#c53b33",
  division: "#8c6b17",
  gap: "#5b50b4",
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="m-0 text-[11px] tabular-nums">{children}</dd>
    </div>
  )
}

function JsonData({
  data,
  label,
  className,
}: {
  data: unknown
  label: string
  className?: string
}) {
  return (
    <ScrollSurface
      className={cn("playground-json-scroll", className)}
      contentClassName="w-max min-w-full!"
      label={label}
    >
      <pre className="m-0 box-border w-full min-w-0 max-w-full bg-transparent font-mono text-[10px] leading-[1.6] text-[#526174] [tab-size:2]">
        {JSON.stringify(data, undefined, 2)}
      </pre>
    </ScrollSurface>
  )
}

function Size({ rect }: { rect: Pick<DuoRect, "width" | "height"> }) {
  return (
    <span className="playground-inspector-size m-0 shrink-0 text-[11px] font-normal tabular-nums text-muted-foreground">
      <CopyableNumber value={rect.width} label="Width" /> ×{" "}
      <CopyableNumber value={rect.height} label="Height" />{" "}
      <small className="playground-inspector-unit text-[#9ba6b5] font-normal [font-size:inherit]">
        pt
      </small>
    </span>
  )
}

function GeometryDetails({ rect }: { rect: DuoRect }) {
  const bounds = [
    ["Top", rect.y, IconBorderTop],
    ["Right", rect.x + rect.width, IconBorderRight],
    ["Bottom", rect.y + rect.height, IconBorderBottom],
    ["Left", rect.x, IconBorderLeft],
  ] as const
  return (
    <span className="playground-inspector-metrics m-0 grid grid-cols-2 gap-x-6 gap-y-[5px] @max-[280px]:gap-x-4">
      {bounds.map(([label, value, Icon]) => (
        <span className={cn("playground-inspector-metric", metric)} key={label}>
          <small className={metricLabel}>
            <Icon size={14} stroke={1.5} aria-hidden="true" />
            {label}
          </small>
          <CopyableNumber value={value} label={label} className={metricValue} />
        </span>
      ))}
    </span>
  )
}

function RegionDetails({ region }: { region: DuoRegion }) {
  return (
    <>
      <span className={cn("playground-region-heading", headingRow)}>
        <span className="playground-region-name flex items-baseline gap-1.5 font-medium capitalize text-[color:var(--playground-region-color)] before:size-1.5 before:shrink-0 before:self-center before:rounded-full before:bg-[var(--playground-region-color)] before:content-['']">
          {region.name}
        </span>
        <Size rect={region} />
      </span>
      <GeometryDetails rect={region} />
    </>
  )
}

function CornerRadii({ values, label }: { values: DuoScreenInfo["cornerRadii"]; label: string }) {
  const corners = [
    ["Top left", 0, IconRadiusTopLeft],
    ["Top right", 1, IconRadiusTopRight],
    ["Bottom left", 3, IconRadiusBottomLeft],
    ["Bottom right", 2, IconRadiusBottomRight],
  ] as const
  return (
    <div
      className="playground-corner-information flex items-center justify-between gap-x-2 gap-y-[5px] flex-wrap"
      role="group"
      aria-label={label}
    >
      <dt className="text-[11px] text-muted-foreground">Corner radius</dt>
      <dd className="m-0">
        <dl className="playground-inspector-metrics playground-corner-metrics m-0 grid grid-cols-[repeat(4,auto)] gap-2">
          {corners.map(([corner, index, Icon]) => (
            <div
              className={cn("playground-inspector-metric", metric, "justify-start gap-1.5")}
              key={corner}
            >
              <dt className={metricLabel}>
                <IconHint label={corner}>
                  <Icon size={16} stroke={1.5} aria-hidden="true" />
                </IconHint>
              </dt>
              <dd className="m-0 text-[11px] font-normal tabular-nums text-[#526174]">
                <CopyableNumber value={values[index]} label={`${corner} radius`} />
              </dd>
            </div>
          ))}
        </dl>
      </dd>
    </div>
  )
}

function ScreenInformation() {
  const state = useDuoState((value) => value)
  const screen = state.screens[state.posture === "closed" ? "outer" : "inner"]
  const displayInformation = [
    ["Posture", state.posture.replace(/-/g, " ")],
    ["Orientation", screen.orientation.replace(/-/g, " ")],
  ]
  const windowHasDifferentCorners = screen.windowCornerRadii.some(
    (radius, index) => radius !== screen.cornerRadii[index],
  )
  return (
    <section className="playground-screen-information" aria-label="Screen information">
      <div className={cn("playground-region-heading", headingRow)}>
        <h3 className={heading}>
          {screen.display === "inner" ? "Inner display" : "Outer display"}
        </h3>
        <Size rect={screen.size} />
      </div>
      <dl className="playground-screen-details mt-2 mb-3 grid gap-[5px]">
        {displayInformation.map(([label, value]) => (
          <DetailRow key={label} label={label}>
            {value}
          </DetailRow>
        ))}
        <CornerRadii label="Display corner radii" values={screen.cornerRadii} />
      </dl>
      <div
        className={cn("playground-region-heading playground-window-heading mt-[18px]", headingRow)}
      >
        <h3 className={heading}>App window</h3>
        <Size rect={screen.window} />
      </div>
      <dl className="playground-screen-details mt-2 mb-3 grid gap-[5px]">
        <DetailRow label="Placement">{screen.placement}</DetailRow>
        {windowHasDifferentCorners && (
          <CornerRadii label="Window corner radii" values={screen.windowCornerRadii} />
        )}
      </dl>
      <div className="playground-window-bounds mb-3" role="group" aria-label="App window bounds">
        <GeometryDetails rect={screen.window} />
      </div>
    </section>
  )
}

export function StateInspector({
  open,
  request,
  layout,
  regionsPinned,
  onRegionsPinnedChange,
  showBarBounds,
  onShowBarBoundsChange,
  highlightedRegionId,
  onHoveredRegionChange,
  onClose,
}: {
  open: boolean
  request: BarsLayoutRequest
  layout?: BarsLayout
  regionsPinned: boolean
  onRegionsPinnedChange: (pinned: boolean) => void
  showBarBounds: boolean
  onShowBarBoundsChange: (show: boolean) => void
  highlightedRegionId?: string
  onHoveredRegionChange: (regionId: string | undefined) => void
  onClose: () => void
}) {
  const state = useDuoState((value) => value)
  const regions = useDuoRegions()
  const [tab, setTab] = React.useState("regions")
  const panel = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    onHoveredRegionChange(undefined)
  }, [regions, open, tab, onHoveredRegionChange])

  React.useLayoutEffect(() => {
    panel.current?.toggleAttribute("inert", !open)
    if (open)
      panel.current
        ?.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')
        ?.focus({ preventScroll: true })
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && panel.current?.contains(document.activeElement)) {
        event.preventDefault()
        onClose()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  const bars = [
    ...(layout?.tabbar ? [{ id: "Tab bar", ...layout.tabbar }] : []),
    ...(layout?.toolbars.map((bar) => ({ ...bar, id: `Toolbar ${bar.id}` })) ?? []),
  ]

  return (
    <div className="playground-inspector-dock absolute inset-y-0 right-0 z-10 w-(--playground-inspector-space) min-h-0 min-w-0 overflow-hidden invisible transition-[width,visibility] duration-[220ms,0s] delay-[0s,220ms] ease-[ease] group-data-[inspector-open=true]/playground:visible group-data-[inspector-open=true]/playground:delay-0 motion-reduce:transition-none max-sm:top-auto max-sm:h-[calc(var(--playground-bottom-space)-45px)] max-sm:w-full">
      <aside
        id="playground-state-panel"
        className="playground-state-panel @container absolute inset-y-0 right-0 box-border flex w-(--playground-inspector-width) min-h-0 min-w-0 flex-col border-l border-border bg-white/90 backdrop-blur-[20px] backdrop-saturate-[125%] translate-x-full transition-transform duration-220 ease-[ease] group-data-[inspector-open=true]/playground:translate-x-0 motion-reduce:transition-none max-sm:w-full max-sm:border-l-0 max-sm:translate-x-0 max-sm:translate-y-full max-sm:group-data-[inspector-open=true]/playground:translate-y-0 [&_[hidden]]:hidden"
        aria-label="Inspector"
        aria-hidden={!open}
        ref={panel}
      >
        <InspectorTabs
          value={tab}
          onValueChange={setTab}
          sections={[
            {
              value: "regions",
              label: "Regions",
              content: (
                <>
                  <ScreenInformation />
                  <div className={cn("playground-inspector-section-heading mt-5", headingRow)}>
                    <h3 className={heading}>Regions</h3>
                    <PinOverlay pinned={regionsPinned} onPinnedChange={onRegionsPinnedChange} />
                  </div>
                  <div
                    className="playground-region-labels group/regions flex flex-col"
                    role="group"
                    aria-label="Active layout regions"
                    data-inspecting={regions.some((region) => region.id === highlightedRegionId)}
                  >
                    {[...regions]
                      .sort((a, b) => a.y + a.height / 2 - b.y - b.height / 2)
                      .map((region) => (
                        <div
                          key={region.id}
                          role="group"
                          aria-label={region.name}
                          className="playground-region-label flex min-w-0 flex-col gap-2 border-0 bg-transparent px-0 py-[11px] text-left text-xs/normal text-[#526174] [&>span]:transition-opacity [&>span]:duration-160 [&>span]:ease-[ease] motion-reduce:[&>span]:transition-none group-data-[inspecting=true]/regions:data-[highlighted=false]:[&>span]:opacity-40"
                          data-region={region.id}
                          data-kind={region.kind}
                          data-highlighted={highlightedRegionId === region.id}
                          style={
                            {
                              "--playground-region-color": regionColors[region.kind],
                            } as React.CSSProperties
                          }
                          onPointerEnter={() => onHoveredRegionChange(region.id)}
                          onPointerLeave={() => onHoveredRegionChange(undefined)}
                        >
                          <RegionDetails region={region} />
                        </div>
                      ))}
                  </div>
                </>
              ),
            },
            {
              value: "bars",
              label: "Bars",
              content: (
                <>
                  <ToggleSetting
                    label="Show bar bounds"
                    checked={showBarBounds}
                    onCheckedChange={onShowBarBoundsChange}
                  />
                  <div className="playground-bar-details mt-1 shrink-0">
                    {bars.map((bar) => (
                      <section
                        className="playground-inspector-row flex flex-col gap-2 border-0 bg-transparent py-[11px] text-left text-xs/normal text-[#526174]"
                        aria-label={bar.id}
                        key={bar.id}
                      >
                        <div className={cn("playground-region-heading", headingRow)}>
                          <h3 className={heading}>{bar.id}</h3>
                          <Size rect={bar.rect} />
                        </div>
                        <dl className="playground-screen-details playground-bar-properties m-0 grid gap-[5px]">
                          <DetailRow label="Placement">
                            {bar.placement.replace(/-/g, " ")}
                          </DetailRow>
                          <DetailRow label="Axis">{bar.axis}</DetailRow>
                        </dl>
                        <GeometryDetails rect={bar.rect} />
                      </section>
                    ))}
                  </div>
                  {bars.length === 0 && (
                    <p className="playground-inspector-note mt-1 mb-2 shrink-0 text-[10px] text-muted-foreground">
                      No bars are enabled.
                    </p>
                  )}
                  <section
                    className="playground-inspector-data mt-3 flex min-h-[240px] flex-[1_0_240px] flex-col border-t border-border pt-3 text-[11px]"
                    aria-label="Layout data"
                  >
                    <h3 className="mt-0 mb-2 shrink-0 text-[11px] font-normal text-muted-foreground">
                      Layout data
                    </h3>
                    <JsonData
                      className="min-h-[200px] flex-1"
                      data={{ request, layout }}
                      label="Bar layout data"
                    />
                  </section>
                </>
              ),
            },
            {
              value: "states",
              label: "States",
              content: (
                <JsonData
                  className="playground-state-data min-h-0 max-h-none flex-1"
                  data={state}
                  label="Playground state"
                />
              ),
            },
          ]}
        />
      </aside>
    </div>
  )
}
