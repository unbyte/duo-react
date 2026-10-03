import { getDuoGeometry, validatePosture } from "./geometry";
import { validateZoom } from "./zoom";
import { normalizeRotation, orientationAtRotation, orientationRotation } from "./rotation";
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
type Model = Pick<
  DuoState,
  "posture" | "orientation" | "rotation" | "innerPlacement" | "zoom" | "system"
>;

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
  validatePosture(model.posture);
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

export function createDuoStore(
  defaults: DuoDefaults = {},
  system: DuoSystemOptions = {},
  outerPortraitLocked = false,
) {
  const indicatorStyles = Object.freeze({ statusBar: "auto", homeIndicator: "auto" } as const);
  const initial: Model = {
    posture: defaults.posture ?? "open",
    orientation: defaults.orientation ?? "landscape-left",
    rotation: orientationRotation[defaults.orientation ?? "landscape-left"],
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
  let renderedZoom: number | undefined;
  let onZoomChange: ((zoom: DuoZoom) => void) | undefined;
  const listeners = new Set<Listener>();
  const windowListeners = new Set<(event: DuoWindowChange) => void>();

  function snapshot(previous?: DuoState): DuoState {
    validateModel(model);
    const screens = {} as Record<DuoDisplay, DuoScreenInfo>;
    for (const display of ["inner", "outer"] as const) {
      const old = previous?.screens[display];
      // Unsupported outer orientations retain the app layout while the shell turns.
      const orientation =
        display === "outer"
          ? outerPortraitLocked
            ? "portrait"
            : model.orientation === "portrait-upside-down"
              ? (old?.orientation ?? "portrait")
              : model.orientation
          : model.orientation;
      const placement = display === "inner" ? model.innerPlacement : "full";
      const visible = display === "inner" ? model.posture !== "closed" : model.posture === "closed";
      const statusBarVisible = !(
        model.system.prefersStatusBarHidden ??
        (display === "outer" && orientation !== "portrait")
      );
      const sameGeometry =
        old &&
        old.orientation === orientation &&
        old.placement === placement &&
        (display === "outer" ||
          (previous.system.cameraActive === model.system.cameraActive &&
            old.foldingRegion?.active === (model.posture === "partially-open")));
      const geometry = sameGeometry
        ? old
        : getDuoGeometry({
            display,
            placement,
            orientation,
            cameraActive: model.system.cameraActive,
            posture: model.posture,
          });
      screens[display] =
        sameGeometry && old.visible === visible && old.statusBarVisible === statusBarVisible
          ? old
          : Object.freeze({ ...geometry, visible, statusBarVisible });
    }
    return Object.freeze({
      ...model,
      outerPortraitLocked,
      zoom: controlledZoom ?? model.zoom,
      zoomReadOnly: controlledZoom !== undefined && !onZoomChange,
      renderedZoom,
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
      next.outerPortraitLocked === state.outerPortraitLocked &&
      next.orientation === state.orientation &&
      next.rotation === state.rotation &&
      next.innerPlacement === state.innerPlacement &&
      next.zoom === state.zoom &&
      next.zoomReadOnly === state.zoomReadOnly &&
      next.renderedZoom === state.renderedZoom &&
      next.screens === state.screens &&
      next.system === state.system
    )
      return;
    state = next;
    const pending = Array.from(listeners);
    for (const listener of pending) listener();
  }

  function update(patch: Partial<Model>, geometryState = state) {
    const previous = model;
    model = { ...model, ...patch };
    let next: DuoState;
    try {
      next = snapshot(geometryState);
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

  function stepZoom(factor: number) {
    const current = typeof state.zoom === "number" ? state.zoom : renderedZoom;
    if (current === undefined || current <= 0) return;
    const next = current * factor;
    if (Number.isFinite(next) && next > 0) setZoom(next);
  }

  const actions = Object.freeze({
    setPosture: (posture: DuoPosture) => update({ posture }),
    setOrientation: (orientation: DuoOrientation) =>
      update({
        orientation,
        rotation: orientationRotation[orientation],
      }),
    rotate: (direction: "left" | "right") => {
      const rotation = normalizeRotation(model.rotation + (direction === "left" ? -90 : 90));
      const orientation = orientationAtRotation(rotation);
      update({
        rotation,
        orientation,
        innerPlacement: orientation.startsWith("portrait") ? "full" : model.innerPlacement,
      });
    },
    setInnerPlacement: (innerPlacement: DuoPlacement) => update({ innerPlacement }),
    setZoom,
    zoomIn: () => stepZoom(1.25),
    zoomOut: () => stepZoom(1 / 1.25),
    setSystem: (values: DuoSystemOptions) => {
      const next = mergeSystem(model.system, values);
      if (next === model.system) return;
      update({ system: next });
    },
    resetView: () => setZoom(initial.zoom),
    resetDevice: () => {
      update({ ...initial, zoom: model.zoom }, serverSnapshot);
      setZoom(initial.zoom);
    },
  });

  return {
    actions,
    configureOuterPortraitLock: (locked: boolean) => {
      outerPortraitLocked = locked;
      publish();
    },
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
        renderedZoom = undefined;
        publish();
      };
    },
    configureZoom: (zoom?: DuoZoom, onChange?: (value: DuoZoom) => void) => {
      if (zoom !== undefined) validateZoom(zoom);
      controlledZoom = zoom;
      onZoomChange = onChange;
      publish();
    },
    reportRenderedZoom: (zoom: number) => {
      if (!Number.isFinite(zoom) || zoom < 0)
        throw new RangeError("Rendered zoom must be nonnegative and finite.");
      if (renderedZoom === zoom) return;
      renderedZoom = zoom;
      publish();
    },
  };
}

export type DuoStore = ReturnType<typeof createDuoStore>;
export type DuoActions = DuoStore["actions"];
