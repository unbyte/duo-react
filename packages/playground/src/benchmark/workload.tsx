import { DuoTabBar, useBars } from 'duo-react'
import { Bell, Bookmark, Compass, Grid2X2, Search } from 'lucide-react'
import * as React from 'react'

export type Scenario = 'still' | 'scroll' | 'motion'
export interface WorkloadHandle {
  advance: (elapsed: number) => void
}

const tabs = [
  { id: 'discover', label: 'Discover', icon: <Compass /> },
  { id: 'collections', label: 'Collections', icon: <Grid2X2 />, badge: '12' },
  { id: 'search', label: 'Search', icon: <Search /> },
  { id: 'saved', label: 'Saved', icon: <Bookmark />, badge: '3', selectedColor: '#bd5a2e' },
  { id: 'updates', label: 'Updates', icon: <Bell />, badge: '', selectedColor: '#7960ad' },
]
const places = [
  'Kyoto, after the rain',
  'A slower kind of Sunday',
  'Where the coast bends',
  'Notes from the highlands',
  'The city at blue hour',
  'Rooms with a view',
]
const categories = [
  'Architecture',
  'Travel journal',
  'Field notes',
  'Photography',
  'Design',
  'Slow living',
]
const barsRequest = { tabbar: {} } as const

function Landscape({ index }: { index: number }) {
  return (
    <svg
      viewBox="0 0 400 240"
      className="lab-landscape"
      role="img"
      aria-label={`Illustrated landscape ${index + 1}`}
    >
      <rect width="400" height="240" fill="var(--scene-sky)" />
      <circle cx={index % 2 ? 290 : 95} cy="68" r="33" fill="var(--scene-sun)" />
      <path d="M0 170 95 75 190 170 285 110 400 185V240H0Z" fill="var(--scene-back)" />
      <path d="M0 200Q100 100 215 185T400 160V240H0Z" fill="var(--scene-front)" />
      <path d="M0 220Q120 150 260 215T400 205V240H0Z" fill="var(--scene-ground)" />
      <path
        d="M120 240Q280 210 240 160"
        fill="none"
        stroke="var(--scene-sky)"
        strokeWidth="6"
        opacity=".5"
      />
    </svg>
  )
}

export const Workload = React.memo(
  React.forwardRef<WorkloadHandle, { count: number; scenario: Scenario; running: boolean }>(
    function Workload({ count, scenario, running }, ref) {
      const scroll = React.useRef<HTMLDivElement>(null)
      const counter = React.useRef<HTMLSpanElement>(null)
      const lastTab = React.useRef(-1)
      const [selected, setSelected] = React.useState('discover')
      const [saved, setSaved] = React.useState<ReadonlySet<number>>(() => new Set())
      const bars = useBars(barsRequest)
      const advance = React.useCallback(
        (elapsed: number) => {
          const node = scroll.current
          if (!node) return
          if (scenario !== 'still') {
            const limit = node.scrollHeight - node.clientHeight
            const distance = elapsed * 0.18
            node.scrollTop = limit > 0 ? limit - Math.abs((distance % (limit * 2)) - limit) : 0
          }
          if (scenario === 'motion') {
            node.style.setProperty('--lab-motion', String(Math.sin(elapsed / 800)))
            if (counter.current)
              counter.current.textContent = (2480 + Math.floor(elapsed / 250)).toLocaleString()
            const tab = Math.floor(elapsed / 2000) % tabs.length
            if (tab !== lastTab.current) {
              lastTab.current = tab
              setSelected(tabs[tab].id)
            }
          }
        },
        [scenario],
      )
      React.useImperativeHandle(ref, () => ({ advance }), [advance])
      React.useEffect(() => {
        lastTab.current = -1
        setSelected('discover')
        setSaved(new Set())
        if (scroll.current) {
          scroll.current.scrollTop = 0
          scroll.current.style.setProperty('--lab-motion', '0')
        }
        if (counter.current) counter.current.textContent = '2,480'
      }, [count, scenario, running])
      React.useEffect(() => {
        if (running || scenario === 'still') return
        let pending = 0
        let start: number | undefined
        const tick = (now: number) => {
          start ??= now
          advance(now - start)
          pending = requestAnimationFrame(tick)
        }
        pending = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(pending)
      }, [advance, running, scenario])
      return (
        <>
          <div ref={scroll} className="lab-feed" data-running={running}>
            <header className="lab-feed-header">
              <span className="lab-wordmark">
                elsewhere<span>®</span>
              </span>
              <span className="lab-issue">A journal for the curious · Issue 024</span>
              <span className="lab-avatar">JL</span>
            </header>
            <section className="lab-hero">
              <div className="lab-hero-copy">
                <span className="lab-eyebrow">THE ART OF PAYING ATTENTION</span>
                <h2>
                  Find a little
                  <br />
                  <em>unexpected.</em>
                </h2>
                <p>Places, people, and small discoveries worth slowing down for.</p>
                <span className="lab-editor-note">
                  CURATED BY JUNE LEE <span>↗</span>
                </span>
              </div>
              <div className="lab-hero-art">
                <Landscape index={0} />
                <span>
                  35° 40′ N<br />
                  139° 42′ E
                </span>
              </div>
            </section>
            <div className="lab-stats">
              <div>
                <span ref={counter}>2,480</span>
                <small>weekly readers</small>
              </div>
              <div>
                <span>36</span>
                <small>stories to explore</small>
              </div>
              <div className="lab-mini-chart" role="img" aria-label="Readership chart">
                {Array.from({ length: 18 }, (_, i) => (
                  <span
                    key={`bar-${i}`}
                    style={{
                      height: `${18 + ((i * 13) % 35)}px`,
                      transform: `scaleY(calc(1 + var(--lab-motion, 0) * ${i % 2 ? '.18' : '-.18'}))`,
                    }}
                  />
                ))}
              </div>
            </div>
            <section className="lab-stories">
              <div className="lab-section-heading">
                <h3>The latest dispatches</h3>
                <span>{count} stories · updated weekly</span>
              </div>
              <div className="lab-topics">
                <span>All stories</span>
                <span>Places</span>
                <span>People</span>
                <span>Objects</span>
                <span>Ideas</span>
              </div>
              <div className="lab-card-grid">
                {Array.from({ length: count }, (_, i) => (
                  <article className="lab-card" data-palette={i % 4} key={`story-${i}`}>
                    <div className="lab-card-art">
                      <Landscape index={i} />
                      <span className="lab-card-number">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <div className="lab-card-body">
                      <div className="lab-card-meta">
                        <span>{categories[i % categories.length]}</span>
                        <span>{4 + (i % 7)} min read</span>
                      </div>
                      <h4>{places[i % places.length]}</h4>
                      <p>
                        A closer look at the details that make an ordinary day feel a little
                        different.
                      </p>
                      <div className="lab-card-footer">
                        <span>
                          <span className="lab-author-dot" />{' '}
                          {['June Lee', 'Alex Martin', 'Sam Rivera'][i % 3]}
                        </span>
                        <button
                          type="button"
                          aria-label={`${saved.has(i) ? 'Unsave' : 'Save'} story ${i + 1}`}
                          aria-pressed={saved.has(i)}
                          onClick={() =>
                            setSaved((current) => {
                              const next = new Set(current)
                              if (next.has(i)) next.delete(i)
                              else next.add(i)
                              return next
                            })
                          }
                        >
                          <Bookmark size={17} fill={saved.has(i) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      <div className="lab-card-tags">
                        <span>Independent</span>
                        <span>Editor's pick</span>
                        <span>Vol. {(i % 9) + 1}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <footer className="lab-feed-footer">
              Take the scenic route. <span>elsewhere®</span>
            </footer>
          </div>
          <DuoTabBar
            layout={bars.tabbar}
            items={tabs}
            selectedId={selected}
            onSelect={setSelected}
          />
        </>
      )
    },
  ),
)
