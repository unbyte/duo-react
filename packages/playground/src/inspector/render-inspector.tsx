import type { DuoRenderingMode } from 'duo-react'
import * as React from 'react'
import { SelectSetting, ToggleSetting } from '../components/setting-fields'
import { type FrameMetrics, sampleFrames } from './frame-sampler'

const modes = [
  { value: 'enhanced', label: 'Enhanced' },
  { value: 'basic', label: 'Basic' },
] as const

function milliseconds(value?: number) {
  return value === undefined ? '—' : `${value.toFixed(1)} ms`
}

export function RenderInspector({
  active,
  mode,
  onModeChange,
}: {
  active: boolean
  mode: DuoRenderingMode
  onModeChange: (mode: DuoRenderingMode) => void
}) {
  const [sampling, setSampling] = React.useState(false)
  const [snapshot, setSnapshot] = React.useState<{
    mode: DuoRenderingMode
    metrics: FrameMetrics
  }>()
  React.useEffect(() => {
    if (!active || !sampling) return
    return sampleFrames((metrics) => setSnapshot({ mode, metrics }))
  }, [active, sampling, mode])
  const metrics = snapshot?.mode === mode ? snapshot.metrics : undefined
  const rows = [
    ['Frame rate', metrics?.fps === undefined ? '—' : `${metrics.fps.toFixed(1)} fps`],
    ['Latest interval', milliseconds(metrics?.latestInterval)],
    ['Mean interval', milliseconds(metrics?.meanInterval)],
    ['95th percentile', milliseconds(metrics?.p95Interval)],
    ['Longest interval', milliseconds(metrics?.maxInterval)],
    ['Samples', metrics?.samples.toLocaleString() ?? '—'],
  ]
  return (
    <div className="grid gap-4">
      <section aria-label="Rendering configuration">
        <SelectSetting
          label="Mode"
          hint="Applies to system UI and tab bars. Enhanced uses sampled materials and liquid glass. Basic uses CSS contrast, blur, and simple tab selection."
          ariaLabel="Rendering mode"
          value={mode}
          options={modes}
          onValueChange={(value) => {
            if (value === 'enhanced' || value === 'basic') onModeChange(value)
          }}
        />
      </section>
      <section className="border-t border-border pt-3" aria-label="Frame performance">
        <ToggleSetting
          label="Sample frames"
          hint="Measures whole-page frame spacing over the last five seconds, not rendering or GPU cost. Updates twice a second and pauses when this panel or page is hidden. Changing modes resets the sample."
          checked={sampling}
          onCheckedChange={setSampling}
        />
        <dl className="mt-3 mb-0 grid gap-2 text-xs">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="m-0 tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
