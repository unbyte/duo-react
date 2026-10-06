import * as React from "react"
import { renderToString } from "react-dom/server"
import { expect, expectTypeOf, test } from "vite-plus/test"
import {
  DuoFrame,
  DuoProvider,
  useBars,
  type BarsLayoutRequest,
  type DuoRect,
  type DuoScreenInfo,
  type ResolvedBarLayout,
} from "../src"
import { getBarsLayout } from "../src/core/layout/bars"
import { DuoStore } from "../src/core/store"

function overlaps(a: DuoRect, b: DuoRect) {
  const epsilon = 0.000001
  return (
    a.x < b.x + b.width - epsilon &&
    a.x + a.width > b.x + epsilon &&
    a.y < b.y + b.height - epsilon &&
    a.y + a.height > b.y + epsilon
  )
}

function checkLayout(screen: DuoScreenInfo, bars: readonly ResolvedBarLayout[]) {
  for (const [index, bar] of bars.entries()) {
    const { rect, containerProps } = bar
    expect(rect.x).toBeGreaterThanOrEqual(0)
    expect(rect.y).toBeGreaterThanOrEqual(0)
    expect(rect.width).toBeGreaterThan(0)
    expect(rect.height).toBeGreaterThan(0)
    expect(rect.x + rect.width).toBeLessThanOrEqual(screen.window.width + 0.000001)
    expect(rect.y + rect.height).toBeLessThanOrEqual(screen.window.height + 0.000001)
    expect(containerProps.style).toMatchObject({
      position: "absolute",
      left: rect.x,
      top: rect.y,
      width: rect.width,
      height: rect.height,
      flexDirection: bar.axis === "horizontal" ? "row" : "column",
    })
    expect(containerProps["data-duo-react-bar-placement"]).toBe(bar.placement)
    expect(containerProps["data-duo-react-bar-axis"]).toBe(bar.axis)
    for (const other of bars.slice(index + 1)) expect(overlaps(rect, other.rect)).toBe(false)
    for (const region of screen.reservedRegions) expect(overlaps(rect, region)).toBe(false)
  }
}

test("portrait allocations retain native edge offsets and distinct tab distributions", () => {
  const screen = new DuoStore({ orientation: "portrait" }).getSnapshot().screens.inner
  const layout = getBarsLayout(screen, {
    toolbars: [{ id: "navigation", placement: "top-trailing" }],
    tabbar: {},
  })
  expect(layout.toolbars[0]).toMatchObject({
    id: "navigation",
    axis: "horizontal",
    placement: "top",
    rect: { x: 20, y: 24, width: 515, height: 48 },
  })
  expect(layout.tabbar?.rect).toEqual({ x: 134.5, y: 868, width: 400, height: 62 })
  const edges = getBarsLayout(screen, { tabbar: { distribution: "edges" } })
  expect(edges.tabbar?.rect).toEqual({ x: 21, y: 875, width: 627, height: 48 })
  expect(edges.tabbar?.containerProps.style.justifyContent).toBe("space-between")
})

test("toolbars share areas in logical order while results retain request order", () => {
  const screen = new DuoStore({ orientation: "portrait" }).getSnapshot().screens.inner
  const request = {
    toolbars: [
      { id: "trailing", placement: "top-trailing" },
      { id: "leading", placement: "top-leading" },
      { id: "trailing-2", placement: "top-trailing" },
    ],
  } as const
  const result = getBarsLayout(screen, request)
  expect(result.toolbars.map((bar) => bar.id)).toEqual(["trailing", "leading", "trailing-2"])
  expect(result.toolbars[1].rect.x).toBe(20)
  expect(result.toolbars[0].rect.x).toBeGreaterThan(result.toolbars[1].rect.x)
  expect(result.toolbars[2].rect.x).toBeGreaterThan(result.toolbars[0].rect.x)
  expect(result.toolbars[0].rect.width).toBe(result.toolbars[1].rect.width)
  expect(request.toolbars.map((bar) => bar.id)).toEqual(["trailing", "leading", "trailing-2"])
  checkLayout(screen, result.toolbars)
})

test("portrait bottom toolbars sit above the tab composition", () => {
  const screen = new DuoStore({ orientation: "portrait" }).getSnapshot().screens.inner
  expect(
    getBarsLayout(screen, { toolbars: [{ id: "actions", placement: "bottom" }] }).toolbars[0].rect,
  ).toEqual({ x: 20, y: 879, width: 629, height: 48 })
  const result = getBarsLayout(screen, {
    toolbars: [{ id: "actions", placement: "bottom" }],
    tabbar: {},
  })
  expect(result.toolbars[0].rect).toEqual({ x: 20, y: 804, width: 629, height: 48 })
  expect(result.tabbar!.rect.y - result.toolbars[0].rect.y - 48).toBe(16)
  checkLayout(screen, [...result.toolbars, result.tabbar!])
})

test("adaptive bars share a rail while horizontal navigation stays at the top", () => {
  const screen = new DuoStore({ orientation: "portrait" }).getSnapshot().screens.outer
  const result = getBarsLayout(screen, {
    toolbars: [
      { id: "text", placement: "top-leading", axis: "horizontal" },
      { id: "icons", placement: "top-trailing" },
      { id: "bottom", placement: "bottom" },
    ],
    tabbar: {},
  })
  expect(result.toolbars[0]).toMatchObject({ placement: "top", axis: "horizontal" })
  expect(result.toolbars[1]).toMatchObject({
    placement: "right",
    axis: "vertical",
    rect: { x: 394, y: 170, width: 48 },
  })
  expect(result.tabbar!.rect.y + result.tabbar!.rect.height).toBeCloseTo(654)
  expect(result.toolbars[2].containerProps.style.justifyContent).toBe("flex-end")
  checkLayout(screen, [...result.toolbars, result.tabbar!])
})

test("allocated rails are window-local and follow split placement", () => {
  const store = new DuoStore()
  for (const placement of ["full", "left", "right"] as const) {
    store.actions.setInnerPlacement(placement)
    const screen = store.getSnapshot().screens.inner
    const result = getBarsLayout(screen, { tabbar: {} })
    expect(result.tabbar).toMatchObject({
      placement: placement === "left" ? "left" : "right",
      axis: "vertical",
      rect: { x: placement === "left" ? 24 : screen.window.width - 72, width: 48 },
    })
    checkLayout(screen, [result.tabbar!])
  }
})

test("all frame configurations avoid reservations and mutual overlap", () => {
  const request: BarsLayoutRequest = {
    toolbars: [
      { id: "back", placement: "top-leading" },
      { id: "tools", placement: "top-trailing" },
      { id: "text", placement: "top-trailing", axis: "horizontal" },
      { id: "actions", placement: "bottom" },
      { id: "bottom-text", placement: "bottom", axis: "horizontal" },
    ],
    tabbar: {},
  }
  for (const orientation of [
    "portrait",
    "portrait-upside-down",
    "landscape-left",
    "landscape-right",
  ] as const) {
    for (const posture of ["open", "closed", "partially-open"] as const) {
      for (const innerPlacement of ["full", "left", "right"] as const) {
        if (orientation.startsWith("portrait") && innerPlacement !== "full") continue
        const store = new DuoStore({ orientation, posture, innerPlacement }, { cameraActive: true })
        for (const screen of Object.values(store.getSnapshot().screens)) {
          for (const distribution of ["packed", "edges"] as const) {
            const result = getBarsLayout(screen, { ...request, tabbar: { distribution } })
            checkLayout(screen, [...result.toolbars, result.tabbar!])
          }
        }
      }
    }
  }
})

test("invalid declarations and exhausted space fail explicitly", () => {
  const screen = new DuoStore({ orientation: "portrait" }).getSnapshot().screens.inner
  expect(() =>
    getBarsLayout(screen, {
      toolbars: [
        { id: "same", placement: "top-leading" },
        { id: "same", placement: "bottom" },
      ],
    }),
  ).toThrow('duplicate toolbar id "same"')
  expect(() => getBarsLayout(screen, { toolbars: [{ id: " ", placement: "bottom" }] })).toThrow(
    "non-empty id",
  )
  expect(() =>
    getBarsLayout(screen, {
      toolbars: [{ id: "bad", placement: "bottom", axis: "vertical" }],
    } as unknown as BarsLayoutRequest),
  ).toThrow("unsupported axis")
  expect(() =>
    getBarsLayout(screen, { tabbar: { distribution: "invalid" } } as unknown as BarsLayoutRequest),
  ).toThrow("unsupported tabbar distribution")
  expect(() =>
    getBarsLayout(screen, {
      toolbars: Array.from({ length: 100 }, (_, index) => ({
        id: String(index),
        placement: "top-leading",
      })),
    }),
  ).toThrow("no space")
  expect(getBarsLayout(screen, {})).toEqual({ toolbars: [] })
  expect(getBarsLayout(screen, { toolbars: [] }).tabbar).toBeUndefined()
})

test("the hook renders custom content with application context on React 16.8 and the server", () => {
  const Label = React.createContext("missing")
  function App() {
    const label = React.useContext(Label)
    const bars = useBars({ toolbars: [{ id: "actions", placement: "top-trailing" }], tabbar: {} })
    return (
      <>
        <nav {...bars.toolbars[0].containerProps}>{label}</nav>
        <nav {...bars.tabbar.containerProps}>Tabs</nav>
      </>
    )
  }
  expect(() => renderToString(<App />)).toThrow("within DuoFrame")
  for (const orientation of ["portrait", "landscape-right"] as const) {
    const html = renderToString(
      <DuoProvider defaultState={{ orientation }}>
        <DuoFrame>
          <Label.Provider value="App actions">
            <App />
          </Label.Provider>
        </DuoFrame>
      </DuoProvider>,
    )
    expect(html).toContain("App actions")
    expect(html).toContain("Tabs")
    expect(html).toContain(
      `data-duo-react-bar-placement="${orientation === "portrait" ? "top" : "right"}"`,
    )
    expect(html).toContain(`left:${orientation === "portrait" ? 20 : 879}px`)
  }
})

test("the hook infers tab bar presence from the request", () => {
  function App({ request }: { request: BarsLayoutRequest }) {
    const requested = useBars({ tabbar: {} })
    const omitted = useBars({ toolbars: [] })
    const empty = useBars()
    const explicitlyAbsent = useBars({ tabbar: undefined })
    const conditional = useBars({ tabbar: request.tabbar })
    const dynamic = useBars(request)

    expectTypeOf(requested.tabbar).toEqualTypeOf<ResolvedBarLayout>()
    expectTypeOf(omitted.tabbar).toEqualTypeOf<undefined>()
    expectTypeOf(empty.tabbar).toEqualTypeOf<undefined>()
    expectTypeOf(explicitlyAbsent.tabbar).toEqualTypeOf<undefined>()
    expectTypeOf(conditional.tabbar).toEqualTypeOf<ResolvedBarLayout | undefined>()
    expectTypeOf(dynamic.tabbar).toEqualTypeOf<ResolvedBarLayout | undefined>()

    expect(requested.tabbar.rect.width).toBeGreaterThan(0)
    expect(omitted.tabbar).toBeUndefined()
    expect(empty.tabbar).toBeUndefined()
    expect(explicitlyAbsent.tabbar).toBeUndefined()
    expect(conditional.tabbar !== undefined).toBe(request.tabbar !== undefined)
    expect(dynamic.tabbar !== undefined).toBe(request.tabbar !== undefined)
    return null
  }

  for (const request of [{}, { tabbar: {} }]) {
    renderToString(
      <DuoProvider>
        <DuoFrame>
          <App request={request} />
        </DuoFrame>
      </DuoProvider>,
    )
  }
})
