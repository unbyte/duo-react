import type { BarsLayoutRequest, TabBarLayoutRequest, ToolbarLayoutRequest } from 'duo-react'

export interface BarSettings {
  readonly tabbarCount: number
  readonly tabbarBadges: readonly string[]
  readonly customBadge: string
  readonly toolbarCount: number
  readonly toolbars: readonly ToolbarLayoutRequest[]
  readonly distribution: NonNullable<TabBarLayoutRequest['distribution']>
}

export const tabBadgeOptions = [
  { value: 'dot', label: 'Dot', badge: '' },
  { value: 'zero', label: '0', badge: '0' },
  { value: 'count', label: '99+', badge: '99+' },
  { value: 'long', label: 'Long text', badge: '12345678901234567890' },
  { value: 'custom', label: 'Custom' },
] as const

export const initialBarSettings: BarSettings = {
  tabbarCount: 3,
  tabbarBadges: [],
  customBadge: 'Custom text',
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
