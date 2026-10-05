import * as React from "react"
import { renderToString } from "react-dom/server"
import { expect, test } from "vite-plus/test"
import { getDuoGeometry } from "../src/core/geometry"
import { getBarsLayout } from "../src/core/layout/bars"
import { getAccessoryLayout } from "../src/core/layout/accessories"
import { getSystemLayout } from "../src/core/layout/system"
import { DuoStore } from "../src/core/store"
import { DuoAppToolbar, DuoFrame, DuoProvider, DuoTabBar } from "../src"

test("full-window bars use measured glass-edge offsets without changing content safe areas", () => {
  const store = new DuoStore({ orientation: "portrait" })
  const outer = store.getSnapshot().screens.outer
  expect(getAccessoryLayout(outer)).toMatchObject({ left: 394, right: 24, top: 170, bottom: 24 })
  expect(outer.safeArea).toEqual({ top: 0, right: 84, bottom: 34, left: 0 })

  const portrait = store.getSnapshot().screens.inner
  const horizontal = getAccessoryLayout(portrait)
  expect(horizontal.top).toBe(24)
  expect(portrait.window.width - horizontal.right - horizontal.toolbarEndInset).toBe(535)
  expect(portrait.window.height - horizontal.bottom).toBe(930)
  expect(portrait.safeArea).toEqual({ top: 82, right: 0, bottom: 34, left: 0 })

  store.actions.setOrientation("landscape-right")
  const landscape = store.getSnapshot().screens.inner
  expect(getAccessoryLayout(landscape)).toMatchObject({
    left: 879,
    right: 24,
    top: 120,
    bottom: 24,
  })
  expect(landscape.safeArea).toEqual({ top: 0, right: 84, bottom: 34, left: 0 })
})

test("bar rails follow app placement and measured hardware edges", () => {
  const store = new DuoStore()
  expect(getAccessoryLayout(store.getSnapshot().screens.inner).side).toBe("right")
  store.actions.setInnerPlacement("left")
  const left = getAccessoryLayout(store.getSnapshot().screens.inner)
  expect(left).toMatchObject({ side: "left", left: 24, top: 24, bottom: 34 })
  store.actions.setInnerPlacement("right")
  const right = getAccessoryLayout(store.getSnapshot().screens.inner)
  expect(right).toMatchObject({ side: "right", right: 24, bottom: 34 })
  expect(right.top).toBe(120)
  for (const layout of [left, right]) {
    expect(469 - layout.left - layout.right).toBe(48)
  }
  store.actions.setInnerPlacement("full")
  for (const orientation of ["portrait", "portrait-upside-down"] as const) {
    store.actions.setOrientation(orientation)
    expect(getAccessoryLayout(store.getSnapshot().screens.inner)).toEqual({
      side: "horizontal",
      left: 20,
      right: 20,
      top: 24,
      bottom: 21,
      toolbarEndInset: 114,
    })
  }
  store.actions.setOrientation("landscape-right")
  expect(getAccessoryLayout(store.getSnapshot().screens.outer).side).toBe("left")
})

test("outer bars leave room for status and the camera at either end", () => {
  for (const orientation of ["portrait", "landscape-left", "landscape-right"] as const) {
    const screen = { ...getDuoGeometry({ display: "outer", orientation }), visible: true }
    const rail = getAccessoryLayout(screen)
    for (const region of screen.reservedRegions) {
      expect(
        rail.top >= region.y + region.height || screen.window.height - rail.bottom <= region.y,
      ).toBe(true)
    }
    expect(rail.top + rail.bottom).toBeLessThan(screen.window.height)
  }
})

test("helpers require a frame surface and server rendering defers portals", () => {
  const screen = new DuoStore().getSnapshot().screens.inner
  const layout = getBarsLayout(screen, { tabbar: {} }).tabbar!
  const items = [{ id: "home", label: "Home", icon: <span>H</span> }]
  const onSelect = () => {}
  expect(() =>
    renderToString(
      <DuoProvider>
        <DuoTabBar layout={layout} items={items} selectedId="home" onSelect={onSelect} />
      </DuoProvider>,
    ),
  ).toThrow("inside DuoFrame")
  expect(() =>
    renderToString(
      <DuoProvider>
        <DuoAppToolbar />
      </DuoProvider>,
    ),
  ).toThrow("inside DuoFrame")
  const html = renderToString(
    <DuoProvider>
      <DuoFrame>
        <DuoTabBar layout={layout} items={items} selectedId="home" onSelect={onSelect} />
        <DuoAppToolbar />
      </DuoFrame>
    </DuoProvider>,
  )
  expect(html.match(/data-duo-accessory-host=""/g)).toHaveLength(1)
  expect(html).not.toContain("Home")
})

test("inner landscape bars and status share the reference axis without doubling status clearance", () => {
  for (const orientation of ["landscape-left", "landscape-right"] as const) {
    for (const placement of ["full", "left", "right"] as const) {
      const screen = {
        ...getDuoGeometry({ display: "inner", orientation, placement }),
        visible: true,
      }
      const bars = getAccessoryLayout(screen)
      const { status } = getSystemLayout(screen)
      expect(status.y).toBe(30)
      expect(screen.size.width - status.x - status.width / 2).toBe(48)
      if (placement === "left") {
        expect(bars.top).toBe(24)
        expect(bars.left + 24).toBe(48)
      } else {
        expect(bars.top).toBe(120)
        expect(screen.window.x + bars.left + 24).toBe(status.x + status.width / 2)
        expect(bars.top - status.y - status.height).toBeGreaterThanOrEqual(16)
      }
    }
  }
})

test("tab items require stable unique IDs before mounting", () => {
  const screen = new DuoStore().getSnapshot().screens.inner
  const layout = getBarsLayout(screen, { tabbar: {} }).tabbar!
  const render = (ids: string[]) =>
    renderToString(
      <DuoProvider>
        <DuoFrame>
          <DuoTabBar
            layout={layout}
            items={ids.map((id) => ({ id, label: "Home", icon: <span>H</span> }))}
            selectedId="home"
            onSelect={() => {}}
          />
        </DuoFrame>
      </DuoProvider>,
    )
  expect(() => render(["home", "home"])).toThrow('duplicate item id "home"')
  expect(() => render([" "])).toThrow("non-empty id")
  expect(() => render([])).not.toThrow()
})
