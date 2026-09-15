import { useState, useEffect } from 'react'

export const DURACION_PRIORIDAD_MS = 2 * 60 * 1000

export function useTickPeriodico(intervaloMs = 15000) {
  const [, forzarRender] = useState(0)
  useEffect(() => {
    const id = setInterval(() => forzarRender((n) => n + 1), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])
}