import { useState, useEffect } from 'react'
import { alRecibirSolicitudNueva, responderSolicitud as responderSolicitudEnServidor } from '../red/servidorTransferencia'
import type { SolicitudTransferencia } from '../red/servidorTransferencia'

export function useTransferencias() {
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<SolicitudTransferencia[]>([])

  useEffect(() => {
    alRecibirSolicitudNueva((solicitud) => {
      setSolicitudesPendientes((previas) => [...previas, solicitud])
    })
  }, [])

  function responderSolicitud(transferId: string, aceptado: boolean) {
    responderSolicitudEnServidor(transferId, aceptado)
    setSolicitudesPendientes((previas) => previas.filter((s) => s.transferId !== transferId))
  }

  const solicitudActual = solicitudesPendientes[0]

  return { solicitudActual, responderSolicitud }
}