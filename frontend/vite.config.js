import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ["avertable-nondelicately-wendolyn.ngrok-free.dev"],
    proxy: {
      '/api': {
        target: process.env.VITE_USER_SERVICE_URL || 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})

