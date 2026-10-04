import * as React from "react"
import {
  DuoFrame,
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

const backgrounds = {
  light: { background: "#fff", color: "#222" },
  dark: { background: "#111", color: "#fff" },
  gray: { background: "#808080", color: "#000" },
  mixed: {
    background: "#fff",
    color: "#222",
  },
} as const
type Background = keyof typeof backgrounds

function BackgroundPicker({
  value,
  onChange,
}: {
  value: Background
  onChange: (value: Background) => void
}) {
  const { setSystem } = useDuoActions()
  const indicatorStyle = useDuoState((state) => state.system.indicatorStyles.outer.statusBar)
  return (
    <>
      <label className="demo-select">
        <span id="demo-background-label">Background</span>
        <select
          aria-labelledby="demo-background-label"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value as Background)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="gray">Gray</option>
          <option value="mixed">Light top, dark bottom</option>
        </select>
      </label>
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
          <option value="light">Light (white)</option>
          <option value="dark">Dark (black)</option>
        </select>
      </label>
    </>
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

function CameraToggle() {
  const cameraActive = useDuoState((state) => state.system.cameraActive)
  const { setSystem } = useDuoActions()
  return (
    <label className="demo-toggle" title="Simulate inner camera activity">
      <input
        type="checkbox"
        checked={cameraActive}
        onChange={(event) => setSystem({ cameraActive: event.currentTarget.checked })}
      />
      <span>Camera</span>
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
          <option value="specified">Specified time</option>
        </select>
      </label>
      {mode === "specified" && (
        <label className="demo-time">
          <span>Time</span>
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

function ExampleApp({
  background,
  showBlock,
  blockColor,
}: {
  background: Background
  showBlock: boolean
  blockColor: string
}) {
  const { display } = useDuoScreen()
  const [count, setCount] = React.useState(0)
  const [text, setText] = React.useState("")
  return (
    <DuoSafeArea className="demo-app">
      {background === "mixed" && <div className="demo-bottom-background" />}
      <div className="demo-content">
        <h2>{display === "inner" ? "Inner screen" : "Outer screen"}</h2>
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
  tabbarEnabled: false,
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
        <label className="demo-select">
          <span>Toolbar count</span>
          <select
            disabled={!settings.toolbarsEnabled}
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
        <label className="demo-select">
          <span>Tab distribution</span>
          <select
            disabled={!settings.tabbarEnabled}
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
        <label className="demo-toggle">
          <input
            type="checkbox"
            checked={settings.showBounds}
            onChange={(event) => onChange({ ...settings, showBounds: event.currentTarget.checked })}
          />
          <span>Bar bounds</span>
        </label>
      </div>
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
    </section>
  )
}

function ExampleBars({
  request,
  showBounds,
  onLayout,
}: {
  request: BarsLayoutRequest
  showBounds: boolean
  onLayout: (layout: BarsLayout) => void
}) {
  const bars = useBars(request)
  const [tab, setTab] = React.useState(1)
  const [counts, setCounts] = React.useState<Readonly<Record<string, number>>>({})
  const [searchActive, setSearchActive] = React.useState(false)
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
        <nav
          {...bars.tabbar.containerProps}
          className="demo-bar-area demo-tab-area"
          data-demo-bar="tabs"
          aria-label="App destinations"
        >
          <div className="demo-app-bar">
            {[1, 2].map((value) => (
              <button
                type="button"
                key={value}
                aria-label={`Destination ${value}`}
                aria-pressed={tab === value}
                onClick={() => setTab(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="demo-app-bar">
            <button
              type="button"
              aria-label="Search"
              aria-pressed={searchActive}
              onClick={() => setSearchActive((active) => !active)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden="true"
              >
                <circle cx="10" cy="10" r="6" />
                <path d="m15 15 5 5" />
              </svg>
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}

export function Demo() {
  const [background, setBackground] = React.useState<Background>("light")
  const [showRegions, setShowRegions] = React.useState(false)
  const [barSettings, setBarSettings] = React.useState(initialBarSettings)
  const [barsLayout, setBarsLayout] = React.useState<BarsLayout>()
  const request = React.useMemo(() => barRequest(barSettings), [barSettings])
  const [showBlock, setShowBlock] = React.useState(true)
  const [blockColor, setBlockColor] = React.useState("#0066ff")
  const [outerPortraitLocked, setOuterPortraitLocked] = React.useState(false)
  const frame = React.useRef<HTMLDivElement>(null)
  return (
    <DuoProvider outerPortraitLocked={outerPortraitLocked}>
      <main className="demo">
        <div className="demo-controls" role="group" aria-label="Preview appearance">
          <BackgroundPicker value={background} onChange={setBackground} />
          <StatusBarPicker />
          <CameraToggle />
          <label className="demo-toggle" title="Keep the outer app in portrait while rotating">
            <input
              type="checkbox"
              checked={outerPortraitLocked}
              onChange={(event) => setOuterPortraitLocked(event.currentTarget.checked)}
            />
            <span>Outer portrait lock</span>
          </label>
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
          <label className="demo-toggle" title="Show layout regions">
            <input
              type="checkbox"
              aria-label="Show layout regions"
              checked={showRegions}
              onChange={(event) => setShowRegions(event.currentTarget.checked)}
            />
            <span>Regions</span>
          </label>
        </div>
        <SystemControls />
        <BarControls settings={barSettings} onChange={setBarSettings} />
        <StateInspector request={request} layout={barsLayout} />
        <div
          className="demo-frame"
          data-regions={showRegions}
          style={
            {
              "--demo-background": backgrounds[background].background,
              "--demo-color": backgrounds[background].color,
            } as React.CSSProperties
          }
        >
          <DuoFrame
            ref={frame}
            style={{ width: "100%", height: "100%" }}
            aria-label="Duo layout preview"
          >
            <ExampleApp background={background} showBlock={showBlock} blockColor={blockColor} />
            <ExampleBars
              request={request}
              showBounds={barSettings.showBounds}
              onLayout={setBarsLayout}
            />
          </DuoFrame>
          {showRegions && (
            <DuoRegionMask frameRef={frame} theme={background === "dark" ? "dark" : "light"} />
          )}
        </div>
        <DuoToolbar className="demo-toolbar">
          <DuoDisplayControls className="demo-toolbar-group" />
          <DuoRotationControls className="demo-toolbar-group" />
          <DuoLayoutControls className="demo-toolbar-group" />
          <DuoZoomControls className="demo-toolbar-group" />
        </DuoToolbar>
      </main>
    </DuoProvider>
  )
}
