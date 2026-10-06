import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { expect, test } from 'vitest'
import { DuoFrame, DuoProvider, DuoTabBar, DuoToolbar, type ResolvedBarLayout } from '../src/index'

const tabLayout: ResolvedBarLayout = {
  axis: 'vertical',
  placement: 'right',
  rect: { x: 879, y: 120, width: 48, height: 525 },
  containerProps: {
    'data-duo-react-bar-axis': 'vertical',
    'data-duo-react-bar-placement': 'right',
    style: {},
  },
}

test('helpers require a frame surface and server rendering defers portals', () => {
  const layout = tabLayout
  const items = [{ id: 'home', label: 'Home', icon: <span>H</span> }]
  const onSelect = () => {}
  expect(() =>
    renderToString(
      <DuoProvider>
        <DuoTabBar layout={layout} items={items} selectedId="home" onSelect={onSelect} />
      </DuoProvider>,
    ),
  ).toThrow('inside DuoFrame')
  expect(() =>
    renderToString(
      <DuoProvider>
        <DuoToolbar />
      </DuoProvider>,
    ),
  ).toThrow('inside DuoFrame')
  const html = renderToString(
    <DuoProvider>
      <DuoFrame>
        <DuoTabBar layout={layout} items={items} selectedId="home" onSelect={onSelect} />
        <DuoToolbar />
      </DuoFrame>
    </DuoProvider>,
  )
  expect(html.match(/data-duo-react-accessory-host=""/g)).toHaveLength(1)
  expect(html).not.toContain('Home')
})

test('tab items require stable unique IDs before mounting', () => {
  const layout = tabLayout
  const render = (ids: string[]) =>
    renderToString(
      <DuoProvider>
        <DuoFrame>
          <DuoTabBar
            layout={layout}
            items={ids.map((id) => ({ id, label: 'Home', icon: <span>H</span> }))}
            selectedId="home"
            onSelect={() => {}}
          />
        </DuoFrame>
      </DuoProvider>,
    )
  expect(() => render(['home', 'home'])).toThrow('duplicate item id "home"')
  expect(() => render([' '])).toThrow('non-empty id')
  expect(() => render([])).not.toThrow()
})
