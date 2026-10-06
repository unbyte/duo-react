# Duo React

React components for previewing applications on iPhone Duo, including a device
frame, adaptive tab bars and toolbars, system indicators, and layout helpers.
Preview your app on the inner or outer display, rotate the device, and try
full-screen or split layouts without losing app state.

Requires React and React DOM 16.8–19 and a modern browser with ResizeObserver and
CSS container-query support.

## Getting started

Import the stylesheet once, wrap the preview in `DuoProvider`, and give the frame
a definite height:

```tsx
import * as React from "react"
import { DuoFrame, DuoProvider, DuoSafeArea } from "duo-react"
import "duo-react/style.css"

export function Preview() {
  return (
    <DuoProvider>
      <DuoFrame style={{ width: "100%", height: 640 }}>
        <DuoSafeArea style={{ height: "100%", overflow: "auto" }}>
          <App />
        </DuoSafeArea>
      </DuoFrame>
    </DuoProvider>
  )
}
```

The preview starts fully open in landscape, with the app filling the inner
display. It scales to fit the frame. Use `height: "100%"` if the parent already
has a definite height.

Mount one frame per provider. Use separate providers for independent previews.
Changing the display, orientation, placement, or zoom preserves your app's
component state. Changing a component's key or type still resets it as usual.

## Preview controls

Place controls anywhere inside the same provider as the frame:

```tsx
import {
  DuoDisplayControls,
  DuoLayoutControls,
  DuoRotationControls,
  DuoControls,
  DuoZoomControls,
} from "duo-react"

<DuoControls className="preview-controls">
  <DuoDisplayControls />
  <DuoRotationControls />
  <DuoLayoutControls />
  <DuoZoomControls />
</DuoControls>
```

Choose **Closed** for the outer display, or **Partially open** or **Fully open**
for the inner display. Rotation controls turn the device in 90° steps. Layout
controls select the left, full, or right app window on the inner display; split
windows are available in landscape. Rotating into portrait selects the full
window. Zoom controls enlarge, reduce, or fit the preview.

The groups can be omitted, reordered, or used without `DuoControls`. Supply your
own control layout and button styling. Buttons have accessible names and expose
selection through `aria-pressed`; style them with `[data-duo-action]`,
`[aria-pressed="true"]`, and `:disabled`. Icons inherit `currentColor`.

For custom controls, call actions from an event handler:

```tsx
import { useDuoActions } from "duo-react"

function CloseDeviceButton() {
  const { setPosture } = useDuoActions()
  return <button onClick={() => setPosture("closed")}>Close device</button>
}
```

Set initial preview settings with `defaultState` on the provider, for example
`defaultState={{ posture: "closed", orientation: "portrait", zoom: "fit" }}`.
Defaults are read once. Use actions for later changes; `resetDevice()` restores
the provider defaults while preserving your app's state.

## Adapting your app

Use `DuoSafeArea` to keep content clear of the display edges and system controls.
For custom spacing, use the inherited safe-area properties directly:

```css
.app-content {
  padding:
    var(--duo-safe-area-inset-top)
    var(--duo-safe-area-inset-right)
    var(--duo-safe-area-inset-bottom)
    var(--duo-safe-area-inset-left);
}
```

Apply safe-area padding once to avoid doubling it. The frame does not add
padding to your app automatically.

Inside the frame, `useDuoScreen()` gives you the active app window's dimensions
and effective orientation:

```tsx
import { useDuoScreen } from "duo-react"

function App() {
  const { window } = useDuoScreen()
  return window.width < 600 ? <CompactLayout /> : <WideLayout />
}
```

Screen dimensions and safe-area values use app CSS pixels before preview zoom.
For CSS-based responsive layouts, use the `duo-screen` container:

```css
@container duo-screen (min-width: 600px) {
  .app-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

Viewport units and media queries in ordinary React content refer to the host
page. Container queries respond to the app window instead.

Safe-area padding covers the edges. Use `useDuoScreen().reservedRegions` when
positioning controls around camera regions or the fold in a partially open
device. These rectangles use coordinates relative to the app window. The frame
leaves content arrangement around them to your app.

Set `outerPortraitLocked` on `DuoProvider` to keep the outer app in portrait as
the device rotates. Read the app's effective orientation with `useDuoScreen()`;
`useDuoState((state) => state.orientation)` reports the device orientation. When
the outer display turns upside down without the lock, its app retains its last
supported layout, or portrait if started upside down.

### Embedding an existing page

Use an iframe when the app needs its own viewport, media queries, and native
resize events:

```tsx
<DuoFrame style={{ height: 640 }}>
  <iframe
    title="Application preview"
    src="/app"
    style={{ display: "block", width: "100%", height: "100%", border: 0 }}
  />
</DuoFrame>
```

Keep the iframe's key and navigation attributes stable to preserve its page
while changing the preview. React context and safe-area CSS properties do not
cross into the iframe. If the embedded app needs screen information, send it
through your own `postMessage` bridge with source and origin checks.

`useDuoEvent("windowchange", handler)` lets you react after screen layout or
visibility changes. Its event includes `display`, `previous`, and `current`
screen information. Zoom changes do not trigger this event.

## System appearance

Use `defaultSystem` to choose the initial appearance and displayed status:

```tsx
<DuoProvider
  defaultSystem={{
    colorMode: "dark",
    time: "09:41",
    battery: 75,
    charging: true,
    homeIndicatorVisible: true,
  }}
>
  <DuoFrame style={{ height: 640 }}>
    <App />
  </DuoFrame>
</DuoProvider>
```

Change settings later with `useDuoActions().setSystem()` from an event handler
or effect. Partial updates preserve other settings.

The simulated color mode is independent of the host page. It sets default
display colors and the color scheme for native controls and the tab bar. Read
it with `useDuoState((state) => state.system.colorMode)` to choose your app's
palette. Your explicit app colors remain under your control; media queries in
the host document still follow the host's preference.

Status and home indicators automatically choose black or white against your
content. For a fixed foreground, set an indicator preference, for example:

```tsx
setSystem({
  indicatorStyles: {
    outer: { statusBar: "light", homeIndicator: "light" },
  },
})
```

Here, `"light"` means white indicators, `"dark"` means black, and `"auto"`
restores automatic contrast. Automatic contrast and glass effects may not
reflect cross-origin iframe content or externally hosted resources reliably;
use an explicit indicator preference when needed.

The status bar is shown on the inner display and in outer portrait by default.
Set `prefersStatusBarHidden: true` to hide it, `false` to show it in every
layout, or `undefined` to restore the default. This leaves safe-area spacing
unchanged. `showSystemUI={false}` on the frame also hides the home indicator;
the outer camera cutout remains visible.

## App navigation and actions

Use `DuoTabBar` for controlled navigation. Inside your app, request its placement
with `useBars`, then update the selected destination in `onSelect`:

```tsx
import * as React from "react"
import { DuoTabBar, useBars } from "duo-react"

function App() {
  const [selectedId, setSelectedId] = React.useState("home")
  const bars = useBars({ tabbar: {} })

  return (
    <>
      <YourContent destination={selectedId} />
      <DuoTabBar
        layout={bars.tabbar}
        items={[
          { id: "home", icon: <HomeIcon />, label: "Home" },
          { id: "library", icon: <LibraryIcon />, label: "Library" },
        ]}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </>
  )
}
```

The bar adapts between horizontal and vertical layouts and stays attached to
the app window while content scrolls. Your app owns navigation. `onSelect`
also fires when the current destination is activated again. Use unique item
IDs and icons that inherit `currentColor`; set an item's `selectedColor` to
customize its selected icon and label.

Bars overlay content without adding safe-area padding. Leave room for them in
your content layout, and keep the number of destinations small enough to fit;
the tab bar does not scroll or provide an overflow menu.

For a simple group of app actions, render your buttons in `DuoToolbar` inside
the frame. It places them at an edge appropriate to the current layout:

```tsx
import { DuoToolbar } from "duo-react"

<DuoToolbar aria-label="Document actions">
  <button onClick={createDocument}>New</button>
</DuoToolbar>
```

When custom toolbars need to share space with a tab bar, declare them together
in one `useBars` request:

```tsx
const bars = useBars({
  toolbars: [{ id: "actions", placement: "top-trailing" }],
  tabbar: {},
})

return (
  <div style={{ position: "relative", width: "100%", height: "100%" }}>
    <YourContent />
    {bars.toolbars.map((bar) => (
      <div key={bar.id} {...bar.containerProps}>
        <YourToolbar axis={bar.axis} />
      </div>
    ))}
    <DuoTabBar layout={bars.tabbar} items={items} selectedId={selectedId} onSelect={onSelect} />
  </div>
)
```

Keep custom toolbar wrappers beside scrolling content in a positioned container
covering the app window. Use the returned axis to arrange your actions within
their allocated space. Separate `useBars` calls and `DuoToolbar` do not
coordinate with this request.

## Zoom

By default, provider actions and zoom controls manage the preview scale.
`"fit"` scales and centers the device within the frame's padded area.
`fitPadding` accepts a nonnegative finite number for all sides, or an object with
optional `top`, `right`, `bottom`, and `left` values. The default and each omitted
side are 24px. Padding is measured in preview CSS pixels before device scaling.

For example, `fitPadding={{ bottom: 104 }}` leaves extra space for controls below
the device and moves the fitted center 40px upward. The full frame remains
available for rendering and interaction.

A positive numeric zoom sets a fixed scale: `1` displays one app CSS pixel as
one preview CSS pixel. Numeric zoom uses the frame's center and ignores fit
padding; larger scales can crop the device.

For controlled zoom, pass both `zoom` and `onZoomChange`:

```tsx
import * as React from "react"
import { DuoFrame, DuoProvider, type DuoZoom } from "duo-react"

function PreviewWithZoom() {
  const [zoom, setZoom] = React.useState<DuoZoom>("fit")

  return (
    <DuoProvider>
      <DuoFrame zoom={zoom} onZoomChange={setZoom} style={{ height: 640 }}>
        <App />
      </DuoFrame>
    </DuoProvider>
  )
}
```

A `zoom` prop without `onZoomChange` fixes the scale and disables the zoom
controls.

Zoom changes presentation without resizing the app's layout. Use
`useDuoState((state) => state.renderedZoom)` if you need the actual fitted scale;
it is unavailable before measurement. DOM `getBoundingClientRect()` values
include preview scaling and rotation.

## Inspecting safe areas

Add `DuoRegionMask` beside the frame to inspect safe areas, reserved regions,
and the split-window gap. The mask renders only the overlay. Use
`useDuoRegions()` inside `DuoProvider` to render your own labels or other region
information anywhere, including outside `DuoFrame`. It returns the active
display's regions, with IDs, names, kinds, and rectangles in unscaled
display CSS pixels, and updates when the provider's geometry changes.

Highlighting is controlled by `highlightedRegionId`. The optional
`onHighlightedRegionChange` callback reports the ID under the pointer, or
`undefined` when it leaves. Share this state with your own list to link
interactions in either direction:

```tsx
import * as React from "react"
import { DuoFrame, DuoProvider, DuoRegionMask, useDuoRegions } from "duo-react"

function RegionPreview() {
  const frame = React.useRef<HTMLDivElement>(null)
  const regions = useDuoRegions()
  const [highlightedRegionId, setHighlightedRegionId] = React.useState<string>()

  return (
    <>
      <div style={{ position: "relative", height: 700 }}>
        <DuoFrame ref={frame} style={{ height: "100%" }}>
          <App />
        </DuoFrame>
        <DuoRegionMask
          frameRef={frame}
          highlightedRegionId={highlightedRegionId}
          onHighlightedRegionChange={setHighlightedRegionId}
        />
      </div>
      <ul>
        {regions.map((region) => (
          <li key={region.id}>
            <button
              type="button"
              onMouseEnter={() => setHighlightedRegionId(region.id)}
              onMouseLeave={() => setHighlightedRegionId(undefined)}
              onFocus={() => setHighlightedRegionId(region.id)}
              onBlur={() => setHighlightedRegionId(undefined)}
            >
              {region.name}: {region.width} × {region.height}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

function LayoutPreview() {
  return (
    <DuoProvider>
      <RegionPreview />
    </DuoProvider>
  )
}
```

The mask highlights only IDs present in the current region list; stale IDs do
not dim the other regions. Your UI controls label content, placement, focus
handling, and overlay visibility. Hide the mask to interact with the app beneath it.
