import { expect, test, vi } from "vite-plus/test";
import { createDuoStore } from "../src/store";

test("independent stores keep stable snapshots and ignore no-op actions", () => {
  const one = createDuoStore();
  const two = createDuoStore();
  const initial = one.getSnapshot();
  const listener = vi.fn();
  const unsubscribe = one.subscribe(listener);
  one.actions.setInnerPlacement("full");
  expect(one.getSnapshot()).toBe(initial);
  expect(listener).not.toHaveBeenCalled();
  one.actions.setZoom(0.5);
  expect(one.getSnapshot().screens).toBe(initial.screens);
  expect(two.getSnapshot().zoom).toBe("fit");
  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
  one.actions.setZoom(1);
  expect(listener).toHaveBeenCalledTimes(1);
});

test("a rejected layout leaves all state and subscriptions unchanged", () => {
  const store = createDuoStore({ innerPlacement: "left" });
  const previous = store.getSnapshot();
  const listener = vi.fn();
  store.subscribe(listener);
  expect(() => store.actions.setOrientation("portrait")).toThrow(RangeError);
  expect(store.getSnapshot()).toBe(previous);
  expect(listener).not.toHaveBeenCalled();
  store.actions.setInnerPlacement("full");
  store.actions.setOrientation("portrait");
  expect(store.getSnapshot().screens.inner.window.width).toBe(669);
});

test("visibility changes preserve window metrics and close/reopen preserves placement", () => {
  const store = createDuoStore({ innerPlacement: "right" });
  const initial = store.getSnapshot();
  store.actions.setPosture("closed");
  expect(store.getSnapshot().screens.inner.visible).toBe(false);
  expect(store.getSnapshot().screens.outer.visible).toBe(true);
  expect(store.getSnapshot().screens.inner.window).toBe(initial.screens.inner.window);
  store.actions.setPosture("open");
  expect(store.getSnapshot().innerPlacement).toBe("right");
});

test("controlled zoom requests changes without mutating its owner", () => {
  const store = createDuoStore();
  const disconnect = store.connectFrame();
  const requested = vi.fn();
  store.configureZoom(0.75, requested);
  store.actions.setZoom(1);
  expect(requested).toHaveBeenCalledWith(1);
  expect(store.getSnapshot().zoom).toBe(0.75);
  store.configureZoom(1, requested);
  expect(store.getSnapshot().zoom).toBe(1);
  store.configureZoom(1);
  expect(store.getSnapshot().zoomReadOnly).toBe(true);
  store.actions.setZoom(2);
  expect(store.getSnapshot().zoom).toBe(1);
  disconnect();
  expect(store.getSnapshot().zoom).toBe("fit");
  expect(store.getSnapshot().zoomReadOnly).toBe(false);
  expect(store.connectFrame()).toBeTypeOf("function");
});

test("system changes only recompute geometry for camera activity", () => {
  const store = createDuoStore();
  const initial = store.getSnapshot();
  store.actions.setSystem({ battery: 25 });
  expect(store.getSnapshot().screens).toBe(initial.screens);
  store.actions.setSystem({ cameraActive: true });
  expect(store.getSnapshot().screens.inner.reservedRegions).toHaveLength(2);
  expect(store.getSnapshot().screens.outer).toBe(initial.screens.outer);
  expect(() => store.actions.setSystem({ battery: -1 })).toThrow(RangeError);
  expect(store.getSnapshot().system.battery).toBe(25);
});

test("reset restores provider defaults and separate providers can register their own frame", () => {
  const store = createDuoStore({ zoom: 0.5, innerPlacement: "left" }, { battery: 50 });
  store.actions.setInnerPlacement("right");
  store.actions.setSystem({ battery: 10 });
  store.actions.setZoom(2);
  store.actions.resetDevice();
  expect(store.getSnapshot()).toMatchObject({
    zoom: 0.5,
    innerPlacement: "left",
    system: { battery: 50 },
  });
  const disconnect = store.connectFrame();
  expect(() => store.connectFrame()).toThrow("one DuoFrame");
  expect(createDuoStore().connectFrame()).toBeTypeOf("function");
  disconnect();
});

test("indicator updates merge per display without changing geometry or mutating snapshots", () => {
  const store = createDuoStore(
    {},
    {
      indicatorStyles: { inner: { statusBar: "light" } },
    },
  );
  const initial = store.getSnapshot();
  const listener = vi.fn();
  store.subscribe(listener);
  store.actions.setSystem({ indicatorStyles: { outer: { homeIndicator: "light" } } });
  const next = store.getSnapshot();
  expect(next.screens).toBe(initial.screens);
  expect(next.system.indicatorStyles.inner).toBe(initial.system.indicatorStyles.inner);
  expect(next.system.indicatorStyles.outer).toEqual({ statusBar: "auto", homeIndicator: "light" });
  expect(initial.system.indicatorStyles.outer.homeIndicator).toBe("auto");
  expect(Object.isFrozen(next.system.indicatorStyles.outer)).toBe(true);
  store.actions.setSystem({ indicatorStyles: { outer: { homeIndicator: "light" } } });
  expect(store.getSnapshot()).toBe(next);
  expect(listener).toHaveBeenCalledTimes(1);
  store.actions.resetDevice();
  expect(store.getSnapshot().system).toBe(initial.system);
});

test("unsupported indicator styles reject the whole system update", () => {
  const store = createDuoStore();
  const initial = store.getSnapshot();
  expect(Object.isFrozen(initial.system)).toBe(true);
  expect(() =>
    store.actions.setSystem({
      battery: 25,
      // @ts-expect-error Check JavaScript callers and unvalidated iframe messages.
      indicatorStyles: { inner: { statusBar: "inverse" } },
    }),
  ).toThrow(RangeError);
  expect(store.getSnapshot()).toBe(initial);
});

test("rotation continues in both directions and resets to the initial angle", () => {
  const store = createDuoStore({ innerPlacement: "left" });
  const listener = vi.fn();
  store.subscribe(listener);
  const initial = store.getSnapshot();
  for (const rotation of [180, 270, 360, 450, 540, 630, 720, 810]) {
    store.actions.rotate("right");
    expect(store.getSnapshot().rotation).toBe(rotation);
  }
  expect(store.getSnapshot().orientation).toBe(initial.orientation);
  expect(listener).toHaveBeenCalledTimes(8);
  for (let i = 0; i < 12; i++) store.actions.rotate("left");
  expect(store.getSnapshot()).toMatchObject({ rotation: -270, orientation: initial.orientation });
  store.actions.resetDevice();
  expect(store.getSnapshot()).toMatchObject({ rotation: 90, innerPlacement: "left" });
});

test("upside-down inner geometry is measured while outer content retains its supported layout", () => {
  const store = createDuoStore({ innerPlacement: "right" });
  const previousOuter = store.getSnapshot().screens.outer;
  store.actions.rotate("right");
  expect(store.getSnapshot()).toMatchObject({
    rotation: 180,
    orientation: "portrait-upside-down",
    innerPlacement: "full",
  });
  expect(store.getSnapshot().screens.inner.orientation).toBe("portrait-upside-down");
  expect(store.getSnapshot().screens.outer).toBe(previousOuter);
  store.actions.setPosture("closed");
  expect(store.getSnapshot().screens.outer.orientation).toBe("landscape-left");
  store.actions.rotate("right");
  const fromRight = store.getSnapshot().screens.outer;
  store.actions.rotate("left");
  expect(store.getSnapshot().screens.outer).toBe(fromRight);
  expect(
    createDuoStore({ orientation: "portrait-upside-down" }).getSnapshot().screens.outer.orientation,
  ).toBe("portrait");
});

test("explicit orientation selects a nearby turn without discarding accumulated rotations", () => {
  const store = createDuoStore();
  for (let i = 0; i < 8; i++) store.actions.rotate("right");
  store.actions.setOrientation("portrait");
  expect(store.getSnapshot()).toMatchObject({ rotation: 720, orientation: "portrait" });
  store.actions.setOrientation("landscape-right");
  expect(store.getSnapshot()).toMatchObject({ rotation: 630, orientation: "landscape-right" });
});

test("reset restores the initial outer fallback when starting upside down", () => {
  const store = createDuoStore({ orientation: "portrait-upside-down" });
  const initial = store.getSnapshot();
  store.actions.rotate("left");
  store.actions.rotate("right");
  expect(store.getSnapshot().screens.outer.orientation).toBe("landscape-left");
  expect(store.getSnapshot().rotation).toBe(initial.rotation);
  store.actions.resetDevice();
  expect(store.getSnapshot().screens).toEqual(initial.screens);
});

test("zoom steps start from measured fit and preserve logical screen geometry", () => {
  const store = createDuoStore();
  const disconnect = store.connectFrame();
  const initial = store.getSnapshot();
  store.actions.zoomIn();
  expect(store.getSnapshot()).toBe(initial);
  store.reportRenderedZoom(0.4);
  expect(store.getSnapshot()).toMatchObject({ zoom: "fit", renderedZoom: 0.4 });
  const measured = store.getSnapshot();
  store.reportRenderedZoom(0.4);
  expect(store.getSnapshot()).toBe(measured);
  store.actions.zoomIn();
  expect(store.getSnapshot().zoom).toBe(0.5);
  store.actions.zoomOut();
  expect(store.getSnapshot().zoom).toBeCloseTo(0.4);
  expect(store.getSnapshot().screens).toBe(initial.screens);
  store.actions.setZoom("fit");
  store.reportRenderedZoom(0);
  store.actions.zoomOut();
  expect(store.getSnapshot().zoom).toBe("fit");
  disconnect();
  expect(store.getSnapshot().renderedZoom).toBeUndefined();
});

test("zoom steps respect controlled fit and fixed zoom", () => {
  const store = createDuoStore();
  const requested = vi.fn();
  store.configureZoom("fit", requested);
  store.reportRenderedZoom(0.4);
  store.actions.zoomIn();
  expect(requested).toHaveBeenLastCalledWith(0.5);
  expect(store.getSnapshot().zoom).toBe("fit");
  store.configureZoom(0.5, requested);
  store.actions.zoomOut();
  expect(requested).toHaveBeenLastCalledWith(0.4);
  store.configureZoom(0.5);
  store.actions.zoomIn();
  expect(requested).toHaveBeenCalledTimes(2);
  expect(store.getSnapshot().zoom).toBe(0.5);
});
