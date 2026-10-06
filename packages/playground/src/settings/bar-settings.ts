import type { BarsLayoutRequest, TabBarLayoutRequest, ToolbarLayoutRequest } from 'duo-react'

export interface BarSettings {
  readonly tabbarCount: number
  readonly toolbarCount: number
  readonly toolbars: readonly ToolbarLayoutRequest[]
  readonly distribution: NonNullable<TabBarLayoutRequest['distribution']>
}

export const initialBarSettings: BarSettings = {
  tabbarCount: 3,
  toolbarCount: 0,
  toolbars: [
    { id: 'A', placement: 'top-trailing', axis: 'adaptive' },
    { id: 'B', placement: 'top-leading', axis: 'horizontal' },
    { id: 'C', placement: 'bottom', axis: 'adaptive' },
  ],
  distribution: 'packed',
}

export function barRequest(settings: BarSettings): BarsLayoutRequest {
  return {
    toolbars: settings.toolbars.slice(0, settings.toolbarCount),
    tabbar: settings.tabbarCount > 0 ? { distribution: settings.distribution } : undefined,
  }
}
