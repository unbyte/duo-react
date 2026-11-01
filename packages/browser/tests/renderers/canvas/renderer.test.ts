import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { DrawableCanvas } from '../../../src/renderers/canvas/html-in-canvas'
import { CanvasRenderer } from '../../../src/renderers/canvas/renderer'

function makeCanvas() {
  const context = {
    clearRect() {},
    drawImage() {},
    drawElementImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([0, 0, 0, 255]) })),
  }
  const canvas = Object.assign(new EventTarget(), {
    width: 300,
    height: 150,
    requestPaint: vi.fn(),
    getContext: () => context,
  }) as unknown as DrawableCanvas
  return { canvas, context }
}

let allocated: ReturnType<typeof makeCanvas>[]

beforeEach(() => {
  allocated = []
  vi.stubGlobal(
    'document',
    Object.assign(new EventTarget(), {
      hidden: false,
      createElement: () => {
        const surface = makeCanvas()
        allocated.push(surface)
        return surface.canvas
      },
    }),
  )
  vi.stubGlobal('window', Object.assign(new EventTarget(), { devicePixelRatio: 2 }))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})

afterEach(() => vi.unstubAllGlobals())

test('native glass updates without pixel readback and retains its surfaces between paints', () => {
  const { canvas, context } = makeCanvas()
  const source = { parentElement: canvas } as unknown as HTMLElement
  const errors = vi.fn()
  const renderer = new CanvasRenderer(errors)
  const store = renderer.backdrop
  const region = Symbol()
  renderer.updateScreen({ size: { width: 100, height: 200 }, visible: true, scale: 0.5 })
  store.request(region, { area: { x: 10, y: 20, width: 30, height: 40 }, blur: 2 })
  renderer.connect(source)
  expect(canvas.width).toBe(100)
  expect(canvas.height).toBe(200)
  canvas.dispatchEvent(new Event('paint'))
  const first = store.getSnapshot().regions.get(region)!
  expect(first).toMatchObject({ x: 4, y: 14, width: 42, height: 52 })
  const listener = vi.fn()
  store.subscribeRegion(region, listener)
  canvas.dispatchEvent(new Event('paint'))
  const next = store.getSnapshot().regions.get(region)!
  expect(next).not.toBe(first)
  expect(next.canvas).toBe(first.canvas)
  expect(next.blurred).toBe(first.blurred)
  expect(listener).toHaveBeenCalledTimes(1)
  expect(context.getImageData).not.toHaveBeenCalled()
  for (const surface of allocated) expect(surface.context.getImageData).not.toHaveBeenCalled()
  expect(errors).not.toHaveBeenCalled()
  renderer.disconnect()
})

test('only indicator regions read pixels and update contrast', () => {
  const { canvas, context } = makeCanvas()
  const renderer = new CanvasRenderer(vi.fn())
  const store = renderer.backdrop
  renderer.updateScreen({ size: { width: 100, height: 200 }, visible: true })
  const indicator = Symbol()
  store.request(indicator, {
    area: { x: 5, y: 10, width: 2, height: 3 },
    blur: 0,
    indicator: 'time',
  })
  renderer.connect({ parentElement: canvas } as unknown as HTMLElement)
  canvas.dispatchEvent(new Event('paint'))
  expect(store.getSnapshot().colors.time).toBe('light')
  expect(context.getImageData).not.toHaveBeenCalled()
  expect(allocated[0].context.getImageData).toHaveBeenCalledWith(0, 0, 2, 3)
  store.release(indicator)
  canvas.dispatchEvent(new Event('paint'))
  expect(store.getSnapshot().regions.size).toBe(0)
  renderer.disconnect()
})

test('hidden and disconnected surfaces stop publishing; reconnect uses the new canvas', () => {
  const old = makeCanvas()
  const current = makeCanvas()
  const renderer = new CanvasRenderer(vi.fn())
  const store = renderer.backdrop
  const listener = vi.fn()
  store.subscribe(listener)
  renderer.updateScreen({ size: { width: 100, height: 200 }, visible: false })
  renderer.connect({ parentElement: old.canvas } as unknown as HTMLElement)
  old.canvas.dispatchEvent(new Event('paint'))
  expect(listener).not.toHaveBeenCalled()
  renderer.updateScreen({ size: { width: 100, height: 200 }, visible: true })
  old.canvas.dispatchEvent(new Event('paint'))
  expect(listener).toHaveBeenCalledTimes(1)
  renderer.disconnect()
  renderer.connect({ parentElement: current.canvas } as unknown as HTMLElement)
  old.canvas.dispatchEvent(new Event('paint'))
  expect(listener).toHaveBeenCalledTimes(1)
  current.canvas.dispatchEvent(new Event('paint'))
  expect(listener).toHaveBeenCalledTimes(2)
  renderer.disconnect()
  current.canvas.dispatchEvent(new Event('paint'))
  expect(listener).toHaveBeenCalledTimes(2)
})

test('a native paint failure retains the last snapshot and disconnects before reporting failure', () => {
  const { canvas, context } = makeCanvas()
  const errors = vi.fn()
  const renderer = new CanvasRenderer(errors)
  const store = renderer.backdrop
  renderer.updateScreen({ size: { width: 100, height: 200 }, visible: true })
  renderer.connect({ parentElement: canvas } as unknown as HTMLElement)
  canvas.dispatchEvent(new Event('paint'))
  const snapshot = store.getSnapshot()
  const failure = new Error('Context unavailable')
  context.drawElementImage.mockImplementation(() => {
    throw failure
  })
  canvas.dispatchEvent(new Event('paint'))
  canvas.dispatchEvent(new Event('paint'))
  expect(store.getSnapshot()).toBe(snapshot)
  expect(errors).toHaveBeenCalledExactlyOnceWith(failure)
})
