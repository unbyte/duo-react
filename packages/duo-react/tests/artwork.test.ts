import { afterEach, expect, test, vi } from 'vitest'
import { makeArtwork } from '../src/components/tab-bar/artwork'
import { TabLayout } from '../src/components/tab-bar/layout'
import type { DuoTabBarItem } from '../src/components/tab-bar/types'

const items: readonly DuoTabBarItem[] = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'favorites', icon: 'heart', label: 'Favorites' },
]

afterEach(() => vi.unstubAllGlobals())

function fixture(paired = false) {
  class Image {
    src = '/heart.png'
    decode = vi.fn(async () => {})
  }
  class Svg {
    cloneNode() {
      return { setAttribute: vi.fn() }
    }
  }
  const labels: { text: string; y: number; color: string }[] = []
  const context = {
    scale: vi.fn(),
    drawImage: vi.fn(),
    fillStyle: '',
    fillText: vi.fn((text: string, _x: number, y: number) => {
      labels.push({ text, y, color: context.fillStyle })
    }),
  }
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
  vi.stubGlobal('getComputedStyle', () => ({ color: '#101910' }))
  const png = new Image()
  const active = new Image()
  active.src = '/heart-filled.png'
  const icons = [new Svg(), png].map((source) => ({
    firstElementChild: source,
    childElementCount: 1,
  }))
  const buttons = icons.map((icon, index) => {
    const children =
      paired && index === 1 ? [icon, { firstElementChild: active, childElementCount: 1 }] : [icon]
    return { querySelectorAll: () => children }
  })
  const element = { querySelectorAll: () => buttons } as unknown as HTMLDivElement
  return { element, png, active, canvas, context, labels }
}

test('mixed SVG and PNG icons retain all labels in either artwork atlas', async () => {
  for (const vertical of [false, true]) {
    const { element, png, canvas, context } = fixture()
    const result = await makeArtwork(element, new TabLayout(vertical, 2), items)
    expect(result.icons).toBe(canvas)
    expect(result.badges).toBeUndefined()
    expect(png.decode).toHaveBeenCalledOnce()
    expect(png.src).toBe('/heart.png')
    expect(context.drawImage).toHaveBeenCalledTimes(4)
    expect(context.drawImage.mock.calls[2][0]).toBe(png)
    expect(context.fillText.mock.calls.map(([label]) => label)).toEqual([
      'Home',
      'Home',
      'Favorites',
      'Favorites',
    ])
  }
})

test('PNG artwork waits for decoding before drawing its icon and label', async () => {
  const { element, png, context } = fixture()
  let decoded!: () => void
  png.decode.mockImplementationOnce(() => new Promise<void>((resolve) => (decoded = resolve)))
  const result = makeArtwork(element, new TabLayout(true, 2), items)
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

test('paired icons occupy separate inactive and active rows alongside single icons', async () => {
  for (const vertical of [false, true]) {
    const { element, png, active, canvas, context } = fixture(true)
    const layout = new TabLayout(vertical, 2)
    await makeArtwork(element, layout, [
      items[0],
      { id: 'favorites', label: 'Favorites', icon: 'outline', selectedIcon: 'filled' },
    ])
    const height = vertical ? 96 : layout.rest.cross
    expect(canvas.height).toBe(height * 2 * 3)
    expect(context.drawImage).toHaveBeenCalledWith(png, expect.any(Number), 10.5, 27, 27)
    expect(context.drawImage).toHaveBeenCalledWith(
      active,
      expect.any(Number),
      height + 10.5,
      27,
      27,
    )
    expect(png.decode).toHaveBeenCalledOnce()
    expect(active.decode).toHaveBeenCalledOnce()
    expect(context.fillText.mock.calls.filter(([label]) => label === 'Favorites')).toHaveLength(2)
  }
})

test('unsupported active artwork falls back to DOM rendering', async () => {
  const { element } = fixture(true)
  const buttons = element.querySelectorAll('.duo-react-tab-bar-item')
  const icons = buttons[1].querySelectorAll('.duo-react-tab-bar-icon')
  Object.assign(icons[1], { childElementCount: 2 })
  await expect(
    makeArtwork(element, new TabLayout(false, 2), [
      items[0],
      { id: 'favorites', label: 'Favorites', icon: 'outline', selectedIcon: 'filled' },
    ]),
  ).rejects.toThrow('Icon requires DOM rendering')
})

test('paired PNGs retain their artwork while each label row uses its own color', async () => {
  for (const vertical of [false, true]) {
    for (const foreground of ['#101910', '#f4f6ef']) {
      const { element, png, active, context, labels } = fixture(true)
      const button = element.querySelectorAll('.duo-react-tab-bar-item')[1]
      vi.stubGlobal('getComputedStyle', (node: Element) => ({
        color: node === button ? 'rgba(255, 45, 85, 0.5)' : foreground,
      }))
      const layout = new TabLayout(vertical, 2)
      await makeArtwork(element, layout, [
        items[0],
        {
          id: 'favorites',
          label: 'Favorites',
          icon: 'outline',
          selectedIcon: 'filled',
          selectedColor: 'rgba(255, 45, 85, 0.5)',
        },
      ])
      const baseline = vertical ? 72 : 48.5
      expect(labels.filter(({ text }) => text === 'Favorites')).toEqual([
        { text: 'Favorites', y: baseline, color: foreground },
        {
          text: 'Favorites',
          y: baseline + (vertical ? 96 : layout.rest.cross),
          color: 'rgba(255, 45, 85, 0.5)',
        },
      ])
      expect(
        labels.filter(({ text }) => text === 'Home').every(({ color }) => color === '#ffffff'),
      ).toBe(true)
      expect(png.src).toBe('/heart.png')
      expect(active.src).toBe('/heart-filled.png')
      expect(context.drawImage.mock.calls.filter(([image]) => image === png)).toHaveLength(1)
      expect(context.drawImage.mock.calls.filter(([image]) => image === active)).toHaveLength(1)
    }
  }
})
