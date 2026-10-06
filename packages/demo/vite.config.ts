import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite-plus"

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

export default defineConfig({
  root: path("./"),
  plugins: [react(), tailwindcss()],
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
