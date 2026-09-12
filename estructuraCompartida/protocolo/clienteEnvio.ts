import WebSocket from 'ws'
import fs from 'node:fs'
import path from 'node:path'
import { RUTA_WEBSOCKET } from './constantes'
import { crearMensajeMetadatos } from './formatoMensaje'
import { dividirEnChunks } from '../utilidades/dividirEnChunks'
import type { DescripcionArchivos } from '../tipos/DescripcionArchivos'

export type EstadoEnvio = 'esperando' | 'aceptado' | 'rechazado' | 'completado' | 'error'

export function enviarArchivoAPeer(
  rutaArchivo: string,
  ipDestino: string,
  puertoDestino: number,
  nombreRemitente: string,
  onCambioEstado: (estado: EstadoEnvio) => void, // NUEVO: avisa cada paso del envío
  onFalloConexion?: () => void
) {
  const nombreArchivo = path.basename(rutaArchivo)
  const tamañoArchivo = fs.statSync(rutaArchivo).size

  const descripcion: DescripcionArchivos = {
    nombre: nombreArchivo,
    tamaño: tamañoArchivo,
    tipo: path.extname(rutaArchivo),
    remitente: nombreRemitente
  }

  const socket = new WebSocket(`ws://${ipDestino}:${puertoDestino}${RUTA_WEBSOCKET}`)

  socket.on('open', () => {
    onCambioEstado('esperando')
    socket.send(crearMensajeMetadatos(descripcion))
  })

  socket.on('message', async (mensajeRespuesta: WebSocket.RawData) => {
    const respuesta = JSON.parse(mensajeRespuesta.toString())

    if (respuesta.tipo === 'respuesta' && respuesta.aceptado) {
      onCambioEstado('aceptado')
      for await (const chunk of dividirEnChunks(rutaArchivo)) {
        socket.send(chunk)
      }
      socket.close()
      onCambioEstado('completado')
    } else {
      onCambioEstado('rechazado')
      socket.close()
    }
  })

  socket.on('error', (error: Error) => {
    console.error('Error en el envío:', error.message)
    onCambioEstado('error')
    onFalloConexion?.()
  })
}