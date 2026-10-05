import * as React from "react"
import { Home, Layers2, Library, Settings } from "lucide-react"
import {
  DuoFrame,
  DuoTabBar,
  DuoRegionMask,
  DuoProvider,
  DuoSafeArea,
  DuoToolbar,
  DuoDisplayControls,
  DuoRotationControls,
  DuoLayoutControls,
  DuoZoomControls,
  useDuoActions,
  useDuoState,
  useDuoScreen,
  useBars,
  type BarsLayout,
  type BarsLayoutRequest,
  type TabBarLayoutRequest,
  type ToolbarLayoutRequest,
  type DuoIndicatorStyle,
} from "duo-frame"
import { DraggableBlock } from "./draggable-block"
import { StateInspector } from "./state-inspector"
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
    <label className="demo-select">
      <span id="demo-icons-label">Icons</span>
      <select
        aria-labelledby="demo-icons-label"
        value={indicatorStyle}
        onChange={(event) => {
          const next = event.currentTarget.value as DuoIndicatorStyle
          const styles = { statusBar: next, homeIndicator: next }
          setSystem({ indicatorStyles: { inner: styles, outer: styles } })
        }}
      >
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  )
}

function StatusBarPicker() {
  const hidden = useDuoState((state) => state.system.prefersStatusBarHidden)
  const { setSystem } = useDuoActions()
  return (
    <label className="demo-select">
      <span id="demo-status-label">Status bar</span>
      <select
        aria-labelledby="demo-status-label"
        value={hidden === undefined ? "auto" : hidden ? "hide" : "show"}
        onChange={(event) => {
          const value = event.currentTarget.value
          setSystem({ prefersStatusBarHidden: value === "auto" ? undefined : value === "hide" })
        }}
      >
        <option value="auto">Auto</option>
        <option value="show">Show</option>
        <option value="hide">Hide</option>
      </select>
    </label>
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
      <label className="demo-select">
        <span>Time</span>
        <select
          aria-label="Time mode"
          value={mode}
          onChange={(event) => setMode(event.currentTarget.value)}
        >
          <option value="automatic">Automatic</option>
          <option value="specified">Manual</option>
        </select>
      </label>
      {mode === "specified" && (
        <label className="demo-time">
          <span>Value</span>
          <input
            type="time"
            aria-label="Specified time"
            step={60}
            value={specifiedTime}
            onChange={(event) => setSpecifiedTime(event.currentTarget.value)}
          />
        </label>
      )}
    </>
  )
}

function SystemControls() {
  const { battery, charging, wifiStrength, cellularStrength } = useDuoState((state) => state.system)
  const { setSystem } = useDuoActions()
  return (
    <div className="demo-controls" role="group" aria-label="System indicators">
      <TimeControls />
      <label className="demo-range">
        <span id="demo-battery-label">Battery</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={battery}
          aria-labelledby="demo-battery-label"
          aria-valuetext={`${battery}%`}
          onChange={(event) => setSystem({ battery: Number(event.currentTarget.value) })}
        />
        <span className="demo-range-value">{battery}%</span>
      </label>
      <label className="demo-toggle">
        <input
          type="checkbox"
          checked={charging}
          onChange={(event) => setSystem({ charging: event.currentTarget.checked })}
        />
        <span>Charging</span>
      </label>
      <label className="demo-select">
        <span id="demo-wifi-label">Wi-Fi</span>
        <select
          aria-labelledby="demo-wifi-label"
          value={wifiStrength}
          onChange={(event) => setSystem({ wifiStrength: Number(event.currentTarget.value) })}
        >
          <option value={0}>0 — None</option>
          <option value={1}>1 — Weak</option>
          <option value={2}>2 — Medium</option>
          <option value={3}>3 — Strong</option>
        </select>
      </label>
      <label className="demo-select">
        <span id="demo-cellular-label">Cellular</span>
        <select
          aria-labelledby="demo-cellular-label"
          value={cellularStrength}
          onChange={(event) => setSystem({ cellularStrength: Number(event.currentTarget.value) })}
        >
          <option value={0}>0 — None</option>
          <option value={1}>1 — Weak</option>
          <option value={2}>2 — Fair</option>
          <option value={3}>3 — Good</option>
          <option value={4}>4 — Strong</option>
        </select>
      </label>
    </div>
  )
}

const tabItems = [
  { id: "home", icon: <Home />, label: "Home" },
  { id: "library", icon: <Library />, label: "Library" },
  { id: "settings", icon: <Settings />, label: "Settings" },
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
  const { display } = useDuoScreen()
  const [count, setCount] = React.useState(0)
  const [text, setText] = React.useState("")
  return (
    <DuoSafeArea className="demo-app">
      <div className="demo-content">
        <h2>{tabItems.find((item) => item.id === selectedTab)?.label}</h2>
        <p>{display === "inner" ? "Inner screen" : "Outer screen"}</p>
        <button type="button" onClick={() => setCount((value) => value + 1)}>
          Count: {count}
        </button>
        <label>
          Text <input value={text} onChange={(event) => setText(event.currentTarget.value)} />
        </label>
      </div>
      <DraggableBlock visible={showBlock} color={blockColor} />
    </DuoSafeArea>
  )
}

interface BarSettings {
  readonly toolbarsEnabled: boolean
  readonly tabbarEnabled: boolean
  readonly toolbarCount: number
  readonly toolbars: readonly ToolbarLayoutRequest[]
  readonly distribution: NonNullable<TabBarLayoutRequest["distribution"]>
  readonly showBounds: boolean
}

const initialBarSettings: BarSettings = {
  toolbarsEnabled: false,
  tabbarEnabled: true,
  toolbarCount: 1,
  toolbars: [
    { id: "A", placement: "top-trailing", axis: "adaptive" },
    { id: "B", placement: "top-leading", axis: "horizontal" },
    { id: "C", placement: "bottom", axis: "adaptive" },
  ],
  distribution: "packed",
  showBounds: false,
}

function barRequest(settings: BarSettings): BarsLayoutRequest {
  return {
    toolbars: settings.toolbarsEnabled ? settings.toolbars.slice(0, settings.toolbarCount) : [],
    tabbar: settings.tabbarEnabled ? { distribution: settings.distribution } : undefined,
  }
}

function BarControls({
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
    <section className="demo-bars-controls" aria-label="App bar configuration">
      <div className="demo-controls">
        <label className="demo-toggle">
          <input
            type="checkbox"
            checked={settings.toolbarsEnabled}
            onChange={(event) =>
              onChange({ ...settings, toolbarsEnabled: event.currentTarget.checked })
            }
          />
          <span>Toolbars</span>
        </label>
        {settings.toolbarsEnabled && (
          <label className="demo-select">
            <span>Toolbar count</span>
            <select
              value={settings.toolbarCount}
              onChange={(event) =>
                onChange({ ...settings, toolbarCount: Number(event.currentTarget.value) })
              }
            >
              {[1, 2, 3].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
        )}
        {settings.toolbarsEnabled && (
          <div className="demo-toolbar-settings">
            {settings.toolbars.slice(0, settings.toolbarCount).map((bar) => (
              <fieldset key={bar.id}>
                <legend>Toolbar {bar.id}</legend>
                <label className="demo-select">
                  <span>Placement</span>
                  <select
                    aria-label={`Toolbar ${bar.id} placement`}
                    value={bar.placement}
                    onChange={(event) =>
                      updateToolbar(bar.id, {
                        placement: event.currentTarget.value as ToolbarLayoutRequest["placement"],
                      })
                    }
                  >
                    <option value="top-leading">Top leading</option>
                    <option value="top-trailing">Top trailing</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </label>
                <label className="demo-select">
                  <span>Axis</span>
                  <select
                    aria-label={`Toolbar ${bar.id} axis`}
                    value={bar.axis}
                    onChange={(event) =>
                      updateToolbar(bar.id, {
                        axis: event.currentTarget.value as ToolbarLayoutRequest["axis"],
                      })
                    }
                  >
                    <option value="adaptive">Adaptive</option>
                    <option value="horizontal">Horizontal</option>
                  </select>
                </label>
              </fieldset>
            ))}
          </div>
        )}
        <label className="demo-toggle">
          <input
            type="checkbox"
            checked={settings.tabbarEnabled}
            onChange={(event) =>
              onChange({ ...settings, tabbarEnabled: event.currentTarget.checked })
            }
          />
          <span>Tab bar</span>
        </label>
        {settings.tabbarEnabled && (
          <label className="demo-select">
            <span>Tab distribution</span>
            <select
              value={settings.distribution}
              onChange={(event) =>
                onChange({
                  ...settings,
                  distribution: event.currentTarget.value as BarSettings["distribution"],
                })
              }
            >
              <option value="packed">Packed</option>
              <option value="edges">Edges</option>
            </select>
          </label>
        )}
        <label className="demo-toggle">
          <input
            type="checkbox"
            checked={settings.showBounds}
            onChange={(event) => onChange({ ...settings, showBounds: event.currentTarget.checked })}
          />
          <span>Bar bounds</span>
        </label>
      </div>
    </section>
  )
}

function ExampleBars({
  request,
  showBounds,
  onLayout,
  selectedId,
  onSelect,
}: {
  request: BarsLayoutRequest
  showBounds: boolean
  onLayout: (layout: BarsLayout) => void
  selectedId: string
  onSelect: (id: string) => void
}) {
  const bars = useBars(request)
  const [counts, setCounts] = React.useState<Readonly<Record<string, number>>>({})
  React.useEffect(() => onLayout(bars), [bars, onLayout])

  return (
    <div className="demo-bars-layer" data-show-bounds={showBounds}>
      {bars.toolbars.map((bar) => (
        <div key={bar.id} {...bar.containerProps} className="demo-bar-area" data-demo-bar={bar.id}>
          <div className="demo-app-bar">
            <button
              type="button"
              aria-label={`Toolbar ${bar.id} action: ${counts[bar.id] ?? 0}`}
              title={`Toolbar ${bar.id}: clicked ${counts[bar.id] ?? 0} times`}
              onClick={() =>
                setCounts((current) => ({ ...current, [bar.id]: (current[bar.id] ?? 0) + 1 }))
              }
            >
              {bar.id}
              {!!counts[bar.id] && <small>{counts[bar.id]}</small>}
            </button>
          </div>
        </div>
      ))}
      {bars.tabbar && (
        <DuoTabBar
          layout={bars.tabbar}
          items={tabItems}
          selectedId={selectedId}
          onSelect={onSelect}
          className="demo-bar-area"
          data-show-bounds={showBounds}
          data-demo-bar="tabs"
        />
      )}
    </div>
  )
}

function ControlSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="demo-section" open>
      <summary>{title}</summary>
      <div className="demo-section-content">{children}</div>
    </details>
  )
}

function PreviewFrame({ background, children }: { background: string; children: React.ReactNode }) {
  const size = useDuoState(
    (state) => state.screens[state.posture === "closed" ? "outer" : "inner"].size,
  )
  return (
    <div
      className="demo-frame"
      style={
        {
          "--demo-background": background,
          "--demo-color": foregroundColor(background),
          "--demo-device-ratio": size.width / size.height,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}

export function Demo() {
  const [selectedTab, setSelectedTab] = React.useState("home")
  const [background, setBackground] = React.useState("#ffffff")
  const [showRegions, setShowRegions] = React.useState(false)
  const [barSettings, setBarSettings] = React.useState(initialBarSettings)
  const [barsLayout, setBarsLayout] = React.useState<BarsLayout>()
  const request = React.useMemo(() => barRequest(barSettings), [barSettings])
  const [showBlock, setShowBlock] = React.useState(true)
  const [blockColor, setBlockColor] = React.useState("#0066ff")
  const [outerPortraitLocked, setOuterPortraitLocked] = React.useState(false)
  const [inspectorOpen, setInspectorOpen] = React.useState(true)
  const frame = React.useRef<HTMLDivElement>(null)
  const inspectorToggle = React.useRef<HTMLButtonElement>(null)
  return (
    <DuoProvider defaultSystem={{ cameraActive: true }} outerPortraitLocked={outerPortraitLocked}>
      <div className="demo" data-inspector-open={inspectorOpen}>
        <button
          ref={inspectorToggle}
          type="button"
          className="demo-state-toggle"
          aria-label={inspectorOpen ? "Hide inspector" : "Show inspector"}
          title={inspectorOpen ? "Hide inspector" : "Show inspector"}
          aria-expanded={inspectorOpen}
          aria-controls="demo-state-panel"
          onClick={() => setInspectorOpen((open) => !open)}
        >
          <span className="demo-panel-icon" aria-hidden="true" />
        </button>
        <div className="demo-workspace">
          <aside className="demo-sidebar" aria-label="Demo settings">
            <div className="demo-sidebar-scroll">
              <ControlSection title="Appearance">
                <div className="demo-controls" role="group" aria-label="Preview appearance">
                  <label className="demo-color">
                    <span>Background</span>
                    <input
                      type="color"
                      aria-label="Background color"
                      value={background}
                      onChange={(event) => setBackground(event.currentTarget.value)}
                    />
                  </label>
                  <IndicatorStylePicker />
                  <StatusBarPicker />
                  <label
                    className="demo-toggle"
                    title="Keep the outer app in portrait while rotating"
                  >
                    <input
                      type="checkbox"
                      checked={outerPortraitLocked}
                      onChange={(event) => setOuterPortraitLocked(event.currentTarget.checked)}
                    />
                    <span>Outer portrait lock</span>
                  </label>
                </div>
              </ControlSection>
              <ControlSection title="System indicators">
                <SystemControls />
              </ControlSection>
              <ControlSection title="App bars">
                <BarControls settings={barSettings} onChange={setBarSettings} />
              </ControlSection>
              <ControlSection title="Draggable block">
                <div className="demo-controls">
                  <label className="demo-toggle" title="Show draggable color block">
                    <input
                      type="checkbox"
                      checked={showBlock}
                      onChange={(event) => setShowBlock(event.currentTarget.checked)}
                    />
                    <span>Block</span>
                  </label>
                  <label className="demo-color">
                    <span>Color</span>
                    <input
                      type="color"
                      aria-label="Block color"
                      value={blockColor}
                      onChange={(event) => setBlockColor(event.currentTarget.value)}
                    />
                  </label>
                </div>
              </ControlSection>
            </div>
          </aside>
          <main className="demo-preview" aria-label="Device preview">
            <div className="demo-canvas">
              <button
                type="button"
                className="demo-regions-toggle"
                aria-label="Layout regions"
                aria-pressed={showRegions}
                title="Layout regions"
                onClick={() => setShowRegions((visible) => !visible)}
              >
                <Layers2 size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
              <PreviewFrame background={background}>
                <DuoFrame
                  ref={frame}
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
                    showBounds={barSettings.showBounds}
                    onLayout={setBarsLayout}
                    selectedId={selectedTab}
                    onSelect={setSelectedTab}
                  />
                </DuoFrame>
                {showRegions && <DuoRegionMask frameRef={frame} theme="light" />}
              </PreviewFrame>
            </div>
            <DuoToolbar className="demo-toolbar">
              <DuoDisplayControls className="demo-toolbar-group" />
              <DuoRotationControls className="demo-toolbar-group" />
              <DuoLayoutControls className="demo-toolbar-group" />
              <DuoZoomControls className="demo-toolbar-group" />
            </DuoToolbar>
          </main>
          <StateInspector
            open={inspectorOpen}
            request={request}
            layout={barsLayout}
            onClose={() => {
              setInspectorOpen(false)
              inspectorToggle.current?.focus()
            }}
          />
        </div>
      </div>
    </DuoProvider>
  )
}
