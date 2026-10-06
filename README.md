# Duo React

Preview React apps and web pages on iPhone Duo. Switch between the inner and outer
displays, rotate the device, and explore full-screen or split layouts.

[Try the playground](https://duo.make.ci/) ·
[Get started](packages/duo-react/README.md) ·
[Usage guide](packages/duo-react/docs/usage.md)

## What you can preview

- **Device layouts:** open, partially open, and closed postures; portrait and
  landscape orientations; left, full, and right windows on the inner display.
- **Responsive content:** app-window dimensions, safe-area padding, camera and
  fold regions, and CSS container queries.
- **App and system UI:** adaptive tab bars and toolbars, light and dark appearance,
  status indicators, and an optional home indicator.
- **Interactions:** live React content or an embedded page, with controls for
  display, rotation, layout, and zoom.

The playground lets you try these settings and inspect the resulting geometry.
The `duo-react` [package](packages/duo-react/README.md) provides the components and
hooks for building previews into your own app.

## Using Duo React

Start with the [package quick start](packages/duo-react/README.md#quick-start).
It shows how to load the stylesheet and compose a provider, frame, safe area, and
preview controls. The [usage guide](packages/duo-react/docs/usage.md) covers
responsive layouts, iframes, navigation, appearance, zoom, and region inspection.

Duo React is preparing for its first public release; the package is currently
private in this workspace. It renders a 2D device preview with simulated system UI.
Partially open mode exposes fold regions for layout testing. Content continues to
run in the browser, and ordinary media queries follow the host page; use container
queries or an iframe when your app needs to respond to the preview's dimensions.
