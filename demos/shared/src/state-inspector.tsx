import * as React from "react"
import { useDuoState, type BarsLayout, type BarsLayoutRequest } from "duo-frame"

const tabs = ["provider", "bars"] as const

export function StateInspector({
  open,
  request,
  layout,
  onClose,
}: {
  open: boolean
  request: BarsLayoutRequest
  layout?: BarsLayout
  onClose: () => void
}) {
  const state = useDuoState((value) => value)
  const [tab, setTab] = React.useState<(typeof tabs)[number]>("provider")
  const panel = React.useRef<HTMLElement>(null)
  const tabList = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && panel.current?.contains(document.activeElement)) {
        event.preventDefault()
        onClose()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  return (
    <aside
      id="demo-state-panel"
      className="demo-state-panel"
      aria-label="Inspector"
      hidden={!open}
      ref={panel}
    >
      <div
        ref={tabList}
        className="demo-state-tabs"
        role="tablist"
        tabIndex={-1}
        aria-label="Inspected state"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
          event.preventDefault()
          const next =
            event.key === "Home"
              ? "provider"
              : event.key === "End"
                ? "bars"
                : tab === "provider"
                  ? "bars"
                  : "provider"
          setTab(next)
          tabList.current?.querySelector<HTMLButtonElement>(`#demo-state-tab-${next}`)?.focus()
        }}
      >
        {tabs.map((value) => (
          <button
            key={value}
            id={`demo-state-tab-${value}`}
            type="button"
            role="tab"
            aria-selected={tab === value}
            aria-controls={`demo-state-content-${value}`}
            tabIndex={open && tab === value ? 0 : -1}
            onClick={() => setTab(value)}
          >
            {value === "provider" ? "Provider" : "Bars"}
          </button>
        ))}
      </div>
      {tabs.map((value) => (
        <pre
          key={value}
          id={`demo-state-content-${value}`}
          role="tabpanel"
          aria-labelledby={`demo-state-tab-${value}`}
          hidden={tab !== value}
          tabIndex={open && tab === value ? 0 : -1}
        >
          {JSON.stringify(value === "provider" ? state : { request, layout }, undefined, 2)}
        </pre>
      ))}
    </aside>
  )
}
