import React from 'react'
import { useBrowserLayoutEffect } from '../../shared/use-browser-layout-effect'
import type { GlassGeometry, TabLayout } from './layout'
import type { TabRendererProps } from './types'

interface TabItemsProps extends Omit<TabRendererProps, 'onSelect' | 'vertical'> {
  readonly layout: TabLayout
  readonly geometry: GlassGeometry
  readonly onActivate: (id: string, event: React.MouseEvent<HTMLButtonElement>) => void
}

export function TabItems({ items, selectedId, dark, layout, geometry, onActivate }: TabItemsProps) {
  const { vertical } = layout
  const defaultAccent = dark ? '#209bff' : '#0088ff'
  return (
    <>
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className="duo-react-tab-bar-item"
          style={{
            ...layout.itemStyle(geometry, index),
            color: item.selectedColor ?? defaultAccent,
          }}
          aria-current={item.id === selectedId ? 'page' : undefined}
          aria-label={item.badge ? `${item.label}, ${item.badge}` : item.label}
          title={item.label}
          onClick={(event) => onActivate(item.id, event)}
          onKeyDown={(event) => {
            let next = index
            if (event.key === (vertical ? 'ArrowDown' : 'ArrowRight'))
              next = (index + 1) % items.length
            else if (event.key === (vertical ? 'ArrowUp' : 'ArrowLeft'))
              next = (index + items.length - 1) % items.length
            else if (event.key === 'Home') next = 0
            else if (event.key === 'End') next = items.length - 1
            else return
            event.preventDefault()
            event.currentTarget.parentElement
              ?.querySelectorAll<HTMLButtonElement>('button')
              [next]?.focus({ preventScroll: true })
          }}
        >
          {item.selectedIcon !== undefined ? (
            <>
              <span
                className="duo-react-tab-bar-icon"
                data-duo-react-icon-state="inactive"
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span
                className="duo-react-tab-bar-icon"
                data-duo-react-icon-state="active"
                aria-hidden="true"
              >
                {item.selectedIcon}
              </span>
            </>
          ) : (
            <span className="duo-react-tab-bar-icon" aria-hidden="true">
              {item.icon}
            </span>
          )}
          <span className="duo-react-tab-bar-label" style={{ opacity: geometry.labels }}>
            {item.label}
          </span>
          {item.badge !== undefined && (
            <TabBadge text={item.badge} layout={layout} geometry={geometry} />
          )}
        </button>
      ))}
    </>
  )
}

function TabBadge({
  text,
  layout,
  geometry,
}: {
  text: string
  layout: TabLayout
  geometry: GlassGeometry
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [width, setWidth] = React.useState(18)
  useBrowserLayoutEffect(() => {
    const element = ref.current!
    const measure = () => setWidth(Number.parseFloat(getComputedStyle(element).width) || 18)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [text])
  return (
    <span
      ref={ref}
      className="duo-react-tab-bar-badge"
      style={{ left: layout.badgeOffset(geometry, width), top: layout.badgeTop(geometry) }}
      title={text}
      aria-hidden="true"
    >
      {text.split(/\r\n?|\n/, 1)[0]}
    </span>
  )
}
