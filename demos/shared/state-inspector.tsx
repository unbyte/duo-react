import * as React from "react"
import { useDuoState, type BarsLayout, type BarsLayoutRequest } from "duo-frame"

const tabs = ["provider", "bars"] as const

export function StateInspector({
  request,
  layout,
}: {
  request: BarsLayoutRequest
  layout?: BarsLayout
}) {
  const state = useDuoState((value) => value)
  const [open, setOpen] = React.useState(false)
  const [tab, setTab] = React.useState<(typeof tabs)[number]>("provider")
  const toggle = React.useRef<HTMLButtonElement>(null)
  const closeButton = React.useRef<HTMLButtonElement>(null)
  const tabList = React.useRef<HTMLDivElement>(null)

  const close = React.useCallback(() => {
    setOpen(false)
    toggle.current?.focus()
  }, [])

  React.useEffect(() => {
    if (!open) return
    closeButton.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        close()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, close])

  return (
    <div className="demo-state" data-open={open}>
      <button
        ref={toggle}
        type="button"
        className="demo-state-toggle"
        aria-expanded={open}
        aria-controls="demo-state-panel"
        onClick={() => (open ? close() : setOpen(true))}
      >
        Inspector
      </button>
      <aside
        id="demo-state-panel"
        className="demo-state-panel"
        aria-labelledby="demo-state-title"
        aria-hidden={!open}
      >
        <div className="demo-state-header">
          <h2 id="demo-state-title">Inspector</h2>
          <button
            ref={closeButton}
            type="button"
            className="demo-state-close"
            aria-label="Close inspector"
            tabIndex={open ? 0 : -1}
            onClick={close}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
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
    </div>
  )
}
