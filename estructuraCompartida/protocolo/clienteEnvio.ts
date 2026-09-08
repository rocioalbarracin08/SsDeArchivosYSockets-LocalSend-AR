// Cliente WebSocket: inicia la conexión HACIA otro dispositivo para
// negociar y mandarle un archivo. Es la contraparte del servidor de main.ts.
import WebSocket from 'ws'
import fs from 'node:fs'
import path from 'node:path'
import { RUTA_WEBSOCKET } from './constantes'
import { crearMensajeMetadatos } from './formatoMensaje'
import { dividirEnChunks } from '../utilidades/dividirEnChunks'
import type { DescripcionArchivos } from '../tipos/DescripcionArchivos'

export function enviarArchivoAPeer(rutaArchivo: string, ipDestino: string, puertoDestino: number) {
  const nombreArchivo = path.basename(rutaArchivo)
  const tamañoArchivo = fs.statSync(rutaArchivo).size

  const descripcion: DescripcionArchivos = {
    nombre: nombreArchivo,
    tamaño: tamañoArchivo,
    tipo: path.extname(rutaArchivo)
  }

  const socket = new WebSocket(`ws://${ipDestino}:${puertoDestino}${RUTA_WEBSOCKET}`)

  socket.on('open', () => {
    socket.send(crearMensajeMetadatos(descripcion))
  })

  socket.on('message', async (mensajeRespuesta: WebSocket.RawData) => {
    const respuesta = JSON.parse(mensajeRespuesta.toString())

    if (respuesta.tipo === 'respuesta' && respuesta.aceptado) {
      for await (const chunk of dividirEnChunks(rutaArchivo)) {
        socket.send(chunk)
      }
      socket.close()
    } else {
      console.warn('El destino rechazó la transferencia.')
      socket.close()
    }
  })

  socket.on('error', (error: Error) => {
    console.error('Error en el envío:', error.message)
  })
}