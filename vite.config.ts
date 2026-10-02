import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    platform: "browser",
    target: "es2020",
    deps: { neverBundle: [/^react(?:-dom)?(?:\/|$)/, /^use-sync-external-store(?:\/|$)/] },
    dts: {
      generator: "tsgo",
    },
    exports: { legacy: true },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
