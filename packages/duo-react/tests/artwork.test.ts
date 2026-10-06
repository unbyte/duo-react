import { afterEach, expect, test, vi } from 'vitest'
import { makeArtwork } from '../src/components/tab-bar/artwork'
import { TabLayout } from '../src/components/tab-bar/layout'

afterEach(() => vi.unstubAllGlobals())

function fixture() {
  class Image {
    src = '/heart.png'
    decode = vi.fn(async () => {})
  }
  class Svg {
    cloneNode() {
      return { setAttribute: vi.fn() }
    }
  }
  const context = { scale: vi.fn(), drawImage: vi.fn(), fillText: vi.fn() }
  const canvas = { width: 0, height: 0, getContext: () => context }
  vi.stubGlobal('document', {
    fonts: { ready: Promise.resolve() },
    createElement: () => canvas,
  })
  vi.stubGlobal('Image', Image)
  vi.stubGlobal('HTMLImageElement', Image)
  vi.stubGlobal('SVGSVGElement', Svg)
  vi.stubGlobal(
    'XMLSerializer',
    class {
      serializeToString() {
        return '<svg stroke="currentColor" />'
      }
    },
  )
  const png = new Image()
  const icons = [new Svg(), png].map((source) => ({
    firstElementChild: source,
    childElementCount: 1,
  }))
  const element = { querySelectorAll: () => icons } as unknown as HTMLDivElement
  return { element, png, canvas, context }
}

test('mixed SVG and PNG icons retain all labels in either artwork atlas', async () => {
  for (const vertical of [false, true]) {
    const { element, png, canvas, context } = fixture()
    const result = await makeArtwork(element, new TabLayout(vertical, 2), ['Home', 'Favorites'])
    expect(result).toBe(canvas)
    expect(png.decode).toHaveBeenCalledOnce()
    expect(png.src).toBe('/heart.png')
    expect(context.drawImage).toHaveBeenCalledTimes(2)
    expect(context.drawImage.mock.calls[1][0]).toBe(png)
    expect(context.fillText.mock.calls.map(([label]) => label)).toEqual(['Home', 'Favorites'])
  }
})

test('PNG artwork waits for decoding before drawing its icon and label', async () => {
  const { element, png, context } = fixture()
  let decoded!: () => void
  png.decode.mockImplementationOnce(() => new Promise<void>((resolve) => (decoded = resolve)))
  const result = makeArtwork(element, new TabLayout(true, 2), ['Home', 'Favorites'])
  await vi.waitFor(() => expect(png.decode).toHaveBeenCalledOnce())
  expect(context.drawImage).not.toHaveBeenCalledWith(
    png,
    expect.anything(),
    expect.anything(),
    27,
    27,
  )
  expect(context.fillText.mock.calls.map(([label]) => label)).not.toContain('Favorites')
  decoded()
  await result
  expect(context.drawImage.mock.calls.some(([image]) => image === png)).toBe(true)
  expect(context.fillText.mock.calls.map(([label]) => label)).toContain('Favorites')
})
