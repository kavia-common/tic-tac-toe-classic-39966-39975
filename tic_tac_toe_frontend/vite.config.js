import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configure development server to work with the provided preview host and port
  server: {
    host: true, // Listen on all addresses
    port: 3000, // Ensure port is 3000
    allowedHosts: ['vscode-internal-29410-qa.qa01.cloud.kavia.ai'], // Allow proxy/preview host
  },
})
