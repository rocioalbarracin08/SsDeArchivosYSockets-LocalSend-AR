import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Proceso principal (Bonjour, Elysia, todo lo que armamos en main.ts)
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              // "ws" intenta usar estos dos paquetes acelerantes si existen,
              // pero son opcionales — le decimos a Rollup que no los empaquete,
              // así "ws" sigue andando con su respaldo en JavaScript puro.
              external: ['bufferutil', 'utf-8-validate']
            }
          }
        }
      },
      {
        // El puente entre Main y Renderer
        entry: 'electron/preload.ts'
      }
    ])
  ]
})