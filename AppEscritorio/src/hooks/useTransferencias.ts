import { useState, useEffect } from 'react'

interface DescripcionArchivos {
  nombre: string
  tamaño: number
  tipo: string
  remitente: string
}

export interface SolicitudTransferencia {
  transferId: string
  descripcion: DescripcionArchivos
}

export interface ProgresoTransferencia {
  transferId: string
  nombreArchivo: string
  bytesRecibidos: number
  tamañoEsperado: number
}

export function useTransferencias() {
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<SolicitudTransferencia[]>([])
  const [progresos, setProgresos] = useState<Record<string, ProgresoTransferencia>>({})

  useEffect(() => {
    window.api.onSolicitudTransferencia((data: SolicitudTransferencia) => {
      setSolicitudesPendientes((previas) => [...previas, data])
    })
  }, [])

  useEffect(() => {
    window.api.onProgresoTransferencia((data: ProgresoTransferencia) => {
      setProgresos((previos) => ({ ...previos, [data.transferId]: data }))
    })
  }, [])

  function responderSolicitud(transferId: string, aceptado: boolean) {
    window.api.responderTransferencia(transferId, aceptado)
    setSolicitudesPendientes((previas) => previas.filter((s) => s.transferId !== transferId))
  }

  const solicitudActual = solicitudesPendientes[0]

  return { solicitudActual, progresos, responderSolicitud }
}