import type * as React from 'react'
import type { ResolvedBarLayout } from '../../bars/types'

export interface DuoTabBarItem {
  readonly id: string
  readonly icon: React.ReactNode
  readonly label: string
  /** CSS color for the selected icon and label; defaults to the material's blue. */
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
