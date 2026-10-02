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
  fmt: {
    // Preserve reference snapshots byte for byte so their provenance hashes stay valid.
    ignorePatterns: ["docs/calibration/sources/**"],
  },
});
