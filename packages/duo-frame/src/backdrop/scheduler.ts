export function createCaptureScheduler<T>(capture: () => Promise<T>, publish: (value: T) => void) {
  let stopped = false
  let busy = false
  let dirty = false
  let generation = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastStart = -Infinity

  function invalidate(discardPending = false) {
    if (stopped) return
    if (discardPending) generation++
    dirty = true
    if (busy || timer !== undefined) return
    timer = setTimeout(
      () => {
        void run()
      },
      Math.max(0, 100 - (performance.now() - lastStart)),
    )
  }
  async function run() {
    timer = undefined
    busy = true
    dirty = false
    lastStart = performance.now()
    const started = generation
    try {
      const result = await capture()
      if (!stopped && generation === started) publish(result)
    } catch {
      // Keep the last completed image if a resource cannot be captured.
    } finally {
      busy = false
      if (dirty) invalidate()
    }
  }
  return {
    invalidate,
    stop() {
      stopped = true
      clearTimeout(timer)
    },
  }
}
