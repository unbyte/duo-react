# Duo Frame

A React device frame for previewing applications on iPhone Duo.

The current implementation is a flat layout prototype: a provider, one persistent
app surface for the active display, measured window geometry, safe-area CSS properties,
zoom, passive system indicators, and an optional toolbar. Status artwork follows
the supplied image; its scale calibration still needs visual acceptance. The device
outline is schematic, with passive buttons and hinge details on both displays,
estimated from the supplied screenshot and projected mesh bounds. Apple's model,
calibrated bezel, folding animation,
hardware events, and asset CLI are not implemented yet.

Read [the design](docs/design.md) for the architecture and rendering decisions still
needed before the 3D implementation. The [calibration review](docs/calibration/README.md)
records control measurements, reference data, and remaining accuracy gaps.

## Preview and development

Use pnpm 11.21.0 and run the commands below from the workspace root. Shared
tooling is installed there; this package owns its source, tests, and build config.
See the [workspace guide](../../README.md) for the complete command list.

```sh
pnpm install
pnpm dev@19
# In another terminal:
pnpm dev@16
```

Open [React 19](http://127.0.0.1:5119) or [React 16](http://127.0.0.1:5116).
Each demo consumes the built package with its own React runtime. The launch
commands build the library first; run `pnpm watch` in another terminal to rebuild
while editing. `pnpm dev` starts the React 19 demo.

Both demos render one React app with a counter and a text input. Change either,
switch the inner window between left, right, and full, then switch to the outer
display and back. Content should keep its state.

The appearance controls share one row and wrap on smaller screens. **Background**
previews light, dark, gray, and mixed content; **Icons** selects automatic, white,
or black indicators. **Camera** simulates inner-camera activity through
`cameraActive`; enable **Regions** to see its reserved area. **Regions** toggles
the layout overlay. Independent **Toolbars** and **Tab bar** toggles exercise all
four bar-presence combinations. Choose one to three toolbars, edit each
placement and axis, and switch tabs between **Packed** and **Edges**.
**Bar bounds** outlines the allocated rectangles independently of the content.
Toolbar counters and tab selection persist while changing the configuration.

Open **Inspector** on the right to switch between **Provider** state and the
**Bars** request and resolved layouts, including `rect` and `containerProps`.

Drag the blue block beneath the system controls to inspect the capsule's blur.
Use the native **Color** picker to try black, white, or any other block color.
Mouse, touch, and pen dragging follow preview zoom and rotation. Focus the block
and use arrow keys to move it (Shift for finer movement), or Home to reset it.
The block has no focus border or ring.
**Block** hides it for solid-background comparisons; its relative position is
preserved when switching displays, layouts, or visibility. With **Icons** set to
Auto, the clock and combined indicator independently choose black or white from
the content beneath them. Fixed white or black settings override that selection.

Enable **Regions** for the library's interactive `DuoRegionMask`. It shows the
app safe area and nonzero insets, active whole-display reserved regions, and the
Split View gap. Hover a region or its label to highlight both; labels also support
keyboard focus. Category colors stay stable. The highlighted region gains a thin
solid edge while other masks and labels fade together. Labels keep their matching
category colors in both themes.
The mask follows placement, orientation, and zoom without remounting content.

Labels use the Safe Area dataset's names: **Safe area**, **Top inset**, **Right
inset**, **Bottom inset**, **Left inset**, `occlusion`, and `division`. Separate
occlusions retain the same source name and show their respective dimensions.
**Split View gap** is a descriptive label for the inferred gap, not an Xcode
reserved-region kind. Dimensions are in device points (pt); one point maps to one
app CSS pixel before preview zoom.

The 40pt `division` appears only while partially open; the 13pt Split View gap
appears whenever a split window is selected. In split view, the folding region
extends 13.5pt into each app window: 13.5 + 13 + 13.5 = 40pt. See the
[folding-region calibration](docs/calibration/folding-region.md).

Resize the browser window and use the zoom control to compare resizing with
scaling. The parent supplies a definite height while the frame uses `height: 100%`.
Portrait requires full-screen placement; unsupported profiles are rejected.

```sh
pnpm build:demos
pnpm check
pnpm test --run
```

The package targets React 16.8 through React 19. The previews use React 16.14 and
19.3 in Strict Mode; unit checks use React 16.8.6 and library declarations are
built with React 16 types. React 17 and 18 are within the peer range but do not
have separate demos. React compatibility does not imply old-browser support:
the prototype requires ResizeObserver and modern CSS, including container queries
for app layout. Only the active display is rendered.

Commit meaningful changes after checking them. Use the demos for manual
acceptance and focused unit tests for state and geometry. Defer E2E and visual
regression suites during this iteration stage.

## Component usage

```tsx
import {
  DuoFrame,
  DuoProvider,
  DuoToolbar,
  DuoDisplayControls,
  DuoRotationControls,
  DuoLayoutControls,
  DuoZoomControls,
} from "duo-frame"
import "duo-frame/style.css"

<DuoProvider
  defaultState={{ orientation: "landscape-left", innerPlacement: "full", zoom: "fit" }}
  defaultSystem={{ time: "09:41", battery: 100 }}
>
  <DuoFrame style={{ width: "100%", height: 640 }}>
    <App />
  </DuoFrame>
  <DuoToolbar className="preview-toolbar">
    <DuoDisplayControls className="preview-group" />
    <DuoRotationControls className="preview-group" />
    <DuoLayoutControls className="preview-group" />
    <DuoZoomControls className="preview-group" />
  </DuoToolbar>
</DuoProvider>
```

The posture buttons select Closed, Partially open, or Fully open. Closed shows
the outer display; both open postures show the inner display. `DuoFrame` renders
one `children` tree in a stable host, updating its dimensions and screen context when switching.
The child can adapt through `useDuoScreen()` or `useDuoState()` without remounting.
Call `setPosture("open")`, `setPosture("partially-open")`, or `setPosture("closed")`
through `useDuoActions()` to select these states programmatically.

Use `<DuoFrame><App /></DuoFrame>` in place of the separate `inner` and `outer`
props. The frame preserves the child’s identity across display, orientation,
placement, and zoom changes. Normal React rules still apply inside `App`: changing
a component type or key remounts that component. Separate per-display app state,
when needed, belongs to the child. The 2D frame does not animate fold/unfold or
render two displays simultaneously.

The toolbar is headless. Each control group works independently anywhere under
`DuoProvider`; omit or reorder groups as needed. `DuoToolbar` is an optional
container and renders only its children. Each component forwards its div ref and
accepts normal div attributes, including `className` and `style`. The demos supply
the floating placement, pill backgrounds, and button styling.

| Group                 | Buttons                            | Behavior                                                             |
| --------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| `DuoDisplayControls`  | Closed, partially open, fully open | Selects posture without remounting apps                              |
| `DuoRotationControls` | Left, right                        | Rotates by 90° in either direction without stopping                  |
| `DuoLayoutControls`   | Left, full, right                  | Hidden on the outer display; split layouts disabled in portrait      |
| `DuoZoomControls`     | Out, in, fit                       | Divides or multiplies the current scale by 1.25, or restores fitting |

Rotation passes through all four positions, including `portrait-upside-down`.
Each click adds or subtracts 90°; repeated turns retain their direction across
360°. The frame animates the turn and fits the rotated bounds, including during
the transition. Reduced-motion preferences disable the animation. Rotating a
split window into either portrait position selects full width.

`state.rotation` is the clockwise target angle from upright portrait, normalized
to `[0, 360)` (0, 90, 180, or 270 degrees);
`state.orientation` is the requested device orientation. Each display's
`screen.orientation` reports its effective app layout. The inner display has
measured geometry for all four positions. The outer display has no upside-down
safe-area profile, so its app and system controls retain their last supported
layout and rotate together with the shell. Starting upside down uses portrait
as that outer layout. This fallback is a preview policy, not calibrated native
behavior. App state and iframe instances remain mounted throughout.

Set `<DuoProvider outerPortraitLocked={true}>` to keep the outer app in portrait
through every physical rotation. This reactive prop defaults to `false`; changing
it updates the existing app without remounting it. The inner display still follows
device orientation. Children read the effective layout from `useDuoScreen().orientation`,
and can read the physical orientation and lock policy through
`useDuoState(state => state.orientation)` and `state.outerPortraitLocked`.
Unlocking applies the current device orientation, or retains portrait if the
device is upside down. Reset preserves the current provider lock setting.

`setOrientation()` sets the normalized angle and animates the nearest turn from
the previous target. `resetDevice()` restores the initial device orientation and angle.
The same operations are available through `rotate("left" | "right")`, `zoomIn()`,
and `zoomOut()` on `useDuoActions()`.

Buttons include accessible names, tooltips, icons, and native disabled states;
selection buttons expose `aria-pressed`. Style descendants with
`[data-duo-action]`, `[aria-pressed="true"]`, and `:disabled`. Group roots expose
`data-duo-toolbar-group` with `display`, `rotation`, `layout`, or `zoom`. Icons use
`currentColor`; custom Duo icons mark their translucent fill with
`data-duo-icon-tone="secondary"`. The used Lucide icons are bundled into the
package, so consumers do not install an icon dependency.

Mount one frame per provider. Separate providers create independent sessions.
The frame forwards its root div through `ref` and accepts standard div attributes,
`className`, and `style`. Import the stylesheet once. Older bundlers that ignore
package exports can import `duo-frame/dist/style.css`. `showSystemUI={false}` hides
the passive system indicators while retaining the outer display's camera cutout.

The device has no built-in cast shadow. To add one around its silhouette, pass
`style={{ filter: "drop-shadow(0 12px 20px rgb(0 0 0 / 18%))" }}` to `DuoFrame`,
or apply the same filter through `className`.

The status glyph combines a battery arc, Wi-Fi arcs, and cellular dots. Set
`battery` from 0 to 100 to change the arc's length. While `charging`, the battery
arc turns green with a gap at the top for a small lightning mark; Wi-Fi remains
visible. `wifiStrength` accepts integers from 0 to 3, lighting the dot
then the inner and outer arcs. `cellularStrength` accepts integers from 0 to 4,
lighting dots from left to right. Inactive segments remain dim. The defaults are
100% battery, no charging, Wi-Fi strength 3, and cellular strength 0. Configure
these through `defaultSystem` or `setSystem`; both demos expose the same controls.
These indicators have no click or gesture behavior. The SVG is drawn from the supplied image with
a common horizontal axis for the battery, Wi-Fi, and cellular dots. See the
[reference measurements](docs/calibration/status-controls.md) for proportions and
calibration assumptions.

The status group occupies the full display's safe-area edge strip, independently
of app placement. By default, on the outer display, the clock, 3-in-1 control, and capsule are
visible only when the effective app layout is portrait. They remain visible during
physical rotation with `outerPortraitLocked`. Upside-down rotation retains the
visibility of the previous supported layout. Inner status controls remain visible
in all orientations. `useDuoScreen().statusBarVisible` exposes the resolved app
preference and layout default;
`showSystemUI={false}` can additionally suppress rendering. The policy does not
depend on whether that display is currently active (`screen.visible`).

Apps can override the default with `prefersStatusBarHidden`, applying to both displays:

```tsx
<DuoProvider defaultSystem={{ prefersStatusBarHidden: true }}>
  <DuoFrame>
    <App />
  </DuoFrame>
</DuoProvider>

// Inside a component, call setSystem from an event handler or effect.
const { setSystem } = useDuoActions()
setSystem({ prefersStatusBarHidden: false }) // Show, including outer landscape.
setSystem({ prefersStatusBarHidden: true }) // Hide the time, 3-in-1, and capsule.
setSystem({ prefersStatusBarHidden: undefined }) // Restore the layout default.
```

Omitting the property in a partial `setSystem` update preserves the current preference.
Reset restores `defaultSystem`. This preference leaves the camera, home indicator,
app bounds, and measured safe areas intact. `getDuoGeometry()` reports the default
visibility for a layout; `useDuoScreen()` includes the app's preference.

The outer camera cutout uses the square occlusion region in the
geometry profile as a provisional approximation of the visible hole; the inner
display currently renders no camera visual, including when `cameraActive` adds
a reserved region. The home indicator is hidden by default; set
`defaultSystem={{ homeIndicatorVisible: true }}` or call
`setSystem({ homeIndicatorVisible: true })` to show it beneath the current app
window. Split View has a black gap and a passive vertical divider grabber.
Artwork dimensions and spacing are defined in `src/core/layout/system.ts` in app CSS
pixels and scale with the screen. The safe-area dataset establishes the available
regions, not exact icon sizes or native status layouts in every orientation;
those still require manual comparison.

`useDuoState(selector, isEqual?)` subscribes to selected state. `useDuoActions()`
provides posture, orientation, inner placement, zoom, system configuration, and
reset operations. Defaults initialize a provider once. Reset restores those
defaults without resetting consumer component state.

`useDuoScreen()` is available within the frame’s children and tracks the active
display. It returns the display, placement, effective orientation, visibility,
status-bar visibility, display size, window
rectangle, safe insets, and reserved
regions. `cornerRadii` describes the display; `windowCornerRadii` describes the
app window. Both use top-left, top-right, bottom-right, bottom-left order.
Geometry uses app CSS pixels: one pixel per source device point.
`getDuoGeometry()` exposes the same geometry without mounting React.

The inner display supports fully open and partially open layouts in all four
orientations. The closed outer display supports portrait and both landscape
orientations, with the upside-down fallback described above. Inner split windows
are supported in landscape in both open postures. The 13pt split gap is inferred from the reported widths; the source does not supply
window origins. Split windows retain the display's outer corner radii and use a
provisional 32px radius beside the divider, estimated from the
[supplied illustration](docs/calibration/split-view.png). The divider's 4 × 48px
grabber is also provisional. Geometry provenance is recorded in
[src/core/profiles/xcode-27.1.ts](src/core/profiles/xcode-27.1.ts).

### Partial folding

Posture and orientation are independent. `"partially-open"` activates the inner
`foldingRegion` and adds its intersection with the current app window to
`reservedRegions` as a `"division"`. These rectangles use window-local coordinates;
`foldingRegion.frame` uses full-display coordinates. `getDuoGeometry()` accepts
an optional `posture` with the same behavior, defaulting to `"open"`.

For a full landscape window, the division is `(455.5, 0, 40, 669)`. Left and right
split windows receive `(455.5, 0, 13.5, 669)` and `(0, 0, 13.5, 669)` respectively.
Portrait uses `(0, 455.5, 669, 40)`. Window sizes, safe insets, and the 13pt split gap
stay unchanged. A posture change emits `windowchange` after the frame commits,
even when only region activity changes.

Children choose how to respond through `useDuoState()` and `useDuoScreen()`.
Apps may adjust important controls or columns around the division; continuous
scrolling content can stay continuous. The frame does not impose app padding or
split an app into panels. It stays flat, with no hinge angle or folding animation.
Enable **Regions** to inspect the active division; inactive folds are omitted.
See the [calibration and Apple guidance](docs/calibration/folding-region.md).

### Region mask

`DuoRegionMask` renders an inspection overlay beside a `DuoFrame` under the same
provider. Pass the frame's ref and place both in a positioned container with room
for the labels. The mask fills that container; reserve 220px on the right, or
280px below when its width is less than 640px. Labels wrap below the frame on
narrow containers and scroll if space runs out.

```tsx
const frame = React.useRef<HTMLDivElement>(null)

<DuoProvider>
  <div className="preview-with-regions">
    <DuoFrame ref={frame} style={{ height: "100%" }}>
      <App />
    </DuoFrame>
    <DuoRegionMask frameRef={frame} />
  </div>
</DuoProvider>
```

```css
.preview-with-regions {
  position: relative;
  box-sizing: border-box;
  height: 700px;
  padding-right: 220px;
}
/* For a preview that fills the viewport width. */
@media (max-width: 639px) {
  .preview-with-regions {
    padding-right: 0;
    padding-bottom: 280px;
  }
}
```

`theme` accepts `"auto"` (system color preference), `"light"`, or `"dark"`.
The demo follows its Background selector. Normal div attributes, `className`, and
`style` are supported. Each mask has independent hover/focus state and clipping
IDs, so multiple providers can show masks on the same page. Only active reserved
regions and nonzero rectangles are rendered. The mask intercepts pointer events
on its regions while mounted; hide it to interact with the app beneath it.
It renders its measured regions only in the browser and supports React 16.8–19.

### System-control material

The controls sit on a rounded, blurred backdrop: the inner capsule encloses the
clock and combined indicator, and the outer capsule includes the camera as well.
The capsule has no fill or tint: uniform backgrounds retain their color, while
nearby color boundaries are blurred. Without backdrop-filter support it remains
transparent. The foreground stays sharp. The material follows display rotation and preview
zoom, and hides with `showSystemUI={false}`; the outer camera remains visible.
The [calibration note](docs/calibration/status-controls.md#capsule-material) records
the simulator references and estimated material parameters.

### Indicator appearance

Each display has independent status-bar and home-indicator styles. `"light"`
forces white artwork, `"dark"` forces black, and `"auto"` is the default. The camera
cutout stays black. These values describe the foreground, not the app's theme.

Set initial styles through `defaultSystem`:

```tsx
<DuoProvider
  defaultSystem={{
    indicatorStyles: {
      inner: { statusBar: "auto", homeIndicator: "auto" },
      outer: { statusBar: "light", homeIndicator: "dark" },
    },
  }}
>
  {/* Frame and application content */}
</DuoProvider>
```

Change them with `useDuoActions().setSystem()`:

```tsx
const { display } = useDuoScreen()
const { setSystem } = useDuoActions()
setSystem({ indicatorStyles: { [display]: { statusBar: "light" } } })
```

Call the action from an event handler or effect. Partial updates preserve the
other display and the other indicator's setting. Reset restores provider
defaults. Changing appearance does not resize or remount app content. Iframe
owners can forward an explicit preference through their own message bridge.

**Auto samples each control separately.** An SVG backdrop filter averages the rendered
background around each control with a Gaussian blur, takes a small sample near its
center, and expands it across the control. The blur uses a minimum 16px standard
deviation on each axis to reduce sensitivity to small background details.
Linear luminance below 0.18 selects white; otherwise it selects
black. An SVG alpha mask supplies the clock, 3-in-1, or home indicator artwork,
including antialiased edges and subdued cellular dots. Moving a dark block under
only the 3-in-1 can turn it white while the clock remains black.

This happens in the browser's rendering pipeline, without DOM screenshots,
JavaScript pixel reads, observers, or polling. It sees the rendered backdrop,
including the capsule blur. No app color-scheme setting is required or consulted.
Explicit `light` and `dark` styles bypass the filter. Hidden status controls and
their capsule are not rendered; an enabled Auto home indicator remains independent.

The sample is a center-weighted neighborhood average, not a uniform average of
the control's bounds or a calibration of Apple's algorithm. Automatic flips are
instantaneous, without hysteresis; the CSS 120ms color transition applies only
between explicit black/white styles and respects reduced motion.

This experimental filter-and-mask combination passes focused checks in Chrome
154.0.8037.93 for light/dark adaptation, status visibility, portrait locking, and
same-origin iframe backdrops in the React 16 and React 19 demos. Cross-version
parity, particularly at fractional zoom and with thin home-indicator masks, is
not established. Other browser engines are not validated.
CSS syntax detection cannot establish full SVG backdrop-filter
support; use explicit styles where Auto does not render correctly. Browsers
without backdrop-filter syntax support fall back to black. Provider state stores
only the requested modes.

### Safe area and iframe content

Each app host defines four inherited properties in pixels:
`--duo-safe-area-inset-top`, `--duo-safe-area-inset-right`,
`--duo-safe-area-inset-bottom`, and `--duo-safe-area-inset-left`.
`DuoSafeArea` applies them as padding, or consumers can use them directly in CSS.
Window dimensions and reserved regions are available through context.

React and iframe elements remain attached to the same host through placement,
orientation, and visibility changes. Ordinary React content can use container
queries; viewport units and media queries still describe the containing page.
An iframe has its own viewport and receives native resize events when its layout
size changes. Keep its key and navigation attributes stable to preserve it.

`useDuoEvent("windowchange", handler)` receives `{ display, previous, current }`
after a frame applies changed screen geometry or visibility. Camera magnification
does not generate a window event. The current prototype applies placement changes
immediately and does not expose animation lifecycle events.

React context and CSS properties do not cross iframe document boundaries.
Consumers embedding an iframe own any `postMessage` bridge, including source and
origin checks. The library does not inject code into consumer iframe documents.

### App bar positioning

`useBars` coordinates custom toolbars and one optional tab bar. Describe them in
one request, then render your own elements using each result's `containerProps`
or `rect`. Input `axis` defaults to `"adaptive"`; `"horizontal"` keeps a toolbar
on a horizontal edge. Returned `axis` is `"horizontal"` or `"vertical"`.

```tsx
import { useBars } from "duo-frame"

function AppBars() {
  const bars = useBars({
    toolbars: [
      { id: "back", placement: "top-leading", axis: "horizontal" },
      { id: "actions", placement: "top-trailing" },
    ],
    tabbar: { distribution: "packed" },
  })

  return (
    <>
      {bars.toolbars.map((bar) => (
        <div key={bar.id} {...bar.containerProps}>
          <YourToolbar id={bar.id} axis={bar.axis} />
        </div>
      ))}
      {bars.tabbar && (
        <nav {...bars.tabbar.containerProps} aria-label="Destinations">
          <YourNavigation axis={bars.tabbar.axis} />
        </nav>
      )}
    </>
  )
}
```

Mount this component within `DuoFrame`, with a containing block matching the
full app window. Coordinates are app-window CSS pixels before zoom and rotation.
The hook renders no elements or portals. Nested positioned or scrolling ancestors
affect the supplied absolute positioning, so keep the bars in an app-window
layer beside scrolling content. Your React context stays in your own tree.

Each `rect` is an allocated drawing area, not a measurement of your content.
Bars sharing a row or rail receive equal shares after gaps. Toolbar IDs must be
unique, and results retain input order. Bottom toolbars sit above tabs in inner
portrait. `tabbar.distribution` accepts `"packed"` (default) or `"edges"`; it
controls the allocation and alignment without implementing minimization.
Invalid declarations or exhausted space throw errors. Separate hook calls do
not coordinate. Content size, visuals, overflow, navigation, and menus remain
the app's responsibility; bars do not change content safe areas.

The demos' app bar controls use this hook. The [bars design](docs/bars.md) specifies
allocation rules, numeric defaults, and geometric fallbacks. A definite `tabbar`
request returns a definite tab-bar layout; conditional requests retain an optional
result. Exhausted space throws rather than silently omitting a requested bar.

### Tab bar

`DuoTabBar` renders an array of destinations with icons, labels, and controlled
selection. Declare it anywhere within `DuoFrame` children and pass the tab-bar
layout from the same `useBars` request as your other bars.

```tsx
import * as React from "react"
import { DuoTabBar, useBars } from "duo-frame"

function App() {
  const [selectedId, setSelectedId] = React.useState("home")
  const bars = useBars({ tabbar: { distribution: "packed" } })

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

Items have unique, non-empty string IDs, string labels, and React-node icons.
`onSelect(id)` runs on pointer or keyboard activation, including reactivation of
the selected destination. The app owns navigation and updates `selectedId`.
The bar provides native buttons, an accessible navigation region, and
`aria-current="page"` on the selected destination.

The component accepts standard div attributes except `children` and the DOM
`onSelect` event, plus a forwarded div ref. Appearance styles can be supplied,
but the resolved layout owns positioning styles. Private horizontal and vertical
variants share a WebGL glass renderer, spring motion, and artwork loading. Hold
or drag the lens to expand it; holding the vertical rail also reveals labels.
The bar respects reduced motion and defaults to the prototype's light material.
Set `style={{ colorScheme: "dark" }}` to select its dark material.

The renderer uses a neutral backdrop for now; it does not sample app content.
Self-contained SVG icons are uploaded as artwork. Other React icons remain DOM
artwork over the same WebGL material. If WebGL is unavailable, the buttons stay
usable without a replacement material. Keyboard and pointer selection remain
available.

Resting horizontal bars are 62px high, with measured widths of 188/274/400/400px
for two through five items. Vertical bars are 48px wide, with lengths of
112/162/212/262px. The component does not compress, scroll, or choose an overflow
presentation. Developers own fitting their items into the available space. The expanded
vertical rail keeps the same center axis and bottom edge; `useBars` reserves
64px above its allocation for platter growth and lens travel, in addition to
the normal 16px toolbar gap. This is an interaction clearance policy, not a new
native resting inset. Detached actions, minimization, and overflow menus remain
outside this implementation.

The frame owns one stable portal host covering the app window. Tab bars and
toolbar helpers mount into that shared div and position their own content.
App scrolling and nested positioned ancestors do not move the bars. Portal
children retain React context; the controlled selection survives display,
orientation, placement, and zoom changes. Switching axes resets the lens gesture. CSS inheritance follows the frame host; place theme variables
on the frame or styles on the bar. Bars overlay content without changing the
calibrated safe area, so the app owns content clearance.

### Toolbar portal helper

`DuoAppToolbar` remains a positioning wrapper for caller-provided actions, with
standard div attributes and a forwarded div ref. It uses the shared portal host
and its existing automatic accessory placement. `DuoToolbar` is the separate
preview-control container.

```tsx
<DuoAppToolbar className="app-actions" aria-label="Document actions">
  <button onClick={createDocument}>New</button>
</DuoAppToolbar>
```

This helper does not participate in `useBars` allocations. When toolbars must
share space with `DuoTabBar`, resolve them together with `useBars` and render the
custom toolbars in an app-window positioning layer, as shown above. The demo
uses this coordinated approach.

### Zoom ownership

With no frame `zoom` prop, provider actions control zoom. `"fit"` fits the active
display into the container with `fitPadding` (24px by default). A positive finite
number sets the scale: `1` renders one app CSS pixel as one preview CSS pixel.
Changing scale leaves context window dimensions and CSS layout sizes unchanged;
`getBoundingClientRect()` includes the transform and reports visual bounds in the
containing document. Measurements inside an iframe use its own viewport. Numeric
zoom can crop.

For controlled zoom, pass `zoom` and `onZoomChange` to `DuoFrame`. Toolbar and
provider actions request changes through the callback; the caller updates the
prop. A `zoom` prop without a callback is fixed and disables toolbar zoom changes.
The provider's `zoom` reflects the effective value after the frame commits. A
server render uses provider defaults; supply matching defaults for controlled
zoom when server-rendering controls.

`useDuoState()` exposes three distinct zoom fields:

| Field          | Meaning                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `zoom`         | Requested numeric scale or `"fit"` mode                                                                          |
| `renderedZoom` | Scale last applied by the frame; `undefined` before measurement or after unmount, `0` when no space is available |
| `zoomReadOnly` | Boolean indicating that the frame has a `zoom` prop without `onZoomChange`                                       |

For example, a fitted frame may have `zoom: "fit"` and `renderedZoom: 0.5`.
Zoom in then requests `zoom: 0.625`. Zoom in and out wait for a positive measured
scale when fitting; fixed zoom disables all three zoom buttons. These values
control presentation; app window dimensions remain in logical CSS pixels.

The package can be imported and its frame shell server-rendered without browser
globals. App children render on the server with the active screen context;
app-bar portals mount on the client after their hosts are attached.
