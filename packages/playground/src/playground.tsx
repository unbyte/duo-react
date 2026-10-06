import * as React from "react"
import { cn } from "cn"
import {
  AlignHorizontalDistributeCenter,
  Battery,
  BatteryCharging,
  ChevronDown,
  Clock,
  Contrast,
  Home,
  Heart,
  Library,
  LockKeyhole,
  PaintBucket,
  PanelTop,
  Settings,
  Search,
  Signal,
  Square,
  SunMoon,
  Sun,
  Moon,
  Wifi,
} from "lucide-react"
import { IconNumber, IconBoxAlignTopLeft, IconAxisX, IconColorSwatch } from "@tabler/icons-react"
import {
  DuoFrame,
  DuoTabBar,
  DuoRegionMask,
  DuoProvider,
  DuoSafeArea,
  useDuoActions,
  useDuoState,
  useBars,
  type BarsLayout,
  type BarsLayoutRequest,
  type TabBarLayoutRequest,
  type ToolbarLayoutRequest,
  type DuoIndicatorStyle,
  type DuoColorMode,
  type DuoInsets,
} from "duo-frame"
import {
  SelectSetting,
  ToggleSetting,
  RangeSetting,
  ColorSetting,
  TimeInput,
  InspectorToggle,
  ScrollSurface,
  PreviewControls,
} from "./playground-ui"
import "./ui.css"
import { DraggableBlock } from "./draggable-block"
import { StateInspector } from "./state-inspector"
import { PreviewCanvas } from "./preview-canvas"
import {
  LevelLabel,
  CountLabel,
  ChoiceLabel,
  PlacementLabel,
  DistributionLabel,
} from "./select-labels"
import "duo-frame/style.css"
import "./style.css"

function foregroundColor(background: string) {
  const channels = background
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => {
      const value = parseInt(channel, 16) / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  return luminance > 0.179 ? "#000000" : "#ffffff"
}

function IndicatorStylePicker() {
  const { setSystem } = useDuoActions()
  const indicatorStyle = useDuoState((state) => state.system.indicatorStyles.outer.statusBar)
  return (
    <SelectSetting
      icon={Contrast}
      label="Icons"
      value={indicatorStyle}
      options={[
        { value: "auto", label: "Auto" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ]}
      onValueChange={(value) => {
        const styles = {
          statusBar: value as DuoIndicatorStyle,
          homeIndicator: value as DuoIndicatorStyle,
        }
        setSystem({ indicatorStyles: { inner: styles, outer: styles } })
      }}
    />
  )
}

function StatusBarPicker() {
  const hidden = useDuoState((state) => state.system.prefersStatusBarHidden)
  const { setSystem } = useDuoActions()
  return (
    <SelectSetting
      icon={PanelTop}
      label="Status bar"
      value={hidden === undefined ? "auto" : hidden ? "hide" : "show"}
      options={[
        { value: "auto", label: "Auto" },
        { value: "show", label: "Show" },
        { value: "hide", label: "Hide" },
      ]}
      onValueChange={(value) =>
        setSystem({ prefersStatusBarHidden: value === "auto" ? undefined : value === "hide" })
      }
    />
  )
}

function TimeControls() {
  const [mode, setMode] = React.useState("automatic")
  const [specifiedTime, setSpecifiedTime] = React.useState("09:41")
  const { setSystem } = useDuoActions()

  React.useEffect(() => {
    if (mode === "specified") {
      if (specifiedTime) setSystem({ time: specifiedTime })
      return
    }
    const sync = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, "0")
      const minutes = String(now.getMinutes()).padStart(2, "0")
      setSystem({ time: `${hours}:${minutes}` })
    }
    sync()
    const timer = window.setInterval(sync, 1000)
    window.addEventListener("focus", sync)
    document.addEventListener("visibilitychange", sync)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("focus", sync)
      document.removeEventListener("visibilitychange", sync)
    }
  }, [mode, specifiedTime, setSystem])

  return (
    <>
      <SelectSetting
        icon={Clock}
        label="Time"
        ariaLabel="Time mode"
        value={mode}
        options={[
          { value: "automatic", label: "Automatic" },
          { value: "specified", label: "Manual" },
        ]}
        onValueChange={setMode}
      />
      {mode === "specified" && <TimeInput value={specifiedTime} onValueChange={setSpecifiedTime} />}
    </>
  )
}

function SystemControls() {
  const { colorMode, battery, charging, wifiStrength, cellularStrength } = useDuoState(
    (state) => state.system,
  )
  const { setSystem } = useDuoActions()
  return (
    <div className="playground-controls grid gap-1" role="group" aria-label="System settings">
      <SelectSetting
        icon={SunMoon}
        label="Appearance"
        value={colorMode}
        options={[
          { value: "light", text: "Light", label: <ChoiceLabel icon={Sun}>Light</ChoiceLabel> },
          { value: "dark", text: "Dark", label: <ChoiceLabel icon={Moon}>Dark</ChoiceLabel> },
        ]}
        onValueChange={(value) => setSystem({ colorMode: value as DuoColorMode })}
      />
      <TimeControls />
      <RangeSetting
        icon={Battery}
        label="Battery"
        value={battery}
        onValueChange={(value) => setSystem({ battery: value })}
      />
      <ToggleSetting
        icon={BatteryCharging}
        label="Charging"
        checked={charging}
        onCheckedChange={(value) => setSystem({ charging: value })}
      />
      <SelectSetting
        icon={Wifi}
        label="Wi-Fi"
        value={String(wifiStrength)}
        options={["None", "Weak", "Medium", "Strong"].map((label, value) => ({
          value: String(value),
          text: `${value} — ${label}`,
          label: (
            <LevelLabel level={value} maximum={3}>
              {label}
            </LevelLabel>
          ),
        }))}
        onValueChange={(value) => setSystem({ wifiStrength: Number(value) })}
      />
      <SelectSetting
        icon={Signal}
        label="Cellular"
        value={String(cellularStrength)}
        options={["None", "Weak", "Fair", "Good", "Strong"].map((label, value) => ({
          value: String(value),
          text: `${value} — ${label}`,
          label: (
            <LevelLabel level={value} maximum={4}>
              {label}
            </LevelLabel>
          ),
        }))}
        onValueChange={(value) => setSystem({ cellularStrength: Number(value) })}
      />
    </div>
  )
}

const tabItems = [
  { id: "home", icon: <Home />, label: "Home" },
  { id: "library", icon: <Library />, label: "Library", selectedColor: "#af52de" },
  { id: "settings", icon: <Settings />, label: "Settings", selectedColor: "#ff9500" },
  { id: "search", icon: <Search />, label: "Search" },
  { id: "favorites", icon: <Heart />, label: "Favorites", selectedColor: "#ff2d55" },
]

function ExampleApp({
  showBlock,
  blockColor,
  selectedTab,
}: {
  showBlock: boolean
  blockColor: string
  selectedTab: string
}) {
  return (
    <DuoSafeArea className="playground-app relative h-full overflow-auto text-base text-[color:var(--playground-color)] bg-[var(--playground-background)]">
      <div className="playground-content relative p-6">
        <h2 className="m-0 text-xl">{tabItems.find((item) => item.id === selectedTab)?.label}</h2>
      </div>
      <DraggableBlock visible={showBlock} color={blockColor} />
    </DuoSafeArea>
  )
}

interface BarSettings {
  readonly tabbarCount: number
  readonly toolbarCount: number
  readonly toolbars: readonly ToolbarLayoutRequest[]
  readonly distribution: NonNullable<TabBarLayoutRequest["distribution"]>
}

const initialBarSettings: BarSettings = {
  tabbarCount: 3,
  toolbarCount: 0,
  toolbars: [
    { id: "A", placement: "top-trailing", axis: "adaptive" },
    { id: "B", placement: "top-leading", axis: "horizontal" },
    { id: "C", placement: "bottom", axis: "adaptive" },
  ],
  distribution: "packed",
}

function barRequest(settings: BarSettings): BarsLayoutRequest {
  return {
    toolbars: settings.toolbars.slice(0, settings.toolbarCount),
    tabbar: settings.tabbarCount > 0 ? { distribution: settings.distribution } : undefined,
  }
}

function TabBarControls({
  settings,
  onChange,
}: {
  settings: BarSettings
  onChange: (settings: BarSettings) => void
}) {
  return (
    <div className="playground-controls grid gap-1" role="group" aria-label="Tab bar settings">
      <SelectSetting
        icon={IconNumber}
        label="Count"
        ariaLabel="Tab count"
        value={String(settings.tabbarCount)}
        options={[0, 2, 3, 4, 5].map((count) => ({
          value: String(count),
          text: count === 0 ? "0 — None" : `${count} tabs`,
          label: <CountLabel count={count} unit="tab" />,
        }))}
        onValueChange={(value) => onChange({ ...settings, tabbarCount: Number(value) })}
      />
      {settings.tabbarCount > 0 && (
        <div hidden>
          <SelectSetting
            icon={AlignHorizontalDistributeCenter}
            label="Distribution"
            value={settings.distribution}
            options={[
              {
                value: "packed",
                text: "Packed",
                label: <DistributionLabel distribution="packed">Packed</DistributionLabel>,
              },
              {
                value: "edges",
                text: "Edges",
                label: <DistributionLabel distribution="edges">Edges</DistributionLabel>,
              },
            ]}
            onValueChange={(value) =>
              onChange({ ...settings, distribution: value as BarSettings["distribution"] })
            }
          />
        </div>
      )}
    </div>
  )
}

function ToolbarControls({
  settings,
  onChange,
}: {
  settings: BarSettings
  onChange: (settings: BarSettings) => void
}) {
  const updateToolbar = (id: string, patch: Partial<ToolbarLayoutRequest>) => {
    onChange({
      ...settings,
      toolbars: settings.toolbars.map((bar) => (bar.id === id ? { ...bar, ...patch } : bar)),
    })
  }
  return (
    <div className="playground-controls grid gap-1" role="group" aria-label="Toolbar settings">
      <SelectSetting
        icon={IconNumber}
        label="Count"
        ariaLabel="Toolbar count"
        value={String(settings.toolbarCount)}
        options={[0, 1, 2, 3].map((count) => ({
          value: String(count),
          text: count === 0 ? "0 — None" : `${count} ${count === 1 ? "bar" : "bars"}`,
          label: <CountLabel count={count} />,
        }))}
        onValueChange={(value) => onChange({ ...settings, toolbarCount: Number(value) })}
      />
      {settings.toolbarCount > 0 && (
        <div className="playground-toolbar-settings grid gap-2.5 mt-0.5 mb-1">
          {settings.toolbars.slice(0, settings.toolbarCount).map((bar) => (
            <fieldset
              key={bar.id}
              className="m-0 grid min-w-0 grid-cols-1 gap-2 border-0 border-l border-border py-1 pl-2.5 pr-0"
            >
              <legend className="p-0 text-[11px] text-muted-foreground">Toolbar {bar.id}</legend>
              <SelectSetting
                icon={IconBoxAlignTopLeft}
                label="Placement"
                ariaLabel={`Toolbar ${bar.id} placement`}
                value={bar.placement}
                options={[
                  {
                    value: "top-leading",
                    text: "Top leading",
                    label: <PlacementLabel placement="top-leading">Top leading</PlacementLabel>,
                  },
                  {
                    value: "top-trailing",
                    text: "Top trailing",
                    label: <PlacementLabel placement="top-trailing">Top trailing</PlacementLabel>,
                  },
                  {
                    value: "bottom",
                    text: "Bottom",
                    label: <PlacementLabel placement="bottom">Bottom</PlacementLabel>,
                  },
                ]}
                onValueChange={(value) =>
                  updateToolbar(bar.id, { placement: value as ToolbarLayoutRequest["placement"] })
                }
              />
              <SelectSetting
                icon={IconAxisX}
                label="Axis"
                ariaLabel={`Toolbar ${bar.id} axis`}
                value={bar.axis ?? "adaptive"}
                options={[
                  { value: "adaptive", label: "Adaptive" },
                  { value: "horizontal", label: "Horizontal" },
                ]}
                onValueChange={(value) =>
                  updateToolbar(bar.id, { axis: value as ToolbarLayoutRequest["axis"] })
                }
              />
            </fieldset>
          ))}
        </div>
      )}
    </div>
  )
}

function ExampleBars({
  request,
  showBounds,
  onLayout,
  selectedId,
  onSelect,
  tabCount,
}: {
  request: BarsLayoutRequest
  showBounds: boolean
  onLayout: (layout: BarsLayout) => void
  selectedId: string
  onSelect: (id: string) => void
  tabCount: number
}) {
  const items = React.useMemo(() => tabItems.slice(0, tabCount), [tabCount])
  const bars = useBars(request)
  const colorMode = useDuoState((state) => state.system.colorMode)
  const [counts, setCounts] = React.useState<Readonly<Record<string, number>>>({})
  React.useEffect(() => onLayout(bars), [bars, onLayout])

  return (
    <div
      className="playground-bars-layer pointer-events-none absolute inset-0"
      data-show-bounds={showBounds}
    >
      {bars.toolbars.map((bar) => (
        <div
          key={bar.id}
          data-show-bounds={showBounds}
          {...bar.containerProps}
          className="playground-bar-area pointer-events-none data-[show-bounds=true]:outline data-[show-bounds=true]:outline-dashed data-[show-bounds=true]:outline-[#0879ed] data-[show-bounds=true]:outline-offset-[-1px] data-[show-bounds=true]:bg-[#0879ed0d]"
          data-playground-bar={bar.id}
        >
          <div
            className={cn(
              "playground-app-bar pointer-events-auto box-border flex min-h-0 min-w-0 max-h-full max-w-full gap-1 overflow-auto rounded-[28px] bg-[#f0f3f8] p-0.5 text-foreground [flex-direction:inherit]",
              colorMode === "dark" && "bg-[#2c2c2e] text-[#f4f4f4]",
            )}
          >
            <button
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-inherit focus-visible:outline-offset-[-2px]"
              type="button"
              aria-label={`Toolbar ${bar.id} action: ${counts[bar.id] ?? 0}`}
              title={`Toolbar ${bar.id}: clicked ${counts[bar.id] ?? 0} times`}
              onClick={() =>
                setCounts((current) => ({ ...current, [bar.id]: (current[bar.id] ?? 0) + 1 }))
              }
            >
              {bar.id}
              {!!counts[bar.id] && <small className="text-[10px]">{counts[bar.id]}</small>}
            </button>
          </div>
        </div>
      ))}
      {bars.tabbar && (
        <DuoTabBar
          layout={bars.tabbar}
          items={items}
          selectedId={selectedId}
          onSelect={onSelect}
          className="playground-bar-area pointer-events-none data-[show-bounds=true]:outline data-[show-bounds=true]:outline-dashed data-[show-bounds=true]:outline-[#0879ed] data-[show-bounds=true]:outline-offset-[-1px] data-[show-bounds=true]:bg-[#0879ed0d]"
          data-show-bounds={showBounds}
          data-playground-bar="tabs"
        />
      )}
    </div>
  )
}

function ControlSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details
      className="playground-section group/section border-b border-border select-none last:border-b-0"
      open
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs/normal font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          className="shrink-0 text-muted-foreground transition-transform duration-180 motion-reduce:transition-none group-open/section:rotate-180"
          size={14}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </summary>
      <div className="playground-section-content grid gap-1.5 px-3 pb-1.5">{children}</div>
    </details>
  )
}

function BackgroundPicker({
  backgrounds,
  onChange,
}: {
  backgrounds: Record<DuoColorMode, string>
  onChange: (mode: DuoColorMode, color: string) => void
}) {
  const colorMode = useDuoState((state) => state.system.colorMode)
  return (
    <ColorSetting
      icon={PaintBucket}
      label="Background"
      ariaLabel="Background color"
      value={backgrounds[colorMode]}
      onValueChange={(value) => onChange(colorMode, value)}
    />
  )
}

function PreviewFrame({
  backgrounds,
  children,
}: {
  backgrounds: Record<DuoColorMode, string>
  children: React.ReactNode
}) {
  const colorMode = useDuoState((state) => state.system.colorMode)
  const background = backgrounds[colorMode]
  return (
    <div
      className="playground-frame absolute inset-0"
      style={
        {
          "--playground-background": background,
          "--playground-color": foregroundColor(background),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}

export function Playground() {
  const [selectedTab, setSelectedTab] = React.useState("home")
  const [backgrounds, setBackgrounds] = React.useState({ light: "#ffffff", dark: "#111111" })
  const [regionsPinned, setRegionsPinned] = React.useState(false)
  const [highlightedRegionId, setHighlightedRegionId] = React.useState<string>()
  const [showBarBounds, setShowBarBounds] = React.useState(false)
  const [barSettings, setBarSettings] = React.useState(initialBarSettings)
  const updateBarSettings = (next: BarSettings) => {
    setBarSettings(next)
    if (
      next.tabbarCount > 0 &&
      !tabItems.slice(0, next.tabbarCount).some((item) => item.id === selectedTab)
    )
      setSelectedTab("home")
  }
  const [barsLayout, setBarsLayout] = React.useState<BarsLayout>()
  const request = React.useMemo(() => barRequest(barSettings), [barSettings])
  const [showBlock, setShowBlock] = React.useState(true)
  const [blockColor, setBlockColor] = React.useState("#0066ff")
  const [outerPortraitLocked, setOuterPortraitLocked] = React.useState(false)
  const [inspectorOpen, setInspectorOpen] = React.useState(false)
  const [fitPadding, setFitPadding] = React.useState<DuoInsets>({
    top: 24,
    right: 24,
    bottom: 98,
    left: 296,
  })
  const updateFitPadding = React.useCallback((next: DuoInsets) => {
    setFitPadding((current) =>
      current.top === next.top &&
      current.right === next.right &&
      current.bottom === next.bottom &&
      current.left === next.left
        ? current
        : next,
    )
  }, [])
  const frame = React.useRef<HTMLDivElement>(null)
  const inspectorToggle = React.useRef<HTMLButtonElement>(null)
  const closeInspector = React.useCallback(() => {
    setInspectorOpen(false)
    inspectorToggle.current?.focus({ preventScroll: true })
  }, [])
  return (
    <DuoProvider
      defaultSystem={{ colorMode: "light", cameraActive: true }}
      outerPortraitLocked={outerPortraitLocked}
    >
      <div
        className="playground group/playground relative isolate h-dvh overflow-hidden [--playground-sidebar-width:272px] [--playground-inspector-width:min(320px,42vw)] [--playground-sidebar-space:var(--playground-sidebar-width)] [--playground-inspector-space:0px] [--playground-bottom-space:0px] data-[inspector-open=true]:[--playground-inspector-space:var(--playground-inspector-width)] max-[1200px]:[--playground-sidebar-width:248px] max-[960px]:[--playground-sidebar-width:224px] max-sm:[--playground-sidebar-space:0px] max-sm:[--playground-inspector-space:0px] max-sm:data-[inspector-open=true]:[--playground-inspector-space:0px] max-sm:[--playground-bottom-space:35dvh]"
        data-inspector-open={inspectorOpen}
      >
        <div className="playground-workspace relative h-full">
          <aside
            className="playground-sidebar @container absolute inset-y-0 left-0 z-10 box-border flex w-(--playground-sidebar-width) min-h-0 min-w-0 flex-col border-r border-border bg-white/90 backdrop-blur-[20px] backdrop-saturate-[125%] max-sm:inset-x-0 max-sm:top-auto max-sm:h-(--playground-bottom-space) max-sm:w-full max-sm:border-r-0 max-sm:border-t max-sm:group-data-[inspector-open=true]/playground:bg-transparent max-sm:group-data-[inspector-open=true]/playground:backdrop-filter-none"
            aria-label="Playground settings"
          >
            <div className="playground-sidebar-heading box-border flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-3 max-sm:group-data-[inspector-open=true]/playground:bg-white/90 max-sm:group-data-[inspector-open=true]/playground:backdrop-blur-[20px] max-sm:group-data-[inspector-open=true]/playground:backdrop-saturate-[125%]">
              <h1 className="playground-title m-0 flex items-center gap-2 text-[13px] font-semibold">
                <img src="/favicon.svg" alt="" width={16} height={16} className="size-4 shrink-0" />
                Duo React
              </h1>
              <InspectorToggle
                buttonRef={inspectorToggle}
                open={inspectorOpen}
                onOpenChange={(open) => (open ? setInspectorOpen(true) : closeInspector())}
              />
            </div>
            <ScrollSurface className="playground-sidebar-scroll min-h-0 flex-1 max-sm:group-data-[inspector-open=true]/playground:invisible">
              <ControlSection title="System">
                <SystemControls />
              </ControlSection>
              <ControlSection title="App">
                <div
                  className="playground-controls grid gap-1"
                  role="group"
                  aria-label="App settings"
                >
                  <BackgroundPicker
                    backgrounds={backgrounds}
                    onChange={(mode, color) =>
                      setBackgrounds((current) => ({ ...current, [mode]: color }))
                    }
                  />
                  <IndicatorStylePicker />
                  <StatusBarPicker />
                  <ToggleSetting
                    icon={LockKeyhole}
                    label="Outer portrait lock"
                    title="Keep the outer app in portrait while rotating"
                    checked={outerPortraitLocked}
                    onCheckedChange={setOuterPortraitLocked}
                  />
                  <ToggleSetting
                    icon={Square}
                    label="Block"
                    title="Show draggable color block"
                    checked={showBlock}
                    onCheckedChange={setShowBlock}
                  />
                  <ColorSetting
                    icon={IconColorSwatch}
                    label="Block color"
                    value={blockColor}
                    onValueChange={setBlockColor}
                  />
                </div>
              </ControlSection>
              <ControlSection title="Tab bar">
                <TabBarControls settings={barSettings} onChange={updateBarSettings} />
              </ControlSection>
              <ControlSection title="Toolbars">
                <ToolbarControls settings={barSettings} onChange={updateBarSettings} />
              </ControlSection>
            </ScrollSurface>
          </aside>
          <main
            className="playground-preview absolute inset-0 overflow-hidden"
            aria-label="Device preview"
          >
            <PreviewCanvas onFitPaddingChange={updateFitPadding}>
              <PreviewFrame backgrounds={backgrounds}>
                <DuoFrame
                  ref={frame}
                  fitPadding={fitPadding}
                  style={{ width: "100%", height: "100%" }}
                  aria-label="Duo layout preview"
                >
                  <ExampleApp
                    showBlock={showBlock}
                    blockColor={blockColor}
                    selectedTab={selectedTab}
                  />
                  <ExampleBars
                    request={request}
                    showBounds={showBarBounds}
                    onLayout={setBarsLayout}
                    selectedId={selectedTab}
                    onSelect={setSelectedTab}
                    tabCount={barSettings.tabbarCount}
                  />
                </DuoFrame>
                <DuoRegionMask
                  frameRef={frame}
                  theme="light"
                  highlightedRegionId={highlightedRegionId}
                  onHighlightedRegionChange={setHighlightedRegionId}
                  data-overlay-pinned={regionsPinned}
                />
              </PreviewFrame>
              <PreviewControls />
            </PreviewCanvas>
          </main>
          <StateInspector
            open={inspectorOpen}
            request={request}
            layout={barsLayout}
            regionsPinned={regionsPinned}
            onRegionsPinnedChange={setRegionsPinned}
            showBarBounds={showBarBounds}
            onShowBarBoundsChange={setShowBarBounds}
            highlightedRegionId={highlightedRegionId}
            onHoveredRegionChange={setHighlightedRegionId}
            onClose={closeInspector}
          />
        </div>
      </div>
    </DuoProvider>
  )
}
