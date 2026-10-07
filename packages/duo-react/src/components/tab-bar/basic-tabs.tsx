import React from 'react'
import { TabLayout } from './layout'
import { TabItems } from './tab-items'
import type { TabRendererProps } from './types'

export function BasicTabs({ items, selectedId, onSelect, vertical, dark }: TabRendererProps) {
  const layout = React.useMemo(
    () => new TabLayout(vertical, items.length),
    [vertical, items.length],
  )
  const { rest } = layout
  const selected = items.findIndex((item) => item.id === selectedId)
  const position = rest.first + selected * rest.pitch
  return (
    <div
      className="duo-react-tab-bar-slot"
      style={{
        width: vertical ? rest.cross : rest.length,
        height: vertical ? rest.length : rest.cross,
      }}
    >
      <div
        className="duo-react-tab-bar-surface"
        data-duo-react-rendering="basic"
        data-duo-react-material-dark={dark}
        style={layout.size(rest)}
      >
        {selected >= 0 && (
          <div
            className="duo-react-tab-bar-selection"
            aria-hidden="true"
            style={
              vertical
                ? {
                    left: (rest.cross - rest.lensCross) / 2,
                    top: position - rest.lensLength / 2,
                    width: rest.lensCross,
                    height: rest.lensLength,
                  }
                : {
                    left: position - rest.lensLength / 2,
                    top: (rest.cross - rest.lensCross) / 2,
                    width: rest.lensLength,
                    height: rest.lensCross,
                  }
            }
          />
        )}
        <TabItems
          items={items}
          selectedId={selectedId}
          dark={dark}
          layout={layout}
          geometry={rest}
          onActivate={onSelect}
        />
      </div>
    </div>
  )
}
