import * as React from "react";
import {
  DuoFrame,
  DuoRegionMask,
  DuoProvider,
  DuoSafeArea,
  DuoTabBar,
  DuoAppToolbar,
  DuoToolbar,
  DuoDisplayControls,
  DuoRotationControls,
  DuoLayoutControls,
  DuoZoomControls,
  useDuoActions,
  useDuoState,
  useDuoScreen,
} from "duo-frame";
import type { DuoIndicatorStyle } from "duo-frame";
import { DraggableBlock } from "./draggable-block";
import "duo-frame/style.css";
import "./style.css";

const backgrounds = {
  light: { background: "#fff", color: "#222" },
  dark: { background: "#111", color: "#fff" },
  gray: { background: "#808080", color: "#000" },
  mixed: {
    background: "#fff",
    color: "#222",
  },
} as const;
type Background = keyof typeof backgrounds;

function BackgroundPicker({
  value,
  onChange,
}: {
  value: Background;
  onChange: (value: Background) => void;
}) {
  const { setSystem } = useDuoActions();
  const indicatorStyle = useDuoState((state) => state.system.indicatorStyles.outer.statusBar);
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
            const next = event.currentTarget.value as DuoIndicatorStyle;
            const styles = { statusBar: next, homeIndicator: next };
            setSystem({ indicatorStyles: { inner: styles, outer: styles } });
          }}
        >
          <option value="auto">Auto</option>
          <option value="light">Light (white)</option>
          <option value="dark">Dark (black)</option>
        </select>
      </label>
    </>
  );
}

function CameraToggle() {
  const cameraActive = useDuoState((state) => state.system.cameraActive);
  const { setSystem } = useDuoActions();
  return (
    <label className="demo-toggle" title="Simulate inner camera activity">
      <input
        type="checkbox"
        checked={cameraActive}
        onChange={(event) => setSystem({ cameraActive: event.currentTarget.checked })}
      />
      <span>Camera</span>
    </label>
  );
}

function ProviderState() {
  const state = useDuoState((value) => value);
  return (
    <details className="demo-state">
      <summary>Provider state</summary>
      <pre>{JSON.stringify(state, undefined, 2)}</pre>
    </details>
  );
}

function ExampleApp({ background, showBlock }: { background: Background; showBlock: boolean }) {
  const { display } = useDuoScreen();
  const [count, setCount] = React.useState(0);
  const [text, setText] = React.useState("");
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
      <DraggableBlock visible={showBlock} />
    </DuoSafeArea>
  );
}

function ExampleBars() {
  const [tab, setTab] = React.useState(1);
  const [count, setCount] = React.useState(0);
  return (
    <>
      <DuoAppToolbar className="demo-app-bar" aria-label="App actions">
        <button
          type="button"
          aria-label={`Add item: ${count}`}
          onClick={() => setCount((value) => value + 1)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </DuoAppToolbar>
      <DuoTabBar className="demo-app-bar" aria-label="App destinations">
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
      </DuoTabBar>
    </>
  );
}

export function Demo({ version }: { version: string }) {
  const [background, setBackground] = React.useState<Background>("light");
  const [showRegions, setShowRegions] = React.useState(false);
  const [showBars, setShowBars] = React.useState(false);
  const [showBlock, setShowBlock] = React.useState(true);
  const frame = React.useRef<HTMLDivElement>(null);
  return (
    <DuoProvider>
      <main className="demo">
        <h1>React {version}</h1>
        <div className="demo-controls" role="group" aria-label="Preview appearance">
          <BackgroundPicker value={background} onChange={setBackground} />
          <CameraToggle />
          <label className="demo-toggle" title="Show draggable color block">
            <input
              type="checkbox"
              checked={showBlock}
              onChange={(event) => setShowBlock(event.currentTarget.checked)}
            />
            <span>Block</span>
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
          <label className="demo-toggle" title="Show app bars">
            <input
              type="checkbox"
              aria-label="Show app bars"
              checked={showBars}
              onChange={(event) => setShowBars(event.currentTarget.checked)}
            />
            <span>Bars</span>
          </label>
        </div>
        <ProviderState />
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
            <ExampleApp background={background} showBlock={showBlock} />
            {showBars && <ExampleBars />}
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
  );
}
