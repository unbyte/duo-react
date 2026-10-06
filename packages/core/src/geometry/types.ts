import type {
  DuoDisplay,
  DuoOrientation,
  DuoPlacement,
  DuoPosture,
  DuoFoldingRegion,
  DuoInsets,
  DuoRect,
  DuoReservedRegion,
  DuoSize,
} from "@duo-react/profiles"

export interface DuoScreenInfo {
  readonly display: DuoDisplay
  readonly placement: DuoPlacement
  /** Effective app layout, honoring the outer portrait lock and upside-down fallback. */
  readonly orientation: DuoOrientation
  readonly visible: boolean
  /** Resolved app preference and layout default; DuoFrame.showSystemUI can suppress rendering. */
  readonly statusBarVisible: boolean
  readonly size: DuoSize
  readonly window: DuoRect
  readonly safeArea: DuoInsets
  readonly reservedRegions: readonly DuoReservedRegion[]
  /** Inner display fold metadata; separate from active, window-local reserved regions. */
  readonly foldingRegion?: DuoFoldingRegion
  readonly cornerRadii: readonly [number, number, number, number]
  readonly windowCornerRadii: readonly [number, number, number, number]
}

export interface DuoGeometryOptions {
  display: DuoDisplay
  orientation: DuoOrientation
  placement?: DuoPlacement
  cameraActive?: boolean
  posture?: DuoPosture
}
