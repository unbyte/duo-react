import { getDuoGeometry, validatePosture } from "../geometry/screen"
import { type DuoScreenInfo } from "../geometry/types"
import { validateZoom } from "../preview/zoom"
import {
  normalizeRotation,
  orientationAtRotation,
  orientationRotation,
} from "../geometry/orientation"
import type { DuoDisplay, DuoOrientation, DuoPlacement, DuoPosture } from "@duo-react/profiles"
import {
  type DuoIndicatorStyles,
  type DuoSystem,
  type DuoSystemOptions,
  type DuoDefaults,
  type DuoState,
  type DuoWindowChange,
} from "./types"
import type { DuoZoom } from "../preview/types"

type Listener = () => void
type Model = Pick<
  DuoState,
  "posture" | "orientation" | "rotation" | "innerPlacement" | "zoom" | "system"
>

function mergeIndicatorStyles(current: DuoIndicatorStyles, patch?: Partial<DuoIndicatorStyles>) {
  const statusBar = patch?.statusBar ?? current.statusBar
  const homeIndicator = patch?.homeIndicator ?? current.homeIndicator
  return statusBar === current.statusBar && homeIndicator === current.homeIndicator
    ? current
    : Object.freeze({ statusBar, homeIndicator })
}

function mergeSystem(current: DuoSystem, patch: DuoSystemOptions) {
  const inner = mergeIndicatorStyles(current.indicatorStyles.inner, patch.indicatorStyles?.inner)
  const outer = mergeIndicatorStyles(current.indicatorStyles.outer, patch.indicatorStyles?.outer)
  const indicatorStyles =
    inner === current.indicatorStyles.inner && outer === current.indicatorStyles.outer
      ? current.indicatorStyles
      : Object.freeze({ inner, outer })
  const next = Object.freeze({ ...current, ...patch, indicatorStyles })
  return Object.keys(next).every(
    (key) => next[key as keyof DuoSystem] === current[key as keyof DuoSystem],
  )
    ? current
    : next
}

function validateModel(model: Model) {
  validateZoom(model.zoom)
  validatePosture(model.posture)
  if (model.system.colorMode !== "light" && model.system.colorMode !== "dark")
    throw new RangeError('System color mode must be "light" or "dark".')
  if (
    !Number.isFinite(model.system.battery) ||
    model.system.battery < 0 ||
    model.system.battery > 100
  )
    throw new RangeError("Battery must be between 0 and 100.")
  for (const [name, value, maximum] of [
    ["Wi-Fi", model.system.wifiStrength, 3],
    ["Cellular", model.system.cellularStrength, 4],
  ] as const) {
    if (!Number.isInteger(value) || value < 0 || value > maximum)
      throw new RangeError(`${name} strength must be an integer between 0 and ${maximum}.`)
  }
  for (const styles of Object.values(model.system.indicatorStyles)) {
    for (const style of [styles.statusBar, styles.homeIndicator]) {
      if (style !== "auto" && style !== "light" && style !== "dark")
        throw new RangeError('Indicator style must be "auto", "light", or "dark".')
    }
  }
}

export class DuoStore {
  private readonly initial: Model
  private model: Model
  private state: DuoState
  private readonly serverSnapshot: DuoState
  private frameConnected = false
  private controlledZoom?: DuoZoom
  private renderedZoom?: number
  private onZoomChange?: (zoom: DuoZoom) => void
  private readonly listeners = new Set<Listener>()
  private readonly windowListeners = new Set<(event: DuoWindowChange) => void>()

  constructor(
    defaults: DuoDefaults = {},
    system: DuoSystemOptions = {},
    private outerPortraitLocked = false,
  ) {
    const indicatorStyles = Object.freeze({ statusBar: "auto", homeIndicator: "auto" } as const)
    this.initial = {
      posture: defaults.posture ?? "open",
      orientation: defaults.orientation ?? "landscape-left",
      rotation: orientationRotation[defaults.orientation ?? "landscape-left"],
      innerPlacement: defaults.innerPlacement ?? "full",
      zoom: defaults.zoom ?? "fit",
      system: mergeSystem(
        Object.freeze({
          colorMode: "light",
          time: "09:41",
          battery: 100,
          charging: false,
          wifiStrength: 3,
          cellularStrength: 0,
          cameraActive: false,
          homeIndicatorVisible: false,
          indicatorStyles: Object.freeze({ inner: indicatorStyles, outer: indicatorStyles }),
        }),
        system,
      ),
    }
    this.model = this.initial
    this.state = this.snapshot()
    this.serverSnapshot = this.state
  }

  private snapshot(previous?: DuoState): DuoState {
    validateModel(this.model)
    const screens = {} as Record<DuoDisplay, DuoScreenInfo>
    for (const display of ["inner", "outer"] as const) {
      const old = previous?.screens[display]
      // Unsupported outer orientations retain the app layout while the shell turns.
      const orientation =
        display === "outer"
          ? this.outerPortraitLocked
            ? "portrait"
            : this.model.orientation === "portrait-upside-down"
              ? (old?.orientation ?? "portrait")
              : this.model.orientation
          : this.model.orientation
      const placement = display === "inner" ? this.model.innerPlacement : "full"
      const visible =
        display === "inner" ? this.model.posture !== "closed" : this.model.posture === "closed"
      const statusBarVisible = !(
        this.model.system.prefersStatusBarHidden ??
        (display === "outer" && orientation !== "portrait")
      )
      const sameGeometry =
        old &&
        old.orientation === orientation &&
        old.placement === placement &&
        (display === "outer" ||
          (previous.system.cameraActive === this.model.system.cameraActive &&
            old.foldingRegion?.active === (this.model.posture === "partially-open")))
      const geometry = sameGeometry
        ? old
        : getDuoGeometry({
            display,
            placement,
            orientation,
            cameraActive: this.model.system.cameraActive,
            posture: this.model.posture,
          })
      screens[display] =
        sameGeometry && old.visible === visible && old.statusBarVisible === statusBarVisible
          ? old
          : Object.freeze({ ...geometry, visible, statusBarVisible })
    }
    return Object.freeze({
      ...this.model,
      outerPortraitLocked: this.outerPortraitLocked,
      zoom: this.controlledZoom ?? this.model.zoom,
      zoomReadOnly: this.controlledZoom !== undefined && !this.onZoomChange,
      renderedZoom: this.renderedZoom,
      screens:
        previous?.screens.inner === screens.inner && previous.screens.outer === screens.outer
          ? previous.screens
          : Object.freeze(screens),
    })
  }

  private publish(next = this.snapshot(this.state)) {
    if (
      next.posture === this.state.posture &&
      next.outerPortraitLocked === this.state.outerPortraitLocked &&
      next.orientation === this.state.orientation &&
      next.rotation === this.state.rotation &&
      next.innerPlacement === this.state.innerPlacement &&
      next.zoom === this.state.zoom &&
      next.zoomReadOnly === this.state.zoomReadOnly &&
      next.renderedZoom === this.state.renderedZoom &&
      next.screens === this.state.screens &&
      next.system === this.state.system
    )
      return
    this.state = next
    const pending = Array.from(this.listeners)
    for (const listener of pending) listener()
  }

  private update(patch: Partial<Model>, geometryState = this.state) {
    const previous = this.model
    this.model = { ...this.model, ...patch }
    let next: DuoState
    try {
      next = this.snapshot(geometryState)
    } catch (error) {
      this.model = previous
      throw error
    }
    this.publish(next)
  }

  private setZoom(zoom: DuoZoom) {
    validateZoom(zoom)
    if (this.controlledZoom !== undefined) {
      if (zoom !== this.controlledZoom) this.onZoomChange?.(zoom)
    } else this.update({ zoom })
  }

  private stepZoom(factor: number) {
    const current = typeof this.state.zoom === "number" ? this.state.zoom : this.renderedZoom
    if (current === undefined || current <= 0) return
    const next = current * factor
    if (Number.isFinite(next) && next > 0) this.setZoom(next)
  }

  readonly actions = Object.freeze({
    setPosture: (posture: DuoPosture) => this.update({ posture }),
    setOrientation: (orientation: DuoOrientation) =>
      this.update({
        orientation,
        rotation: orientationRotation[orientation],
      }),
    rotate: (direction: "left" | "right") => {
      const rotation = normalizeRotation(this.model.rotation + (direction === "left" ? -90 : 90))
      const orientation = orientationAtRotation(rotation)
      this.update({
        rotation,
        orientation,
        innerPlacement: orientation.startsWith("portrait") ? "full" : this.model.innerPlacement,
      })
    },
    setInnerPlacement: (innerPlacement: DuoPlacement) => this.update({ innerPlacement }),
    setZoom: (zoom: DuoZoom) => this.setZoom(zoom),
    zoomIn: () => this.stepZoom(1.25),
    zoomOut: () => this.stepZoom(1 / 1.25),
    setSystem: (values: DuoSystemOptions) => {
      const next = mergeSystem(this.model.system, values)
      if (next === this.model.system) return
      this.update({ system: next })
    },
    resetView: () => this.setZoom(this.initial.zoom),
    resetDevice: () => {
      this.update({ ...this.initial, zoom: this.model.zoom }, this.serverSnapshot)
      this.setZoom(this.initial.zoom)
    },
  })

  configureOuterPortraitLock(locked: boolean) {
    this.outerPortraitLocked = locked
    this.publish()
  }

  getSnapshot = () => this.state

  getServerSnapshot = () => this.serverSnapshot

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  subscribeWindow(listener: (event: DuoWindowChange) => void) {
    this.windowListeners.add(listener)
    return () => {
      this.windowListeners.delete(listener)
    }
  }

  emitWindowChange(event: DuoWindowChange) {
    const pending = Array.from(this.windowListeners)
    for (const listener of pending) listener(event)
  }

  connectFrame() {
    if (this.frameConnected)
      throw new Error(
        "Mount one DuoFrame per DuoProvider. Use separate providers for independent devices.",
      )
    this.frameConnected = true
    return () => {
      this.frameConnected = false
      this.controlledZoom = undefined
      this.onZoomChange = undefined
      this.renderedZoom = undefined
      this.publish()
    }
  }

  configureZoom(zoom?: DuoZoom, onChange?: (value: DuoZoom) => void) {
    if (zoom !== undefined) validateZoom(zoom)
    this.controlledZoom = zoom
    this.onZoomChange = onChange
    this.publish()
  }

  reportRenderedZoom(zoom: number) {
    if (!Number.isFinite(zoom) || zoom < 0)
      throw new RangeError("Rendered zoom must be nonnegative and finite.")
    if (this.renderedZoom === zoom) return
    this.renderedZoom = zoom
    this.publish()
  }
}

export type DuoActions = DuoStore["actions"]
