import {
  type BarAllocation,
  type BarsLayoutRequest,
  getBarsLayout,
  type TabBarLayoutRequest,
} from '@private/core'
import React from 'react'
import { useDuoScreen } from '../screen/screen-context'
import type { BarsLayout, ResolvedBarLayout } from './types'

const alignments = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  spread: 'space-between',
} as const

function bindBar({ placement, axis, rect, alignment }: BarAllocation): ResolvedBarLayout {
  return {
    placement,
    axis,
    rect,
    containerProps: {
      'data-duo-react-bar-placement': placement,
      'data-duo-react-bar-axis': axis,
      style: {
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: axis === 'horizontal' ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: alignments[alignment],
      },
    },
  }
}

/** Resolve one complete set of bars within the current DuoFrame app window. */
export function useBars(
  request: BarsLayoutRequest & { readonly tabbar: TabBarLayoutRequest },
): BarsLayout & { readonly tabbar: ResolvedBarLayout }
export function useBars(
  request?: BarsLayoutRequest & { readonly tabbar?: undefined },
): BarsLayout & { readonly tabbar?: undefined }
export function useBars(request?: BarsLayoutRequest): BarsLayout
export function useBars(request: BarsLayoutRequest = {}): BarsLayout {
  const screen = useDuoScreen()
  return React.useMemo(() => {
    const allocation = getBarsLayout(screen, request)
    return {
      toolbars: allocation.toolbars.map((bar) => ({ id: bar.id, ...bindBar(bar) })),
      tabbar: allocation.tabbar ? bindBar(allocation.tabbar) : undefined,
    }
  }, [screen, request])
}
