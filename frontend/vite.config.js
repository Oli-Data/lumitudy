import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        study: fileURLToPath(new URL('./study.html', import.meta.url)),
        bookshelf: fileURLToPath(new URL('./observatory.html', import.meta.url)),
      },
    },
  },
  server: {
    proxy: {'/api': {
      target: 'http://127.0.0.1:8000', changeOrigin: true, ws: true,
      rewrite: path => path.replace(/^\/api/, ''),
    }},
    fs: {deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.preview-data/**']},
  },
})
