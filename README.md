# Duo Frame

A React device frame for previewing applications on iPhone Duo.

The current implementation is a flat layout prototype: a provider, persistent
inner and outer app surfaces, measured window geometry, safe-area CSS properties,
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

Use pnpm 11.21.0. Vite Plus is installed locally and delegates dependency
management to the pinned pnpm version.

```sh
pnpm install
pnpm dev:react19
# In another terminal:
pnpm dev:react16
```

Open [React 19](http://127.0.0.1:5119) or [React 16](http://127.0.0.1:5116).
Each demo consumes the built package with its own React runtime. The launch
commands build the library first; run `pnpm watch` in another terminal to rebuild
while editing. `pnpm dev` starts the React 19 demo.

Both demos have React and iframe content modes. Change a counter or enter text,
switch the inner window between left, right, and full, then use the toolbar's
display buttons to switch to the outer display and back. Content should keep
its state. Both content modes contain only a counter
and a text input. The Background selector previews light, dark, gray, and mixed
content; Icons selects automatic, white, or black indicators. Switching content
modes reloads the page intentionally.

Enable **Show layout regions** for translucent safe-area and reserved-region
blocks, dashed outlines, and labels outside the frame. Fills follow the rounded
display and app-window boundaries. Outlines sit 2 logical pixels inside the
region boundaries; labels report the original dimensions. The overlay follows
placement, orientation, and zoom without remounting content.

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
and native inert for hidden-display isolation.

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
} from "duo-frame";
import "duo-frame/style.css";

<DuoProvider
  defaultState={{ orientation: "landscape-left", innerPlacement: "full", zoom: "fit" }}
  defaultSystem={{ time: "9:41", battery: 100 }}
>
  <DuoFrame inner={<InnerApp />} outer={<OuterApp />} style={{ width: "100%", height: 640 }} />
  <DuoToolbar className="preview-toolbar">
    <DuoDisplayControls className="preview-group" />
    <DuoRotationControls className="preview-group" />
    <DuoLayoutControls className="preview-group" />
    <DuoZoomControls className="preview-group" />
  </DuoToolbar>
</DuoProvider>;
```

The display buttons select the inner display for the open posture and
the outer display for the closed posture. Both app subtrees remain mounted while
switching. Call `setPosture("open")` or `setPosture("closed")` through
`useDuoActions()` to select the same states programmatically.

The toolbar is headless. Each control group works independently anywhere under
`DuoProvider`; omit or reorder groups as needed. `DuoToolbar` is an optional
container and renders only its children. Each component forwards its div ref and
accepts normal div attributes, including `className` and `style`. The demos supply
the floating placement, pill backgrounds, and button styling.

| Group                 | Buttons           | Behavior                                                             |
| --------------------- | ----------------- | -------------------------------------------------------------------- |
| `DuoDisplayControls`  | Inner, outer      | Selects the visible display without remounting apps                  |
| `DuoRotationControls` | Left, right       | Rotates by 90° in either direction without stopping                  |
| `DuoLayoutControls`   | Left, full, right | Hidden on the outer display; split layouts disabled in portrait      |
| `DuoZoomControls`     | Out, in, fit      | Divides or multiplies the current scale by 1.25, or restores fitting |

Rotation passes through all four positions, including `portrait-upside-down`.
Each click adds or subtracts 90°; repeated turns retain their direction across
360°. The frame animates the turn and fits the rotated bounds, including during
the transition. Reduced-motion preferences disable the animation. Rotating a
split window into either portrait position selects full width.

`state.rotation` is the accumulated clockwise target angle from upright portrait;
`state.orientation` is the requested device orientation. Each display's
`screen.orientation` reports its effective app layout. The inner display has
measured geometry for all four positions. The outer display has no upside-down
safe-area profile, so its app and system controls retain their last supported
layout and rotate together with the shell. Starting upside down uses portrait
as that outer layout. This fallback is a preview policy, not calibrated native
behavior. App state and iframe instances remain mounted throughout.

`setOrientation()` selects the nearest equivalent angle without discarding full
turns. `resetDevice()` restores the initial device orientation and angle.
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

The status glyph combines a battery arc, Wi-Fi arcs, and cellular dots. Battery
level changes the arc's fill; charging displays a lightning mark. These indicators
have no click or gesture behavior. The SVG is drawn from the supplied image with
a common center for the battery, Wi-Fi, and cellular dots. See the
[reference measurements](docs/calibration/status-controls.md) for proportions and
calibration assumptions.

The status group occupies the full display's safe-area edge strip, independently
of app placement. The outer camera cutout uses the square occlusion region in the
geometry profile as a provisional approximation of the visible hole; the inner
display currently renders no camera visual, including when `cameraActive` adds
a reserved region. The home indicator is hidden by default; set
`defaultSystem={{ homeIndicatorVisible: true }}` or call
`setSystem({ homeIndicatorVisible: true })` to show it beneath the current app
window. Split View has a black gap and a passive vertical divider grabber.
Artwork dimensions and spacing are defined in `src/system-layout.ts` in app CSS
pixels and scale with the screen. The safe-area dataset establishes the available
regions, not exact icon sizes or native status layouts in every orientation;
those still require manual comparison.

`useDuoState(selector, isEqual?)` subscribes to selected state. `useDuoActions()`
provides posture, orientation, inner placement, zoom, system configuration, and
reset operations. Defaults initialize a provider once. Reset restores those
defaults without resetting consumer component state.

`useDuoScreen()` is available in both app subtrees. It returns the display,
placement, visibility, display size, window rectangle, safe insets, and reserved
regions. `cornerRadii` describes the display; `windowCornerRadii` describes the
app window. Both use top-left, top-right, bottom-right, bottom-left order.
Geometry uses app CSS pixels: one pixel per source device point.
`getDuoGeometry()` exposes the same geometry without mounting React.

The current profiles cover open and closed layouts in portrait, landscape left,
and landscape right. Inner split windows are supported in landscape. The
13px split gap is inferred from the reported widths; the source does not supply
window origins. Split windows retain the display's outer corner radii and use a
provisional 32px radius beside the divider, estimated from the
[supplied illustration](docs/calibration/split-view.png). The divider's 4 × 48px
grabber is also provisional. Geometry provenance is recorded in
[src/profiles/xcode-27.1.ts](src/profiles/xcode-27.1.ts).

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
const { display } = useDuoScreen();
const { setSystem } = useDuoActions();
setSystem({ indicatorStyles: { [display]: { statusBar: "light" } } });
```

Call the action from an event handler or effect. Partial updates preserve the
other display and the other indicator's setting. Reset restores provider
defaults. Changing appearance does not resize or remount app content. Iframe
owners can forward an explicit preference through their own message bridge.

**Automatic rendering is provisional.** It currently retains CSS `difference`
blending, which inverts pixels independently, can produce colored or low-contrast
results, and can split one icon across light/dark backgrounds. It does **not** yet
meet the intended whole-control black-or-white behavior. Explicit `light` and
`dark` modes do. State stores the requested mode only; no resolved color or
JavaScript sampling loop is present. The next rendering step must select one
color for the complete control without pretending that arbitrary DOM or
cross-origin iframe pixels are readable.

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

React context and CSS properties do not cross iframe document boundaries. The
iframe demo shows a consumer-owned `postMessage` bridge with source and origin
checks. The library does not inject code into consumer iframe documents.

### App bar positioning

`DuoTabBar` and `DuoAppToolbar` position caller-provided content within a frame's
inner or outer app subtree. `DuoAppToolbar` is the in-app action bar;
`DuoToolbar` controls the device preview. The positioning helpers do not implement
navigation, tab selection, menus, or iOS visual styling.

```tsx
import { DuoTabBar, DuoAppToolbar } from "duo-frame";

function App() {
  return (
    <>
      <YourContent />
      <DuoAppToolbar className="app-actions" aria-label="Document actions">
        <button onClick={createDocument}>New</button>
      </DuoAppToolbar>
      <DuoTabBar className="app-tabs" aria-label="Destinations">
        <YourNavigation />
      </DuoTabBar>
    </>
  );
}
```

Mount this app through a frame's `inner` or `outer` prop. Use one of each helper
per display, or omit either. They accept standard div attributes, `style`,
`className`, and a forwarded div ref. Supply the appropriate navigation or tab
semantics on your children; the helpers do not impose ARIA tab behavior.

On the side, the toolbar grows downward below system controls and the tab bar
grows upward from the bottom. Split-left uses the left edge, split-right uses
the right, and full-display placement follows the measured side inset. Inner
portrait, including upside-down portrait, places the toolbar horizontally at the
top and the tab bar horizontally at the bottom. RTL text does not swap hardware
edges. These rules follow [Apple's Duo guidance](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo#Vertical-controls).

The frame provides private, stable portal hosts, so app scrolling and nested
positioned ancestors do not move the bars. Children keep their React context and
state across orientation, placement, and zoom changes. CSS inheritance follows
the frame host rather than the original DOM ancestry; put appearance styles on
the helper or its children. Both bars scale in logical pixels with the app.
Helpers cannot run inside an iframe's separate React tree; mount them beside the
iframe in the frame's React content instead.

The default layout uses 16px edge/group spacing and the measured 84px side rail;
the split-left rail uses that same width by convention. These gaps are our
positioning defaults, not calibrated Apple control metrics. Reserved regions and
the rendered status bounds constrain available space. Bars share that space and
scroll when their content exceeds it; there is no automatic overflow menu or
minimization. They overlay app content and do not change the provider's calibrated
safe area. Keep your content clear of your chosen bar dimensions.

Use `[data-duo-bar-placement="left" | "right" | "top" | "bottom"]` to adapt your
styles. The helper uses a column on the side and a row in portrait; your own
nested navigation container may also need to change its direction. The demos'
**Show app bars** toggle demonstrates both helpers with React and iframe content.

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
globals. Portal app content mounts on the client after its host is attached.
