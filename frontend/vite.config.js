import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/banker/stream': {
        target: 'http://localhost:8000',
        headers: { 'Connection': 'keep-alive' },
      },
      '/banker/leads': 'http://localhost:8000',
      '/banker/demo': 'http://localhost:8000',
      '/banker/portfolio': 'http://localhost:8000',
      '/banker/smb': 'http://localhost:8000',
      '/smb': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
})
