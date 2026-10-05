import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite-plus"

export default defineConfig(({ mode }) => {
  const version = mode === "react16" ? "16" : "19"
  const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))
  return {
    root: path(`./react${version}`),
    cacheDir: path(`./node_modules/.vite/react${version}`),
    plugins: [react({ jsxRuntime: "classic" })],
    optimizeDeps: { rolldownOptions: { transform: { jsx: { runtime: "classic" } } } },
    resolve: {
      alias: {
        react: path(`./node_modules/react${version}`),
        "react-dom": path(`./node_modules/react-dom${version}`),
      },
    },
    server: { host: "127.0.0.1", port: version === "16" ? 5116 : 5119, strictPort: true },
    build: {
      outDir: path(`./dist/react${version}`),
      emptyOutDir: true,
      rolldownOptions: { output: { comments: { legal: true } } },
    },
  }
})
