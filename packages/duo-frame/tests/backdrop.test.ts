import { afterEach, expect, test, vi } from "vite-plus/test"
import { createCaptureScheduler } from "../src/backdrop/scheduler"
import { createBackdropStore } from "../src/backdrop/store"

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
  const next = { colors: { ...original.colors } }
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
