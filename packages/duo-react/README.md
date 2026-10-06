# Duo React

React components for previewing web apps in iPhone Duo device layouts. Wrap your
app in a device frame, switch displays and orientations, and try full-screen or
split layouts without losing component state.

[Playground](https://duo.make.ci/) ·
[Usage guide](docs/usage.md) ·
[Source](https://github.com/unbyte/duo-react)

## Installation

The package is currently private in this workspace while the first public release
is prepared. Once published, install it in your React application:

```sh
npm install duo-react
```

The declared peer range is React and React DOM 16.8–19. The package ships ES modules,
CommonJS, TypeScript declarations, and a stylesheet. Use a bundler that handles
CSS imports and a browser with ResizeObserver and CSS container-query support.

## Quick start

Import the stylesheet once. Wrap the frame and its controls in `DuoProvider`, and
give the frame a definite height:

```tsx
import * as React from "react"
import {
  DuoControls,
  DuoDisplayControls,
  DuoFrame,
  DuoLayoutControls,
  DuoProvider,
  DuoRotationControls,
  DuoSafeArea,
  DuoZoomControls,
} from "duo-react"
import "duo-react/style.css"

export default function Preview() {
  return (
    <DuoProvider>
      <DuoFrame style={{ height: 640 }}>
        <DuoSafeArea style={{ height: "100%", overflow: "auto" }}>
          <Counter />
        </DuoSafeArea>
      </DuoFrame>
      <DuoControls>
        <DuoDisplayControls />
        <DuoRotationControls />
        <DuoLayoutControls />
        <DuoZoomControls />
      </DuoControls>
    </DuoProvider>
  )
}

function Counter() {
  const [count, setCount] = React.useState(0)

  return (
    <main>
      <h1>Your app</h1>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </main>
  )
}
```

The preview starts fully open in landscape and scales to fit the frame. Try
incrementing the counter, then changing the display or rotating the device: the
same component stays mounted. Use one frame per provider and separate providers
for independent previews.

Controls are optional and can be reordered. Supply your own button styling and
control layout. `DuoSafeArea` adds padding around the system's safe-area insets;
apply that padding once.

## Choose your starting layout

Use provider defaults for the initial display, orientation, zoom, and system
appearance:

```tsx
<DuoProvider
  defaultState={{ posture: "closed", orientation: "portrait", zoom: "fit" }}
  defaultSystem={{ colorMode: "dark", time: "09:41", battery: 75 }}
>
  <DuoFrame style={{ height: 640 }}>
    <DuoSafeArea>Your app</DuoSafeArea>
  </DuoFrame>
</DuoProvider>
```

Defaults are read once. Call `useDuoActions()` inside the provider to change
settings later, or `useDuoState(selector)` to read preview state.

## Build your preview

| Task                                     | Components and hooks                 |
| ---------------------------------------- | ------------------------------------ |
| Keep content inside safe areas           | `DuoSafeArea`, `useDuoScreen`        |
| Add adaptive navigation                  | `DuoTabBar`, `DuoToolbar`, `useBars` |
| Control the device and appearance        | `useDuoActions`, `useDuoState`       |
| Respond to app-window changes            | `useDuoEvent`                        |
| Inspect safe areas and reserved regions  | `DuoRegionMask`, `useDuoRegions`     |
| Calculate geometry for explicit settings | `getDuoGeometry`, `safeAreaStyle`    |

The [usage guide](docs/usage.md)
includes examples for each task, plus controlled zoom, indicator colors, custom
bars, and iframe integration.

## How the preview affects your app

App dimensions use CSS pixels before preview zoom. Inside the frame,
`useDuoScreen()` reports the active app window, and the `duo-react-screen` CSS
container supports responsive layouts. Ordinary viewport units and media queries
still refer to the host page. Embed an iframe when the content needs its own
viewport; React context and safe-area properties do not cross the iframe boundary.

Your app runs in the host browser's JavaScript and rendering environment. Duo React
provides a 2D device frame, layout geometry, and system UI visuals. Partially open
mode exposes fold regions for layout testing. Your app arranges its content around
reserved regions and leaves room for overlaid bars.

Glass effects and automatic indicator contrast sample the app's content.
Cross-origin iframes and external resources can limit those effects; explicit
indicator colors are available in the
[system appearance guide](docs/usage.md#system-appearance).

## License

[MIT](LICENSE)
