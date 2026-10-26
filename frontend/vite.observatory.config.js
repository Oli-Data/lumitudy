import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// A separate entry/output, using the existing API. Locally, proxy to the
// isolated preview backend so HTTP and WebSocket requests share one origin.
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '')
  const api = env.VITE_API_URL || '/api'
  const proxy = {'/api': {
    target: env.LUMITUDY_PREVIEW_API_TARGET || 'http://127.0.0.1:8000',
    changeOrigin: true, ws: true, rewrite: path => path.replace(/^\/api/, ''),
  }}
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(api),
      'import.meta.env.VITE_PREVIEW_LOCAL_API': JSON.stringify(env.VITE_API_URL ? 'false' : 'true'),
    },
    server: {
      proxy,
      fs: {deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.preview-data/**']},
    },
    preview: {proxy},
    build: {
      outDir: 'dist-observatory',
      rollupOptions: {input: fileURLToPath(new URL('./observatory.html', import.meta.url))},
    },
  }
})
