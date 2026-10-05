export type DuoDisplay = "inner" | "outer"
export type DuoPlacement = "full" | "left" | "right"
export type DuoOrientation =
  | "portrait"
  | "portrait-upside-down"
  | "landscape-left"
  | "landscape-right"
export type DuoPosture = "open" | "closed" | "partially-open"
export type DuoZoom = "fit" | number
export type DuoColorMode = "light" | "dark"
export type DuoIndicatorStyle = "auto" | "light" | "dark"

export interface DuoIndicatorStyles {
  readonly statusBar: DuoIndicatorStyle
  readonly homeIndicator: DuoIndicatorStyle
}

export interface DuoRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface DuoInsets {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

export interface DuoReservedRegion extends DuoRect {
  readonly type: "occlusion" | "division"
}

export interface DuoFoldingRegion {
  /** Full-display coordinates, including the fold's avoidance margins. */
  readonly frame: DuoRect
  readonly margins: DuoInsets
  /** Active only while partially open, independently of orientation and placement. */
  readonly active: boolean
}

export interface DuoScreenInfo {
  readonly display: DuoDisplay
  readonly placement: DuoPlacement
  /** Effective app layout, honoring the outer portrait lock and upside-down fallback. */
  readonly orientation: DuoOrientation
  readonly visible: boolean
  /** Resolved app preference and layout default; DuoFrame.showSystemUI can suppress rendering. */
  readonly statusBarVisible: boolean
  readonly size: Readonly<{ width: number; height: number }>
  readonly window: DuoRect
  readonly safeArea: DuoInsets
  readonly reservedRegions: readonly DuoReservedRegion[]
  /** Inner display fold metadata; separate from active, window-local reserved regions. */
  readonly foldingRegion?: DuoFoldingRegion
  readonly cornerRadii: readonly [number, number, number, number]
  readonly windowCornerRadii: readonly [number, number, number, number]
}

export interface DuoSystem {
  /** Simulated system appearance, independent of the host page's preference. */
  readonly colorMode: DuoColorMode
  /** Displayed as provided. Use HH:mm for zero-padded hours. */
  readonly time: string
  readonly battery: number
  readonly charging: boolean
  /** Active Wi-Fi segments, from 0 to 3. */
  readonly wifiStrength: number
  /** Active cellular dots, from 0 to 4. */
  readonly cellularStrength: number
  readonly cameraActive: boolean
  readonly homeIndicatorVisible: boolean
  /** Undefined follows the layout default; true hides status controls and false shows them. */
  readonly prefersStatusBarHidden?: boolean
  readonly indicatorStyles: Readonly<Record<DuoDisplay, DuoIndicatorStyles>>
}

export interface DuoSystemOptions extends Partial<Omit<DuoSystem, "indicatorStyles">> {
  readonly indicatorStyles?: Partial<Record<DuoDisplay, Partial<DuoIndicatorStyles>>>
}

export interface DuoDefaults {
  readonly posture?: DuoPosture
  readonly orientation?: DuoOrientation
  readonly innerPlacement?: DuoPlacement
  readonly zoom?: DuoZoom
}

export interface DuoState {
  readonly posture: DuoPosture
  /** Provider policy: keep the outer app in portrait while the physical device rotates. */
  readonly outerPortraitLocked: boolean
  /** Requested device orientation. Each screen reports its effective app layout separately. */
  readonly orientation: DuoOrientation
  /** Target clockwise angle from upright portrait, normalized to [0, 360) degrees. */
  readonly rotation: number
  readonly innerPlacement: DuoPlacement
  /** Requested scale, or "fit" to let the frame calculate it from available space.
   * A numeric 1 maps one logical app pixel to one preview CSS pixel.
   */
  readonly zoom: DuoZoom
  /** Whether zoom actions are disabled because DuoFrame has a zoom prop without
   * an onZoomChange callback. This is a permission flag, not another scale.
   */
  readonly zoomReadOnly: boolean
  /** Actual scale last applied by the mounted frame, including the result of "fit".
   * Undefined before measurement or after unmount; 0 when no space is available.
   * Zoom buttons step from this value while zoom is "fit". App layout stays in logical pixels.
   */
  readonly renderedZoom?: number
  readonly system: DuoSystem
  readonly screens: Readonly<Record<DuoDisplay, DuoScreenInfo>>
}

export interface DuoWindowChange {
  readonly display: DuoDisplay
  readonly previous: DuoScreenInfo
  readonly current: DuoScreenInfo
}
