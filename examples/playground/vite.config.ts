import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import eslint from 'vite-plugin-eslint2'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    eslint({
      lintOnStart: false, // Don't lint all files on server start
      lintDirtyOnly: true, // Only lint changed files
      emitWarning: true, // Show warnings in terminal
      emitErrorAsWarning: true, // Treat errors as warnings (allows HMR)
      include: [
        'src/**/*.{ts,tsx}', // Playground files
        '../../packages/flesh-cage/src/**/*.{ts,tsx}', // Package files
      ],
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
