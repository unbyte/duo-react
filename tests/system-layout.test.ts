import { expect, test } from "vite-plus/test";
import { createDuoStore } from "../src/store";
import { getSystemLayout } from "../src/system-layout";

test("status belongs to the display while the home indicator follows the app window", () => {
  const store = createDuoStore();
  const full = getSystemLayout(store.getSnapshot().screens.inner);
  expect(full.home.x + full.home.width / 2).toBe(951 / 2);
  expect(full.divider).toBeUndefined();
  for (const placement of ["left", "right"] as const) {
    store.actions.setInnerPlacement(placement);
    const screen = store.getSnapshot().screens.inner;
    const layout = getSystemLayout(screen);
    expect(layout.status).toEqual(full.status);
    expect(layout.home.x + layout.home.width / 2).toBe(screen.window.x + screen.window.width / 2);
    expect(layout.divider).toEqual({ x: 473.5, y: 310.5, width: 4, height: 48 });
  }
});

test("the outer cutout uses measured coordinates and only shifts status when above it", () => {
  const store = createDuoStore({ orientation: "portrait" });
  const portrait = getSystemLayout(store.getSnapshot().screens.outer);
  expect(portrait.camera).toMatchObject({ x: 399.67, y: 29.33, width: 37, height: 37 });
  expect(portrait.status.y).toBeGreaterThan(portrait.camera!.y + portrait.camera!.height);
  expect(getSystemLayout(store.getSnapshot().screens.inner).camera).toBeUndefined();
  store.actions.setOrientation("landscape-left");
  const landscape = getSystemLayout(store.getSnapshot().screens.outer);
  expect(landscape.status.y + landscape.status.height).toBeLessThan(landscape.camera!.y);
});

test("status stays in the reserved edge strip in all supported orientations", () => {
  const store = createDuoStore();
  for (const orientation of [
    "portrait",
    "portrait-upside-down",
    "landscape-left",
    "landscape-right",
  ] as const) {
    store.actions.setOrientation(orientation);
    for (const screen of Object.values(store.getSnapshot().screens)) {
      const { status } = getSystemLayout(screen);
      const { safeArea, size } = screen;
      expect(status.x).toBeGreaterThanOrEqual(0);
      expect(status.y).toBeGreaterThanOrEqual(0);
      expect(status.x + status.width).toBeLessThanOrEqual(size.width);
      expect(status.y + status.height).toBeLessThanOrEqual(size.height);
      if (safeArea.top) expect(status.y + status.height).toBeLessThanOrEqual(safeArea.top);
      else if (safeArea.left) expect(status.x + status.width).toBeLessThanOrEqual(safeArea.left);
      else expect(status.x).toBeGreaterThanOrEqual(size.width - safeArea.right);
    }
  }
});
