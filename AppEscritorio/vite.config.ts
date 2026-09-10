import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['bufferutil', 'utf-8-validate']
            }
          }
        }
      },
      preload: {
        input: 'electron/preload.ts'
        // El sub-paquete "/simple" ya se encarga de compilar esto
        // a CommonJS automáticamente — no hace falta forzar nada más acá.
      }
    })
  ]
})