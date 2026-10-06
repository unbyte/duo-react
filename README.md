# Duo Frame workspace

A workspace for React device previews and system UI packages.

The [duo-frame package](packages/duo-frame/README.md) provides the iPhone Duo
frame, provider, layout helpers, system indicators, and preview controls. Its
[design](packages/duo-frame/docs/design.md) and
[calibration review](packages/duo-frame/docs/calibration/README.md) describe the
architecture, measurements, and remaining rendering decisions.

## Workspace layout

```text
packages/
  duo-frame/          Library source, tests, documentation, and package build
  demo/               Private React 19 demo and Vite configuration
    index.html        Demo entry page
    src/              React entry point, demo content, controls, and styles
```

Add packages under `packages/`, each with its own manifest and build config.
The root owns the pnpm workspace and lockfile, shared development dependencies,
TypeScript defaults, lint/format rules, and test project discovery. Packages own
their runtime dependencies, peer contracts, and package-specific build inputs.
`vp run` orchestrates workspace scripts; `vp check` handles formatting, lint,
and type checks in one pass using each package's TypeScript configuration.
The library pins React 16.8.6 for its test baseline and supports React 16.8
through 19. The private `@duo-frame/demo` package uses React 19 and matching
React DOM and types. Vite deduplicates React imports so the demo and library
share the demo's React instance. The demo builds to `packages/demo/dist/`.

## Development

Use pnpm 11.21.0 and run these commands from the workspace root:

```sh
pnpm install
pnpm dev
# In another terminal, rebuild the library while editing:
pnpm watch
```

`dev` builds `duo-frame` and opens the React 19 development server at
[127.0.0.1:5119](http://127.0.0.1:5119). The demo consumes the library's package
exports from `packages/duo-frame/dist`.

| Command           | Purpose                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| `pnpm build`      | Build the `duo-frame` library                                          |
| `pnpm build:demo` | Build the library and React 19 demo                                    |
| `pnpm test --run` | Run all package test projects once                                     |
| `pnpm test`       | Run package tests in watch mode in an interactive terminal             |
| `pnpm check`      | Build the library, check formatting and lint, and check the demo types |
| `pnpm watch`      | Watch the library build                                                |

Use a package filter for focused work, such as `pnpm --filter duo-frame test --run`.
The [package usage guide](packages/duo-frame/README.md)
describes how to integrate the frame into an application.

## Code style and diagnostics

The root Vite Plus config enables import, React, accessibility, and type-aware
promise checks alongside Oxlint's correctness rules. Duplicate imports are
errors; auto-fixes merge compatible imports and keep type-only names marked with
`type`. React effect dependencies include the library's `useBrowserLayoutEffect`.

Oxfmt omits optional JavaScript/TypeScript semicolons and uses its default
100-column print width. This is a wrapping target; long strings and URLs can
exceed it. Markdown code blocks keep their authored formatting so usage examples
can remain fragments. Reference snapshots remain excluded from formatting.

Run `pnpm check` to report problems, or `pnpm exec vp check --fix` to apply safe
lint fixes and formatting. The same root settings apply throughout the workspace.
