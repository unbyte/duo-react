import * as React from "react"
import { createPortal } from "react-dom"
import { useAccessoryHost } from "../../context/accessory-context"
import { HorizontalTabBar } from "./horizontal"
import { VerticalTabBar } from "./vertical"
import type { ResolvedBarLayout } from "../../core/bar-types"

export interface DuoTabBarItem {
  readonly id: string
  readonly icon: React.ReactNode
  readonly label: string
  /** CSS color for the selected icon and label; defaults to the material's blue. */
  readonly selectedColor?: React.CSSProperties["color"]
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
  const dark = style?.colorScheme === "dark"
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
      {layout.axis === "vertical" ? (
        <VerticalTabBar
          dark={dark}
          items={items}
          selectedId={selectedId}
          onSelect={onSelect}
          layout={layout}
        />
      ) : (
        <HorizontalTabBar
          dark={dark}
          items={items}
          selectedId={selectedId}
          onSelect={onSelect}
          layout={layout}
        />
      )}
    </div>,
    host,
  )
})
