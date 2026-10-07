// @vitest-environment jsdom

import { BackdropStore } from '@private/browser'
import React from 'react'
import ReactDOM from 'react-dom'
import { act } from 'react-dom/test-utils'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import {
  DuoFrame,
  DuoProvider,
  type DuoProviderProps,
  type DuoRenderingMode,
  DuoTabBar,
  type DuoTabBarItem,
  useBars,
  useDuoActions,
} from '../src'

const items: readonly DuoTabBarItem[] = Array.from({ length: 5 }, (_, index) => ({
  id: String(index),
  label: `Destination ${index}`,
  icon: <span>Inactive {index}</span>,
  selectedIcon: <span>Active {index}</span>,
  selectedColor: '#ff2d55',
}))

let root: HTMLDivElement

beforeEach(() => {
  root = document.createElement('div')
  document.body.append(root)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }))
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  )
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  vi.spyOn(BackdropStore.prototype, 'request')
  vi.spyOn(BackdropStore.prototype, 'release')
})

afterEach(() => {
  act(() => {
    ReactDOM.unmountComponentAtNode(root)
  })
  root.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function activeRequests() {
  const requested = vi.mocked(BackdropStore.prototype.request).mock.calls
  const released = vi.mocked(BackdropStore.prototype.release).mock.calls
  const active = new Set(requested.map(([key]) => key))
  for (const [key] of released) active.delete(key)
  return active.size
}

function App({
  rendering,
  count = 3,
  onSelect,
  badges,
}: {
  rendering?: DuoRenderingMode
  count?: number
  onSelect?: (id: string) => void
  badges?: readonly (string | undefined)[]
}) {
  const bars = useBars({ tabbar: {} })
  const [selected, setSelected] = React.useState('0')
  const actions = useDuoActions()
  return (
    <>
      <button
        type="button"
        data-theme="dark"
        onClick={() => actions.setSystem({ colorMode: 'dark' })}
      >
        Dark appearance
      </button>
      <button
        type="button"
        data-indicators="light"
        onClick={() =>
          actions.setSystem({
            indicatorStyles: { inner: { statusBar: 'light', homeIndicator: 'dark' } },
          })
        }
      >
        Fixed indicators
      </button>
      <DuoTabBar
        layout={bars.tabbar}
        rendering={rendering}
        items={items.slice(0, count).map((item, index) => ({ ...item, badge: badges?.[index] }))}
        selectedId={selected}
        onSelect={(id) => {
          setSelected(id)
          onSelect?.(id)
        }}
      />
    </>
  )
}

function render({
  rendering,
  tabRendering,
  count,
  vertical = false,
  onSelect,
  badges,
}: {
  rendering?: DuoProviderProps['rendering']
  tabRendering?: DuoRenderingMode
  count?: number
  vertical?: boolean
  onSelect?: (id: string) => void
  badges?: readonly (string | undefined)[]
} = {}) {
  act(() => {
    ReactDOM.render(
      <DuoProvider
        rendering={rendering}
        defaultState={{ posture: 'open', orientation: vertical ? 'landscape-left' : 'portrait' }}
        defaultSystem={{ homeIndicatorVisible: true }}
      >
        <DuoFrame zoom={1}>
          <App rendering={tabRendering} count={count} onSelect={onSelect} badges={badges} />
        </DuoFrame>
      </DuoProvider>,
      root,
    )
  })
}

function tabs() {
  return Array.from(root.querySelectorAll<HTMLButtonElement>('.duo-react-tab-bar-item'))
}

test.each(['basic', 'enhanced'] as const)(
  '%s tab badges distinguish absence, empty, and literal text and update with their item',
  (tabRendering) => {
    const onSelect = vi.fn()
    const options = { rendering: { system: 'basic' as const }, tabRendering, count: 5, onSelect }
    render({ ...options, badges: [undefined, '', '0', '99+', 'New\nItems'] })
    expect(root.querySelectorAll('.duo-react-tab-bar-badge')).toHaveLength(4)
    expect(
      tabs().map((button) => button.querySelector('.duo-react-tab-bar-badge')?.textContent),
    ).toEqual([undefined, '', '0', '99+', 'New'])
    expect(tabs()[4].getAttribute('aria-label')).toBe('Destination 4, New\nItems')
    act(() => tabs()[3].click())
    expect(onSelect).toHaveBeenLastCalledWith('3')
    expect(tabs()[3].getAttribute('aria-current')).toBe('page')
    render({ ...options, badges: ['Long badge text', undefined, '', '新消息通知', '🔔'] })
    expect(
      tabs().map((button) => button.querySelector('.duo-react-tab-bar-badge')?.textContent),
    ).toEqual(['Long badge text', undefined, '', '新消息通知', '🔔'])
    expect(tabs()[0].getAttribute('aria-label')).toBe('Destination 0, Long badge text')
    expect(tabs()[3].getAttribute('aria-current')).toBe('page')
    render(options)
    expect(root.querySelectorAll('.duo-react-tab-bar-badge')).toHaveLength(0)
  },
)

test('basic controls mount without sampling requests or canvas rendering', () => {
  render({ rendering: { system: 'basic', tabBar: 'basic' } })
  expect(BackdropStore.prototype.request).not.toHaveBeenCalled()
  expect(HTMLCanvasElement.prototype.getContext).not.toHaveBeenCalled()
  expect(root.querySelectorAll('canvas')).toHaveLength(0)
  expect(root.querySelectorAll('[data-duo-react-rendering="basic"]')).toHaveLength(2)
  expect(tabs()).toHaveLength(3)
})

test('live provider changes release enhanced requests and preserve app selection', () => {
  render()
  expect(activeRequests()).toBe(5)
  expect(root.querySelectorAll('canvas')).toHaveLength(2)

  render({ rendering: { system: 'basic', tabBar: 'basic' } })
  expect(activeRequests()).toBe(0)
  expect(root.querySelectorAll('canvas')).toHaveLength(0)
  act(() => tabs()[1].click())
  expect(tabs()[1].getAttribute('aria-current')).toBe('page')

  render()
  expect(activeRequests()).toBe(5)
  expect(tabs()[1].getAttribute('aria-current')).toBe('page')
  render({ rendering: { system: 'basic', tabBar: 'basic' } })
  expect(activeRequests()).toBe(0)
  expect(tabs()[1].getAttribute('aria-current')).toBe('page')
})

test('tab overrides win over provider settings and omitted settings remain enhanced', () => {
  render({ rendering: { system: 'basic' }, tabRendering: 'basic' })
  expect(activeRequests()).toBe(0)
  render({ rendering: { system: 'basic' } })
  expect(activeRequests()).toBe(1)
  render({ rendering: { system: 'basic', tabBar: 'basic' }, tabRendering: 'enhanced' })
  expect(activeRequests()).toBe(1)
  render({ rendering: { tabBar: 'basic' } })
  expect(activeRequests()).toBe(4)
  act(() => {
    ReactDOM.unmountComponentAtNode(root)
  })
  expect(activeRequests()).toBe(0)
})

test('basic indicators use CSS contrast independently of color mode and honor explicit styles', () => {
  render({ rendering: { system: 'basic', tabBar: 'basic' } })
  const styles = () =>
    Array.from(
      root.querySelectorAll('.duo-react-indicator'),
      (node) => node.getAttribute('data-duo-react-resolved-style') ?? undefined,
    )
  expect(styles()).toEqual([undefined, undefined, undefined])
  const filters = Array.from(root.querySelectorAll('filter'), (filter) => filter.id)
  expect(new Set(filters).size).toBe(3)
  expect(root.querySelectorAll('.duo-react-indicator-auto')).toHaveLength(3)
  act(() => root.querySelector<HTMLButtonElement>('[data-theme="dark"]')!.click())
  expect(styles()).toEqual([undefined, undefined, undefined])
  expect(Array.from(root.querySelectorAll('filter'), (filter) => filter.id)).toEqual(filters)
  expect(
    root.querySelector('.duo-react-tab-bar-surface')?.getAttribute('data-duo-react-material-dark'),
  ).toBe('true')
  act(() => root.querySelector<HTMLButtonElement>('[data-indicators="light"]')!.click())
  expect(styles()).toEqual(['light', 'light', 'dark'])
  expect(root.querySelectorAll('.duo-react-indicator-auto')).toHaveLength(0)
  expect(root.querySelectorAll('filter')).toHaveLength(0)
  expect(BackdropStore.prototype.request).not.toHaveBeenCalled()
})

test.each([
  [2, 188, 94],
  [3, 274, 94],
  [4, 400, 108],
  [5, 400, 94],
])(
  '%i basic tabs preserve calibrated dimensions through selection and holding',
  (count, width, itemWidth) => {
    const onSelect = vi.fn()
    render({ rendering: { system: 'basic', tabBar: 'basic' }, count, onSelect })
    const surface = root.querySelector<HTMLDivElement>('.duo-react-tab-bar-surface')!
    const selection = () => root.querySelector<HTMLDivElement>('.duo-react-tab-bar-selection')!
    expect(surface.style.width).toBe(`${width}px`)
    expect(surface.style.height).toBe('62px')
    expect(selection().style.width).toBe(`${itemWidth}px`)
    expect(selection().style.height).toBe('54px')
    expect(selection().style.left).toBe('4px')
    act(() => {
      tabs()[count - 1].dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    })
    expect(selection().style.width).toBe(`${itemWidth}px`)
    expect(surface.hasAttribute('data-duo-react-expanded')).toBe(false)
    act(() => tabs()[count - 1].click())
    expect(onSelect).toHaveBeenLastCalledWith(String(count - 1))
    expect(tabs()[count - 1].getAttribute('aria-current')).toBe('page')
    expect(Number.parseFloat(selection().style.left) + itemWidth).toBeCloseTo(width - 4)
    expect(tabs()[count - 1].style.color).toBe('rgb(255, 45, 85)')
    expect(
      tabs()[count - 1].querySelector('[data-duo-react-icon-state="active"]')?.textContent,
    ).toBe(`Active ${count - 1}`)
    act(() => tabs()[count - 1].click())
    expect(onSelect).toHaveBeenCalledTimes(2)
  },
)

test.each([false, true])(
  'basic keyboard navigation follows the layout axis (vertical: %s)',
  (vertical) => {
    const onSelect = vi.fn()
    render({ rendering: { system: 'basic', tabBar: 'basic' }, vertical, onSelect })
    const buttons = tabs()
    const surface = root.querySelector<HTMLDivElement>('.duo-react-tab-bar-surface')!
    if (vertical) {
      expect(surface.style.width).toBe('48px')
      expect(surface.style.height).toBe('162px')
      const selection = root.querySelector<HTMLDivElement>('.duo-react-tab-bar-selection')!
      expect(selection.style.width).toBe('44px')
      expect(selection.style.height).toBe('58px')
    }
    buttons[0].focus()
    for (const [key, index] of [
      [vertical ? 'ArrowUp' : 'ArrowLeft', 2],
      [vertical ? 'ArrowDown' : 'ArrowRight', 0],
      ['End', 2],
      ['Home', 0],
    ] as const) {
      act(() => {
        document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
      })
      expect(document.activeElement).toBe(buttons[index])
    }
    expect(onSelect).not.toHaveBeenCalled()
    act(() => buttons[0].click())
    expect(onSelect).toHaveBeenCalledWith('0')
    expect(BackdropStore.prototype.request).not.toHaveBeenCalled()
  },
)
