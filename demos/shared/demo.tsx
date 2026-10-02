import * as React from "react";
import {
  DuoFrame,
  DuoProvider,
  DuoSafeArea,
  DuoToolbar,
  useDuoActions,
  useDuoEvent,
  useDuoScreen,
  useDuoState,
} from "duo-frame";
import type { DuoFrameProps, DuoWindowChange } from "duo-frame";
import "duo-frame/style.css";
import "./style.css";

const AppContext = React.createContext("outside provider");

function ExampleApp() {
  const screen = useDuoScreen();
  const parent = React.useContext(AppContext);
  const [count, setCount] = React.useState(0);
  const [note, setNote] = React.useState("");
  return (
    <DuoSafeArea className="sample-safe">
      <div className="sample-app">
        <p className="eyebrow">
          {screen.display} display · {screen.placement}
        </p>
        <h2>
          A little room
          <br />
          for your app.
        </h2>
        <p className="sample-intro">
          This is your application. Resize it, move it to either half, or close the device. Your
          work stays here.
        </p>
        <div className="sample-cards">
          <section>
            <span className="card-label">Local React state</span>
            <button
              type="button"
              className="counter"
              onClick={() => setCount((value) => value + 1)}
            >
              {count}
              <span>Click to count ↗</span>
            </button>
          </section>
          <section>
            <label className="card-label" htmlFor={`${screen.display}-note`}>
              Leave yourself a note
            </label>
            <textarea
              id={`${screen.display}-note`}
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
              placeholder="This should survive layout changes…"
            />
          </section>
        </div>
        <dl className="metrics">
          <div>
            <dt>Window</dt>
            <dd>
              {screen.window.width} × {screen.window.height} px
            </dd>
          </div>
          <div>
            <dt>Safe area · T/R/B/L</dt>
            <dd>{Object.values(screen.safeArea).join(" / ")} px</dd>
          </div>
          <div>
            <dt>Context through portal</dt>
            <dd>{parent}</dd>
          </div>
        </dl>
      </div>
    </DuoSafeArea>
  );
}

const iframeSource = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}body{margin:0;padding:var(--duo-safe-area-inset-top,0px) var(--duo-safe-area-inset-right,0px) var(--duo-safe-area-inset-bottom,0px) var(--duo-safe-area-inset-left,0px);font:18px/1.6 system-ui;color:#202c3b;background:#e8f3ec}main{padding:36px}h1{font-size:40px;line-height:1.1}button,textarea{font:inherit;border:1px solid #aac2b4;border-radius:12px;background:#fff;padding:14px}textarea{display:block;margin:20px 0;width:100%;min-height:120px}code{font-size:13px;overflow-wrap:anywhere}dl{font-size:15px}dd{margin:0 0 12px}button{cursor:pointer}
</style><main><p>Independent iframe document</p><h1>One browsing context.<br>One running app.</h1><button id="count">Count: 0</button><textarea placeholder="Type here, then change layout or close the device."></textarea><dl><dt>Document instance</dt><dd><code id="instance"></code></dd><dt>Native viewport / resize events</dt><dd id="viewport"></dd><dt>Parent layout notifications</dt><dd id="layout">Waiting</dd><dt>Elapsed seconds</dt><dd id="clock">0</dd></dl></main><script>
let count=0,resizeCount=0,seconds=0;document.getElementById('instance').textContent=Date.now()+'-'+Math.random().toString(36).slice(2);document.getElementById('count').onclick=function(){this.textContent='Count: '+(++count)};function viewport(){document.getElementById('viewport').textContent=innerWidth+' × '+innerHeight+' px / '+resizeCount}addEventListener('resize',()=>{resizeCount++;viewport()});viewport();setInterval(()=>{document.getElementById('clock').textContent=++seconds},1000);
addEventListener('message',event=>{if(event.source!==parent||event.origin!==parent.location.origin||event.data?.type!=='demo:layout')return;const info=event.data.screen;for(const [side,value] of Object.entries(info.safeArea))document.documentElement.style.setProperty('--duo-safe-area-inset-'+side,value+'px');document.getElementById('layout').textContent=info.display+' / '+info.placement+' / '+(info.visible?'visible':'hidden')});
</script></html>`;

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
      className="sample-iframe"
      title={`${screen.display} app state preservation`}
      ref={frame}
      srcDoc={iframeSource}
      onLoad={publish}
    />
  );
}

function Workbench({ version }: { version: string }) {
  const state = useDuoState((value) => value);
  const actions = useDuoActions();
  const [events, setEvents] = React.useState<DuoWindowChange[]>([]);
  const [width, setWidth] = React.useState(100);
  const [showRegions, setShowRegions] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);
  const iframe = new URLSearchParams(window.location.search).get("content") === "iframe";
  useDuoEvent("windowchange", (event) => setEvents((current) => [event, ...current].slice(0, 4)));
  const frameProps: DuoFrameProps = {
    inner: iframe ? <IframeApp /> : <ExampleApp />,
    outer: iframe ? <IframeApp /> : <ExampleApp />,
    style: { width: "100%", height: "100%" },
    "aria-label": "Duo layout preview",
  };
  return (
    <main className="workbench">
      <header className="page-header">
        <div>
          <p className="eyebrow">Duo Frame · React {version}</p>
          <h1>Make room for both sides.</h1>
          <p>A live layout workbench for your next application.</p>
        </div>
        <span className="phase">Layout prototype</span>
      </header>
      <div className="workspace">
        <section className="preview-panel" aria-label="Preview">
          <div className="preview-top">
            <nav aria-label="Demo content">
              <a href="?content=react" aria-current={!iframe ? "page" : undefined}>
                React app
              </a>
              <a href="?content=iframe" aria-current={iframe ? "page" : undefined}>
                Iframe app
              </a>
            </nav>
            <span>
              {state.posture} / {state.innerPlacement}
            </span>
          </div>
          <div className="preview-resize" style={{ width: `${width}%` }}>
            <DuoFrame
              {...frameProps}
              ref={root}
              inner={
                <>
                  {frameProps.inner}
                  {showRegions && <Regions />}
                </>
              }
              outer={
                <>
                  {frameProps.outer}
                  {showRegions && <Regions />}
                </>
              }
            />
          </div>
          <div className="preview-controls">
            <DuoToolbar />
            <label className="width-control">
              Container width{" "}
              <input
                type="range"
                min="35"
                max="100"
                value={width}
                onChange={(event) => setWidth(Number(event.currentTarget.value))}
              />{" "}
              {width}%
            </label>
          </div>
        </section>
        <aside className="inspector">
          <h2>Inspect the layout</h2>
          <p>
            Both displays stay mounted. Try a counter or a note, switch left → right → full, then
            close and reopen.
          </p>
          <label className="check-control">
            <input
              type="checkbox"
              checked={showRegions}
              onChange={(event) => setShowRegions(event.currentTarget.checked)}
            />{" "}
            Show reserved regions
          </label>
          <label className="check-control">
            <input
              type="checkbox"
              checked={state.system.cameraActive}
              onChange={(event) => actions.setSystem({ cameraActive: event.currentTarget.checked })}
            />{" "}
            Inner camera active
          </label>
          <label className="battery-control">
            Battery · {state.system.battery}%
            <input
              type="range"
              min="0"
              max="100"
              value={state.system.battery}
              onChange={(event) =>
                actions.setSystem({ battery: Number(event.currentTarget.value) })
              }
            />
          </label>
          <h3>Applied window changes</h3>
          <ol className="event-list">
            {events.length ? (
              events.map((event, index) => (
                <li key={index}>
                  <strong>
                    {event.display} → {event.current.placement}
                  </strong>
                  <span>
                    {event.current.window.width} × {event.current.window.height} ·{" "}
                    {event.current.visible ? "visible" : "hidden"}
                  </span>
                </li>
              ))
            ) : (
              <li>Change a layout to see notifications.</li>
            )}
          </ol>
          <p className="prototype-note">
            The outline and system indicators are schematic. Apple’s 3D model, hinge motion, and
            calibrated bezel are the next rendering stage. Geometry uses Xcode 27.1 measurements.
          </p>
        </aside>
      </div>
      <footer>
        React {version} · Separate inner and outer content · App dimensions in CSS pixels
      </footer>
    </main>
  );
}

function Regions() {
  const screen = useDuoScreen();
  return (
    <div className="regions" aria-hidden="true">
      {screen.reservedRegions.map((region, index) => (
        <div
          key={index}
          style={{ left: region.x, top: region.y, width: region.width, height: region.height }}
        >
          {region.type}
        </div>
      ))}
    </div>
  );
}

export function Demo({ version }: { version: string }) {
  return (
    <AppContext.Provider value="Connected">
      <DuoProvider>
        <Workbench version={version} />
      </DuoProvider>
    </AppContext.Provider>
  );
}
