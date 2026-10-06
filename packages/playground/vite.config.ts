import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { cloudflare } from "@cloudflare/vite-plugin"
import { defineConfig } from "vite-plus"

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "vp build",
        dependsOn: [{ task: "build", from: "dependencies" }],
      },
      dev: {
        command: "vp dev",
        dependsOn: [{ task: "build", from: "dependencies" }],
        cache: false,
      },
    },
  },
  root: path("./"),
  plugins: [react(), tailwindcss(), cloudflare({ configPath: path("./wrangler.jsonc") })],
  resolve: {
    alias: {
      "@": path("./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: { host: "127.0.0.1", port: 5119, strictPort: true },
  build: {
    outDir: path("./dist"),
    emptyOutDir: true,
    rolldownOptions: { output: { comments: { legal: true } } },
  },
})
