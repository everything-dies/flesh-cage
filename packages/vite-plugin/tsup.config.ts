import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    resolve: true,
  },
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['vite', '@flesh-cage/core', '@flesh-cage/react'],
  minify: false, // Keep readable for debugging
  target: 'node18',
  platform: 'node',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    }
  },
  banner: {
    js: '/* @flesh-cage/vite-plugin | MIT License */',
  },
  outDir: 'dist',
  skipNodeModulesBundle: true,
  onSuccess: 'echo "✅ @flesh-cage/vite-plugin built successfully"',
})
