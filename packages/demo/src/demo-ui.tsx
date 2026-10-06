import * as React from "react"
import { cn } from "cn"
import { Field, FieldLabel } from "./components/ui/field"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./components/ui/select"
import { Switch } from "./components/ui/switch"
import { Slider } from "./components/ui/slider"
import { Input } from "./components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "./components/ui/tooltip"
import { Toggle } from "./components/ui/toggle"
import { ScrollArea } from "./components/ui/scroll-area"
import { Pin, PinOff, Info } from "lucide-react"
import type {
  SettingProps,
  SelectSettingProps,
  ToggleSettingProps,
  RangeSettingProps,
  ColorSettingProps,
  TimeInputProps,
  InspectorTabsProps,
  IconHintProps,
  PinOverlayProps,
  InspectorToggleProps,
  ScrollSurfaceProps,
} from "./ui-types"

export { PreviewControls } from "./components/preview-controls"

const fieldRow =
  "grid min-h-[30px] min-w-0 grid-cols-[minmax(0,1fr)_124px] items-center gap-2 text-xs/normal font-medium text-[#526174]"
const fieldLabel =
  "flex min-w-0 items-center gap-2 text-xs/normal font-medium leading-[1.35] [&>svg]:shrink-0 [&>svg]:text-[#8390a0]"
const fieldControl =
  "box-border h-7 w-full min-w-0 cursor-pointer rounded-md border border-input bg-background px-2 py-0 text-xs/5 text-foreground"
const colorControl =
  "h-7 w-9 cursor-pointer justify-self-end rounded-md border border-input bg-background p-[3px] [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-[3px] [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-[3px] [&::-moz-color-swatch]:border-0"
const iconToggle =
  "inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-muted-foreground transition-colors duration-160 motion-reduce:transition-none hover:bg-muted aria-pressed:bg-[#e8f1ff] aria-pressed:text-[#2165c5]"
const cornerIcon =
  "inline-flex size-5 items-center justify-center border-0 bg-transparent p-0 text-inherit"
const inspectorTabs = "flex min-h-0 min-w-0 flex-1 flex-col gap-0"
const inspectorHeading =
  "flex h-11 shrink-0 items-center gap-2.5 border-b border-border px-3.5 @max-[280px]:gap-[5px] @max-[280px]:px-2.5"
const inspectorTabList =
  "box-border -mb-px flex w-auto min-w-0 flex-1 self-stretch gap-0 rounded-none border-0 bg-transparent p-0 group-data-horizontal/tabs:h-auto"
const inspectorTab =
  "h-full flex-1 cursor-pointer rounded-none border-0 border-b-2 border-b-transparent bg-transparent px-1.5 py-0 text-xs/normal font-medium text-muted-foreground after:content-none aria-selected:border-b-primary aria-selected:bg-transparent aria-selected:text-[#2165c5] @max-[280px]:px-[3px] @max-[280px]:text-[11px]"
const inspectorBody = "flex min-h-0 min-w-0 flex-1 overflow-hidden bg-transparent text-xs/normal"
const inspectorContent = "box-border min-h-full min-w-0! p-3.5"

function SettingLabel({ icon: Icon, label, id }: SettingProps & { id: string }) {
  return (
    <FieldLabel htmlFor={id} className={cn("demo-field-label", fieldLabel)}>
      {Icon && <Icon size={16} strokeWidth={1.5} aria-hidden="true" />}
      <span>{label}</span>
    </FieldLabel>
  )
}

export function ScrollSurface({
  className,
  contentClassName,
  label,
  children,
}: ScrollSurfaceProps) {
  return (
    <ScrollArea
      className={cn("demo-scroll-surface", className)}
      contentClassName={contentClassName}
      viewportProps={{ role: label ? "region" : undefined, "aria-label": label }}
    >
      {children}
    </ScrollArea>
  )
}

export function SelectSetting(props: SelectSettingProps) {
  const id = React.useId()
  return (
    <Field orientation="horizontal" className={cn("demo-select", fieldRow)} title={props.title}>
      <SettingLabel {...props} id={id} />
      <Select
        items={props.options}
        value={props.value}
        onValueChange={(value) => {
          if (value !== null) props.onValueChange(value)
        }}
      >
        <SelectTrigger
          className={cn(
            fieldControl,
            "[&_svg]:size-3 [&_.demo-option-icon]:size-3.5 [&_.demo-placement-preview]:size-3.5 [&_.demo-distribution-preview]:h-3.5 [&_.demo-distribution-preview]:w-5",
          )}
          id={id}
          size="sm"
          aria-label={props.ariaLabel}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          className="demo-select-popup p-[3px]"
          align="end"
          alignItemWithTrigger={false}
        >
          {props.options.map((option) => (
            <SelectItem
              className="min-h-[26px] text-xs/5 data-highlighted:bg-muted"
              key={option.value}
              value={option.value}
              aria-label={option.text}
              label={
                option.text ?? (typeof option.label === "string" ? option.label : option.value)
              }
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

export function ToggleSetting(props: ToggleSettingProps) {
  const id = React.useId()
  return (
    <Field
      orientation="horizontal"
      className={cn(
        "demo-toggle",
        fieldRow,
        "cursor-pointer select-none grid-cols-[minmax(0,1fr)_auto]",
      )}
      title={props.title}
      onClick={(event) => {
        if (event.target === event.currentTarget) props.onCheckedChange(!props.checked)
      }}
    >
      <SettingLabel {...props} id={id} />
      <Switch
        className="cursor-pointer justify-self-end"
        id={id}
        size="sm"
        checked={props.checked}
        onCheckedChange={props.onCheckedChange}
        aria-label={props.ariaLabel}
      />
    </Field>
  )
}

export function RangeSetting(props: RangeSettingProps) {
  const id = React.useId()
  const [inputId, setInputId] = React.useState<string>()
  const attachInput = React.useCallback((input: HTMLInputElement | null) => {
    setInputId(input?.id)
  }, [])
  return (
    <Field orientation="horizontal" className={cn("demo-range", fieldRow)}>
      <SettingLabel {...props} id={inputId ?? id} />
      <Slider
        className="px-1"
        value={[props.value]}
        min={0}
        max={100}
        step={1}
        thumbProps={{
          inputRef: attachInput,
          "aria-label": props.ariaLabel ?? props.label,
          "aria-valuetext": `${props.value}%`,
        }}
        onValueChange={(value) => props.onValueChange(Array.isArray(value) ? value[0] : value)}
      />
    </Field>
  )
}

export function ColorSetting(props: ColorSettingProps) {
  const id = React.useId()
  return (
    <Field
      orientation="horizontal"
      className={cn("demo-color", fieldRow, "grid-cols-[minmax(0,1fr)_auto]")}
    >
      <SettingLabel {...props} id={id} />
      <Input
        id={id}
        className={colorControl}
        type="color"
        value={props.value}
        aria-label={props.ariaLabel}
        onChange={(event) => props.onValueChange(event.currentTarget.value)}
      />
    </Field>
  )
}

export function TimeInput({ value, onValueChange }: TimeInputProps) {
  return (
    <Field className={cn("demo-time", fieldRow)}>
      <Input
        className={cn(fieldControl, "col-start-2 select-text")}
        type="time"
        aria-label="Specified time"
        step={60}
        value={value}
        onChange={(event) => onValueChange(event.currentTarget.value)}
      />
    </Field>
  )
}

export function InspectorTabs({ value, onValueChange, sections }: InspectorTabsProps) {
  return (
    <TooltipProvider delay={200}>
      <Tabs
        value={value}
        onValueChange={(next) => onValueChange(String(next))}
        className={cn("demo-inspector-tabs", inspectorTabs)}
      >
        <div className={cn("demo-inspector-heading", inspectorHeading)}>
          <h2 className="m-0 shrink-0 text-xs/normal font-semibold">Inspector</h2>
          <TabsList
            variant="line"
            activateOnFocus
            className={cn("demo-state-tabs", inspectorTabList)}
            aria-label="Inspector sections"
          >
            {sections.map((section) => (
              <TabsTrigger className={inspectorTab} key={section.value} value={section.value}>
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {sections.map((section) => (
          <TabsContent
            key={section.value}
            value={section.value}
            keepMounted
            className={cn("demo-inspector-body", inspectorBody)}
            data-inspector-section={section.value}
          >
            <ScrollSurface
              className="demo-inspector-scroll flex-1"
              contentClassName={cn(
                "demo-inspector-content",
                inspectorContent,
                section.value === "bars" && "flex flex-col [&>.demo-toggle]:shrink-0",
                section.value === "states" && "flex h-full",
              )}
            >
              {section.content}
            </ScrollSurface>
          </TabsContent>
        ))}
      </Tabs>
    </TooltipProvider>
  )
}

export function IconHint({ label, children }: IconHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger className={cn("demo-corner-icon", cornerIcon)} aria-label={label}>
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
            className={cn("demo-overlay-pin", iconToggle)}
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
              className={cn("demo-inspector-toggle", iconToggle)}
              aria-label="Inspector"
              aria-expanded={open}
              aria-controls="demo-state-panel"
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
