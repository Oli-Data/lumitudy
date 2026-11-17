import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vite's React transform is used only by Vitest, not the application build.
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom' },
})
