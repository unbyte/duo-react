import type * as React from 'react'
import type { ResolvedBarLayout } from '../../bars/types'

export interface DuoTabBarItem {
  readonly id: string
  readonly label: string
  readonly icon: React.ReactNode
  /** Replaces the selected icon without tinting either icon. */
  readonly selectedIcon?: React.ReactNode
  /** Selected label color; also tints the icon without selectedIcon. Defaults to the material's blue. */
  readonly selectedColor?: React.CSSProperties['color']
}

export interface TabContent {
  readonly items: readonly DuoTabBarItem[]
  readonly selectedId: string
  /** Called on activation, including when the selected item is activated again. */
  readonly onSelect: (id: string) => void
}

export interface DuoTabBarProps
  extends TabContent,
    Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onSelect'> {
  readonly layout: ResolvedBarLayout
}
