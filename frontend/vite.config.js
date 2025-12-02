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
<<<<<<< HEAD
        target: 'http://localhost:3001',
=======
        target: process.env.VITE_USER_SERVICE_URL || 'http://localhost:3001',
>>>>>>> feature8-attendee-networking
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})

