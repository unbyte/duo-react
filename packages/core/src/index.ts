export { orientationRotation } from "./geometry/orientation"
export { getDuoRegions } from "./geometry/regions"
export type { DuoRegion } from "./geometry/regions"
export { getDuoGeometry } from "./geometry/screen"
export type { DuoGeometryOptions, DuoScreenInfo } from "./geometry/types"

export { getAccessoryLayout } from "./layout/accessories"
export { getBarsLayout } from "./layout/bars"
export { getSystemLayout } from "./layout/system"
export type {
  BarAlignment,
  BarAllocation,
  BarAxis,
  BarPlacement,
  BarRect,
  BarsAllocation,
  BarsLayoutRequest,
  TabBarLayoutRequest,
  ToolbarAllocation,
  ToolbarLayoutRequest,
} from "./layout/types"

export { resolveFitPadding, resolveZoom } from "./preview/zoom"
export { rotatedSize, rotationStart } from "./preview/rotation"
export type { DuoFitPadding, DuoZoom } from "./preview/types"

export { DuoStore } from "./state/store"
export type { DuoActions } from "./state/store"
export type {
  DuoColorMode,
  DuoDefaults,
  DuoIndicatorStyle,
  DuoIndicatorStyles,
  DuoState,
  DuoSystem,
  DuoSystemOptions,
  DuoWindowChange,
} from "./state/types"
