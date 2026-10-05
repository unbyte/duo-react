import { expect, test } from "vite-plus/test"
import { DuoStore } from "../src/core/store"
import { getSystemLayout, systemMetrics } from "../src/core/layout/system"

test("clock and glyph anchors match the three native full-window captures", () => {
  const fixtures = [
    {
      display: "outer",
      orientation: "portrait",
      clock: [399 + 1 / 3, 86 + 2 / 3, 36, 12],
      glyph: [397 + 2 / 3, 109 + 2 / 3, 41, 41 + 1 / 3],
    },
    {
      display: "inner",
      orientation: "landscape-right",
      clock: [881 + 1 / 3, 34, 43, 12],
      glyph: [882 + 2 / 3, 57, 41, 41 + 1 / 3],
    },
    {
      display: "inner",
      orientation: "portrait-upside-down",
      clock: [549 + 1 / 3, 42 + 2 / 3, 40 + 2 / 3, 11 + 1 / 3],
      glyph: [601, 27 + 2 / 3, 41, 41 + 1 / 3],
    },
  ] as const
  for (const fixture of fixtures) {
    const store = new DuoStore({ orientation: fixture.orientation })
    const { time, glyph, status } = getSystemLayout(store.getSnapshot().screens[fixture.display])
    // The clock uses a stable text box; ink width varies with the time string and font.
    expect(
      Math.abs(time.x + time.width / 2 - (fixture.clock[0] + fixture.clock[2] / 2)),
    ).toBeLessThan(1)
    expect(time.y + time.height / 2).toBeCloseTo(fixture.clock[1] + fixture.clock[3] / 2)
    expect(glyph.x + glyph.width / 2).toBeCloseTo(fixture.glyph[0] + fixture.glyph[2] / 2)
    expect(glyph.y + systemMetrics.glyphTopPadding).toBeCloseTo(fixture.glyph[1])
    for (const bounds of [time, glyph]) {
      expect(bounds.x).toBeGreaterThanOrEqual(status.x)
      expect(bounds.y).toBeGreaterThanOrEqual(status.y)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(status.x + status.width)
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(status.y + status.height)
    }
  }
})

test("status belongs to the display while the home indicator follows the app window", () => {
  const store = new DuoStore()
  const full = getSystemLayout(store.getSnapshot().screens.inner)
  expect(full.home.x + full.home.width / 2).toBe(951 / 2)
  expect(full.divider).toBeUndefined()
  for (const placement of ["left", "right"] as const) {
    store.actions.setInnerPlacement(placement)
    const screen = store.getSnapshot().screens.inner
    const layout = getSystemLayout(screen)
    expect(layout.status).toEqual(full.status)
    expect(layout.home.x + layout.home.width / 2).toBe(screen.window.x + screen.window.width / 2)
    expect(layout.divider).toEqual({ x: 473.5, y: 310.5, width: 4, height: 48 })
  }
})

test("the outer cutout uses measured coordinates independently of status visibility", () => {
  const store = new DuoStore({ orientation: "portrait" })
  const portrait = getSystemLayout(store.getSnapshot().screens.outer)
  expect(portrait.camera).toMatchObject({ x: 399.67, y: 29.33, width: 37, height: 37 })
  expect(portrait.status.y).toBeGreaterThan(portrait.camera!.y + portrait.camera!.height)
  expect(getSystemLayout(store.getSnapshot().screens.inner).camera).toBeUndefined()
  store.actions.setOrientation("landscape-left")
  const landscape = getSystemLayout(store.getSnapshot().screens.outer)
  expect(landscape.camera).toMatchObject({ x: 611.67, y: 399.67, width: 37, height: 37 })
  expect(store.getSnapshot().screens.outer.statusBarVisible).toBe(false)
})

test("explicitly shown status stays in the reserved edge strip in all supported orientations", () => {
  const store = new DuoStore({}, { prefersStatusBarHidden: false })
  for (const orientation of [
    "portrait",
    "portrait-upside-down",
    "landscape-left",
    "landscape-right",
  ] as const) {
    store.actions.setOrientation(orientation)
    for (const screen of Object.values(store.getSnapshot().screens)) {
      if (!screen.statusBarVisible) continue
      const { status } = getSystemLayout(screen)
      const { safeArea, size } = screen
      expect(status.x).toBeGreaterThanOrEqual(0)
      expect(status.y).toBeGreaterThanOrEqual(0)
      expect(status.x + status.width).toBeLessThanOrEqual(size.width)
      expect(status.y + status.height).toBeLessThanOrEqual(size.height)
      if (safeArea.top) expect(status.y + status.height).toBeLessThanOrEqual(safeArea.top)
      else if (safeArea.left) expect(status.x + status.width).toBeLessThanOrEqual(safeArea.left)
      else expect(status.x).toBeGreaterThanOrEqual(size.width - safeArea.right)
    }
  }
})

test("capsule encloses the complete control group with consistent padding in every orientation", () => {
  const store = new DuoStore({}, { prefersStatusBarHidden: false })
  for (const orientation of [
    "portrait",
    "portrait-upside-down",
    "landscape-left",
    "landscape-right",
  ] as const) {
    store.actions.setOrientation(orientation)
    for (const screen of Object.values(store.getSnapshot().screens)) {
      if (!screen.statusBarVisible) continue
      const { material, status, camera } = getSystemLayout(screen)
      for (const bounds of camera ? [camera, status] : [status]) {
        expect(material.x).toBeLessThan(bounds.x)
        expect(material.y).toBeLessThan(bounds.y)
        expect(material.x + material.width).toBeGreaterThan(bounds.x + bounds.width)
        expect(material.y + material.height).toBeGreaterThan(bounds.y + bounds.height)
      }
      expect(material.x).toBeGreaterThanOrEqual(0)
      expect(material.y).toBeGreaterThanOrEqual(0)
      expect(material.x + material.width).toBeLessThanOrEqual(screen.size.width)
      expect(material.y + material.height).toBeLessThanOrEqual(screen.size.height)
      if (camera) expect(material.height).toBeLessThan(150)
    }
  }
})
