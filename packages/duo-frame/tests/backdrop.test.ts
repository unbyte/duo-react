import { afterEach, expect, test, vi } from "vite-plus/test"
import { createCaptureScheduler } from "../src/backdrop/scheduler"
import { paddedRegion, samePixels } from "../src/backdrop/regions"
import { createBackdropStore, type BackdropRegion } from "../src/backdrop/store"

afterEach(() => vi.useRealTimers())

test("capture coalesces mutations and never starts another capture while busy", async () => {
  vi.useFakeTimers()
  let complete: ((value: number) => void) | undefined
  const capture = vi.fn(
    () =>
      new Promise<number>((resolve) => {
        complete = resolve
      }),
  )
  const publish = vi.fn()
  const scheduler = createCaptureScheduler(capture, publish)
  scheduler.invalidate()
  await vi.advanceTimersByTimeAsync(0)
  for (let i = 0; i < 20; i++) scheduler.invalidate()
  await vi.advanceTimersByTimeAsync(500)
  expect(capture).toHaveBeenCalledTimes(1)
  complete!(1)
  await vi.advanceTimersByTimeAsync(1)
  expect(publish).toHaveBeenCalledWith(1)
  expect(capture).toHaveBeenCalledTimes(2)
  complete!(2)
  await vi.advanceTimersByTimeAsync(1000)
  expect(publish).toHaveBeenCalledTimes(2)
  expect(capture).toHaveBeenCalledTimes(2)
  scheduler.stop()
})

test("geometry changes discard a pending image and disposal cannot publish late results", async () => {
  vi.useFakeTimers()
  let complete: ((value: number) => void) | undefined
  const publish = vi.fn()
  const scheduler = createCaptureScheduler(
    () =>
      new Promise<number>((resolve) => {
        complete = resolve
      }),
    publish,
  )
  scheduler.invalidate()
  await vi.advanceTimersByTimeAsync(0)
  scheduler.invalidate(true)
  complete!(1)
  await vi.advanceTimersByTimeAsync(101)
  scheduler.stop()
  complete!(2)
  await vi.advanceTimersByTimeAsync(500)
  expect(publish).not.toHaveBeenCalled()
})

test("capture failure retains the current result and a later invalidation can retry", async () => {
  vi.useFakeTimers()
  const capture = vi
    .fn()
    .mockRejectedValueOnce(new Error("Unreadable image"))
    .mockResolvedValueOnce(2)
  const publish = vi.fn()
  const scheduler = createCaptureScheduler(capture, publish)
  scheduler.invalidate()
  await vi.advanceTimersByTimeAsync(100)
  expect(publish).not.toHaveBeenCalled()
  scheduler.invalidate()
  await vi.advanceTimersByTimeAsync(100)
  expect(publish).toHaveBeenCalledWith(2)
  scheduler.stop()
})

test("subscribers share one cached snapshot while indicator selections stay stable", () => {
  const store = createBackdropStore()
  const original = store.getSnapshot()
  expect(store.getSnapshot()).toBe(original)
  const snapshots: unknown[] = []
  const unsubscribe = store.subscribe(() => snapshots.push(store.getSnapshot()))
  const other = store.subscribe(() => snapshots.push(store.getSnapshot()))
  const next = { regions: new Map(), colors: { ...original.colors } }
  store.publish(next)
  expect(snapshots).toEqual([next, next])
  expect(snapshots[0]).toBe(snapshots[1])
  expect(store.getSnapshot().colors.time).toBe(original.colors.time)
  expect(store.getServerSnapshot()).toBe(original)
  unsubscribe()
  other()
  store.publish(next)
  expect(snapshots).toHaveLength(2)
})

test("region subscriptions ignore changes to other consumers and identical publications", () => {
  const store = createBackdropStore()
  const tab = Symbol("tab")
  const status = Symbol("status")
  const tabRegion = { x: 20, y: 40, width: 100, height: 200 } as BackdropRegion
  const statusRegion = { x: 20, y: 0, width: 100, height: 40 } as BackdropRegion
  const draw = vi.fn()
  const unsubscribe = store.subscribeRegion(tab, draw)
  store.publish({ ...store.getSnapshot(), regions: new Map([[tab, tabRegion]]) })
  expect(draw).toHaveBeenCalledTimes(1)
  store.publish({
    ...store.getSnapshot(),
    regions: new Map([
      [tab, tabRegion],
      [status, statusRegion],
    ]),
  })
  store.publish(store.getSnapshot())
  expect(draw).toHaveBeenCalledTimes(1)
  store.publish({ ...store.getSnapshot(), regions: new Map([[tab, { ...tabRegion }]]) })
  expect(draw).toHaveBeenCalledTimes(2)
  unsubscribe()
  store.publish({ ...store.getSnapshot(), regions: new Map() })
  expect(draw).toHaveBeenCalledTimes(2)
})

test("only changed region requirements invalidate capture and released consumers disappear", () => {
  const store = createBackdropStore()
  const key = Symbol()
  const invalidate = vi.fn()
  const unsubscribe = store.subscribeRequests(invalidate)
  const request = { area: { x: 40, y: 60, width: 80, height: 100 }, blur: 6 }
  store.request(key, request)
  const pending = store.getRequests()
  store.request(key, { ...request, area: { ...request.area } })
  expect(invalidate).toHaveBeenCalledTimes(1)
  store.request(key, { ...request, area: { ...request.area, x: 50 } })
  expect(invalidate).toHaveBeenCalledTimes(2)
  expect(pending.get(key)).toBe(request)
  store.release(key)
  store.release(key)
  expect(invalidate).toHaveBeenCalledTimes(3)
  expect(store.getRequests().size).toBe(0)
  unsubscribe()
  store.request(key, request)
  expect(invalidate).toHaveBeenCalledTimes(3)
})

test("blur padding rounds outward and clips to the display", () => {
  const size = { width: 669, height: 951 }
  const tab = paddedRegion({ x: 592.5, y: 700, width: 48, height: 162 }, 18, size)!
  const status = paddedRegion({ x: 590, y: 30, width: 50, height: 70 }, 36, size)!
  expect(tab).toEqual({ x: 574, y: 682, width: 85, height: 198 })
  expect(status).toEqual({ x: 554, y: 0, width: 115, height: 136 })
  expect(paddedRegion({ x: 800, y: 0, width: 10, height: 10 }, 0, size)).toBeUndefined()
})

test("pixel comparison notices alpha changes and differences at the end of the region", () => {
  const pixels = new Uint8ClampedArray([0, 1, 2, 255, 3, 4, 5, 255])
  expect(samePixels(pixels, pixels.slice())).toBe(true)
  const changed = pixels.slice()
  changed[7] = 254
  expect(samePixels(pixels, changed)).toBe(false)
  expect(samePixels(pixels, pixels.slice(0, 4))).toBe(false)
})

test("active invalidations can sample at 20 fps without turning idle time into a loop", async () => {
  vi.useFakeTimers()
  const capture = vi.fn().mockResolvedValue(1)
  const scheduler = createCaptureScheduler(capture, vi.fn())
  scheduler.invalidate()
  await vi.advanceTimersByTimeAsync(0)
  scheduler.invalidate()
  await vi.advanceTimersByTimeAsync(49)
  expect(capture).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(1)
  expect(capture).toHaveBeenCalledTimes(2)
  await vi.advanceTimersByTimeAsync(1000)
  expect(capture).toHaveBeenCalledTimes(2)
  scheduler.stop()
})
