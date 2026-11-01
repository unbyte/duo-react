---
"duo-react": minor
---

feat: support native HTML-in-Canvas rendering

Add a `renderer` prop to `DuoFrame` with `"auto"`, `"canvas"`, and `"dom"` options. The default `"auto"` renders app content into Canvas on supported browsers and uses the resulting image for liquid glass materials without DOM capture. System UI and tab bars remain interactive DOM overlays. Unsupported browsers and native rendering failures fall back to DOM rendering.

Export `DuoRenderer` and `supportsCanvasRenderer()`, and add a Renderer selector above Mode in the playground. Separate DOM and Canvas implementations behind a shared renderer interface, with each renderer owning its backdrop processing.

Switching between active backends remounts the app subtree, including the initial upgrade from DOM to Canvas. Use `renderer="dom"` for cross-origin embeds or content that requires normal DOM painting.
