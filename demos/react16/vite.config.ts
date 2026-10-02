import { createRequire } from "node:module";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

const require = createRequire(import.meta.url);

export default defineConfig({
  plugins: [react({ jsxRuntime: "classic" })],
  resolve: {
    alias: [
      { find: /^react$/, replacement: require.resolve("react") },
      { find: /^react-dom$/, replacement: require.resolve("react-dom") },
    ],
  },
});
