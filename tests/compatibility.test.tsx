import * as React from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import {
  DuoFrame,
  DuoProvider,
  DuoToolbar,
  DuoDisplayControls,
  DuoLayoutControls,
  DuoRotationControls,
  DuoZoomControls,
  useDuoState,
  useDuoScreen,
} from "../src";

function ReadState() {
  const width = useDuoState((state) => state.screens.inner.window.width);
  return <span>{width}</span>;
}

test("provider and selector hooks render with the React 16.8 baseline", () => {
  expect(React.version).toBe("16.8.6");
  expect(
    renderToString(
      <DuoProvider defaultState={{ innerPlacement: "left" }}>
        <ReadState />
      </DuoProvider>,
    ),
  ).toContain("469");
  expect(
    renderToString(
      <DuoProvider>
        <ReadState />
      </DuoProvider>,
    ),
  ).toContain("951");
});

test("frame can be server-rendered without browser globals", () => {
  const html = renderToString(
    <DuoProvider>
      <DuoFrame>
        <span>App content</span>
      </DuoFrame>
    </DuoProvider>,
  );
  expect(html).toContain('data-duo-window="inner"');
  expect(html).not.toContain('data-duo-window="outer"');
  expect(html).toContain("App content");
  expect(html).not.toContain('class="duo-home"');
  expect(html).not.toContain('class="duo-divider"');
});

test("frame children receive the active display's screen context on the server", () => {
  function App() {
    const screen = useDuoScreen();
    return <span>{`${screen.display}:${screen.window.width}`}</span>;
  }
  for (const posture of ["open", "closed", "partially-open"] as const) {
    const html = renderToString(
      <DuoProvider defaultState={{ posture, orientation: "portrait" }}>
        <DuoFrame>
          <App />
        </DuoFrame>
      </DuoProvider>,
    );
    expect(html).toContain(posture === "closed" ? "outer:466" : "inner:669");
    expect(html.match(/class="duo-window"/g)).toHaveLength(1);
  }
});

test("split chrome is passive and the home indicator is opt-in", () => {
  const render = (showSystemUI: boolean) =>
    renderToString(
      <DuoProvider
        defaultState={{ innerPlacement: "right" }}
        defaultSystem={{ homeIndicatorVisible: true }}
      >
        <DuoFrame showSystemUI={showSystemUI}>
          <span>App content</span>
        </DuoFrame>
      </DuoProvider>,
    );
  const visible = render(true);
  expect(visible).toContain('class="duo-divider"');
  expect(visible).toContain('class="duo-home"');
  const hidden = render(false);
  expect(hidden).not.toContain('class="duo-divider"');
  expect(hidden).not.toContain('class="duo-home"');
});

test("headless control groups compose independently with the React 16.8 baseline", () => {
  const standalone = renderToString(
    <DuoProvider>
      <DuoRotationControls className="my-rotation" />
    </DuoProvider>,
  );
  expect(standalone).toContain('class="my-rotation"');
  expect(standalone).toContain('aria-label="Rotate left"');
  expect(standalone).not.toContain('data-duo-toolbar-group="zoom"');
  const composed = renderToString(
    <DuoProvider defaultState={{ posture: "closed" }}>
      <DuoToolbar className="my-toolbar">
        <DuoZoomControls />
        <DuoDisplayControls />
        <DuoLayoutControls />
      </DuoToolbar>
    </DuoProvider>,
  );
  expect(composed).toContain('class="duo-toolbar my-toolbar"');
  expect(composed).toContain('aria-label="Zoom in"');
  expect(composed).toContain('aria-label="Closed"');
  expect(composed).not.toContain('data-duo-toolbar-group="layout"');
});

test("partial posture selects its own control and keeps landscape layout controls available", () => {
  const html = renderToString(
    <DuoProvider defaultState={{ posture: "partially-open" }}>
      <DuoDisplayControls />
      <DuoLayoutControls />
    </DuoProvider>,
  );
  expect(html).toMatch(/data-duo-action="partially-open" aria-pressed="true"/);
  expect(html).toMatch(/data-duo-action="inner" aria-pressed="false"/);
  expect(html).toMatch(/data-duo-action="outer" aria-pressed="false"/);
  expect(html).toContain('data-duo-toolbar-group="layout"');
  expect(html).not.toContain("disabled");
});
