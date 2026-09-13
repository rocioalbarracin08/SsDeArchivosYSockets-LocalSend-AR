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

export function useTransferencias() {
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<SolicitudTransferencia[]>([])

  useEffect(() => {
    window.api.onSolicitudTransferencia((data: SolicitudTransferencia) => {
      setSolicitudesPendientes((previas) => [...previas, data])
    })
  }, [])

  function responderSolicitud(transferId: string, aceptado: boolean) {
    window.api.responderTransferencia(transferId, aceptado)
    setSolicitudesPendientes((previas) => previas.filter((s) => s.transferId !== transferId))
  }

  const solicitudActual = solicitudesPendientes[0]

  return { solicitudActual, responderSolicitud }
}