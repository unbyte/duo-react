---
"duo-react": minor
---

feat: add basic rendering for system UI and tab bars

Configure `DuoProvider` with `rendering={{ system: "basic", tabBar: "basic" }}` to use built-in CSS materials without DOM capture. Basic system indicators adapt through SVG backdrop filters and artwork masks, with explicit indicator styles preserved. Basic tab bars retain calibrated resting dimensions and click and keyboard navigation without liquid glass, dragging, or hold expansion.

Rendering settings update live, and individual tab bars can override the provider with their `rendering` prop. Both modes default to `"enhanced"`.
