import * as React from "react"
import { createPortal } from "react-dom"
import { useAccessoryHost } from "../../context/accessory-context"
import type { ResolvedBarLayout } from "../../core/bar-types"

export interface DuoTabBarItem {
  readonly id: string
  readonly icon: React.ReactNode
  readonly label: string
}

export interface DuoTabBarProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children" | "onSelect"
> {
  readonly items: readonly DuoTabBarItem[]
  readonly selectedId: string
  /** Called on activation, including when the selected item is activated again. */
  readonly onSelect: (id: string) => void
  readonly layout: ResolvedBarLayout
}

export const DuoTabBar = React.forwardRef<HTMLDivElement, DuoTabBarProps>(function DuoTabBar(
  { items, selectedId, onSelect, layout, className, style, ...props },
  ref,
) {
  const host = useAccessoryHost()
  const ids = new Set<string>()
  for (const item of items) {
    if (!item.id.trim()) throw new Error("DuoTabBar: each item needs a non-empty id.")
    if (ids.has(item.id))
      throw new Error(`DuoTabBar: duplicate item id ${JSON.stringify(item.id)}.`)
    ids.add(item.id)
  }
  if (!host || !items.length) return null

  return createPortal(
    <div
      role="navigation"
      aria-label="App destinations"
      {...props}
      {...layout.containerProps}
      ref={ref}
      className={["duo-tab-bar", className].filter(Boolean).join(" ")}
      style={{ ...style, ...layout.containerProps.style }}
    >
      <div className="duo-tab-bar-surface">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="duo-tab-bar-item"
            aria-current={item.id === selectedId ? "page" : undefined}
            aria-label={item.label}
            title={item.label}
            onClick={() => onSelect(item.id)}
          >
            <span className="duo-tab-bar-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="duo-tab-bar-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>,
    host,
  )
})
