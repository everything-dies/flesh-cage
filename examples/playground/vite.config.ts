import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@flesh-cage/core': path.resolve(__dirname, '../../packages/core/src'),
      '@flesh-cage/react': path.resolve(__dirname, '../../packages/react/src'),
    },
  },

  optimizeDeps: {
    exclude: ['@flesh-cage/core', '@flesh-cage/react'],
  },

  server: {
    port: 3000,
    open: true,
  },
})
