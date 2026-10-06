import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"
import { cn } from "cn"

function ScrollArea({
  className,
  children,
  viewportProps,
  contentClassName,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  viewportProps?: ScrollAreaPrimitive.Viewport.Props
  contentClassName?: string
}) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn(
        "relative min-h-0 min-w-0 overflow-hidden [&:hover>[data-slot=scroll-area-scrollbar]]:opacity-100 [&:focus-within>[data-slot=scroll-area-scrollbar]]:opacity-100",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full overflow-auto overscroll-contain rounded-[inherit] outline-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-3px]"
        {...viewportProps}
      >
        <ScrollAreaPrimitive.Content data-slot="scroll-area-content" className={contentClassName}>
          {children}
        </ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "absolute z-1 box-border touch-none select-none border-0 p-0.5 opacity-0 transition-opacity duration-160 motion-reduce:transition-none data-scrolling:opacity-100",
        orientation === "vertical"
          ? "inset-y-0 right-0 h-auto w-2"
          : "inset-x-0 bottom-0 h-2 w-auto",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className={cn(
          "relative rounded-full bg-[var(--demo-scrollbar-thumb,#b8c3d1)] hover:bg-[var(--demo-scrollbar-thumb-hover,#8798ad)]",
          orientation === "vertical" ? "w-full" : "h-full",
        )}
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
