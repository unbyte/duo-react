import * as React from "react"
import type { DuoPlacement } from "../../core/types"

function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function DisplayIcon({ inner }: { inner: boolean }) {
  const outline = inner
    ? "M4.5 5h15A2.5 2.5 0 0 1 22 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 16.5v-9A2.5 2.5 0 0 1 4.5 5Z"
    : "M5.5 2H15a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H5.5a.5.5 0 0 1-.5-.5v-19a.5.5 0 0 1 .5-.5Z"
  return (
    <Glyph>
      <path
        d={outline}
        fill="currentColor"
        fillOpacity="0.14"
        stroke="none"
        data-duo-icon-tone="secondary"
      />
      <path d={outline} />
      {inner ? (
        <path d="M9.5 16.5h5" strokeWidth="1.25" />
      ) : (
        <circle cx="15.5" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
      )}
    </Glyph>
  )
}

export function LayoutIcon({ placement }: { placement: DuoPlacement }) {
  return (
    <Glyph>
      <rect
        x={placement === "right" ? 12 : 3}
        y="4"
        width={placement === "full" ? 18 : 9}
        height="16"
        rx="2"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="none"
        data-duo-icon-tone="secondary"
      />
      <rect x="3" y="4" width="18" height="16" rx="2" />
      {placement !== "full" && <path d="M12 4v16" />}
    </Glyph>
  )
}

export function PartialFoldIcon() {
  const outline =
    "M12 6 4.25 4.28A1 1 0 0 0 3 5.26v11.94a1 1 0 0 0 .78.98L12 20l8.22-1.82a1 1 0 0 0 .78-.98V5.26a1 1 0 0 0-1.25-.98L12 6Z"
  return (
    <Glyph>
      <path
        d={outline}
        fill="currentColor"
        fillOpacity="0.14"
        stroke="none"
        data-duo-icon-tone="secondary"
      />
      <path d={outline} />
      <path d="M12 6v14" />
    </Glyph>
  )
}

export const iconProps = {
  size: 24,
  strokeWidth: 1.75,
  "aria-hidden": true,
  focusable: false,
} as const
