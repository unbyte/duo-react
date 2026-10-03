import * as React from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import {
  DuoFrame,
  DuoRegionMask,
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

test("provider portrait lock reaches frame children on the first server render", () => {
  function App() {
    const screen = useDuoScreen();
    const physical = useDuoState((state) => state.orientation);
    const locked = useDuoState((state) => state.outerPortraitLocked);
    return <span>{`${physical}:${screen.orientation}:${screen.window.width}:${locked}`}</span>;
  }
  const html = renderToString(
    <DuoProvider
      outerPortraitLocked
      defaultState={{ posture: "closed", orientation: "landscape-left" }}
    >
      <DuoFrame>
        <App />
      </DuoFrame>
    </DuoProvider>,
  );
  expect(html).toContain("landscape-left:portrait:466:true");
});

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

test("region masks can be server-rendered before frame measurement", () => {
  const html = renderToString(
    <DuoProvider>
      <DuoRegionMask frameRef={React.createRef<HTMLDivElement>()} theme="dark" />
    </DuoProvider>,
  );
  expect(html).toContain('class="duo-region-mask"');
  expect(html).toContain('data-theme="dark"');
  expect(html).not.toContain("clipPath");
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
  expect(visible).toContain('class="duo-status-material"');
  const hidden = render(false);
  expect(hidden).not.toContain('class="duo-divider"');
  expect(hidden).not.toContain('class="duo-home"');
  expect(hidden).not.toContain('class="duo-status-material"');
});

test("outer landscape hides status and capsule while retaining the camera and optional home indicator", () => {
  function App() {
    return <span>{`status:${useDuoScreen().statusBarVisible}`}</span>;
  }
  for (const orientation of ["portrait", "landscape-left", "landscape-right"] as const) {
    for (const locked of [false, true]) {
      for (const showSystemUI of [false, true]) {
        const expected = locked || orientation === "portrait";
        const html = renderToString(
          <DuoProvider
            outerPortraitLocked={locked}
            defaultState={{ posture: "closed", orientation }}
            defaultSystem={{ homeIndicatorVisible: true }}
          >
            <DuoFrame showSystemUI={showSystemUI}>
              <App />
            </DuoFrame>
          </DuoProvider>,
        );
        expect(html).toContain(`status:${expected}`);
        expect(html.includes('class="duo-status"')).toBe(expected && showSystemUI);
        expect(html.includes('class="duo-status-material"')).toBe(expected && showSystemUI);
        expect(html).toContain('class="duo-camera-cutout"');
        expect(html.includes('class="duo-home"')).toBe(showSystemUI);
      }
    }
  }
});

test("app status preference reaches children and rendering while retaining independent chrome", () => {
  function App() {
    return <span>{`status:${useDuoScreen().statusBarVisible}`}</span>;
  }
  for (const posture of ["open", "closed"] as const) {
    for (const prefersStatusBarHidden of [true, false]) {
      for (const showSystemUI of [true, false]) {
        const html = renderToString(
          <DuoProvider
            defaultState={{ posture }}
            defaultSystem={{ prefersStatusBarHidden, homeIndicatorVisible: true }}
          >
            <DuoFrame showSystemUI={showSystemUI}>
              <App />
            </DuoFrame>
          </DuoProvider>,
        );
        expect(html).toContain(`status:${!prefersStatusBarHidden}`);
        expect(html.includes('class="duo-status"')).toBe(showSystemUI && !prefersStatusBarHidden);
        expect(html.includes('class="duo-status-material"')).toBe(
          showSystemUI && !prefersStatusBarHidden,
        );
        expect(html.includes('class="duo-home"')).toBe(showSystemUI);
        expect(html.includes('class="duo-camera-cutout"')).toBe(posture === "closed");
      }
    }
  }
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
