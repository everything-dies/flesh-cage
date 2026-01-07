import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import checker from 'vite-plugin-checker'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    checker({
      eslint: {
        lintCommand: 'eslint . --ext .ts,.tsx', // Lint command
        dev: {
          logLevel: ['error', 'warning'], // Show errors and warnings in overlay
        },
      },
      overlay: {
        initialIsOpen: false, // Don't auto-open overlay on start
      },
    }),
  ],

  resolve: {
    alias: {
      '@everything-dies/flesh-cage': path.resolve(__dirname, '../../packages/flesh-cage/src/core'),
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
