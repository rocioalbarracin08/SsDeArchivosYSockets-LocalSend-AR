import { useState } from 'react'
import { useTickPeriodico, DURACION_PRIORIDAD_MS } from './useHistorialHelpers'

export interface EnvioSaliente {
  envioId: string
  nombreArchivo: string
  nombreDispositivo: string
  estado: string
  finalizadoEn?: number
}

const ESTADOS_FINALES = ['completado', 'rechazado', 'error']

export function useEnviosSalientes() {
  const [envios, setEnvios] = useState<Record<string, EnvioSaliente>>({})
  useTickPeriodico()

  function registrarEnvio(envioId: string, nombreArchivo: string, nombreDispositivo: string) {
    setEnvios((previos) => ({
      ...previos,
      [envioId]: { envioId, nombreArchivo, nombreDispositivo, estado: 'enviando' }
    }))
  }

  function actualizarEstadoEnvio(envioId: string, estado: string) {
    setEnvios((previos) => {
      const existente = previos[envioId]
      if (!existente) return previos
      const esFinal = ESTADOS_FINALES.includes(estado)
      return {
        ...previos,
        [envioId]: {
          ...existente,
          estado,
          finalizadoEn: esFinal ? (existente.finalizadoEn ?? Date.now()) : existente.finalizadoEn
        }
      }
    })
  }

  function eliminarEnvios(ids: string[]) {
    setEnvios((previos) => {
      const copia = { ...previos }
      ids.forEach((id) => delete copia[id])
      return copia
    })
  }

  const todos = Object.values(envios)
  const ahora = Date.now()
  const activos = todos.filter((e) => !e.finalizadoEn || ahora - e.finalizadoEn < DURACION_PRIORIDAD_MS)
  const historial = todos.filter((e) => e.finalizadoEn && ahora - e.finalizadoEn >= DURACION_PRIORIDAD_MS)

  return { activos, historial, registrarEnvio, actualizarEstadoEnvio, eliminarEnvios }
}