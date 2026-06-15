import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Honor a PORT env var when provided (e.g. by the preview harness); fall back
  // to Vite's default otherwise.
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : {},
})
