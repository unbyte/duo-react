import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['esm', 'cjs'],
  platform: 'browser',
  target: 'es2020',
  dts: {
    // Resolve workspace sources directly so declarations stay self-contained.
    compilerOptions: { paths: { '@private/*': ['../*/src/index.ts'] } },
  },
  clean: true,
  minify: false,
  treeshake: true,
  sourcemap: false,
  esbuildOptions(options) {
    options.legalComments = 'eof'
  },
})
