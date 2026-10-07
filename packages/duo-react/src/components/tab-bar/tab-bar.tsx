import React from 'react'
import ReactDOM from 'react-dom'
import { useDuoState } from '../../context/hooks'
import { useRenderingMode } from '../../context/rendering-context'
import { useAccessoryHost } from '../../screen/accessory-context'
import { BasicTabs } from './basic-tabs'
import { GlassTabs } from './glass-tabs'
import type { DuoTabBarProps } from './types'

export const DuoTabBar = React.forwardRef<HTMLDivElement, DuoTabBarProps>(function DuoTabBar(
  { items, selectedId, onSelect, layout, rendering, className, style, ...props },
  ref,
) {
  const host = useAccessoryHost()
  const colorMode = useDuoState((state) => state.system.colorMode)
  const mode = useRenderingMode('tabBar', rendering)
  const Tabs = mode === 'basic' ? BasicTabs : GlassTabs
  const dark = (style?.colorScheme ?? colorMode) === 'dark'
  const ids = new Set<string>()
  for (const item of items) {
    if (!item.id.trim()) throw new Error('DuoTabBar: each item needs a non-empty id.')
    if (ids.has(item.id))
      throw new Error(`DuoTabBar: duplicate item id ${JSON.stringify(item.id)}.`)
    ids.add(item.id)
  }
  if (!host || !items.length) return null

  return ReactDOM.createPortal(
    <div
      role="navigation"
      aria-label="App destinations"
      {...props}
      {...layout.containerProps}
      ref={ref}
      className={['duo-react-tab-bar', className].filter(Boolean).join(' ')}
      style={{ ...style, ...layout.containerProps.style }}
    >
      <Tabs
        key={layout.axis}
        dark={dark}
        items={items}
        selectedId={selectedId}
        onSelect={onSelect}
        vertical={layout.axis === 'vertical'}
      />
    </div>,
    host,
  )
})
