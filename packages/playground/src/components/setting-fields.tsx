import type { TablerIcon } from '@tabler/icons-react'
import { cn } from 'cn'
import type { LucideIcon } from 'lucide-react'
import * as React from 'react'
import { Field, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Slider } from './ui/slider'
import { Switch } from './ui/switch'

interface SettingProps {
  icon?: LucideIcon | TablerIcon
  label: string
  ariaLabel?: string
  title?: string
}

interface SelectSettingProps extends SettingProps {
  value: string
  options: readonly { value: string; label: React.ReactNode; text?: string }[]
  onValueChange: (value: string) => void
}

interface ToggleSettingProps extends SettingProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

interface RangeSettingProps extends SettingProps {
  value: number
  onValueChange: (value: number) => void
}

interface ColorSettingProps extends SettingProps {
  value: string
  onValueChange: (value: string) => void
}

interface TimeInputProps {
  value: string
  onValueChange: (value: string) => void
}

const fieldRow =
  'grid min-h-[30px] min-w-0 grid-cols-[minmax(0,1fr)_124px] items-center gap-2 text-xs/normal font-medium text-[#526174]'
const fieldLabel =
  'flex min-w-0 items-center gap-2 text-xs/normal font-medium leading-[1.35] [&>svg]:shrink-0 [&>svg]:text-[#8390a0]'
const fieldControl =
  'box-border h-7 w-full min-w-0 cursor-pointer rounded-md border border-input bg-background px-2 py-0 text-xs/5 text-foreground'
const colorControl =
  'h-7 w-9 cursor-pointer justify-self-end rounded-md border border-input bg-background p-[3px] [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-[3px] [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-[3px] [&::-moz-color-swatch]:border-0'

function SettingLabel({ icon: Icon, label, id }: SettingProps & { id: string }) {
  return (
    <FieldLabel htmlFor={id} className={cn('playground-field-label', fieldLabel)}>
      {Icon && <Icon size={16} strokeWidth={1.5} aria-hidden="true" />}
      <span>{label}</span>
    </FieldLabel>
  )
}

export function SelectSetting(props: SelectSettingProps) {
  const id = React.useId()
  return (
    <Field
      orientation="horizontal"
      className={cn('playground-select', fieldRow)}
      title={props.title}
    >
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
            '[&_svg]:size-3 [&_.playground-option-icon]:size-3.5 [&_.playground-placement-preview]:size-3.5 [&_.playground-distribution-preview]:h-3.5 [&_.playground-distribution-preview]:w-5',
          )}
          id={id}
          size="sm"
          aria-label={props.ariaLabel}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          className="playground-select-popup p-[3px]"
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
                option.text ?? (typeof option.label === 'string' ? option.label : option.value)
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
        'playground-toggle',
        fieldRow,
        'cursor-pointer select-none grid-cols-[minmax(0,1fr)_auto]',
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
    <Field orientation="horizontal" className={cn('playground-range', fieldRow)}>
      <SettingLabel {...props} id={inputId ?? id} />
      <Slider
        className="px-1"
        value={[props.value]}
        min={0}
        max={100}
        step={1}
        thumbProps={{
          inputRef: attachInput,
          'aria-label': props.ariaLabel ?? props.label,
          'aria-valuetext': `${props.value}%`,
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
      className={cn('playground-color', fieldRow, 'grid-cols-[minmax(0,1fr)_auto]')}
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
    <Field className={cn('playground-time', fieldRow)}>
      <Input
        className={cn(
          fieldControl,
          'col-start-2 cursor-text appearance-none select-text tabular-nums md:text-xs [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none',
        )}
        type="time"
        aria-label="Specified time"
        step={60}
        value={value}
        onChange={(event) => onValueChange(event.currentTarget.value)}
      />
    </Field>
  )
}
