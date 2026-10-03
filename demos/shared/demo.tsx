import * as React from "react";
import {
  DuoFrame,
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
import { RegionOverlay } from "./region-overlay";
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
    <div className="demo-appearance">
      <label>
        Background{" "}
        <select
          value={value}
          onChange={(event) => onChange(event.currentTarget.value as Background)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="gray">Gray</option>
          <option value="mixed">Light top, dark bottom</option>
        </select>
      </label>
      <label>
        Icons{" "}
        <select
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
    </div>
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

function ExampleApp({ background }: { background: Background }) {
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
    </DuoSafeArea>
  );
}

const iframeSource = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Iframe example</title>
<style>
  html { height: 100%; }
  body {
    min-height: 100%;
    box-sizing: border-box;
    margin: 0;
    padding: var(--duo-safe-area-inset-top, 0px) var(--duo-safe-area-inset-right, 0px)
      var(--duo-safe-area-inset-bottom, 0px) var(--duo-safe-area-inset-left, 0px);
    font: 16px system-ui, sans-serif;
    color: #222;
    background: white;
  }
  main { position: relative; padding: 24px; }
  #bottom-background { position: fixed; left: 0; right: 0; bottom: 0; height: 50%; background: #111; display: none; }
  h1 { font-size: 20px; }
  button, input { font: inherit; }
  label { display: block; margin-top: 16px; }
  input { max-width: 70%; }
</style>
<div id="bottom-background"></div>
<main>
  <h1>Iframe</h1>
  <button type="button" id="count">Count: 0</button>
  <label>Text <input></label>
</main>
<script>
  let count = 0;
  document.getElementById('count').onclick = function () {
    this.textContent = 'Count: ' + (++count);
  };
  addEventListener('message', event => {
    if (event.source !== parent || event.origin !== parent.location.origin || event.data?.type !== 'demo:layout') return;
    const { display, safeArea } = event.data.screen;
    document.body.style.background = event.data.appearance.background;
    document.body.style.color = event.data.appearance.color;
    document.getElementById("bottom-background").style.display = event.data.background === "mixed" ? "block" : "none";
    document.querySelector('h1').textContent = display === 'inner' ? 'Inner screen (iframe)' : 'Outer screen (iframe)';
    for (const [side, value] of Object.entries(safeArea)) {
      document.documentElement.style.setProperty('--duo-safe-area-inset-' + side, value + 'px');
    }
  });
</script>
</html>`;

function IframeApp({ background }: { background: Background }) {
  const screen = useDuoScreen();
  const frame = React.useRef<HTMLIFrameElement>(null);
  const publish = React.useCallback(() => {
    frame.current?.contentWindow?.postMessage(
      { type: "demo:layout", screen, background, appearance: backgrounds[background] },
      window.location.origin,
    );
  }, [screen, background]);
  React.useEffect(publish, [publish]);
  return (
    <iframe
      className="demo-iframe"
      title={`${screen.display} screen iframe`}
      ref={frame}
      srcDoc={iframeSource}
      onLoad={publish}
    />
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
  const frame = React.useRef<HTMLDivElement>(null);
  const stage = React.useRef<HTMLDivElement>(null);
  const iframe = new URLSearchParams(window.location.search).get("content") === "iframe";
  return (
    <DuoProvider>
      <main className="demo">
        <h1>React {version}</h1>
        <nav aria-label="Demo content">
          <a href="?content=react" aria-current={!iframe ? "page" : undefined}>
            React content
          </a>
          <a href="?content=iframe" aria-current={iframe ? "page" : undefined}>
            Iframe content
          </a>
        </nav>
        <BackgroundPicker value={background} onChange={setBackground} />
        <label className="demo-region-toggle">
          <input
            type="checkbox"
            checked={showRegions}
            onChange={(event) => setShowRegions(event.currentTarget.checked)}
          />{" "}
          Show layout regions
        </label>
        <label className="demo-region-toggle">
          <input
            type="checkbox"
            checked={showBars}
            onChange={(event) => setShowBars(event.currentTarget.checked)}
          />{" "}
          Show app bars
        </label>
        <ProviderState />
        {showRegions && (
          <p className="demo-region-note">
            App safe area and insets; whole-display reserved regions and the inactive inner fold.
            All measurements are logical pixels. Fills show exact bounds; dashed outlines sit 2 px
            inside them.
          </p>
        )}
        <div
          ref={stage}
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
            inner={
              <>
                {iframe ? (
                  <IframeApp background={background} />
                ) : (
                  <ExampleApp background={background} />
                )}
                {showBars && <ExampleBars />}
              </>
            }
            outer={
              <>
                {iframe ? (
                  <IframeApp background={background} />
                ) : (
                  <ExampleApp background={background} />
                )}
                {showBars && <ExampleBars />}
              </>
            }
            style={{ width: "100%", height: "100%" }}
            aria-label="Duo layout preview"
          />
          {showRegions && <RegionOverlay frameRef={frame} stageRef={stage} />}
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
