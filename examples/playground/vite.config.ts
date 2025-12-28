import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@everything-dies/flesh-cage': path.resolve(__dirname, '../../packages/flesh-cage/src/macros'),
      '@everything-dies/flesh-cage/core': path.resolve(__dirname, '../../packages/flesh-cage/src/core'),
      '@everything-dies/flesh-cage/vite': path.resolve(__dirname, '../../packages/flesh-cage/src/vite'),
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
