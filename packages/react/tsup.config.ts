import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    compilerOptions: {
      paths: {},
    },
  },
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', '@flesh-cage/core'],
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
    js: '/* @flesh-cage/react | MIT License */',
  },
  outDir: 'dist',
  skipNodeModulesBundle: true,
  onSuccess: 'echo "✅ @flesh-cage/react built successfully"',
})
