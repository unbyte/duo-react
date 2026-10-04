import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    platform: "browser",
    target: "es2020",
    outputOptions: { comments: { legal: true } },
    exports: { legacy: true },
  },
  test: {
    name: "duo-frame",
  },
});
