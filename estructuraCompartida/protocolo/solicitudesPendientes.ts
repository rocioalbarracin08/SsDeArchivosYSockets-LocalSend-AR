// Guarda las transferencias que están esperando que el usuario decida
// Aceptar/Rechazar, identificadas por un id único (transferId).
import type { WebSocket } from 'ws'
import type { DescripcionArchivos } from '../tipos/DescripcionArchivos'

interface SolicitudPendiente {
  conexion: WebSocket
  descripcion: DescripcionArchivos
}

const solicitudesPendientes = new Map<string, SolicitudPendiente>()

export function registrarSolicitud(transferId: string, conexion: WebSocket, descripcion: DescripcionArchivos) {
  solicitudesPendientes.set(transferId, { conexion, descripcion })
}

// La "toma" y la borra al mismo tiempo: una vez que el usuario respondió,
// esa solicitud ya no debería poder responderse de nuevo.
export function tomarSolicitud(transferId: string): SolicitudPendiente | undefined {
  const solicitud = solicitudesPendientes.get(transferId)
  solicitudesPendientes.delete(transferId)
  return solicitud
}