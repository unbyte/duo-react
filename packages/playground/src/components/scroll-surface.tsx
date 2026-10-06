import type * as React from "react"
import { cn } from "cn"
import { ScrollArea } from "./ui/scroll-area"

interface ScrollSurfaceProps {
  className?: string
  contentClassName?: string
  label?: string
  children: React.ReactNode
}

export function ScrollSurface({
  className,
  contentClassName,
  label,
  children,
}: ScrollSurfaceProps) {
  return (
    <ScrollArea
      className={cn("playground-scroll-surface", className)}
      contentClassName={contentClassName}
      viewportProps={{ role: label ? "region" : undefined, "aria-label": label }}
    >
      {children}
    </ScrollArea>
  )
}
