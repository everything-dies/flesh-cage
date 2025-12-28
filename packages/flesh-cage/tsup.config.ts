import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/macros/index.ts', // Main export = Component macros
    core: 'src/core/index.ts', // Core utilities
    vite: 'src/vite/index.ts', // Vite plugin
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  target: 'es2020',
  external: ['react', 'react-dom', 'vite'],
})
