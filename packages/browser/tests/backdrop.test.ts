import { snapdom } from '@zumer/snapdom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { paddedRegion, samePixels } from '../src/backdrop/image'
import { BackdropStore } from '../src/backdrop/store'

vi.mock('@zumer/snapdom', () => ({ snapdom: { toCanvas: vi.fn() } }))

function canvas(value = 255) {
  return {
    width: 1,
    height: 1,
    getContext: () => ({
      getImageData: () => ({ width: 1, data: new Uint8ClampedArray([value, value, value, 255]) }),
      createImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: vi.fn(),
    }),
  } as unknown as HTMLCanvasElement
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(snapdom.toCanvas).mockReset().mockResolvedValue(canvas())
  vi.stubGlobal(
    'document',
    Object.assign(new EventTarget(), { hidden: false, createElement: () => canvas() }),
  )
  class Observer {
    observe() {}
    disconnect() {}
  }
  vi.stubGlobal('MutationObserver', Observer)
  vi.stubGlobal('ResizeObserver', Observer)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

test('blur padding rounds outward and clips to the display', () => {
  const size = { width: 669, height: 951 }
  const tab = paddedRegion({ x: 592.5, y: 700, width: 48, height: 162 }, 18, size)!
  const status = paddedRegion({ x: 590, y: 30, width: 50, height: 70 }, 36, size)!
  expect(tab).toEqual({ x: 574, y: 682, width: 85, height: 198 })
  expect(status).toEqual({ x: 554, y: 0, width: 115, height: 136 })
  expect(paddedRegion({ x: 800, y: 0, width: 10, height: 10 }, 0, size)).toBeUndefined()
})

test('pixel comparison notices alpha changes and differences at the end of the region', () => {
  const pixels = new Uint8ClampedArray([0, 1, 2, 255, 3, 4, 5, 255])
  expect(samePixels(pixels, pixels.slice())).toBe(true)
  const changed = pixels.slice()
  changed[7] = 254
  expect(samePixels(pixels, changed)).toBe(false)
  expect(samePixels(pixels, pixels.slice(0, 4))).toBe(false)
})

test('capture stays single-flight across disconnect and reconnect, discarding the old image', async () => {
  const store = new BackdropStore()
  const source = new EventTarget() as HTMLElement
  const key = Symbol()
  const changed = vi.fn()
  store.subscribe(changed)
  store.updateScreen({ size: { width: 1, height: 1 }, visible: true })
  store.request(key, { area: { x: 0, y: 0, width: 1, height: 1 }, blur: 0, indicator: 'time' })
  let finish!: (canvas: HTMLCanvasElement) => void
  vi.mocked(snapdom.toCanvas).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  store.connect(source)
  await vi.advanceTimersByTimeAsync(0)
  for (let i = 0; i < 20; i++) source.dispatchEvent(new Event('input'))
  await vi.advanceTimersByTimeAsync(100)
  expect(snapdom.toCanvas).toHaveBeenCalledTimes(1)
  store.disconnect()
  store.connect(source)
  const initial = store.getSnapshot()
  let finishNew!: (canvas: HTMLCanvasElement) => void
  vi.mocked(snapdom.toCanvas).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishNew = resolve
      }),
  )
  finish(canvas(0))
  await vi.advanceTimersByTimeAsync(50)
  expect(store.getSnapshot()).toBe(initial)
  expect(changed).not.toHaveBeenCalled()
  expect(snapdom.toCanvas).toHaveBeenCalledTimes(2)
  finishNew(canvas(255))
  await vi.advanceTimersByTimeAsync(50)
  expect(store.getSnapshot().colors.time).toBe('dark')
  expect(changed).toHaveBeenCalledTimes(1)
  store.disconnect()
  source.dispatchEvent(new Event('input'))
  await vi.advanceTimersByTimeAsync(1000)
  expect(snapdom.toCanvas).toHaveBeenCalledTimes(2)
})

test('unchanged captures and failures retain snapshots; released regions disappear', async () => {
  const store = new BackdropStore()
  const source = new EventTarget() as HTMLElement
  const key = Symbol()
  const draw = vi.fn()
  const request = { area: { x: 0, y: 0, width: 1, height: 1 }, blur: 0 } as const
  store.updateScreen({ size: { width: 1, height: 1 }, visible: true })
  store.request(key, request)
  const unsubscribe = store.subscribeRegion(key, draw)
  store.connect(source)
  await vi.advanceTimersByTimeAsync(50)
  const snapshot = store.getSnapshot()
  expect(snapshot.regions.size).toBe(1)
  expect(draw).toHaveBeenCalledTimes(1)
  store.request(key, { ...request, area: { ...request.area } })
  await vi.advanceTimersByTimeAsync(50)
  expect(snapdom.toCanvas).toHaveBeenCalledTimes(1)
  source.dispatchEvent(new Event('input'))
  await vi.advanceTimersByTimeAsync(50)
  expect(store.getSnapshot()).toBe(snapshot)
  expect(draw).toHaveBeenCalledTimes(1)
  vi.mocked(snapdom.toCanvas).mockRejectedValueOnce(new Error('Unreadable image'))
  source.dispatchEvent(new Event('input'))
  await vi.advanceTimersByTimeAsync(50)
  expect(store.getSnapshot()).toBe(snapshot)
  vi.mocked(snapdom.toCanvas).mockResolvedValue(canvas(0))
  source.dispatchEvent(new Event('input'))
  await vi.advanceTimersByTimeAsync(50)
  expect(store.getSnapshot()).not.toBe(snapshot)
  expect(draw).toHaveBeenCalledTimes(2)
  store.release(key)
  await vi.advanceTimersByTimeAsync(50)
  expect(store.getSnapshot().regions.size).toBe(0)
  expect(draw).toHaveBeenCalledTimes(3)
  unsubscribe()
  store.disconnect()
})
