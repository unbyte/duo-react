import * as React from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { DuoFrame, DuoProvider, useDuoState } from "../src";

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
});
