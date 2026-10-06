import './style.css'

export type {
  BarAxis,
  BarPlacement,
  BarRect,
  BarsLayoutRequest,
  DuoActions,
  DuoColorMode,
  DuoDefaults,
  DuoFitPadding,
  DuoGeometryOptions,
  DuoIndicatorStyle,
  DuoIndicatorStyles,
  DuoRegion,
  DuoScreenInfo,
  DuoState,
  DuoSystem,
  DuoSystemOptions,
  DuoWindowChange,
  DuoZoom,
  TabBarLayoutRequest,
  ToolbarLayoutRequest,
} from '@private/core'
export { getDuoGeometry } from '@private/core'
export type {
  DuoDisplay,
  DuoFoldingRegion,
  DuoInsets,
  DuoOrientation,
  DuoPlacement,
  DuoPosture,
  DuoRect,
  DuoReservedRegion,
} from '@private/profiles'
export type {
  BarContainerProps,
  BarsLayout,
  ResolvedBarLayout,
  ResolvedToolbarLayout,
} from './bars/types'
export { useBars } from './bars/use-bars'
export { DuoControls } from './components/controls/controls'
export { DuoDisplayControls } from './components/controls/display-controls'
export { DuoLayoutControls } from './components/controls/layout-controls'
export { DuoRotationControls } from './components/controls/rotation-controls'
export type { DuoControlGroupProps, DuoControlsProps } from './components/controls/types'
export { DuoZoomControls } from './components/controls/zoom-controls'
export type { DuoFrameProps } from './components/frame/frame'
export { DuoFrame } from './components/frame/frame'
export type { DuoRegionMaskProps } from './components/region-mask/region-mask'
export { DuoRegionMask } from './components/region-mask/region-mask'
export { DuoSafeArea } from './components/safe-area/safe-area'
export { DuoTabBar } from './components/tab-bar/tab-bar'
export type { DuoTabBarItem, DuoTabBarProps } from './components/tab-bar/types'
export type { DuoToolbarProps } from './components/toolbar/toolbar'
export { DuoToolbar } from './components/toolbar/toolbar'
export { useDuoActions, useDuoEvent, useDuoState } from './context/hooks'
export type { DuoProviderProps } from './context/provider'
export { DuoProvider } from './context/provider'
export { useDuoRegions } from './inspection/use-duo-regions'
export { safeAreaStyle } from './screen/safe-area'
export { useDuoScreen } from './screen/screen-context'
