export { DuoProvider } from "./context/provider"
export { useDuoState, useDuoActions, useDuoScreen, useDuoEvent } from "./context/hooks"
export { useBars } from "./hooks/use-bars"
export type {
  BarAxis,
  BarContainerProps,
  BarPlacement,
  BarRect,
  BarsLayout,
  BarsLayoutRequest,
  ResolvedBarLayout,
  ResolvedToolbarLayout,
  TabBarLayoutRequest,
  ToolbarLayoutRequest,
} from "./core/bar-types"
export type { DuoProviderProps } from "./context/provider"
export { getDuoGeometry } from "./core/geometry"
export { safeAreaStyle } from "./core/safe-area"
export type { DuoGeometryOptions } from "./core/geometry"
export type { DuoActions } from "./core/store"
export type {
  DuoColorMode,
  DuoDefaults,
  DuoDisplay,
  DuoFitPadding,
  DuoFoldingRegion,
  DuoInsets,
  DuoIndicatorStyle,
  DuoIndicatorStyles,
  DuoOrientation,
  DuoPlacement,
  DuoPosture,
  DuoRect,
  DuoReservedRegion,
  DuoScreenInfo,
  DuoState,
  DuoSystem,
  DuoSystemOptions,
  DuoWindowChange,
  DuoZoom,
} from "./core/types"
export { DuoFrame } from "./components/frame/frame"
export { DuoSafeArea } from "./components/safe-area/safe-area"
export type { DuoFrameProps } from "./components/frame/frame"
export { DuoControls } from "./components/controls/controls"
export { DuoDisplayControls } from "./components/controls/display-controls"
export { DuoRotationControls } from "./components/controls/rotation-controls"
export { DuoLayoutControls } from "./components/controls/layout-controls"
export { DuoZoomControls } from "./components/controls/zoom-controls"
export type { DuoControlsProps, DuoControlGroupProps } from "./components/controls/types"

export { DuoToolbar } from "./components/toolbar/toolbar"
export type { DuoToolbarProps } from "./components/toolbar/toolbar"
export { DuoTabBar } from "./components/tab-bar/tab-bar"
export type { DuoTabBarItem, DuoTabBarProps } from "./components/tab-bar/tab-bar"

export { DuoRegionMask } from "./components/region-mask/region-mask"
export type { DuoRegionMaskProps } from "./components/region-mask/region-mask"
