# Playground and Tab Bar Lab

Run `pnpm --filter @private/playground dev` from the repository root. Open:

- `http://127.0.0.1:5119/` for device geometry and component controls.
- `http://127.0.0.1:5119/benchmark.html` for the separate tab bar comparison demo.

The playground header also links to the lab. Both pages are included in the
production build, with independent entry points and styles.

## Comparing renderers

The lab renders a local editorial feed with SVG illustrations, cards, shadows,
sticky navigation, a chart, badges, and five tab destinations. Choose 12, 36, or
96 cards, a portrait or landscape display, and a scenario:

- **Still page:** manually explore the page and tab bar before measuring.
- **Auto scroll:** repeatable scrolling at 180 logical pixels per second.
- **Scroll + motion + tab changes:** also animate illustrations and the chart,
  update a counter, and select the next tab every two seconds.

The modes are DOM capture with enhanced glass, native HTML-in-canvas with the
same enhanced glass, and basic DOM/CSS rendering. Basic CSS is a different visual
baseline: it does not implement the enhanced lens effects. Native mode uses the
capability checks and fallback of Duo React. The page always reports the actual
backend, and an unavailable native mode is recorded as skipped, without a score.

**Record this renderer** runs a two-second warm-up followed by a 10, 20, or
30-second sample. The scripted workload restarts at sample start. **Compare all
three** runs modes sequentially, beginning with the selected mode; it does not
render multiple competing previews at once. Repeat from different starting modes
to check order effects. Configuration is locked during a run. Keep the tab
visible, do not interact with the preview, and keep the viewport size unchanged.
Hiding the tab, resizing, cancelling, or changing the actual backend during
measurement discards that partial result.

Results stay in memory until reload. Export JSON to retain the measurements,
requested mode and actual backend, configuration, node count, viewport, device
pixel ratio, logical display dimensions, browser user agent, and build type.

## What the numbers mean

- FPS, mean/p95/max frame intervals, and the percentage of frames over 33.3 ms
  come from whole-page `requestAnimationFrame` callbacks.
- Long tasks use `PerformanceObserver` when supported. Blocking time sums each
  measured task's duration beyond 50 ms. Unsupported values are shown as a dash
  and exported as `null`.
- These are not GPU timings, isolated tab-bar costs, or backdrop freshness
  measurements. A page can schedule frames smoothly while its captured backdrop
  updates slowly. Inspect scrolling, text, tab icons, and glass quality too.
- System indicators are hidden to focus the specimen on the app and tab bar.
  The measured work still includes app updates, browser layout/paint, capture,
  glass effects, React, and the small amount of benchmark UI work.

For comparisons, build with `pnpm build:playground`, then run
`pnpm preview:playground` and open `/benchmark.html` on the printed preview URL.
Use the same browser, refresh rate, zoom, viewport, workload, and layout. Close
unrelated busy tabs. Development builds, DevTools, automation, software GPU
rendering, and machine load can all change the results. No renderer is declared
faster from a single run.

HTML-in-canvas remains experimental. A supporting Chromium build may require
`chrome://flags/#enable-experimental-web-platform-features`. The library's
[renderer documentation](../duo-react/docs/usage.md#display-renderer) describes
content restrictions and fallback behavior.
