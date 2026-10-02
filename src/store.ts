import { getDuoGeometry, validateZoom } from "./geometry";
import type {
  DuoDefaults,
  DuoDisplay,
  DuoOrientation,
  DuoPlacement,
  DuoPosture,
  DuoScreenInfo,
  DuoState,
  DuoSystem,
  DuoWindowChange,
  DuoZoom,
} from "./types";

type Listener = () => void;
type Model = Pick<DuoState, "posture" | "orientation" | "innerPlacement" | "zoom" | "system">;

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
}

export function createDuoStore(defaults: DuoDefaults = {}, system: Partial<DuoSystem> = {}) {
  const initial: Model = {
    posture: defaults.posture ?? "open",
    orientation: defaults.orientation ?? "landscape-left",
    innerPlacement: defaults.innerPlacement ?? "full",
    zoom: defaults.zoom ?? "fit",
    system: Object.freeze({
      time: "9:41",
      battery: 100,
      charging: false,
      cameraActive: false,
      ...system,
    }),
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
    setSystem: (values: Partial<DuoSystem>) => {
      const next = Object.freeze({ ...model.system, ...values });
      if (
        Object.keys(next).every(
          (key) => next[key as keyof DuoSystem] === model.system[key as keyof DuoSystem],
        )
      )
        return;
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
