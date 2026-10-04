import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [react({ jsxRuntime: "classic" })],
  optimizeDeps: { rolldownOptions: { transform: { jsx: { runtime: "classic" } } } },
  build: { rolldownOptions: { output: { comments: { legal: true } } } },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
