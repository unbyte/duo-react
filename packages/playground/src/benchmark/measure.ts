export interface Measurement {
  readonly frames: number
  readonly elapsedMs: number
  readonly fps: number
  readonly meanMs: number
  readonly p95Ms: number
  readonly maxMs: number
  readonly slowPercent: number
  readonly longTasks: number | null
  readonly blockingMs: number | null
}

export function summarizeFrames(intervals: readonly number[], elapsedMs: number) {
  if (!intervals.length) throw new Error('No animation frames were measured.')
  const sorted = [...intervals].sort((a, b) => a - b)
  const meanMs = intervals.reduce((sum, value) => sum + value, 0) / intervals.length
  return {
    frames: intervals.length,
    elapsedMs,
    fps: 1000 / meanMs,
    meanMs,
    p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1],
    maxMs: sorted[sorted.length - 1],
    slowPercent: (intervals.filter((value) => value > 1000 / 30).length / intervals.length) * 100,
  }
}

export interface Progress {
  readonly phase: 'warmup' | 'measuring'
  readonly remainingMs: number
}

/** Whole-page rAF cadence and long tasks, not GPU timing or isolated renderer cost. */
export function measure({
  warmupMs,
  durationMs,
  signal,
  onFrame,
  onProgress,
  validate,
}: {
  warmupMs: number
  durationMs: number
  signal: AbortSignal
  onFrame: (elapsedMs: number) => void
  onProgress: (progress: Progress) => void
  validate: () => void
}): Promise<Measurement> {
  return new Promise((resolve, reject) => {
    let pending = 0
    let started: number | undefined
    let measuring: number | undefined
    let previous = 0
    let published = -Infinity
    const intervals: number[] = []
    const tasks: PerformanceEntry[] = []
    let observer: PerformanceObserver | undefined
    let done = false
    try {
      if (
        typeof PerformanceObserver !== 'undefined' &&
        PerformanceObserver.supportedEntryTypes.includes('longtask')
      ) {
        observer = new PerformanceObserver((list) => tasks.push(...list.getEntries()))
        observer.observe({ type: 'longtask' })
      }
    } catch {
      observer = undefined
    }

    function cleanup() {
      done = true
      cancelAnimationFrame(pending)
      observer?.disconnect()
      signal.removeEventListener('abort', abort)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('resize', resize)
    }
    function fail(error: unknown) {
      if (done) return
      cleanup()
      reject(error)
    }
    function abort() {
      fail(
        signal.reason instanceof Error && signal.reason.name !== 'AbortError'
          ? signal.reason
          : new Error('Run cancelled. No partial result was saved.'),
      )
    }
    function visibility() {
      if (document.hidden) fail(new Error('Run interrupted: keep this tab visible.'))
    }
    function resize() {
      fail(new Error('Run interrupted: the viewport changed.'))
    }

    function tick(now: number) {
      if (done) return
      try {
        validate()
        started ??= now
        const elapsed = now - started
        // Reset the scripted workload when sampling starts, after warming resources.
        if (measuring === undefined && elapsed >= warmupMs) {
          measuring = now
          previous = now
        } else if (measuring !== undefined) {
          intervals.push(now - previous)
          previous = now
        }
        const phase = measuring === undefined ? 'warmup' : 'measuring'
        const phaseElapsed = measuring === undefined ? elapsed : now - measuring
        const remainingMs = Math.max(0, (phase === 'warmup' ? warmupMs : durationMs) - phaseElapsed)
        onFrame(phaseElapsed)
        if (now - published >= 250) {
          onProgress({ phase, remainingMs })
          published = now
        }
        if (measuring !== undefined && phaseElapsed >= durationMs) {
          if (observer) tasks.push(...observer.takeRecords())
          // Exclude tasks that began in warm-up, even if delivered after it.
          const sampleStart = measuring
          const measuredTasks = tasks.filter(
            (task) => task.startTime >= sampleStart && task.startTime < now,
          )
          const result: Measurement = {
            ...summarizeFrames(intervals, phaseElapsed),
            longTasks: observer ? measuredTasks.length : null,
            blockingMs: observer
              ? measuredTasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0)
              : null,
          }
          cleanup()
          resolve(result)
          return
        }
        pending = requestAnimationFrame(tick)
      } catch (error) {
        fail(error)
      }
    }

    signal.addEventListener('abort', abort)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('resize', resize)
    if (signal.aborted) abort()
    else if (document.hidden) visibility()
    else pending = requestAnimationFrame(tick)
  })
}
