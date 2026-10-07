export interface FrameMetrics {
  readonly samples: number
  readonly fps?: number
  readonly latestInterval?: number
  readonly meanInterval?: number
  readonly p95Interval?: number
  readonly maxInterval?: number
}

interface TimedSample {
  readonly end: number
  readonly duration: number
}

const windowDuration = 5000
const updateInterval = 500

export function sampleFrames(onSample: (metrics: FrameMetrics) => void) {
  let intervals: TimedSample[] = []
  let previous: number | undefined
  let published = 0
  let pending = 0
  let stopped = false

  function publish(now: number) {
    intervals = intervals.filter((sample) => sample.end > now - windowDuration)
    const durations = intervals.map((sample) => sample.duration).sort((a, b) => a - b)
    const mean = durations.length
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : undefined
    onSample({
      samples: durations.length,
      fps: mean === undefined ? undefined : 1000 / mean,
      latestInterval: intervals.at(-1)?.duration,
      meanInterval: mean,
      p95Interval: durations[Math.ceil(durations.length * 0.95) - 1],
      maxInterval: durations.at(-1),
    })
    published = now
  }

  function tick(now: number) {
    if (stopped || document.hidden) return
    if (previous !== undefined && now > previous)
      intervals.push({ end: now, duration: now - previous })
    previous = now
    if (now - published >= updateInterval) publish(now)
    pending = requestAnimationFrame(tick)
  }

  function resume() {
    cancelAnimationFrame(pending)
    intervals = []
    previous = undefined
    if (!document.hidden) pending = requestAnimationFrame(tick)
    publish(performance.now())
  }

  document.addEventListener('visibilitychange', resume)
  resume()
  return () => {
    stopped = true
    cancelAnimationFrame(pending)
    document.removeEventListener('visibilitychange', resume)
  }
}
