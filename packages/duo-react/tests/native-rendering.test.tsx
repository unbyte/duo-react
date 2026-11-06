// @vitest-environment jsdom

import { BackdropStore } from '@private/browser'
import React from 'react'
import ReactDOM from 'react-dom'
import { act } from 'react-dom/test-utils'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { DuoFrame, DuoProvider, type DuoRenderer } from '../src'

let root: HTMLDivElement
let mounts: number
const draw = vi.fn()
const restore: (() => void)[] = []

function property(object: object, name: string, value: unknown) {
  const descriptor = Object.getOwnPropertyDescriptor(object, name)
  Object.defineProperty(object, name, { configurable: true, writable: true, value })
  restore.push(() => {
    if (descriptor) Object.defineProperty(object, name, descriptor)
    else Reflect.deleteProperty(object, name)
  })
}

function supportNative() {
  class Context {
    drawElementImage = draw
    clearRect() {}
    drawImage() {}
  }
  vi.stubGlobal('CanvasRenderingContext2D', Context)
  property(Context.prototype, 'drawElementImage', draw)
  property(HTMLCanvasElement.prototype, 'content', 'fallback')
  property(HTMLCanvasElement.prototype, 'onpaint', null)
  property(HTMLCanvasElement.prototype, 'requestPaint', vi.fn())
  property(HTMLCanvasElement.prototype, 'updateElementGeometry', vi.fn())
  property(
    Element.prototype,
    'moveBefore',
    function (this: Element, node: Node, child: Node | null) {
      this.insertBefore(node, child)
    },
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    new Context() as unknown as CanvasRenderingContext2D,
  )
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(100)
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(100)
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ width: 100 } as DOMRect)
}

function Counter() {
  const [count, setCount] = React.useState(0)
  React.useEffect(() => {
    mounts++
  }, [])
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      {count}
    </button>
  )
}

function render(renderer: DuoRenderer = 'auto') {
  act(() => {
    ReactDOM.render(
      <DuoProvider rendering={{ renderer, system: 'basic', tabBar: 'basic' }}>
        <DuoFrame zoom={1}>
          <Counter />
        </DuoFrame>
      </DuoProvider>,
      root,
    )
  })
}

function paint() {
  act(() => {
    root.querySelector<HTMLElement>('.duo-react-display')!.style.visibility = 'visible'
    root.querySelector('.duo-react-display-canvas')!.dispatchEvent(new Event('paint'))
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  mounts = 0
  draw.mockReset()
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
  vi.spyOn(BackdropStore.prototype, 'connect')
  vi.spyOn(BackdropStore.prototype, 'connectCanvas')
})

afterEach(() => {
  act(() => {
    ReactDOM.unmountComponentAtNode(root)
  })
  root.remove()
  for (const undo of restore.splice(0).reverse()) undo()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

test('unsupported and incomplete native APIs retain the DOM renderer', () => {
  render('html-in-canvas')
  expect(root.querySelector('.duo-react-display-canvas')).toBeNull()
  expect(root.querySelector('[data-duo-react-renderer="dom"]')).not.toBeNull()
  supportNative()
  property(HTMLCanvasElement.prototype, 'updateElementGeometry', undefined)
  render('dom')
  render('auto')
  expect(root.querySelector('.duo-react-display-canvas')).toBeNull()
})

test('native drawing and renderer switches preserve app nodes, state, and cleanup', () => {
  supportNative()
  render()
  const button = root.querySelector('button')!
  act(() => {
    button.click()
  })
  paint()
  expect(draw.mock.calls.map(([element]) => element.className)).toEqual([
    'duo-react-screen',
    'duo-react-chrome',
    'duo-react-system',
  ])
  expect(BackdropStore.prototype.connect).not.toHaveBeenCalled()
  expect(BackdropStore.prototype.connectCanvas).toHaveBeenCalledOnce()
  render('dom')
  expect(root.querySelector('.duo-react-display-canvas')).toBeNull()
  expect(root.querySelector('[drawable]')).toBeNull()
  expect(root.querySelector('button')).toBe(button)
  expect(button.textContent).toBe('1')
  render('html-in-canvas')
  paint()
  expect(root.querySelector('button')).toBe(button)
  expect(mounts).toBe(1)
  act(() => {
    ReactDOM.unmountComponentAtNode(root)
  })
  expect(root.childNodes.length).toBe(0)
})

test('paint failures restore interactive DOM and reconnect the existing backdrop requests', () => {
  supportNative()
  render()
  const button = root.querySelector('button')!
  draw.mockImplementationOnce(() => {
    throw new Error('Native paint failed')
  })
  paint()
  expect(root.querySelector('[data-duo-react-renderer="dom"]')).not.toBeNull()
  expect(root.querySelector('.duo-react-display-canvas')).toBeNull()
  expect(BackdropStore.prototype.connect).toHaveBeenCalledOnce()
  act(() => {
    button.click()
  })
  expect(button.textContent).toBe('1')
  expect(mounts).toBe(1)
})

test('missing paint events and lost contexts fall back to DOM', () => {
  supportNative()
  render()
  root.querySelector<HTMLElement>('.duo-react-display')!.style.visibility = 'visible'
  act(() => {
    vi.advanceTimersByTime(1500)
  })
  expect(root.querySelector('[data-duo-react-renderer="dom"]')).not.toBeNull()
  render('dom')
  render('auto')
  paint()
  act(() => {
    root.querySelector('.duo-react-display-canvas')!.dispatchEvent(new Event('contextlost'))
  })
  expect(root.querySelector('[data-duo-react-renderer="dom"]')).not.toBeNull()
})
