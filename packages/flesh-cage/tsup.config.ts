import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/core/index.ts', // Main export = Core
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  target: 'es2020',
  external: ['react', 'react-dom'],
})
