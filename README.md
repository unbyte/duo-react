# Duo Frame

A React device frame for previewing applications on iPhone Duo.

The package targets React 16.8 through React 19. The workspace has separate
React 16.14 and React 19.3 demos that consume the built package; library checks
use React 16.8.6 and React 16 types to catch accidental newer API dependencies.
The device component and asset CLI are not implemented yet.

Read [the design](DESIGN.md) for the architecture and remaining rendering decisions.

## Development

Use pnpm 11.21.0. Vite Plus is installed locally and delegates dependency
management to the pinned pnpm version.

```sh
pnpm install
pnpm dev:react19
# In another terminal:
pnpm dev:react16
```

The demos run at http://127.0.0.1:5119 and http://127.0.0.1:5116. Each command
builds the library before starting its demo. Run `pnpm watch` in another terminal
to rebuild the library while editing. `pnpm dev` starts the React 19 demo.

```sh
pnpm build:demos
pnpm check
pnpm test --run
```

Commit meaningful changes after checking them. Use the demos for manual
acceptance and focused unit tests for state and geometry; defer E2E and visual
regression suites during this iteration stage.
