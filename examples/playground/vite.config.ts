import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import eslint from 'vite-plugin-eslint2'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    eslint({
      lintOnStart: false,
      lintDirtyOnly: true,
      emitWarning: true,
      emitErrorAsWarning: true, // Show errors as warnings (allows HMR to continue)
      include: [
        'src/**/*.{ts,tsx}',
        '../../packages/flesh-cage/src/**/*.{ts,tsx}',
      ],
    }),
  ],

  resolve: {
    alias: {
      '@everything-dies/flesh-cage': path.resolve(
        __dirname,
        '../../packages/flesh-cage/src/core'
      ),
    },
  },

  optimizeDeps: {
    exclude: ['@everything-dies/flesh-cage'],
  },

  server: {
    port: 3000,
    open: true,
  },
})
