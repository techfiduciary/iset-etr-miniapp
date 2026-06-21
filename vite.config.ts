import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static SPA — builds to dist/ for Cloudflare Pages (`npm run deploy`).
export default defineConfig({
  plugins: [react()],
  build: { target: 'es2020', outDir: 'dist' },
})
