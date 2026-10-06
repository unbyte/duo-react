export type DuoDisplay = 'inner' | 'outer'
export type DuoPlacement = 'full' | 'left' | 'right'
export type DuoOrientation =
  | 'portrait'
  | 'portrait-upside-down'
  | 'landscape-left'
  | 'landscape-right'
export type DuoPosture = 'open' | 'closed' | 'partially-open'
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
  readonly type: 'occlusion' | 'division'
}

export interface DuoFoldingRegion {
  /** Full-display coordinates, including the fold's avoidance margins. */
  readonly frame: DuoRect
  readonly margins: DuoInsets
  /** Active only while partially open, independently of orientation and placement. */
  readonly active: boolean
}

export interface DuoSize {
  readonly width: number
  readonly height: number
}

export interface GeometryProfile {
  readonly display: DuoDisplay
  readonly placement: DuoPlacement
  readonly orientation: DuoOrientation
  readonly cameraActive: boolean
  readonly size: DuoSize
  readonly window: DuoRect
  readonly safeArea: DuoInsets
  readonly reservedRegions: readonly DuoReservedRegion[]
  readonly cornerRadii: readonly [number, number, number, number]
}
