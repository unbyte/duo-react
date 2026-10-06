import { cn } from 'cn'
import * as React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export function CopyableNumber({
  value,
  label,
  className,
}: {
  value: number
  label: string
  className?: string
}) {
  const text = String(Number(value.toFixed(2)))
  const triggerId = React.useId()
  const [feedback, setFeedback] = React.useState({ message: 'Copied', open: false })

  const close = () => setFeedback((current) => ({ ...current, open: false }))

  React.useEffect(() => {
    if (!feedback.open) return
    const timeout = window.setTimeout(
      () => setFeedback((current) => ({ ...current, open: false })),
      1200,
    )
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setFeedback({ message: 'Copied', open: true })
    } catch {
      setFeedback({ message: 'Copy failed', open: true })
    }
  }

  return (
    <Tooltip
      open={feedback.open}
      triggerId={triggerId}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <TooltipTrigger
        id={triggerId}
        type="button"
        closeOnClick={false}
        aria-label={`Copy ${label.toLowerCase()}: ${text}`}
        aria-describedby={feedback.open ? `${triggerId}-feedback` : undefined}
        className={cn(
          'inline cursor-pointer border-0 bg-transparent p-0 text-inherit tabular-nums transition-colors hover:text-primary data-popup-open:text-primary motion-reduce:transition-none',
          className,
        )}
        onClick={() => void copy()}
      >
        {text}
      </TooltipTrigger>
      <TooltipContent
        id={`${triggerId}-feedback`}
        role="tooltip"
        className="px-2 py-1 text-[11px]"
        aria-live="polite"
      >
        {feedback.message}
      </TooltipContent>
    </Tooltip>
  )
}
