# Duo React workspace

A workspace for React device previews and system UI packages.

The [duo-react package](packages/duo-react/README.md) provides the iPhone Duo
frame, provider, adaptive bars, layout helpers, system indicators, and preview controls. Its
[design](packages/duo-react/docs/design.md) and
[calibration review](packages/duo-react/docs/calibration/README.md) describe the
architecture, measurements, and remaining rendering decisions.

## Workspace layout

```text
packages/
  duo-react/          Library source, tests, documentation, and package build
  playground/         Private React 19 playground and Vite configuration
    index.html        Playground entry page and page metadata
    wrangler.jsonc    Playground-only Cloudflare Workers deployment
    public/           Static playground assets
    src/
      main.tsx        React entry point and stylesheet loading
      app.tsx         Shared state and composition of the three playground areas
      settings/       Sidebar, setting groups, option labels, and bar settings
      preview/        Device canvas, preview controls, and example content
      inspector/      State inspection and inspector controls
      components/     Shared fields, copyable values, scrolling, and UI primitives
      styles/         UI theme and playground styles
      lib/            Utilities used by generated UI components
```

Add packages under `packages/`, each with its own manifest and build config.
In the playground, keep area-specific components and their props together.
`app.tsx` owns state shared between settings, preview, and inspector; the area
components receive that state and callbacks. Components used across areas belong
in `components/`, with the generated primitives under `components/ui/`.
The root owns the pnpm workspace and lockfile, shared development dependencies,
TypeScript defaults, lint/format rules, and test project discovery. Packages own
their runtime dependencies, peer contracts, and package-specific build inputs.
`vp run` orchestrates workspace scripts; `vp check` handles formatting, lint,
and type checks in one pass using each package's TypeScript configuration.
The library pins React 16.8.6 for its test baseline and supports React 16.8
through 19. The private `@duo-react/playground` package uses React 19 and matching
React DOM and types. Vite deduplicates React imports so the playground and library
share the playground's React instance. The Cloudflare Vite plugin builds the playground's
static assets and generates its deployment configuration in `packages/playground/dist/`.

## Development

Use pnpm 11.21.0 and run these commands from the workspace root:

```sh
pnpm install
pnpm dev
# In another terminal, rebuild the library while editing:
pnpm watch
```

`dev` builds `duo-react` and opens the React 19 development server at
[127.0.0.1:5119](http://127.0.0.1:5119). The playground consumes the library's package
exports from `packages/duo-react/dist`.

| Command                   | Purpose                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| `pnpm build`              | Build the `duo-react` library                                                |
| `pnpm build:playground`   | Build the library and React 19 playground                                    |
| `pnpm preview:playground` | Preview the built playground in the local Workers runtime                    |
| `pnpm deploy:playground`  | Deploy the previously built playground                                      |
| `pnpm test --run`         | Run all package test projects once                                           |
| `pnpm test`               | Run package tests in watch mode in an interactive terminal                   |
| `pnpm check`              | Build the library, check formatting and lint, and check the playground types |
| `pnpm watch`              | Watch the library build                                                      |

Use a package filter for focused work, such as `pnpm --filter duo-react test --run`.
The [package usage guide](packages/duo-react/README.md)
describes how to integrate the frame into an application.

## Playground deployment

The playground uses the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/)
and Workers Static Assets. `packages/playground/wrangler.jsonc` configures the
`duo-react-playground` Worker and SPA fallback. The page metadata uses `https://duo.make.ci/`.
The library is built locally and bundled into the playground's browser assets; it is
not published or deployed separately.

From the workspace root:

```sh
pnpm build:playground
pnpm preview:playground
pnpm deploy:playground --dry-run
```

Authenticate with your Cloudflare account, build, and deploy:

```sh
pnpm --filter @duo-react/playground exec wrangler login
pnpm build:playground
pnpm deploy:playground
```

Build and deploy are separate steps; `pnpm deploy:playground` uses the existing build output.

Wrangler uses the deployment configuration generated by the Vite build, which
points only to the playground's client assets. Attach `duo.make.ci` to `duo-react-playground`
under **Settings → Domains & Routes → Add → Custom Domain** in Cloudflare.
This requires `make.ci` to be an active zone in the deploying Cloudflare account;
Cloudflare manages the DNS record and TLS certificate. For Workers Builds, use the repository
root as the build directory, `pnpm build:playground` as the build command, and
`pnpm deploy:playground` as the deploy command.

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
