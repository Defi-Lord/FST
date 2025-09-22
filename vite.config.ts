// vite.config.ts (ensure this is in place)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/fpl': {
        target: 'https://fantasy.premierleague.com',
        changeOrigin: true,
        secure: true,
        rewrite: p => p.replace(/^\/fpl/, '/api'),
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
      },
    },
  },
})
