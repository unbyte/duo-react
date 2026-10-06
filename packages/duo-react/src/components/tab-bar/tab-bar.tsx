import React from 'react'
import ReactDOM from 'react-dom'
import { useDuoState } from '../../context/hooks'
import { useAccessoryHost } from '../../screen/accessory-context'
import { GlassTabs } from './glass-tabs'
import type { DuoTabBarProps } from './types'

export const DuoTabBar = React.forwardRef<HTMLDivElement, DuoTabBarProps>(function DuoTabBar(
  { items, selectedId, onSelect, layout, className, style, ...props },
  ref,
) {
  const host = useAccessoryHost()
  const colorMode = useDuoState((state) => state.system.colorMode)
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
      <GlassTabs
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
