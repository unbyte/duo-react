import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { measure, summarizeFrames } from '../src/benchmark/measure'

let callbacks: Map<number, FrameRequestCallback>
let documentMock: EventTarget & { hidden: boolean }
let windowMock: EventTarget
let nextId: number

beforeEach(() => {
  callbacks = new Map()
  nextId = 0
  documentMock = Object.assign(new EventTarget(), { hidden: false })
  windowMock = new EventTarget()
  vi.stubGlobal('document', documentMock)
  vi.stubGlobal('window', windowMock)
  vi.stubGlobal('PerformanceObserver', undefined)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callbacks.set(++nextId, callback)
    return nextId
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id))
})
afterEach(() => vi.unstubAllGlobals())

function frame(now: number) {
  const batch = [...callbacks.values()]
  callbacks.clear()
  for (const callback of batch) callback(now)
}
function options() {
  return {
    warmupMs: 100,
    durationMs: 100,
    signal: new AbortController().signal,
    onFrame: vi.fn(),
    onProgress: vi.fn(),
    validate: vi.fn(),
  }
}

test('summary uses nearest-rank percentile and a fixed 33.3 ms slow-frame threshold', () => {
  const values = [10, 20, 30, 40]
  expect(summarizeFrames(values, 100)).toEqual({
    frames: 4,
    elapsedMs: 100,
    fps: 40,
    meanMs: 25,
    p95Ms: 40,
    maxMs: 40,
    slowPercent: 25,
  })
  expect(values).toEqual([10, 20, 30, 40])
  expect(() => summarizeFrames([], 0)).toThrow('No animation frames')
})

test('warm-up gaps are excluded and the scripted workload restarts at sampling', async () => {
  const config = options()
  const pending = measure(config)
  for (const now of [1000, 1090, 1100, 1120, 1160, 1200]) frame(now)
  const result = await pending
  expect(result.frames).toBe(3)
  expect(result.elapsedMs).toBe(100)
  expect(result.fps).toBeCloseTo(30)
  expect(result.p95Ms).toBe(40)
  expect(result.longTasks).toBeNull()
  expect(result.blockingMs).toBeNull()
  expect(config.onFrame.mock.calls.map(([elapsed]) => elapsed)).toEqual([0, 90, 0, 20, 60, 100])
  expect(callbacks.size).toBe(0)
})

test.each(['abort', 'hidden', 'resize', 'backend'])(
  '%s interrupts measurement without returning a partial score',
  async (reason) => {
    const abort = new AbortController()
    const config = { ...options(), signal: abort.signal }
    const pending = measure(config)
    const rejected = expect(pending).rejects.toThrow()
    frame(0)
    frame(100)
    if (reason === 'abort') abort.abort()
    if (reason === 'hidden') {
      documentMock.hidden = true
      documentMock.dispatchEvent(new Event('visibilitychange'))
    }
    if (reason === 'resize') windowMock.dispatchEvent(new Event('resize'))
    if (reason === 'backend') {
      config.validate.mockImplementation(() => {
        throw new Error('Renderer changed')
      })
      frame(120)
    }
    await rejected
    expect(callbacks.size).toBe(0)
  },
)

test('long-task reporting excludes warm-up and counts only time above 50 ms as blocking', async () => {
  const disconnected = vi.fn()
  vi.stubGlobal(
    'PerformanceObserver',
    class {
      static supportedEntryTypes = ['longtask']
      observe() {}
      disconnect = disconnected
      takeRecords() {
        return [
          { startTime: 50, duration: 120 },
          { startTime: 110, duration: 80 },
          { startTime: 150, duration: 60 },
        ]
      }
    },
  )
  const pending = measure(options())
  for (const now of [0, 100, 120, 200]) frame(now)
  expect(await pending).toMatchObject({ longTasks: 2, blockingMs: 40 })
  expect(disconnected).toHaveBeenCalledOnce()
})
