import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    projects: ["packages/*/vite.config.ts"],
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    // Preserve reference snapshots byte for byte so their provenance hashes stay valid.
    ignorePatterns: ["packages/duo-frame/docs/calibration/sources/**"],
  },
});
