import {
  DuoFrame,
  type DuoOrientation,
  DuoProvider,
  type DuoRenderer,
  type DuoRenderingMode,
  useDuoActions,
} from 'duo-react'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  Check,
  FlaskConical,
  Play,
  Square,
} from 'lucide-react'
import * as React from 'react'
import { type Measurement, measure, type Progress } from './measure'
import { type Scenario, Workload, type WorkloadHandle } from './workload'

const modes = [
  {
    id: 'dom',
    name: 'DOM capture',
    detail: 'SnapDOM + glass',
    renderer: 'dom',
    effects: 'enhanced',
    number: '01',
  },
  {
    id: 'native',
    name: 'HTML-in-canvas',
    detail: 'Native pixels + glass',
    renderer: 'html-in-canvas',
    effects: 'enhanced',
    number: '02',
  },
  {
    id: 'basic',
    name: 'Basic CSS',
    detail: 'CSS blur + selection',
    renderer: 'dom',
    effects: 'basic',
    number: '03',
  },
] as const satisfies readonly {
  id: string
  name: string
  detail: string
  renderer: DuoRenderer
  effects: DuoRenderingMode
  number: string
}[]
type Mode = (typeof modes)[number]
interface RunConfig {
  readonly cards: number
  readonly scenario: Scenario
  readonly orientation: DuoOrientation
  readonly durationMs: number
}
interface Result extends RunConfig {
  readonly id: number
  readonly mode: Mode['id']
  readonly backend: string
  readonly status: 'complete' | 'unavailable'
  readonly metrics?: Measurement
  readonly recordedAt: string
  readonly viewport: { width: number; height: number; dpr: number }
  readonly display: { width: number; height: number }
  readonly domNodes: number
}
const warmupMs = 2000
const format = (value: number | undefined | null, suffix = '') =>
  value == null ? '—' : `${value.toFixed(1)}${suffix}`

function settleRenderer(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    let pending = 0
    const abort = () => {
      cancelAnimationFrame(pending)
      signal.removeEventListener('abort', abort)
      reject(signal.reason)
    }
    signal.addEventListener('abort', abort)
    if (signal.aborted) abort()
    else
      pending = requestAnimationFrame(() => {
        pending = requestAnimationFrame(() => {
          signal.removeEventListener('abort', abort)
          resolve()
        })
      })
  })
}

function Orientation({ value }: { value: DuoOrientation }) {
  const actions = useDuoActions()
  React.useLayoutEffect(() => actions.setOrientation(value), [actions, value])
  return null
}

export function Benchmark() {
  const [mode, setMode] = React.useState<Mode>(modes[0])
  const [config, setConfig] = React.useState<RunConfig>({
    cards: 36,
    scenario: 'motion',
    orientation: 'landscape-left',
    durationMs: 10000,
  })
  const [running, setRunning] = React.useState(false)
  const [progress, setProgress] = React.useState<Progress>()
  const [notice, setNotice] = React.useState(
    'Ready when you are. Explore the page, then record a run.',
  )
  const [backend, setBackend] = React.useState('detecting')
  const [results, setResults] = React.useState<readonly Result[]>([])
  const frame = React.useRef<HTMLDivElement>(null)
  const workload = React.useRef<WorkloadHandle>(null)
  const controller = React.useRef<AbortController | undefined>(undefined)
  const nextId = React.useRef(1)
  const mounted = React.useRef(true)

  React.useEffect(() => {
    mounted.current = true
    const node = frame.current!
    const update = () =>
      setBackend(
        node.querySelector<HTMLElement>('.duo-react-display')?.dataset.duoReactRenderer ??
          'detecting',
      )
    const observer = new MutationObserver(update)
    observer.observe(node, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-duo-react-renderer'],
    })
    update()
    return () => {
      mounted.current = false
      controller.current?.abort()
      observer.disconnect()
    }
  }, [])

  async function run(all: boolean) {
    if (controller.current) return
    const abort = new AbortController()
    controller.current = abort
    frame.current?.scrollIntoView({ block: 'center', behavior: 'instant' })
    const hidden = () => {
      if (document.hidden) abort.abort(new Error('Run interrupted: keep this tab visible.'))
    }
    const resized = () => abort.abort(new Error('Run interrupted: the viewport changed.'))
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('resize', resized)
    setRunning(true)
    setProgress(undefined)
    const index = modes.indexOf(mode)
    const queue = all ? [...modes.slice(index), ...modes.slice(0, index)] : [mode]
    try {
      await document.fonts.ready
      for (const candidate of queue) {
        if (abort.signal.aborted) throw new Error('Run cancelled. No partial result was saved.')
        setMode(candidate)
        setNotice(`${candidate.name}: preparing the same workload.`)
        // Allow the provider's layout effects and native capability detection to settle.
        await settleRenderer(abort.signal)
        if (abort.signal.aborted) throw new Error('Run cancelled. No partial result was saved.')
        const actual = () =>
          frame.current?.querySelector<HTMLElement>('.duo-react-display')?.dataset
            .duoReactRenderer ?? 'missing'
        const expected = candidate.id === 'native' ? 'html-in-canvas' : 'dom'
        const display = frame.current!.querySelector<HTMLElement>('.duo-react-display')!
        const metadata = {
          ...config,
          id: nextId.current++,
          mode: candidate.id,
          backend: actual(),
          recordedAt: new Date().toISOString(),
          viewport: { width: window.innerWidth, height: window.innerHeight, dpr: devicePixelRatio },
          display: { width: display.offsetWidth, height: display.offsetHeight },
          domNodes: frame.current!.querySelector('.lab-feed')!.querySelectorAll('*').length,
        }
        if (candidate.id === 'native' && actual() !== expected) {
          setResults((current) => [...current, { ...metadata, status: 'unavailable' }])
          setNotice('Native API unavailable. DOM fallback was not recorded as a native result.')
          continue
        }
        const metrics = await measure({
          warmupMs,
          durationMs: config.durationMs,
          signal: abort.signal,
          onFrame: (elapsed) => workload.current?.advance(elapsed),
          onProgress: setProgress,
          validate: () => {
            if (actual() !== expected)
              throw new Error(
                `${candidate.name} changed renderer during the run. No partial result was saved.`,
              )
          },
        })
        if (mounted.current)
          setResults((current) => [...current, { ...metadata, status: 'complete', metrics }])
      }
      if (mounted.current)
        setNotice('Finished. Results stay below so you can compare repeated runs.')
    } catch (error) {
      if (mounted.current)
        setNotice(
          error instanceof Error
            ? error.name === 'AbortError'
              ? 'Run cancelled. No partial result was saved.'
              : error.message
            : 'The run could not finish.',
        )
    } finally {
      document.removeEventListener('visibilitychange', hidden)
      window.removeEventListener('resize', resized)
      controller.current = undefined
      if (mounted.current) {
        setRunning(false)
        setProgress(undefined)
      }
    }
  }

  function download() {
    const data = {
      version: 1,
      userAgent: navigator.userAgent,
      build: import.meta.env.DEV ? 'development' : 'production',
      warmupMs,
      frameThresholdMs: 1000 / 30,
      measurement:
        'Whole-page requestAnimationFrame intervals; long-task blocking time sums duration beyond 50 ms. Not GPU or isolated renderer timing.',
      results,
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'duo-tab-bar-benchmark.json'
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const latest = results.findLast((result) => result.status === 'complete')?.metrics
  const nativeFallback = mode.id === 'native' && backend === 'dom'
  return (
    <main className="lab">
      <header className="lab-header">
        <a href="/" className="lab-brand">
          <span className="lab-brand-symbol">d.</span> duo react{' '}
          <span className="lab-brand-divider" /> <span>Experiments</span>
        </a>
        <a className="lab-back" href="/">
          <ArrowLeft size={15} /> Playground
        </a>
      </header>
      <div className="lab-intro">
        <div>
          <span className="lab-kicker">
            <FlaskConical size={14} /> EXPERIMENT 01 / RENDERING
          </span>
          <h1>Behind the glass.</h1>
          <p>A busy page. The same tab bar. Three ways to render it.</p>
        </div>
        <div className="lab-build">
          <span className="lab-status-dot" />{' '}
          {import.meta.env.DEV ? 'Development build' : 'Production build'}
          <small>For comparable numbers, use a production build.</small>
        </div>
      </div>
      <div className="lab-layout">
        <section className="lab-preview" aria-label="Benchmark preview" inert={running}>
          <div className="lab-preview-heading">
            <span>
              <span className="lab-live-dot" /> LIVE SPECIMEN
            </span>
            <span>{config.cards} cards · 5 tabs · local assets</span>
          </div>
          <DuoProvider
            defaultState={{ orientation: 'landscape-left' }}
            defaultSystem={{ time: '09:41' }}
            rendering={{ renderer: mode.renderer, system: mode.effects, tabBar: mode.effects }}
          >
            <Orientation value={config.orientation} />
            <DuoFrame ref={frame} fitPadding={22} showSystemUI={false} className="lab-device">
              <Workload
                ref={workload}
                count={config.cards}
                scenario={config.scenario}
                running={running}
              />
            </DuoFrame>
          </DuoProvider>
          <div className="lab-preview-footer">
            <span>
              Actual renderer{' '}
              <strong data-lab-backend={backend}>
                {backend === 'html-in-canvas'
                  ? 'HTML-in-canvas'
                  : backend === 'dom'
                    ? 'DOM'
                    : 'Detecting…'}
                {nativeFallback ? ' · fallback' : ''}
              </strong>
            </span>
            <span>
              {config.orientation === 'portrait' ? 'Bottom tab bar' : 'Side tab bar'}{' '}
              <ArrowUpRight size={14} />
            </span>
          </div>
        </section>
        <aside className="lab-controls" aria-label="Benchmark controls">
          <fieldset disabled={running} className="lab-fieldset">
            <legend>
              01 <span>Choose a renderer</span>
            </legend>
            <div className="lab-mode-list">
              {modes.map((candidate) => (
                <label
                  key={candidate.id}
                  className="lab-mode"
                  data-selected={candidate.id === mode.id}
                >
                  <input
                    type="radio"
                    name="renderer"
                    value={candidate.id}
                    checked={candidate.id === mode.id}
                    onChange={() => setMode(candidate)}
                  />
                  <span className="lab-mode-number">{candidate.number}</span>
                  <span>
                    <strong>{candidate.name}</strong>
                    <small>{candidate.detail}</small>
                  </span>
                  {candidate.id === mode.id && <Check size={16} />}
                </label>
              ))}
            </div>
          </fieldset>
          {nativeFallback && (
            <p className="lab-warning">
              This browser falls back to DOM. Enable experimental web platform features in a
              supporting Chromium build to measure native rendering.
            </p>
          )}
          <fieldset disabled={running} className="lab-fieldset">
            <legend>
              02 <span>Set the workload</span>
            </legend>
            <label className="lab-select">
              Complexity
              <select
                value={config.cards}
                onChange={(event) => setConfig({ ...config, cards: Number(event.target.value) })}
              >
                <option value={12}>Light · 12 cards</option>
                <option value={36}>Medium · 36 cards</option>
                <option value={96}>Heavy · 96 cards</option>
              </select>
            </label>
            <label className="lab-select">
              Scenario
              <select
                value={config.scenario}
                onChange={(event) =>
                  setConfig({ ...config, scenario: event.target.value as Scenario })
                }
              >
                <option value="still">Still page</option>
                <option value="scroll">Auto scroll</option>
                <option value="motion">Scroll + motion + tab changes</option>
              </select>
            </label>
            <div className="lab-select-row">
              <label className="lab-select">
                Layout
                <select
                  value={config.orientation}
                  onChange={(event) =>
                    setConfig({ ...config, orientation: event.target.value as DuoOrientation })
                  }
                >
                  <option value="landscape-left">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </label>
              <label className="lab-select">
                Sample length
                <select
                  value={config.durationMs}
                  onChange={(event) =>
                    setConfig({ ...config, durationMs: Number(event.target.value) })
                  }
                >
                  <option value={10000}>10 seconds</option>
                  <option value={20000}>20 seconds</option>
                  <option value={30000}>30 seconds</option>
                </select>
              </label>
            </div>
          </fieldset>
          <div className="lab-run-actions">
            {running ? (
              <button
                type="button"
                className="lab-primary"
                onClick={() => controller.current?.abort()}
              >
                <Square size={14} /> Stop run
              </button>
            ) : (
              <button
                type="button"
                className="lab-primary"
                onClick={() => {
                  void run(false)
                }}
              >
                <Play size={14} /> Record this renderer
              </button>
            )}
            <button
              type="button"
              className="lab-secondary"
              disabled={running}
              onClick={() => {
                void run(true)
              }}
            >
              Compare all three
            </button>
          </div>
          <div className="lab-run-status" role="status">
            {progress ? (
              <>
                <strong>
                  {mode.name} · {progress.phase === 'warmup' ? 'Warming up' : 'Measuring'}
                </strong>
                <span>{Math.ceil(progress.remainingMs / 1000)} seconds remaining</span>
                <progress
                  max={progress.phase === 'warmup' ? warmupMs : config.durationMs}
                  value={
                    (progress.phase === 'warmup' ? warmupMs : config.durationMs) -
                    progress.remainingMs
                  }
                  aria-label="Run progress"
                />
              </>
            ) : (
              notice
            )}
          </div>
          <p className="lab-protocol">
            2 s warm-up, then a fresh scripted sequence. One renderer at a time. Keep this tab
            visible and avoid interacting during a run.
          </p>
        </aside>
      </div>
      <section className="lab-results" aria-label="Recorded results">
        <div className="lab-results-heading">
          <div>
            <span className="lab-kicker">THE NUMBERS</span>
            <h2>Compare the experience.</h2>
          </div>
          <div className="lab-result-actions">
            <button type="button" disabled={!results.length || running} onClick={download}>
              <ArrowDownToLine size={15} /> Export JSON
            </button>
            <button
              type="button"
              disabled={!results.length || running}
              onClick={() => setResults([])}
            >
              Clear
            </button>
          </div>
        </div>
        <div className="lab-summary">
          <div>
            <small>AVERAGE FRAME RATE</small>
            <strong>
              {format(latest?.fps)}
              <span> fps</span>
            </strong>
          </div>
          <div>
            <small>95TH PERCENTILE FRAME</small>
            <strong>
              {format(latest?.p95Ms)}
              <span> ms</span>
            </strong>
          </div>
          <div>
            <small>FRAMES OVER 33.3 MS</small>
            <strong>
              {format(latest?.slowPercent)}
              <span> %</span>
            </strong>
          </div>
          <div>
            <small>LONG-TASK BLOCKING TIME</small>
            <strong>
              {format(latest?.blockingMs)}
              <span> ms</span>
            </strong>
          </div>
        </div>
        <p className="lab-summary-label">
          Latest completed run. Frame timing covers the whole page, including the workload and glass
          effects.
        </p>
        <div className="lab-table-wrap">
          <table>
            <caption className="lab-sr-only">Saved benchmark runs</caption>
            <thead>
              <tr>
                <th>Run / renderer</th>
                <th>Workload</th>
                <th>Actual backend</th>
                <th>FPS ↑</th>
                <th>P95 ms ↓</th>
                <th>&gt;33 ms ↓</th>
                <th>Long tasks</th>
                <th>Blocking ms ↓</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td>
                    <span className="lab-run-number">{String(result.id).padStart(2, '0')}</span>
                    {modes.find((candidate) => candidate.id === result.mode)?.name}
                  </td>
                  <td>
                    {result.cards} cards · {result.scenario}
                    <small>
                      {result.orientation === 'portrait' ? 'Portrait' : 'Landscape'} ·{' '}
                      {result.durationMs / 1000}s · {result.domNodes.toLocaleString()} nodes · DPR{' '}
                      {result.viewport.dpr}
                    </small>
                  </td>
                  <td>
                    {result.status === 'unavailable' ? 'Skipped: DOM fallback' : result.backend}
                  </td>
                  <td>{format(result.metrics?.fps)}</td>
                  <td>{format(result.metrics?.p95Ms)}</td>
                  <td>{format(result.metrics?.slowPercent, '%')}</td>
                  <td>{result.metrics?.longTasks ?? '—'}</td>
                  <td>{format(result.metrics?.blockingMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!results.length && (
            <div className="lab-empty">
              <span>01 → 02 → 03</span>
              <p>Your comparison starts here.</p>
              <small>Record a renderer or run all three with the same workload.</small>
            </div>
          )}
        </div>
        <div className="lab-notes">
          <p>
            <strong>What this measures.</strong> Animation-frame cadence and main-thread long tasks.
            Blocking time is the portion of each long task beyond 50 ms. A dash means unavailable.
            These are not GPU timings or isolated tab-bar timings; a smooth result can still have a
            stale backdrop.
          </p>
          <p>
            <strong>Keep comparisons fair.</strong> Use the same workload, layout, viewport, and
            display refresh rate. Repeat runs; “Compare all” starts with the selected renderer.
            Basic CSS is a cheaper visual baseline, without the enhanced lens. Inspect scrolling and
            glass quality alongside the numbers.
          </p>
        </div>
      </section>
      <footer className="lab-page-footer">
        <span>Duo React / Rendering experiments</span>
        <a href="https://github.com/unbyte/duo-react">
          View source <ArrowUpRight size={13} />
        </a>
      </footer>
    </main>
  )
}
