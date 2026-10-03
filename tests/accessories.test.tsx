import * as React from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { getDuoGeometry } from "../src/geometry";
import { getAccessoryLayout } from "../src/accessory-layout";
import { getSystemLayout } from "../src/system-layout";
import { createDuoStore } from "../src/store";
import { DuoAppToolbar, DuoFrame, DuoProvider, DuoTabBar } from "../src";

test("bar rails follow app placement and measured hardware edges", () => {
  const store = createDuoStore();
  expect(getAccessoryLayout(store.getSnapshot().screens.inner).side).toBe("right");
  store.actions.setInnerPlacement("left");
  const left = getAccessoryLayout(store.getSnapshot().screens.inner);
  expect(left).toMatchObject({ side: "left", left: 24, top: 24, bottom: 34 });
  store.actions.setInnerPlacement("right");
  const right = getAccessoryLayout(store.getSnapshot().screens.inner);
  expect(right).toMatchObject({ side: "right", right: 24, bottom: 34 });
  expect(right.top).toBe(120);
  for (const layout of [left, right]) {
    expect(469 - layout.left - layout.right).toBe(48);
  }
  store.actions.setInnerPlacement("full");
  for (const orientation of ["portrait", "portrait-upside-down"] as const) {
    store.actions.setOrientation(orientation);
    expect(getAccessoryLayout(store.getSnapshot().screens.inner)).toEqual({
      side: "horizontal",
      left: 16,
      right: 16,
      top: 98,
      bottom: 34,
    });
  }
  store.actions.setOrientation("landscape-right");
  expect(getAccessoryLayout(store.getSnapshot().screens.outer).side).toBe("left");
});

test("outer bars leave room for status and the camera at either end", () => {
  for (const orientation of ["portrait", "landscape-left", "landscape-right"] as const) {
    const screen = { ...getDuoGeometry({ display: "outer", orientation }), visible: true };
    const rail = getAccessoryLayout(screen);
    for (const region of screen.reservedRegions) {
      expect(
        rail.top >= region.y + region.height || screen.window.height - rail.bottom <= region.y,
      ).toBe(true);
    }
    expect(rail.top + rail.bottom).toBeLessThan(screen.window.height);
  }
});

test("helpers require a frame surface and server rendering defers portals", () => {
  expect(() =>
    renderToString(
      <DuoProvider>
        <DuoTabBar />
      </DuoProvider>,
    ),
  ).toThrow("inside DuoFrame");
  expect(() =>
    renderToString(
      <DuoProvider>
        <DuoAppToolbar />
      </DuoProvider>,
    ),
  ).toThrow("inside DuoFrame");
  const html = renderToString(
    <DuoProvider>
      <DuoFrame
        inner={
          <DuoTabBar>
            <button>Home</button>
          </DuoTabBar>
        }
        outer={<DuoAppToolbar />}
      />
    </DuoProvider>,
  );
  expect(html).toContain('data-duo-accessory-host="tab"');
  expect(html).not.toContain("Home");
});

test("inner landscape bars and status share the reference axis without doubling status clearance", () => {
  for (const orientation of ["landscape-left", "landscape-right"] as const) {
    for (const placement of ["full", "left", "right"] as const) {
      const screen = {
        ...getDuoGeometry({ display: "inner", orientation, placement }),
        visible: true,
      };
      const bars = getAccessoryLayout(screen);
      const { status } = getSystemLayout(screen);
      expect(status.y).toBe(32);
      expect(screen.size.width - status.x - status.width / 2).toBe(48);
      if (placement === "left") {
        expect(bars.top).toBe(24);
        expect(bars.left + 24).toBe(48);
      } else {
        expect(bars.top).toBe(120);
        expect(screen.window.x + bars.left + 24).toBe(status.x + status.width / 2);
        expect(bars.top - status.y - status.height).toBeGreaterThanOrEqual(16);
      }
    }
  }
});
