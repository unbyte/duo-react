import { ChevronDown } from 'lucide-react'
import type * as React from 'react'

export function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details
      className="playground-section group/section border-b border-border select-none last:border-b-0"
      open
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs/normal font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          className="shrink-0 text-muted-foreground transition-transform duration-180 motion-reduce:transition-none group-open/section:rotate-180"
          size={14}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </summary>
      <div className="playground-section-content grid gap-1.5 px-3 pb-1.5">{children}</div>
    </details>
  )
}
