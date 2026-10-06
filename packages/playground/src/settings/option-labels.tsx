import type { LucideIcon } from 'lucide-react'
import type * as React from 'react'

export function LevelLabel({
  level,
  maximum,
  children,
}: {
  level: number
  maximum: number
  children: React.ReactNode
}) {
  return (
    <span className="playground-option-label inline-flex min-w-0 items-center gap-1.5">
      <span
        className="playground-level-meter inline-flex h-3 flex-[0_0_14px] items-end gap-0.5"
        aria-hidden="true"
      >
        {Array.from({ length: maximum }, (_, index) => (
          <span
            className="w-0.5 rounded-[1px] bg-input data-[filled=true]:bg-primary"
            key={index}
            data-filled={index < level}
            style={{ height: (index + 1) * 3 }}
          />
        ))}
      </span>
      <span className="playground-option-number text-[11px] font-semibold tabular-nums text-[#2165c5]">
        {level}
      </span>
      <span>{children}</span>
    </span>
  )
}

export function CountLabel({ count, unit = 'bar' }: { count: number; unit?: 'bar' | 'tab' }) {
  return (
    <span className="playground-option-label inline-flex min-w-0 items-center gap-1.5">
      <span className="playground-option-number text-[11px] font-semibold tabular-nums text-[#2165c5]">
        {count}
      </span>
      <span className="playground-option-description text-muted-foreground">
        {count === 0 ? 'None' : count === 1 ? unit : `${unit}s`}
      </span>
    </span>
  )
}

export function ChoiceLabel({
  icon: Icon,
  children,
}: {
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <span className="playground-option-label inline-flex min-w-0 items-center gap-1.5">
      <Icon
        className="playground-option-icon size-3.5 text-muted-foreground"
        size={14}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <span>{children}</span>
    </span>
  )
}

export function PlacementLabel({
  placement,
  children,
}: {
  placement: 'top-leading' | 'top-trailing' | 'bottom'
  children: React.ReactNode
}) {
  return (
    <span className="playground-option-label inline-flex min-w-0 items-center gap-1.5">
      <svg
        className="playground-placement-preview size-3.5 shrink-0 text-[#9ba6b5]"
        width="14"
        height="16"
        viewBox="0 0 14 16"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="12" height="14" rx="2" fill="none" stroke="currentColor" />
        <rect
          x={placement === 'top-trailing' ? 7 : 3}
          y={placement === 'bottom' ? 10 : 3}
          width={placement === 'bottom' ? 8 : 4}
          height="3"
          rx="1"
          className="playground-placement-bar fill-primary"
        />
      </svg>
      <span>{children}</span>
    </span>
  )
}

export function DistributionLabel({
  distribution,
  children,
}: {
  distribution: 'packed' | 'edges'
  children: React.ReactNode
}) {
  return (
    <span className="playground-option-label inline-flex min-w-0 items-center gap-1.5">
      <svg
        width="20"
        height="14"
        viewBox="0 0 20 14"
        className="playground-distribution-preview size-5 h-3.5 shrink-0 text-primary"
        aria-hidden="true"
      >
        {(distribution === 'packed' ? [6, 10, 14] : [2, 10, 18]).map((x) => (
          <circle key={x} cx={x} cy="7" r="1.5" fill="currentColor" />
        ))}
      </svg>
      <span>{children}</span>
    </span>
  )
}
