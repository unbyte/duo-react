# Duo Frame

A React device frame for previewing applications on iPhone Duo.

This repository currently contains the Vite Plus library scaffold and a React
preview page. The device component and asset CLI are not implemented yet. The
generated library function and its unit test are temporary scaffold examples.

Read [the proposed design](DESIGN.md) to review the public API, screen layout,
asset preparation, and rendering constraints before implementation.

## Development

Use pnpm 11.21.0. The project includes Vite Plus locally, so a global `vp`
installation is optional.

```sh
pnpm install
pnpm dev
```

The development server prints the local preview URL. The preview currently shows
the scaffold status; it does not render a device yet.

```sh
pnpm check
pnpm build
pnpm build:preview
pnpm test --run
```

`build` packages the library with `vp pack`; `build:preview` builds the React
preview. To use Vite Plus for dependency management, run `pnpm exec vp add` or
`pnpm exec vp install`. Both use the project's pinned pnpm version.

Commit each meaningful change after checking it. Use the preview for manual
acceptance; add focused unit tests for geometry and state behavior as those
features arrive. Early E2E and UI test suites are outside the current workflow.
