import * as React from "react";
import { DuoFrame, DuoProvider, DuoSafeArea, DuoToolbar, useDuoScreen } from "duo-frame";
import "duo-frame/style.css";
import "./style.css";

function ExampleApp() {
  const { display } = useDuoScreen();
  const [count, setCount] = React.useState(0);
  const [text, setText] = React.useState("");
  return (
    <DuoSafeArea className="demo-app">
      <div>
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
  body {
    margin: 0;
    padding: var(--duo-safe-area-inset-top, 0px) var(--duo-safe-area-inset-right, 0px)
      var(--duo-safe-area-inset-bottom, 0px) var(--duo-safe-area-inset-left, 0px);
    font: 16px system-ui, sans-serif;
    color: #222;
    background: white;
  }
  main { padding: 24px; }
  h1 { font-size: 20px; }
  button, input { font: inherit; }
  label { display: block; margin-top: 16px; }
  input { max-width: 70%; }
</style>
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
    document.querySelector('h1').textContent = display === 'inner' ? 'Inner screen (iframe)' : 'Outer screen (iframe)';
    for (const [side, value] of Object.entries(safeArea)) {
      document.documentElement.style.setProperty('--duo-safe-area-inset-' + side, value + 'px');
    }
  });
</script>
</html>`;

function IframeApp() {
  const screen = useDuoScreen();
  const frame = React.useRef<HTMLIFrameElement>(null);
  const publish = React.useCallback(() => {
    frame.current?.contentWindow?.postMessage(
      { type: "demo:layout", screen },
      window.location.origin,
    );
  }, [screen]);
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

export function Demo({ version }: { version: string }) {
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
        <DuoToolbar />
        <div className="demo-frame">
          <DuoFrame
            inner={iframe ? <IframeApp /> : <ExampleApp />}
            outer={iframe ? <IframeApp /> : <ExampleApp />}
            style={{ width: "100%", height: "100%" }}
            aria-label="Duo layout preview"
          />
        </div>
      </main>
    </DuoProvider>
  );
}
