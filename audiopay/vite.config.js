import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [
    react(),
    mkcert() // generates trusted HTTPS cert — required for mic on mobile browsers
  ],
  server: {
    host: true,   // expose to local network so both phones can connect
    https: true,  // mic API requires HTTPS on non-localhost
    port: 3000
  }
})
