import { type DuoRenderer, type DuoRenderingMode, supportsCanvasRenderer } from 'duo-react'
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
  renderer,
  onRendererChange,
  mode,
  onModeChange,
}: {
  active: boolean
  renderer: DuoRenderer
  onRendererChange: (renderer: DuoRenderer) => void
  mode: DuoRenderingMode
  onModeChange: (mode: DuoRenderingMode) => void
}) {
  const [canvasSupported] = React.useState(supportsCanvasRenderer)
  const [sampling, setSampling] = React.useState(false)
  const [snapshot, setSnapshot] = React.useState<{
    renderer: DuoRenderer
    mode: DuoRenderingMode
    metrics: FrameMetrics
  }>()
  React.useEffect(() => {
    setSnapshot(undefined)
    if (!active || !sampling) return
    return sampleFrames((metrics) => setSnapshot({ renderer, mode, metrics }))
  }, [active, sampling, renderer, mode])
  const metrics =
    snapshot?.renderer === renderer && snapshot.mode === mode ? snapshot.metrics : undefined
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
      <section className="grid gap-2" aria-label="Rendering configuration">
        <SelectSetting
          label="Renderer"
          hint="Chooses how app content is drawn. Auto uses Canvas when supported, with DOM as the fallback. Switching between Canvas and DOM remounts the app."
          ariaLabel="Content renderer"
          value={renderer}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'canvas', label: 'Canvas', disabled: !canvasSupported },
            { value: 'dom', label: 'DOM' },
          ]}
          onValueChange={(value) => {
            if (value === 'auto' || value === 'canvas' || value === 'dom') onRendererChange(value)
          }}
        />
        {!canvasSupported && (
          <p className="m-0 text-xs text-muted-foreground">
            Canvas requires HTML-in-Canvas support in this browser.
          </p>
        )}
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
          hint="Measures whole-page frame spacing over the last five seconds, not rendering or GPU cost. Updates twice a second and pauses when this panel or page is hidden. Changing the renderer or mode resets the sample."
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
