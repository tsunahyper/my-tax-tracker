import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/receipts': 'http://localhost:8000',
    }
  },
  define: {
    'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(process.env.NODE_ENV),
  }
})
