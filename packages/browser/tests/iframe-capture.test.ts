import { type CaptureContext, snapdom } from '@zumer/snapdom'
import { beforeEach, expect, test, vi } from 'vitest'
import { iframeCapture } from '../src/backdrop/iframe-capture'

vi.mock('@zumer/snapdom', () => ({ snapdom: { toPng: vi.fn() } }))

beforeEach(() => vi.resetAllMocks())

function fixture() {
  const image = { style: {} }
  const replacement = { style: {}, appendChild: vi.fn() }
  const documentElement = Object.freeze({ style: Object.freeze({}) })
  const frame = {
    tagName: 'IFRAME',
    // The preview's transform must never determine the iframe's capture viewport.
    getBoundingClientRect: vi.fn(() => ({ width: 163, height: 237 })),
    contentDocument: Object.freeze({
      documentElement,
      defaultView: Object.freeze({ innerWidth: 466, innerHeight: 678, scrollX: 12, scrollY: 750 }),
    }),
    ownerDocument: { createElement: vi.fn(() => replacement) },
  }
  const toPng = vi.mocked(snapdom.toPng)
  toPng.mockResolvedValue(image as HTMLImageElement)
  const plugin = iframeCapture
  const context = {
    exclude: ['.duo-react-system'],
    excludeMode: 'remove',
    fast: false,
    invalidate: true,
  } as unknown as CaptureContext
  const resolve = (node: unknown) => plugin.resolveNode!(node as Element, context)
  return { frame, image, replacement, toPng, plugin, resolve }
}

test('iframe capture preserves the live viewport and captures its scrolled content at any zoom', async () => {
  const { frame, image, replacement, toPng, plugin, resolve } = fixture()
  expect(await resolve(frame)).toBe(replacement)
  expect(frame.getBoundingClientRect).not.toHaveBeenCalled()
  expect(toPng).toHaveBeenCalledWith(frame.contentDocument.documentElement, {
    scale: 1,
    dpr: 1,
    clip: { x: 12, y: 750, width: 466, height: 678 },
    exclude: ['.duo-react-system'],
    excludeMode: 'remove',
    fast: false,
    invalidate: true,
    plugins: [plugin],
  })
  expect(replacement.appendChild).toHaveBeenCalledWith(image)
  expect(image.style).toMatchObject({ width: '466px', height: '678px' })
})

test("other elements and inaccessible iframes retain SnapDOM's normal handling", async () => {
  const { frame, toPng, resolve } = fixture()
  expect(await resolve({ tagName: 'DIV' })).toBeUndefined()
  expect(await resolve({ ...frame, contentDocument: null })).toBeUndefined()
  expect(toPng).not.toHaveBeenCalled()
})

test('a failed iframe capture does not fall back to the live-document pinning handler', async () => {
  const { frame, toPng, resolve } = fixture()
  const error = new Error('Unreadable iframe content')
  toPng.mockRejectedValue(error)
  await expect(resolve(frame)).rejects.toBe(error)
})
