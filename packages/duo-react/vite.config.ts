import { defineConfig } from "vite-plus"

export default defineConfig({
  pack: {
    platform: "browser",
    dts: { tsconfig: "../../tsconfig.pack.json" },
    target: "es2020",
    outputOptions: { comments: { legal: true } },
    exports: { legacy: true },
  },
})
