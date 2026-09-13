import { useState, useEffect } from 'react'
import { useTickPeriodico, DURACION_PRIORIDAD_MS } from './useHistorialHelpers'

export interface RegistroRecepcion {
  transferId: string
  nombreArchivo: string
  remitente: string
  bytesRecibidos: number
  tamañoEsperado: number
  estado: 'recibiendo' | 'completado'
  finalizadoEn?: number
}

export function useRecepciones() {
  const [recepciones, setRecepciones] = useState<Record<string, RegistroRecepcion>>({})
  useTickPeriodico()

  useEffect(() => {
    window.api.onProgresoTransferencia((data: {
      transferId: string
      nombreArchivo: string
      remitente: string
      bytesRecibidos: number
      tamañoEsperado: number
    }) => {
      setRecepciones((previos) => {
        const completado = data.bytesRecibidos >= data.tamañoEsperado
        const existente = previos[data.transferId]
        return {
          ...previos,
          [data.transferId]: {
            transferId: data.transferId,
            nombreArchivo: data.nombreArchivo,
            remitente: data.remitente,
            bytesRecibidos: data.bytesRecibidos,
            tamañoEsperado: data.tamañoEsperado,
            estado: completado ? 'completado' : 'recibiendo',
            finalizadoEn: completado ? (existente?.finalizadoEn ?? Date.now()) : undefined
          }
        }
      })
    })
  }, [])

  function eliminarRecepciones(ids: string[]) {
    setRecepciones((previos) => {
      const copia = { ...previos }
      ids.forEach((id) => delete copia[id])
      return copia
    })
  }

  const todos = Object.values(recepciones)
  const ahora = Date.now()
  const activos = todos.filter((r) => r.estado === 'recibiendo' || !r.finalizadoEn || ahora - r.finalizadoEn < DURACION_PRIORIDAD_MS)
  const historial = todos.filter((r) => r.finalizadoEn && ahora - r.finalizadoEn >= DURACION_PRIORIDAD_MS)

  return { activos, historial, eliminarRecepciones }
}