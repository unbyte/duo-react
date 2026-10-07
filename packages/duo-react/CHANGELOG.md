# duo-react

## 0.2.0

### Minor Changes

- [`7914423`](https://github.com/unbyte/duo-react/commit/79144239f67f52644293f21f4c796d21774186cc) Thanks [@unbyte](https://github.com/unbyte)! - feat: add basic rendering for system UI and tab bars
  
  Configure `DuoProvider` with `rendering={{ system: "basic", tabBar: "basic" }}` to use built-in CSS materials without DOM capture. Basic system indicators adapt through SVG backdrop filters and artwork masks, with explicit indicator styles preserved. Basic tab bars retain calibrated resting dimensions and click and keyboard navigation without liquid glass, dragging, or hold expansion.
  
  Rendering settings update live, and individual tab bars can override the provider with their `rendering` prop. Both modes default to `"enhanced"`.

- [`47dc2b3`](https://github.com/unbyte/duo-react/commit/47dc2b3e4a718f71bf932fa090fe9dcf047a9f12) Thanks [@unbyte](https://github.com/unbyte)! - feat: support optional selected tab bar icons
  
  Add an optional `selectedIcon` that replaces `icon` when a tab is selected while preserving both icons' colors. The optional `selectedColor` colors the selected label and, when `selectedIcon` is omitted, the icon.
  
  Fix dark fringes around transparent icon edges.

- [`9197f7a`](https://github.com/unbyte/duo-react/commit/9197f7a0df0b0d129fa28aaf989758a2f77f2d4a) Thanks [@unbyte](https://github.com/unbyte)! - feat: support text badges on tab bar items
  
  Add an optional `badge` string to tab items in basic and enhanced rendering. An empty string shows a red dot; long text truncates without changing tab dimensions. Badges keep their red and white colors and participate in the enhanced glass lens's distortion.

### Patch Changes

- [`abdaf09`](https://github.com/unbyte/duo-react/commit/abdaf091db1eace379213548c2a2568e5719d608) Thanks [@unbyte](https://github.com/unbyte)! - fix: allow app interaction beneath region masks

- [`2fa2a29`](https://github.com/unbyte/duo-react/commit/2fa2a294115b2e6a53a5ca21954886efc789a67a) Thanks [@unbyte](https://github.com/unbyte)! - fix: match tab bar item widths to device measurements
