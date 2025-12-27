import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    resolve: true,
  },
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  minify: true,
  target: 'es2020',
  platform: 'browser',
  shims: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    }
  },
  banner: {
    js: '/* @flesh-cage/core | MIT License */',
  },
  outDir: 'dist',
  skipNodeModulesBundle: true,
  onSuccess: 'echo "✅ @flesh-cage/core built successfully"',
})
