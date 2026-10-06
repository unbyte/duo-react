import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      '@': `${import.meta.dirname}/src`,
    },
    dedupe: ['react', 'react-dom'],
  },
  server: { host: '127.0.0.1', port: 5119, strictPort: true },
  build: {
    rolldownOptions: { output: { comments: { legal: true } } },
  },
})
