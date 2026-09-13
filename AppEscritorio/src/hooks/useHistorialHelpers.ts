import { useState, useEffect } from 'react'

export const DURACION_PRIORIDAD_MS = 15 * 1000 // 15 segundos

// Fuerza un re-render periódico, así los items "vencidos" pasan
// del área prioritaria al historial sin que el usuario tenga que interactuar.
export function useTickPeriodico(intervaloMs = 15000) {
  const [, forzarRender] = useState(0)
  useEffect(() => {
    const id = setInterval(() => forzarRender((n) => n + 1), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])
}