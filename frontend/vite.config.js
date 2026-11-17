import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Space_Mission_Health_Monitoring/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  }
})
