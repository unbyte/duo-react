# Duo Frame

A React device frame for previewing applications on iPhone Duo.

The current implementation is a flat layout prototype: a provider, persistent
inner and outer app surfaces, measured window geometry, safe-area CSS properties,
zoom, passive system indicators, and an optional toolbar. Status glyphs follow
the reference project; their sizes still need visual acceptance. The device
outline is schematic. Apple's model, calibrated bezel, folding animation,
hardware events, and asset CLI are not implemented yet.

Read [the design](DESIGN.md) for the architecture and rendering decisions still
needed before the 3D implementation.

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
switch the inner window between left, right, and full, then close and reopen the
device. Content should keep its state. Both content modes contain only a counter
and a text input. Switching modes reloads the page intentionally.

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
import { DuoFrame, DuoProvider, DuoToolbar } from "duo-frame";
import "duo-frame/style.css";

<DuoProvider
  defaultState={{ orientation: "landscape-left", innerPlacement: "full", zoom: "fit" }}
  defaultSystem={{ time: "9:41", battery: 100 }}
>
  <DuoFrame inner={<InnerApp />} outer={<OuterApp />} style={{ width: "100%", height: 640 }} />
  <DuoToolbar />
</DuoProvider>;
```

Mount one frame per provider. Separate providers create independent sessions.
The frame forwards its root div through `ref` and accepts standard div attributes,
`className`, and `style`. Import the stylesheet once. Older bundlers that ignore
package exports can import `duo-frame/dist/style.css`. `showSystemUI={false}` hides
the passive system indicators while retaining the outer display's camera cutout.

The status glyph combines a battery arc, Wi-Fi arcs, and cellular dots. Battery
level changes the arc's fill; charging displays a lightning mark. These indicators
have no click or gesture behavior. Their vector paths follow the reference
project, with attribution in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

The status group occupies the full display's safe-area edge strip, independently
of app placement. The outer camera cutout uses the square occlusion region in the
geometry profile; the inner display has no visible camera cutout. The home
indicator is centered beneath the current app window, including split windows.
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
regions. Geometry uses app CSS pixels: one pixel per source device point.
`getDuoGeometry()` exposes the same measured profiles without mounting React.

The current profiles cover open and closed layouts in portrait, landscape left,
and landscape right. Inner split windows are supported in landscape. The
13px split gap is inferred from the reported widths; the source does not supply
window origins. Geometry provenance is recorded in
[src/profiles/xcode-27.1.ts](src/profiles/xcode-27.1.ts).

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

### Zoom ownership

With no frame `zoom` prop, provider actions control zoom. `"fit"` fits the active
display into the container with `fitPadding` (24px by default). A positive finite
number sets the scale: `1` renders one app CSS pixel as one preview CSS pixel.
Changing scale does not change app-window measurements; numeric zoom can crop.

For controlled zoom, pass `zoom` and `onZoomChange` to `DuoFrame`. Toolbar and
provider actions request changes through the callback; the caller updates the
prop. A `zoom` prop without a callback is fixed and disables toolbar zoom changes.
The provider's `zoom` reflects the effective value after the frame commits. A
server render uses provider defaults; supply matching defaults for controlled
zoom when server-rendering controls.

The package can be imported and its frame shell server-rendered without browser
globals. Portal app content mounts on the client after its host is attached.
