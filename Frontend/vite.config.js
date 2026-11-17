import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // The browser calls /api/... on Vite, and Vite passes it on to the backend.
      // On your computer the backend is on localhost:5000.
      // In Docker, docker-compose.yml sets API_TARGET to the backend container.
      '/api': process.env.API_TARGET || 'http://localhost:5000',
    },
  },
})
