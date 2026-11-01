import { expect, test, vi } from 'vitest'
import { BackdropStore } from '../../../src/renderers/backdrop/store'
import type { BackdropRegion } from '../../../src/renderers/backdrop/types'

test('only changed requests invalidate their owning renderer', () => {
  const invalidate = vi.fn()
  const otherInvalidate = vi.fn()
  const store = new BackdropStore(invalidate)
  const other = new BackdropStore(otherInvalidate)
  const key = Symbol()
  const request = { area: { x: 0, y: 0, width: 20, height: 10 }, blur: 4 }

  store.request(key, request)
  store.request(key, { ...request, area: { ...request.area } })
  expect(invalidate).toHaveBeenCalledTimes(1)
  store.request(key, { ...request, blur: 8 })
  expect(invalidate).toHaveBeenCalledTimes(2)
  store.release(key)
  store.release(key)
  expect(invalidate).toHaveBeenCalledTimes(3)
  expect(store.getRequests().size).toBe(0)
  expect(other.getRequests().size).toBe(0)
  expect(otherInvalidate).not.toHaveBeenCalled()
})

test('region subscribers ignore other regions and stop receiving updates after unsubscribe', () => {
  const store = new BackdropStore(vi.fn())
  const key = Symbol()
  const otherKey = Symbol()
  const region = {
    x: 0,
    y: 0,
    width: 20,
    height: 10,
    blur: 0,
    canvas: {} as HTMLCanvasElement,
    blurred: {} as HTMLCanvasElement,
  } satisfies BackdropRegion
  const changed = vi.fn()
  const unsubscribe = store.subscribeRegion(key, changed)
  const initial = store.getSnapshot()

  store.publish({ ...initial, regions: new Map([[key, region]]) })
  expect(changed).toHaveBeenCalledTimes(1)
  store.publish({
    ...initial,
    regions: new Map([
      [key, region],
      [otherKey, { ...region }],
    ]),
  })
  expect(changed).toHaveBeenCalledTimes(1)
  store.publish(initial)
  expect(changed).toHaveBeenCalledTimes(2)
  unsubscribe()
  store.publish({ ...initial, regions: new Map([[key, region]]) })
  expect(changed).toHaveBeenCalledTimes(2)
  expect(store.getServerSnapshot()).toBe(initial)
})
