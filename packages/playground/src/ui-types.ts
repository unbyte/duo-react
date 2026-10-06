import type * as React from "react"
import type { LucideIcon } from "lucide-react"
import type { TablerIcon } from "@tabler/icons-react"

export interface SettingProps {
  icon?: LucideIcon | TablerIcon
  label: string
  ariaLabel?: string
  title?: string
}

export interface SelectSettingProps extends SettingProps {
  value: string
  options: readonly { value: string; label: React.ReactNode; text?: string }[]
  onValueChange: (value: string) => void
}

export interface ToggleSettingProps extends SettingProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export interface RangeSettingProps extends SettingProps {
  value: number
  onValueChange: (value: number) => void
}

export interface ColorSettingProps extends SettingProps {
  value: string
  onValueChange: (value: string) => void
}

export interface TimeInputProps {
  value: string
  onValueChange: (value: string) => void
}

export interface InspectorTabsProps {
  value: string
  onValueChange: (value: string) => void
  sections: readonly { value: string; label: string; content: React.ReactNode }[]
}

export interface IconHintProps {
  label: string
  children: React.ReactNode
}

export interface PinOverlayProps {
  pinned: boolean
  onPinnedChange: (pinned: boolean) => void
}

export interface InspectorToggleProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  buttonRef: React.Ref<HTMLButtonElement>
}

export interface ScrollSurfaceProps {
  className?: string
  contentClassName?: string
  label?: string
  children: React.ReactNode
}
