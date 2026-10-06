import "./style.css"

export { getDuoGeometry } from "@duo-react/core"
export type { DuoGeometryOptions, DuoScreenInfo } from "@duo-react/core"
export type {
  DuoColorMode,
  DuoFitPadding,
  DuoIndicatorStyle,
  DuoIndicatorStyles,
  DuoSystem,
  DuoSystemOptions,
  DuoZoom,
} from "@duo-react/core"
export type {
  DuoDisplay,
  DuoFoldingRegion,
  DuoInsets,
  DuoOrientation,
  DuoPlacement,
  DuoPosture,
  DuoRect,
  DuoReservedRegion,
} from "@duo-react/profiles"

export { DuoProvider } from "./context/provider"
export type { DuoProviderProps } from "./context/provider"
export { useDuoActions, useDuoEvent, useDuoState } from "./context/hooks"
export type { DuoActions, DuoDefaults, DuoState, DuoWindowChange } from "@duo-react/core"

export { DuoFrame } from "./components/frame/frame"
export type { DuoFrameProps } from "./components/frame/frame"
export { DuoSafeArea } from "./components/safe-area/safe-area"
export { useDuoScreen } from "./screen/screen-context"
export { safeAreaStyle } from "./screen/safe-area"

export { useBars } from "./bars/use-bars"
export type {
  BarAxis,
  BarPlacement,
  BarRect,
  BarsLayoutRequest,
  TabBarLayoutRequest,
  ToolbarLayoutRequest,
} from "@duo-react/core"
export type {
  BarContainerProps,
  BarsLayout,
  ResolvedBarLayout,
  ResolvedToolbarLayout,
} from "./bars/types"
export { DuoTabBar } from "./components/tab-bar/tab-bar"
export type { DuoTabBarItem, DuoTabBarProps } from "./components/tab-bar/types"
export { DuoToolbar } from "./components/toolbar/toolbar"
export type { DuoToolbarProps } from "./components/toolbar/toolbar"

export { DuoControls } from "./components/controls/controls"
export { DuoDisplayControls } from "./components/controls/display-controls"
export { DuoLayoutControls } from "./components/controls/layout-controls"
export { DuoRotationControls } from "./components/controls/rotation-controls"
export { DuoZoomControls } from "./components/controls/zoom-controls"
export type { DuoControlGroupProps, DuoControlsProps } from "./components/controls/types"

export { useDuoRegions } from "./inspection/use-duo-regions"
export type { DuoRegion } from "@duo-react/core"
export { DuoRegionMask } from "./components/region-mask/region-mask"
export type { DuoRegionMaskProps } from "./components/region-mask/region-mask"
