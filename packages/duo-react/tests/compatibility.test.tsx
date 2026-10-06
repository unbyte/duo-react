import { getDuoGeometry, safeAreaStyle } from "../src"
import * as React from "react"
import { renderToStaticMarkup, renderToString } from "react-dom/server"
import { expect, test } from "vite-plus/test"
import {
  DuoFrame,
  DuoRegionMask,
  DuoProvider,
  DuoControls,
  DuoDisplayControls,
  DuoLayoutControls,
  DuoRotationControls,
  DuoZoomControls,
  useDuoState,
  useDuoScreen,
  useDuoRegions,
} from "../src/index"
import { DuoStore, getDuoRegions } from "@duo-react/core"

function ReadState() {
  const width = useDuoState((state) => state.screens.inner.window.width)
  return <span>{width}</span>
}

test("system color mode reaches app context and the active display on the first render", () => {
  function App() {
    const colorMode = useDuoState((state) => state.system.colorMode)
    return <span>{`mode:${colorMode}`}</span>
  }
  for (const posture of ["open", "closed"] as const) {
    for (const colorMode of ["light", "dark"] as const) {
      const html = renderToString(
        <DuoProvider defaultState={{ posture }} defaultSystem={{ colorMode }}>
          <DuoFrame>
            <App />
          </DuoFrame>
        </DuoProvider>,
      )
      expect(html).toContain(`mode:${colorMode}`)
      expect(html).toContain(`data-duo-react-color-mode="${colorMode}"`)
      expect(html).toContain(`color-scheme:${colorMode}`)
      expect(html).toContain(`data-duo-react-display="${posture === "closed" ? "outer" : "inner"}"`)
    }
  }
})

test("provider portrait lock reaches frame children on the first server render", () => {
  function App() {
    const screen = useDuoScreen()
    const physical = useDuoState((state) => state.orientation)
    const locked = useDuoState((state) => state.outerPortraitLocked)
    return <span>{`${physical}:${screen.orientation}:${screen.window.width}:${locked}`}</span>
  }
  const html = renderToString(
    <DuoProvider
      outerPortraitLocked
      defaultState={{ posture: "closed", orientation: "landscape-left" }}
    >
      <DuoFrame>
        <App />
      </DuoFrame>
    </DuoProvider>,
  )
  expect(html).toContain("landscape-left:portrait:466:true")
})

test("provider and selector hooks render with the React 16.8 baseline", () => {
  expect(React.version).toBe("16.8.6")
  expect(
    renderToString(
      <DuoProvider defaultState={{ innerPlacement: "left" }}>
        <ReadState />
      </DuoProvider>,
    ),
  ).toContain("469")
  expect(
    renderToString(
      <DuoProvider>
        <ReadState />
      </DuoProvider>,
    ),
  ).toContain("951")
})

test("frame can be server-rendered without browser globals", () => {
  const html = renderToString(
    <DuoProvider>
      <DuoFrame>
        <span>App content</span>
      </DuoFrame>
    </DuoProvider>,
  )
  expect(html).toContain('data-duo-react-window="inner"')
  expect(html).not.toContain('data-duo-react-window="outer"')
  expect(html).toContain("App content")
  expect(html).not.toContain('class="duo-react-indicator duo-react-home"')
  expect(html).not.toContain('class="duo-react-divider"')
})

test("asymmetric fit padding shifts the frame center and leaves numeric zoom centered", () => {
  const render = (zoom: "fit" | number) =>
    renderToString(
      <DuoProvider>
        <DuoFrame zoom={zoom} fitPadding={{ top: 24, bottom: 104, left: 84 }}>
          <span>App content</span>
        </DuoFrame>
      </DuoProvider>,
    ).match(/class="duo-react-rotation" style="([^"]+)"/)?.[1]
  expect(render("fit")).toContain("left:calc(50% + 30px)")
  expect(render("fit")).toContain("top:calc(50% + -40px)")
  expect(render(2)).not.toContain("left:")
  expect(render(2)).not.toContain("top:")
})

test("both displays preserve the supplied time including leading zeros", () => {
  for (const posture of ["open", "closed"] as const) {
    for (const time of ["00:00", "00:05", "01:09", "09:41", "9:41", "10:05", "12:00", "23:59"]) {
      const html = renderToString(
        <DuoProvider defaultState={{ posture, orientation: "portrait" }} defaultSystem={{ time }}>
          <DuoFrame>
            <span>App content</span>
          </DuoFrame>
        </DuoProvider>,
      )
      expect(html.match(/<text\b[^>]*>([^<]*)<\/text>/)?.[1]).toBe(time)
    }
  }
})

test("region masks can be server-rendered before frame measurement", () => {
  const html = renderToString(
    <DuoProvider>
      <DuoRegionMask
        frameRef={React.createRef<HTMLDivElement>()}
        theme="dark"
        highlightedRegionId="safe-area"
        onHighlightedRegionChange={() => {}}
      />
    </DuoProvider>,
  )
  expect(html).toContain('class="duo-react-region-mask"')
  expect(html).toContain('data-duo-react-theme="dark"')
  expect(html).not.toContain("clipPath")
  expect(html).toContain('data-duo-react-inspecting="true"')
  expect(html).not.toContain("duo-react-region-label")
  expect(html).not.toContain("highlightedRegionId")
})

test("region data is available outside the frame and follows the active provider geometry", () => {
  function ReadRegions() {
    const regions = useDuoRegions()
    return <pre>{JSON.stringify(regions)}</pre>
  }
  for (const posture of ["open", "partially-open", "closed"] as const) {
    for (const innerPlacement of ["full", "left", "right"] as const) {
      for (const cameraActive of [false, true]) {
        const defaults = { posture, innerPlacement, orientation: "landscape-left" } as const
        const state = new DuoStore(defaults, { cameraActive }, true).getSnapshot()
        const html = renderToStaticMarkup(
          <DuoProvider defaultState={defaults} defaultSystem={{ cameraActive }} outerPortraitLocked>
            <ReadRegions />
          </DuoProvider>,
        )
        expect(html).toBe(
          renderToStaticMarkup(
            <pre>
              {JSON.stringify(
                getDuoRegions(
                  state.screens[posture === "closed" ? "outer" : "inner"],
                  cameraActive,
                  posture,
                ),
              )}
            </pre>,
          ),
        )
      }
    }
  }
})

test("frame children receive the active display's screen context on the server", () => {
  function App() {
    const screen = useDuoScreen()
    return <span>{`${screen.display}:${screen.window.width}`}</span>
  }
  for (const posture of ["open", "closed", "partially-open"] as const) {
    const html = renderToString(
      <DuoProvider defaultState={{ posture, orientation: "portrait" }}>
        <DuoFrame>
          <App />
        </DuoFrame>
      </DuoProvider>,
    )
    expect(html).toContain(posture === "closed" ? "outer:466" : "inner:669")
    expect(html.match(/class="duo-react-window"/g)).toHaveLength(1)
  }
})

test("split chrome is passive and the home indicator is opt-in", () => {
  const render = (showSystemUI: boolean) =>
    renderToString(
      <DuoProvider
        defaultState={{ innerPlacement: "right" }}
        defaultSystem={{ homeIndicatorVisible: true }}
      >
        <DuoFrame showSystemUI={showSystemUI}>
          <span>App content</span>
        </DuoFrame>
      </DuoProvider>,
    )
  const visible = render(true)
  expect(visible).toContain('class="duo-react-divider"')
  expect(visible).toContain('class="duo-react-indicator duo-react-home"')
  expect(visible).toContain('class="duo-react-status-material"')
  const hidden = render(false)
  expect(hidden).not.toContain('class="duo-react-divider"')
  expect(hidden).not.toContain('class="duo-react-indicator duo-react-home"')
  expect(hidden).not.toContain('class="duo-react-status-material"')
})

test("outer landscape hides status and capsule while retaining the camera and optional home indicator", () => {
  function App() {
    return <span>{`status:${useDuoScreen().statusBarVisible}`}</span>
  }
  for (const orientation of ["portrait", "landscape-left", "landscape-right"] as const) {
    for (const locked of [false, true]) {
      for (const showSystemUI of [false, true]) {
        const expected = locked || orientation === "portrait"
        const html = renderToString(
          <DuoProvider
            outerPortraitLocked={locked}
            defaultState={{ posture: "closed", orientation }}
            defaultSystem={{ homeIndicatorVisible: true }}
          >
            <DuoFrame showSystemUI={showSystemUI}>
              <App />
            </DuoFrame>
          </DuoProvider>,
        )
        expect(html).toContain(`status:${expected}`)
        expect(html.includes('class="duo-react-status"')).toBe(expected && showSystemUI)
        expect(html.includes('class="duo-react-status-material"')).toBe(expected && showSystemUI)
        expect(html).toContain('class="duo-react-camera-cutout"')
        expect(html.includes('class="duo-react-indicator duo-react-home"')).toBe(showSystemUI)
      }
    }
  }
})

test("app status preference reaches children and rendering while retaining independent chrome", () => {
  function App() {
    return <span>{`status:${useDuoScreen().statusBarVisible}`}</span>
  }
  for (const posture of ["open", "closed"] as const) {
    for (const prefersStatusBarHidden of [true, false]) {
      for (const showSystemUI of [true, false]) {
        const html = renderToString(
          <DuoProvider
            defaultState={{ posture }}
            defaultSystem={{ prefersStatusBarHidden, homeIndicatorVisible: true }}
          >
            <DuoFrame showSystemUI={showSystemUI}>
              <App />
            </DuoFrame>
          </DuoProvider>,
        )
        expect(html).toContain(`status:${!prefersStatusBarHidden}`)
        expect(html.includes('class="duo-react-status"')).toBe(
          showSystemUI && !prefersStatusBarHidden,
        )
        expect(html.includes('class="duo-react-status-material"')).toBe(
          showSystemUI && !prefersStatusBarHidden,
        )
        expect(html.includes('class="duo-react-indicator duo-react-home"')).toBe(showSystemUI)
        expect(html.includes('class="duo-react-camera-cutout"')).toBe(posture === "closed")
      }
    }
  }
})

test("headless control groups compose independently with the React 16.8 baseline", () => {
  const standalone = renderToString(
    <DuoProvider>
      <DuoRotationControls className="my-rotation" />
    </DuoProvider>,
  )
  expect(standalone).toContain('class="my-rotation"')
  expect(standalone).toContain('aria-label="Rotate left"')
  expect(standalone).not.toContain('data-duo-react-control-group="zoom"')
  const composed = renderToString(
    <DuoProvider defaultState={{ posture: "closed" }}>
      <DuoControls className="my-controls">
        <DuoZoomControls />
        <DuoDisplayControls />
        <DuoLayoutControls />
      </DuoControls>
    </DuoProvider>,
  )
  expect(composed).toContain('class="duo-react-controls my-controls"')
  expect(composed).toContain('aria-label="Zoom in"')
  expect(composed).toContain('aria-label="Closed"')
  expect(composed).not.toContain('data-duo-react-control-group="layout"')
})

test("partial posture selects its own control and keeps landscape layout controls available", () => {
  const html = renderToString(
    <DuoProvider defaultState={{ posture: "partially-open" }}>
      <DuoDisplayControls />
      <DuoLayoutControls />
    </DuoProvider>,
  )
  expect(html).toMatch(/data-duo-react-action="partially-open" aria-pressed="true"/)
  expect(html).toMatch(/data-duo-react-action="inner" aria-pressed="false"/)
  expect(html).toMatch(/data-duo-react-action="outer" aria-pressed="false"/)
  expect(html).toContain('data-duo-react-control-group="layout"')
  expect(html).not.toContain("disabled")
})

test("safe-area CSS uses the resolved window insets", () => {
  const right = getDuoGeometry({
    display: "inner",
    orientation: "landscape-left",
    placement: "right",
  })
  expect(safeAreaStyle(right.safeArea)).toEqual({
    "--duo-react-safe-area-inset-top": "0px",
    "--duo-react-safe-area-inset-right": "84px",
    "--duo-react-safe-area-inset-bottom": "34px",
    "--duo-react-safe-area-inset-left": "0px",
  })
})
