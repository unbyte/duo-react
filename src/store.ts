import { getDuoGeometry, validateZoom } from "./geometry";
import type {
  DuoDefaults,
  DuoDisplay,
  DuoIndicatorStyles,
  DuoOrientation,
  DuoPlacement,
  DuoPosture,
  DuoScreenInfo,
  DuoState,
  DuoSystem,
  DuoSystemOptions,
  DuoWindowChange,
  DuoZoom,
} from "./types";

type Listener = () => void;
type Model = Pick<DuoState, "posture" | "orientation" | "innerPlacement" | "zoom" | "system">;

function mergeIndicatorStyles(current: DuoIndicatorStyles, patch?: Partial<DuoIndicatorStyles>) {
  const statusBar = patch?.statusBar ?? current.statusBar;
  const homeIndicator = patch?.homeIndicator ?? current.homeIndicator;
  return statusBar === current.statusBar && homeIndicator === current.homeIndicator
    ? current
    : Object.freeze({ statusBar, homeIndicator });
}

function mergeSystem(current: DuoSystem, patch: DuoSystemOptions) {
  const inner = mergeIndicatorStyles(current.indicatorStyles.inner, patch.indicatorStyles?.inner);
  const outer = mergeIndicatorStyles(current.indicatorStyles.outer, patch.indicatorStyles?.outer);
  const indicatorStyles =
    inner === current.indicatorStyles.inner && outer === current.indicatorStyles.outer
      ? current.indicatorStyles
      : Object.freeze({ inner, outer });
  const next = Object.freeze({ ...current, ...patch, indicatorStyles });
  return Object.keys(next).every(
    (key) => next[key as keyof DuoSystem] === current[key as keyof DuoSystem],
  )
    ? current
    : next;
}

function validateModel(model: Model) {
  validateZoom(model.zoom);
  if (model.posture !== "open" && model.posture !== "closed")
    throw new RangeError("Unsupported Duo posture.");
  if (
    !Number.isFinite(model.system.battery) ||
    model.system.battery < 0 ||
    model.system.battery > 100
  )
    throw new RangeError("Battery must be between 0 and 100.");
  for (const styles of Object.values(model.system.indicatorStyles)) {
    for (const style of [styles.statusBar, styles.homeIndicator]) {
      if (style !== "auto" && style !== "light" && style !== "dark")
        throw new RangeError('Indicator style must be "auto", "light", or "dark".');
    }
  }
}

export function createDuoStore(defaults: DuoDefaults = {}, system: DuoSystemOptions = {}) {
  const indicatorStyles = Object.freeze({ statusBar: "auto", homeIndicator: "auto" } as const);
  const initial: Model = {
    posture: defaults.posture ?? "open",
    orientation: defaults.orientation ?? "landscape-left",
    innerPlacement: defaults.innerPlacement ?? "full",
    zoom: defaults.zoom ?? "fit",
    system: mergeSystem(
      Object.freeze({
        time: "9:41",
        battery: 100,
        charging: false,
        cameraActive: false,
        homeIndicatorVisible: false,
        indicatorStyles: Object.freeze({ inner: indicatorStyles, outer: indicatorStyles }),
      }),
      system,
    ),
  };
  let model = initial;
  let frameConnected = false;
  let controlledZoom: DuoZoom | undefined;
  let onZoomChange: ((zoom: DuoZoom) => void) | undefined;
  const listeners = new Set<Listener>();
  const windowListeners = new Set<(event: DuoWindowChange) => void>();

  function snapshot(previous?: DuoState): DuoState {
    validateModel(model);
    const screens = {} as Record<DuoDisplay, DuoScreenInfo>;
    for (const display of ["inner", "outer"] as const) {
      const old = previous?.screens[display];
      const placement = display === "inner" ? model.innerPlacement : "full";
      const visible = display === "inner" ? model.posture === "open" : model.posture === "closed";
      const sameGeometry =
        old &&
        old.orientation === model.orientation &&
        old.placement === placement &&
        (display === "outer" || previous.system.cameraActive === model.system.cameraActive);
      const geometry = sameGeometry
        ? old
        : getDuoGeometry({
            display,
            placement,
            orientation: model.orientation,
            cameraActive: model.system.cameraActive,
          });
      screens[display] =
        sameGeometry && old.visible === visible ? old : Object.freeze({ ...geometry, visible });
    }
    return Object.freeze({
      ...model,
      zoom: controlledZoom ?? model.zoom,
      zoomReadOnly: controlledZoom !== undefined && !onZoomChange,
      screens:
        previous?.screens.inner === screens.inner && previous.screens.outer === screens.outer
          ? previous.screens
          : Object.freeze(screens),
    });
  }
  let state = snapshot();
  const serverSnapshot = state;

  function publish(next = snapshot(state)) {
    if (
      next.posture === state.posture &&
      next.orientation === state.orientation &&
      next.innerPlacement === state.innerPlacement &&
      next.zoom === state.zoom &&
      next.zoomReadOnly === state.zoomReadOnly &&
      next.system === state.system
    )
      return;
    state = next;
    const pending = Array.from(listeners);
    for (const listener of pending) listener();
  }

  function update(patch: Partial<Model>) {
    const previous = model;
    model = { ...model, ...patch };
    let next: DuoState;
    try {
      next = snapshot(state);
    } catch (error) {
      model = previous;
      throw error;
    }
    publish(next);
  }

  function setZoom(zoom: DuoZoom) {
    validateZoom(zoom);
    if (controlledZoom !== undefined) {
      if (zoom !== controlledZoom) onZoomChange?.(zoom);
    } else update({ zoom });
  }

  const actions = Object.freeze({
    setPosture: (posture: DuoPosture) => update({ posture }),
    setOrientation: (orientation: DuoOrientation) => update({ orientation }),
    setInnerPlacement: (innerPlacement: DuoPlacement) => update({ innerPlacement }),
    setZoom,
    setSystem: (values: DuoSystemOptions) => {
      const next = mergeSystem(model.system, values);
      if (next === model.system) return;
      update({ system: next });
    },
    resetView: () => setZoom(initial.zoom),
    resetDevice: () => {
      update({ ...initial, zoom: model.zoom });
      setZoom(initial.zoom);
    },
  });

  return {
    actions,
    getSnapshot: () => state,
    getServerSnapshot: () => serverSnapshot,
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    subscribeWindow: (listener: (event: DuoWindowChange) => void) => {
      windowListeners.add(listener);
      return () => {
        windowListeners.delete(listener);
      };
    },
    emitWindowChange: (event: DuoWindowChange) => {
      const pending = Array.from(windowListeners);
      for (const listener of pending) listener(event);
    },
    connectFrame: () => {
      if (frameConnected)
        throw new Error(
          "Mount one DuoFrame per DuoProvider. Use separate providers for independent devices.",
        );
      frameConnected = true;
      return () => {
        frameConnected = false;
        controlledZoom = undefined;
        onZoomChange = undefined;
        publish();
      };
    },
    configureZoom: (zoom?: DuoZoom, onChange?: (value: DuoZoom) => void) => {
      if (zoom !== undefined) validateZoom(zoom);
      controlledZoom = zoom;
      onZoomChange = onChange;
      publish();
    },
  };
}

export type DuoStore = ReturnType<typeof createDuoStore>;
export type DuoActions = DuoStore["actions"];
