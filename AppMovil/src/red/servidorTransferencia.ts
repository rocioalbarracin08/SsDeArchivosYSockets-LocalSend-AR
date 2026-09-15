// src/red/servidorTransferencia.ts
import { File, Paths } from 'expo-file-system'
import { crearServidorWebSocket } from './servidorWebSocket'
import type { ConexionWebSocket } from './servidorWebSocket'
import { interpretarMensajeMetadatos, crearMensajeRespuesta } from '../../../estructuraCompartida/protocolo/formatoMensaje'
import { generarIdUnico } from './generarIdUnico'
import type { DescripcionArchivos } from '../../../estructuraCompartida/tipos/DescripcionArchivos'

export interface SolicitudTransferencia {
  transferId: string
  descripcion: DescripcionArchivos
}

interface TransferenciaActiva {
  manejador: any
  descripcion: DescripcionArchivos
  bytesRecibidos: number
}

const solicitudesPendientes = new Map<string, { conexion: ConexionWebSocket; descripcion: DescripcionArchivos }>()
const transferenciasActivas = new Map<string, TransferenciaActiva>()

let avisarSolicitudNueva: ((s: SolicitudTransferencia) => void) | null = null
let avisarProgreso:
  | ((transferId: string, nombreArchivo: string, remitente: string, bytesRecibidos: number, tamañoEsperado: number) => void)
  | null = null

export function iniciarServidorTransferencia(puerto: number) {
  crearServidorWebSocket(puerto, (conexion) => {
    let transferIdActual: string | null = null

    conexion.alRecibirTexto((textoRecibido) => {
      const descripcion = interpretarMensajeMetadatos(textoRecibido)
      const transferId = generarIdUnico()
      transferIdActual = transferId

      solicitudesPendientes.set(transferId, { conexion, descripcion })
      avisarSolicitudNueva?.({ transferId, descripcion })
    })

    conexion.alRecibirBinario((chunk) => {
      if (!transferIdActual) return
      const estado = transferenciasActivas.get(transferIdActual)
      if (!estado) return

      estado.manejador.writeBytes(chunk)
      estado.bytesRecibidos += chunk.length
      avisarProgreso?.(
        transferIdActual,
        estado.descripcion.nombre,
        estado.descripcion.remitente,
        estado.bytesRecibidos,
        estado.descripcion.tamaño
      )

      if (estado.bytesRecibidos >= estado.descripcion.tamaño) {
        estado.manejador.close()
        transferenciasActivas.delete(transferIdActual)
      }
    })
  })
}

export function responderSolicitud(transferId: string, aceptado: boolean) {
  const solicitud = solicitudesPendientes.get(transferId)
  solicitudesPendientes.delete(transferId)
  if (!solicitud) return

  solicitud.conexion.enviarTexto(crearMensajeRespuesta(aceptado))
  if (!aceptado) return

  const archivoDestino = new File(Paths.document, solicitud.descripcion.nombre)
  if (archivoDestino.exists) {
    archivoDestino.delete()
  }
  archivoDestino.create()

  const manejador = archivoDestino.open()

  transferenciasActivas.set(transferId, {
    manejador,
    descripcion: solicitud.descripcion,
    bytesRecibidos: 0
  })
}

export function alRecibirSolicitudNueva(callback: (s: SolicitudTransferencia) => void) {
  avisarSolicitudNueva = callback
}

export function alAvanzarProgreso(
  callback: (transferId: string, nombreArchivo: string, remitente: string, bytesRecibidos: number, tamañoEsperado: number) => void
) {
  avisarProgreso = callback
}