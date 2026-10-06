import type * as React from "react"
import { cn } from "cn"
import { Pin, PinOff, Info } from "lucide-react"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../components/ui/tooltip"
import { Toggle } from "../components/ui/toggle"

interface IconHintProps {
  label: string
  children: React.ReactNode
}

interface PinOverlayProps {
  pinned: boolean
  onPinnedChange: (pinned: boolean) => void
}

interface InspectorToggleProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  buttonRef: React.Ref<HTMLButtonElement>
}

const iconToggle =
  "inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-muted-foreground transition-colors duration-160 motion-reduce:transition-none hover:bg-muted aria-pressed:bg-[#e8f1ff] aria-pressed:text-[#2165c5]"
const cornerIcon =
  "inline-flex size-5 items-center justify-center border-0 bg-transparent p-0 text-inherit"

export function IconHint({ label, children }: IconHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger className={cn("playground-corner-icon", cornerIcon)} aria-label={label}>
        {children}
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function PinOverlay({ pinned, onPinnedChange }: PinOverlayProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toggle
            size="sm"
            className={cn("playground-overlay-pin", iconToggle)}
            aria-label="Pin overlay"
            pressed={pinned}
            onPressedChange={onPinnedChange}
          />
        }
      >
        {pinned ? (
          <Pin className="size-3.5" size={14} strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <PinOff className="size-3.5" size={14} strokeWidth={1.5} aria-hidden="true" />
        )}
      </TooltipTrigger>
      <TooltipContent>{pinned ? "Unpin overlay" : "Keep overlay visible"}</TooltipContent>
    </Tooltip>
  )
}

export function InspectorToggle({ open, onOpenChange, buttonRef }: InspectorToggleProps) {
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Toggle
              ref={buttonRef}
              size="sm"
              className={cn("playground-inspector-toggle", iconToggle)}
              aria-label="Inspector"
              aria-expanded={open}
              aria-controls="playground-state-panel"
              pressed={open}
              onPressedChange={onOpenChange}
              onKeyDown={(event) => {
                if (event.key === "Escape" && open) onOpenChange(false)
              }}
            />
          }
        >
          <Info className="shrink-0" size={16} strokeWidth={1.5} aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>Inspector</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
