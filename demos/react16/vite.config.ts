import { createRequire } from "node:module";
import { dirname } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

const require = createRequire(import.meta.url);

export default defineConfig({
  plugins: [react({ jsxRuntime: "classic" })],
  optimizeDeps: { rolldownOptions: { transform: { jsx: { runtime: "classic" } } } },
  build: { rolldownOptions: { output: { comments: { legal: true } } } },
  resolve: {
    alias: {
      react: dirname(require.resolve("react/package.json")),
      "react-dom": dirname(require.resolve("react-dom/package.json")),
    },
  },
});
