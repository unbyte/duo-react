import { expect, test, vi } from "vite-plus/test"
import { DuoStore } from "../src/state/store"

test("independent stores keep stable snapshots and ignore no-op actions", () => {
  const one = new DuoStore()
  const two = new DuoStore()
  const initial = one.getSnapshot()
  const listener = vi.fn()
  const unsubscribe = one.subscribe(listener)
  one.actions.setInnerPlacement("full")
  expect(one.getSnapshot()).toBe(initial)
  expect(listener).not.toHaveBeenCalled()
  one.actions.setZoom(0.5)
  expect(one.getSnapshot().screens).toBe(initial.screens)
  expect(two.getSnapshot().zoom).toBe("fit")
  expect(listener).toHaveBeenCalledTimes(1)
  unsubscribe()
  one.actions.setZoom(1)
  expect(listener).toHaveBeenCalledTimes(1)
})

test("a rejected layout leaves all state and subscriptions unchanged", () => {
  const store = new DuoStore({ innerPlacement: "left" })
  const previous = store.getSnapshot()
  const listener = vi.fn()
  store.subscribe(listener)
  expect(() => store.actions.setOrientation("portrait")).toThrow(RangeError)
  expect(store.getSnapshot()).toBe(previous)
  expect(listener).not.toHaveBeenCalled()
  store.actions.setInnerPlacement("full")
  store.actions.setOrientation("portrait")
  expect(store.getSnapshot().screens.inner.window.width).toBe(669)
})

test("visibility changes preserve window metrics and close/reopen preserves placement", () => {
  const store = new DuoStore({ innerPlacement: "right" })
  const initial = store.getSnapshot()
  store.actions.setPosture("closed")
  expect(store.getSnapshot().screens.inner.visible).toBe(false)
  expect(store.getSnapshot().screens.outer.visible).toBe(true)
  expect(store.getSnapshot().screens.inner.window).toBe(initial.screens.inner.window)
  store.actions.setPosture("open")
  expect(store.getSnapshot().innerPlacement).toBe("right")
})

test("partial posture updates regions without changing display visibility and ignores repeated selection", () => {
  const store = new DuoStore({ innerPlacement: "right" })
  const initial = store.getSnapshot()
  const listener = vi.fn()
  store.subscribe(listener)
  store.actions.setPosture("partially-open")
  const partial = store.getSnapshot()
  expect(partial.screens.inner).not.toBe(initial.screens.inner)
  expect(partial.screens.inner.visible).toBe(true)
  expect(partial.screens.inner.foldingRegion?.active).toBe(true)
  expect(partial.screens.outer).toBe(initial.screens.outer)
  expect(partial.screens.inner.window).toEqual(initial.screens.inner.window)
  store.actions.setPosture("partially-open")
  expect(store.getSnapshot()).toBe(partial)
  expect(listener).toHaveBeenCalledTimes(1)
  store.actions.setSystem({ cameraActive: true })
  expect(store.getSnapshot().screens.inner.reservedRegions).toHaveLength(3)
  expect(store.getSnapshot().screens.inner.foldingRegion?.active).toBe(true)
  store.actions.setPosture("closed")
  expect(store.getSnapshot().screens.inner.foldingRegion?.active).toBe(false)
  expect(store.getSnapshot().screens.outer.visible).toBe(true)
  store.actions.setPosture("partially-open")
  expect(store.getSnapshot().innerPlacement).toBe("right")
  store.actions.setPosture("open")
  expect(store.getSnapshot().screens.inner.foldingRegion?.active).toBe(false)
  expect(
    store.getSnapshot().screens.inner.reservedRegions.every((r) => r.type === "occlusion"),
  ).toBe(true)
})

test("partial defaults survive rotation and reset while unsupported postures are rejected", () => {
  const store = new DuoStore({ posture: "partially-open", innerPlacement: "left" })
  const initial = store.getSnapshot()
  for (let i = 0; i < 4; i++) {
    store.actions.rotate("right")
    expect(store.getSnapshot().posture).toBe("partially-open")
    expect(store.getSnapshot().screens.inner.foldingRegion?.active).toBe(true)
    expect(store.getSnapshot().innerPlacement).toBe("full")
  }
  store.actions.setPosture("closed")
  store.actions.resetDevice()
  expect(store.getSnapshot()).toEqual(initial)
  expect(() => {
    // @ts-expect-error Validate JavaScript callers too.
    store.actions.setPosture("half")
  }).toThrow(RangeError)
  expect(store.getSnapshot()).toEqual(initial)
})

test("controlled zoom requests changes without mutating its owner", () => {
  const store = new DuoStore()
  const disconnect = store.connectFrame()
  const requested = vi.fn()
  store.configureZoom(0.75, requested)
  store.actions.setZoom(1)
  expect(requested).toHaveBeenCalledWith(1)
  expect(store.getSnapshot().zoom).toBe(0.75)
  store.configureZoom(1, requested)
  expect(store.getSnapshot().zoom).toBe(1)
  store.configureZoom(1)
  expect(store.getSnapshot().zoomReadOnly).toBe(true)
  store.actions.setZoom(2)
  expect(store.getSnapshot().zoom).toBe(1)
  disconnect()
  expect(store.getSnapshot().zoom).toBe("fit")
  expect(store.getSnapshot().zoomReadOnly).toBe(false)
  expect(store.connectFrame()).toBeTypeOf("function")
})

test("system changes only recompute geometry for camera activity", () => {
  const store = new DuoStore()
  const initial = store.getSnapshot()
  store.actions.setSystem({ battery: 25 })
  expect(store.getSnapshot().screens).toBe(initial.screens)
  store.actions.setSystem({ cameraActive: true })
  expect(store.getSnapshot().screens.inner.reservedRegions).toHaveLength(2)
  expect(store.getSnapshot().screens.outer).toBe(initial.screens.outer)
  expect(() => store.actions.setSystem({ battery: -1 })).toThrow(RangeError)
  expect(store.getSnapshot().system.battery).toBe(25)
})

test("system color mode defaults to light and changes without disturbing app state or geometry", () => {
  const independent = new DuoStore()
  expect(independent.getSnapshot().system.colorMode).toBe("light")
  const store = new DuoStore({}, { colorMode: "dark", battery: 25 })
  const initial = store.getSnapshot()
  const listener = vi.fn()
  store.subscribe(listener)

  store.actions.setSystem({ colorMode: "light" })
  const changed = store.getSnapshot()
  expect(changed.screens).toBe(initial.screens)
  expect(changed.system).toMatchObject({ colorMode: "light", battery: 25 })
  expect(changed.system.indicatorStyles).toBe(initial.system.indicatorStyles)
  store.actions.setSystem({ colorMode: "light" })
  expect(store.getSnapshot()).toBe(changed)
  expect(listener).toHaveBeenCalledTimes(1)

  store.actions.resetDevice()
  expect(store.getSnapshot().system).toBe(initial.system)
  expect(independent.getSnapshot().system.colorMode).toBe("light")
})

test("invalid system color modes are rejected without publishing partial updates", () => {
  for (const colorMode of ["auto", "sepia", "", undefined]) {
    // @ts-expect-error Validate JavaScript callers too.
    expect(() => new DuoStore({}, { colorMode })).toThrow(RangeError)
    const store = new DuoStore()
    const initial = store.getSnapshot()
    const listener = vi.fn()
    store.subscribe(listener)
    // @ts-expect-error Validate JavaScript callers too.
    expect(() => store.actions.setSystem({ colorMode, battery: 25 })).toThrow(RangeError)
    expect(store.getSnapshot()).toBe(initial)
    expect(listener).not.toHaveBeenCalled()
  }
})

test("signal updates preserve geometry, reject invalid levels, and reset to provider defaults", () => {
  const store = new DuoStore({}, { wifiStrength: 2, cellularStrength: 3 })
  const initial = store.getSnapshot()
  store.actions.setSystem({ wifiStrength: 0, cellularStrength: 4 })
  const changed = store.getSnapshot()
  expect(changed.screens).toBe(initial.screens)
  expect(changed.system).toMatchObject({ wifiStrength: 0, cellularStrength: 4 })
  const listener = vi.fn()
  store.subscribe(listener)
  store.actions.setSystem({ wifiStrength: 0, cellularStrength: 4 })
  expect(store.getSnapshot()).toBe(changed)
  for (const key of ["wifiStrength", "cellularStrength"] as const) {
    for (const value of [-1, 0.5, key === "wifiStrength" ? 4 : 5, NaN, Infinity]) {
      expect(() => new DuoStore({}, { [key]: value })).toThrow(RangeError)
      expect(() => store.actions.setSystem({ battery: 25, [key]: value })).toThrow(RangeError)
      expect(store.getSnapshot()).toBe(changed)
    }
  }
  expect(listener).not.toHaveBeenCalled()
  store.actions.resetDevice()
  expect(store.getSnapshot().system).toBe(initial.system)
})

test("reset restores provider defaults and separate providers can register their own frame", () => {
  const store = new DuoStore({ zoom: 0.5, innerPlacement: "left" }, { battery: 50 })
  store.actions.setInnerPlacement("right")
  store.actions.setSystem({ battery: 10 })
  store.actions.setZoom(2)
  store.actions.resetDevice()
  expect(store.getSnapshot()).toMatchObject({
    zoom: 0.5,
    innerPlacement: "left",
    system: { battery: 50 },
  })
  const disconnect = store.connectFrame()
  expect(() => store.connectFrame()).toThrow("one DuoFrame")
  expect(new DuoStore().connectFrame()).toBeTypeOf("function")
  disconnect()
})

test("indicator updates merge per display without changing geometry or mutating snapshots", () => {
  const store = new DuoStore(
    {},
    {
      indicatorStyles: { inner: { statusBar: "light" } },
    },
  )
  const initial = store.getSnapshot()
  const listener = vi.fn()
  store.subscribe(listener)
  store.actions.setSystem({ indicatorStyles: { outer: { homeIndicator: "light" } } })
  const next = store.getSnapshot()
  expect(next.screens).toBe(initial.screens)
  expect(next.system.indicatorStyles.inner).toBe(initial.system.indicatorStyles.inner)
  expect(next.system.indicatorStyles.outer).toEqual({ statusBar: "auto", homeIndicator: "light" })
  expect(initial.system.indicatorStyles.outer.homeIndicator).toBe("auto")
  expect(Object.isFrozen(next.system.indicatorStyles.outer)).toBe(true)
  store.actions.setSystem({ indicatorStyles: { outer: { homeIndicator: "light" } } })
  expect(store.getSnapshot()).toBe(next)
  expect(listener).toHaveBeenCalledTimes(1)
  store.actions.resetDevice()
  expect(store.getSnapshot().system).toBe(initial.system)
})

test("unsupported indicator styles reject the whole system update", () => {
  const store = new DuoStore()
  const initial = store.getSnapshot()
  expect(Object.isFrozen(initial.system)).toBe(true)
  expect(() =>
    store.actions.setSystem({
      battery: 25,
      // @ts-expect-error Check JavaScript callers and unvalidated iframe messages.
      indicatorStyles: { inner: { statusBar: "inverse" } },
    }),
  ).toThrow(RangeError)
  expect(store.getSnapshot()).toBe(initial)
})

test("rotation wraps in both directions and resets to the initial angle", () => {
  const store = new DuoStore({ innerPlacement: "left" })
  const listener = vi.fn()
  store.subscribe(listener)
  const initial = store.getSnapshot()
  for (const rotation of [180, 270, 0, 90, 180, 270, 0, 90]) {
    store.actions.rotate("right")
    expect(store.getSnapshot().rotation).toBe(rotation)
  }
  expect(store.getSnapshot().orientation).toBe(initial.orientation)
  expect(listener).toHaveBeenCalledTimes(8)
  for (let i = 0; i < 1000; i++) {
    store.actions.rotate("left")
    expect(store.getSnapshot().rotation).toBe([0, 270, 180, 90][i % 4])
  }
  expect(store.getSnapshot()).toMatchObject({ rotation: 90, orientation: initial.orientation })
  store.actions.resetDevice()
  expect(store.getSnapshot()).toMatchObject({ rotation: 90, innerPlacement: "left" })
})

test("upside-down inner geometry is measured while outer content retains its supported layout", () => {
  const store = new DuoStore({ innerPlacement: "right" })
  const previousOuter = store.getSnapshot().screens.outer
  store.actions.rotate("right")
  expect(store.getSnapshot()).toMatchObject({
    rotation: 180,
    orientation: "portrait-upside-down",
    innerPlacement: "full",
  })
  expect(store.getSnapshot().screens.inner.orientation).toBe("portrait-upside-down")
  expect(store.getSnapshot().screens.outer).toBe(previousOuter)
  store.actions.setPosture("closed")
  expect(store.getSnapshot().screens.outer.orientation).toBe("landscape-left")
  store.actions.rotate("right")
  const fromRight = store.getSnapshot().screens.outer
  store.actions.rotate("left")
  expect(store.getSnapshot().screens.outer).toBe(fromRight)
  expect(
    new DuoStore({ orientation: "portrait-upside-down" }).getSnapshot().screens.outer.orientation,
  ).toBe("portrait")
})

test("explicit orientation uses a normalized angle after repeated turns", () => {
  const store = new DuoStore()
  for (let i = 0; i < 8; i++) store.actions.rotate("right")
  store.actions.setOrientation("portrait")
  expect(store.getSnapshot()).toMatchObject({ rotation: 0, orientation: "portrait" })
  store.actions.setOrientation("landscape-right")
  expect(store.getSnapshot()).toMatchObject({ rotation: 270, orientation: "landscape-right" })
})

test("reset restores the initial outer fallback when starting upside down", () => {
  const store = new DuoStore({ orientation: "portrait-upside-down" })
  const initial = store.getSnapshot()
  store.actions.rotate("left")
  store.actions.rotate("right")
  expect(store.getSnapshot().screens.outer.orientation).toBe("landscape-left")
  expect(store.getSnapshot().rotation).toBe(initial.rotation)
  store.actions.resetDevice()
  expect(store.getSnapshot().screens).toEqual(initial.screens)
})

test("zoom steps start from measured fit and preserve logical screen geometry", () => {
  const store = new DuoStore()
  const disconnect = store.connectFrame()
  const initial = store.getSnapshot()
  store.actions.zoomIn()
  expect(store.getSnapshot()).toBe(initial)
  store.reportRenderedZoom(0.4)
  expect(store.getSnapshot()).toMatchObject({ zoom: "fit", renderedZoom: 0.4 })
  const measured = store.getSnapshot()
  store.reportRenderedZoom(0.4)
  expect(store.getSnapshot()).toBe(measured)
  store.actions.zoomIn()
  expect(store.getSnapshot().zoom).toBe(0.5)
  store.actions.zoomOut()
  expect(store.getSnapshot().zoom).toBeCloseTo(0.4)
  expect(store.getSnapshot().screens).toBe(initial.screens)
  store.actions.setZoom("fit")
  store.reportRenderedZoom(0)
  store.actions.zoomOut()
  expect(store.getSnapshot().zoom).toBe("fit")
  disconnect()
  expect(store.getSnapshot().renderedZoom).toBeUndefined()
})

test("zoom steps respect controlled fit and fixed zoom", () => {
  const store = new DuoStore()
  const requested = vi.fn()
  store.configureZoom("fit", requested)
  store.reportRenderedZoom(0.4)
  store.actions.zoomIn()
  expect(requested).toHaveBeenLastCalledWith(0.5)
  expect(store.getSnapshot().zoom).toBe("fit")
  store.configureZoom(0.5, requested)
  store.actions.zoomOut()
  expect(requested).toHaveBeenLastCalledWith(0.4)
  store.configureZoom(0.5)
  store.actions.zoomIn()
  expect(requested).toHaveBeenCalledTimes(2)
  expect(store.getSnapshot().zoom).toBe(0.5)
})

test("outer portrait lock preserves app geometry through physical rotations and display changes", () => {
  const store = new DuoStore({ posture: "closed", orientation: "portrait" }, {}, true)
  const outer = store.getSnapshot().screens.outer
  for (const orientation of [
    "landscape-left",
    "portrait-upside-down",
    "landscape-right",
    "portrait",
  ] as const) {
    store.actions.rotate("right")
    const state = store.getSnapshot()
    expect(state.orientation).toBe(orientation)
    expect(state.screens.inner.orientation).toBe(orientation)
    expect(state.screens.outer).toBe(outer)
    expect(state.outerPortraitLocked).toBe(true)
  }
  store.actions.setOrientation("landscape-right")
  store.actions.setPosture("partially-open")
  expect(store.getSnapshot().screens.inner.orientation).toBe("landscape-right")
  store.actions.setPosture("closed")
  expect(store.getSnapshot().screens.outer).toEqual(outer)
})

test("provider lock changes update only outer layout and reset preserves the current policy", () => {
  const store = new DuoStore({ posture: "closed", orientation: "landscape-left" })
  const initial = store.getSnapshot()
  const listener = vi.fn()
  store.subscribe(listener)
  store.configureOuterPortraitLock(true)
  const locked = store.getSnapshot()
  expect(locked).toMatchObject({ outerPortraitLocked: true, rotation: 90 })
  expect(locked.screens.inner).toBe(initial.screens.inner)
  expect(locked.screens.outer.orientation).toBe("portrait")
  store.configureOuterPortraitLock(true)
  expect(store.getSnapshot()).toBe(locked)
  expect(listener).toHaveBeenCalledTimes(1)
  store.actions.rotate("right")
  store.actions.resetDevice()
  expect(store.getSnapshot()).toMatchObject({ outerPortraitLocked: true, rotation: 90 })
  expect(store.getSnapshot().screens.outer.orientation).toBe("portrait")
  store.configureOuterPortraitLock(false)
  expect(store.getSnapshot().screens.outer).toEqual(initial.screens.outer)
})

test("unlocking upside down retains portrait until a supported orientation is reached", () => {
  const store = new DuoStore({ orientation: "portrait-upside-down" }, {}, true)
  store.configureOuterPortraitLock(false)
  expect(store.getSnapshot().screens.outer.orientation).toBe("portrait")
  store.actions.rotate("left")
  expect(store.getSnapshot().screens.outer.orientation).toBe("landscape-left")
  store.actions.rotate("right")
  expect(store.getSnapshot().screens.outer.orientation).toBe("landscape-left")
})

test("outer status visibility follows effective layout, including retained and locked orientations", () => {
  const store = new DuoStore({ posture: "closed", orientation: "portrait" })
  expect(store.getSnapshot().screens.outer.statusBarVisible).toBe(true)
  for (const direction of ["left", "right"] as const) {
    store.actions.setOrientation("portrait")
    store.actions.rotate(direction)
    expect(store.getSnapshot().screens.outer.statusBarVisible).toBe(false)
    store.actions.rotate(direction)
    expect(store.getSnapshot().orientation).toBe("portrait-upside-down")
    expect(store.getSnapshot().screens.outer.statusBarVisible).toBe(false)
    store.configureOuterPortraitLock(true)
    expect(store.getSnapshot().screens.outer.statusBarVisible).toBe(true)
    store.configureOuterPortraitLock(false)
    expect(store.getSnapshot().screens.outer.statusBarVisible).toBe(true)
    store.actions.rotate(direction)
    expect(store.getSnapshot().screens.outer.statusBarVisible).toBe(false)
  }
  for (let turn = 0; turn < 4; turn++) {
    store.actions.rotate("right")
    expect(store.getSnapshot().screens.inner.statusBarVisible).toBe(true)
  }
})

test("status preference overrides both displays without changing app geometry", () => {
  const store = new DuoStore({ orientation: "landscape-left" })
  const initial = store.getSnapshot()
  store.actions.setSystem({ prefersStatusBarHidden: false })
  expect(store.getSnapshot().screens.outer.statusBarVisible).toBe(true)
  store.actions.setSystem({ prefersStatusBarHidden: true })
  const hidden = store.getSnapshot()
  for (const display of ["inner", "outer"] as const) {
    expect(hidden.screens[display].statusBarVisible).toBe(false)
    expect(hidden.screens[display].window).toBe(initial.screens[display].window)
    expect(hidden.screens[display].safeArea).toBe(initial.screens[display].safeArea)
    expect(hidden.screens[display].reservedRegions).toBe(initial.screens[display].reservedRegions)
  }
  store.actions.setSystem({ time: "12:34" })
  expect(store.getSnapshot().system.prefersStatusBarHidden).toBe(true)
  expect(store.getSnapshot().screens).toBe(hidden.screens)
  store.configureOuterPortraitLock(true)
  store.actions.rotate("right")
  expect(store.getSnapshot().screens.outer.statusBarVisible).toBe(false)
  store.actions.setSystem({ prefersStatusBarHidden: undefined })
  expect(store.getSnapshot().screens.outer.statusBarVisible).toBe(true)
  expect(store.getSnapshot().screens.inner.statusBarVisible).toBe(true)
  store.actions.setOrientation("landscape-left")
  store.configureOuterPortraitLock(false)
  store.actions.setSystem({ prefersStatusBarHidden: false })
  store.actions.setSystem({ prefersStatusBarHidden: undefined })
  expect(store.getSnapshot().screens.outer.statusBarVisible).toBe(false)
})

test("status preference initializes from provider defaults and reset restores it", () => {
  for (const prefersStatusBarHidden of [true, false]) {
    const store = new DuoStore({}, { prefersStatusBarHidden })
    for (const screen of Object.values(store.getSnapshot().screens)) {
      expect(screen.statusBarVisible).toBe(!prefersStatusBarHidden)
    }
    store.actions.setSystem({ prefersStatusBarHidden: undefined })
    store.actions.resetDevice()
    expect(store.getSnapshot().system.prefersStatusBarHidden).toBe(prefersStatusBarHidden)
    expect(store.getSnapshot().screens.outer.statusBarVisible).toBe(!prefersStatusBarHidden)
  }
})
