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
      <DuoFrame inner={<span>Inner</span>} outer={<span>Outer</span>} />
    </DuoProvider>,
  );
  expect(html).toContain('data-duo-window="inner"');
  expect(html).toContain('data-duo-window="outer"');
  expect(html).not.toContain('class="duo-home"');
  expect(html).not.toContain('class="duo-divider"');
});

test("split chrome is passive and the home indicator is opt-in", () => {
  const render = (showSystemUI: boolean) =>
    renderToString(
      <DuoProvider
        defaultState={{ innerPlacement: "right" }}
        defaultSystem={{ homeIndicatorVisible: true }}
      >
        <DuoFrame
          inner={<span>Inner</span>}
          outer={<span>Outer</span>}
          showSystemUI={showSystemUI}
        />
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
  expect(composed).toContain('aria-label="Outer display"');
  expect(composed).not.toContain('data-duo-toolbar-group="layout"');
});
