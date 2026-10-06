import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { expect, expectTypeOf, test } from 'vitest'
import {
  type BarsLayoutRequest,
  DuoFrame,
  DuoProvider,
  type ResolvedBarLayout,
  useBars,
} from '../src'

test('the hook renders custom content with application context on React 16.8 and the server', () => {
  const Label = React.createContext('missing')
  function App() {
    const label = React.useContext(Label)
    const bars = useBars({ toolbars: [{ id: 'actions', placement: 'top-trailing' }], tabbar: {} })
    for (const bar of [...bars.toolbars, bars.tabbar]) {
      expect(bar.containerProps.style).toMatchObject({
        position: 'absolute',
        left: bar.rect.x,
        top: bar.rect.y,
        width: bar.rect.width,
        height: bar.rect.height,
        flexDirection: bar.axis === 'horizontal' ? 'row' : 'column',
      })
      expect(bar.containerProps['data-duo-react-bar-placement']).toBe(bar.placement)
      expect(bar.containerProps['data-duo-react-bar-axis']).toBe(bar.axis)
    }
    return (
      <>
        <nav {...bars.toolbars[0].containerProps}>{label}</nav>
        <nav {...bars.tabbar.containerProps}>Tabs</nav>
      </>
    )
  }
  expect(() => renderToString(<App />)).toThrow('within DuoFrame')
  for (const orientation of ['portrait', 'landscape-right'] as const) {
    const html = renderToString(
      <DuoProvider defaultState={{ orientation }}>
        <DuoFrame>
          <Label.Provider value="App actions">
            <App />
          </Label.Provider>
        </DuoFrame>
      </DuoProvider>,
    )
    expect(html).toContain('App actions')
    expect(html).toContain('Tabs')
    expect(html).toContain(
      `data-duo-react-bar-placement="${orientation === 'portrait' ? 'top' : 'right'}"`,
    )
    expect(html).toContain(`left:${orientation === 'portrait' ? 20 : 879}px`)
  }
})

test('the hook infers tab bar presence from the request', () => {
  function App({ request }: { request: BarsLayoutRequest }) {
    const requested = useBars({ tabbar: {} })
    const omitted = useBars({ toolbars: [] })
    const empty = useBars()
    const explicitlyAbsent = useBars({ tabbar: undefined })
    const conditional = useBars({ tabbar: request.tabbar })
    const dynamic = useBars(request)

    expectTypeOf(requested.tabbar).toEqualTypeOf<ResolvedBarLayout>()
    expectTypeOf(omitted.tabbar).toEqualTypeOf<undefined>()
    expectTypeOf(empty.tabbar).toEqualTypeOf<undefined>()
    expectTypeOf(explicitlyAbsent.tabbar).toEqualTypeOf<undefined>()
    expectTypeOf(conditional.tabbar).toEqualTypeOf<ResolvedBarLayout | undefined>()
    expectTypeOf(dynamic.tabbar).toEqualTypeOf<ResolvedBarLayout | undefined>()

    expect(requested.tabbar.rect.width).toBeGreaterThan(0)
    expect(omitted.tabbar).toBeUndefined()
    expect(empty.tabbar).toBeUndefined()
    expect(explicitlyAbsent.tabbar).toBeUndefined()
    expect(conditional.tabbar !== undefined).toBe(request.tabbar !== undefined)
    expect(dynamic.tabbar !== undefined).toBe(request.tabbar !== undefined)
    return null
  }

  for (const request of [{}, { tabbar: {} }]) {
    renderToString(
      <DuoProvider>
        <DuoFrame>
          <App request={request} />
        </DuoFrame>
      </DuoProvider>,
    )
  }
})
