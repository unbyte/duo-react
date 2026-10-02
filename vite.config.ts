import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    platform: "browser",
    dts: {
      generator: "tsgo",
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
