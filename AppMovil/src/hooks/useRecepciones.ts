import { useState, useEffect } from 'react'
import { alAvanzarProgreso } from '../red/servidorTransferencia'
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
    alAvanzarProgreso((transferId, nombreArchivo, remitente, bytesRecibidos, tamañoEsperado) => {
      setRecepciones((previos) => {
        const completado = bytesRecibidos >= tamañoEsperado
        const existente = previos[transferId]
        return {
          ...previos,
          [transferId]: {
            transferId,
            nombreArchivo,
            remitente,
            bytesRecibidos,
            tamañoEsperado,
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