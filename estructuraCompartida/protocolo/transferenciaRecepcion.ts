import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import type { WebSocket } from 'ws'
import type { DescripcionArchivos } from '../tipos/DescripcionArchivos'

type NotificarProgreso = (bytesRecibidos: number, tamañoEsperado: number) => void

interface EstadoTransferencia {
  streamEscritura: fs.WriteStream
  tamañoEsperado: number
  bytesRecibidos: number
  nombreArchivo: string
  notificarProgreso: NotificarProgreso
}

const transferenciasActivas = new Map<WebSocket, EstadoTransferencia>()

// Ahora recibe una función de callback: cada vez que llega un chunk,
// avisamos hacia afuera cuánto llevamos, sin que este archivo sepa nada de React.
export function iniciarRecepcion(
  conexion: WebSocket,
  descripcion: DescripcionArchivos,
  notificarProgreso: NotificarProgreso
) {
  const rutaDestino = path.join(app.getPath('downloads'), descripcion.nombre)

  transferenciasActivas.set(conexion, {
    streamEscritura: fs.createWriteStream(rutaDestino),
    tamañoEsperado: descripcion.tamaño,
    bytesRecibidos: 0,
    nombreArchivo: descripcion.nombre,
    notificarProgreso
  })
}

export function recibirChunk(conexion: WebSocket, chunk: Buffer): boolean {
  const estado = transferenciasActivas.get(conexion)
  if (!estado) return false

  estado.streamEscritura.write(chunk)
  estado.bytesRecibidos += chunk.length
  estado.notificarProgreso(estado.bytesRecibidos, estado.tamañoEsperado)

  const transferenciaCompleta = estado.bytesRecibidos >= estado.tamañoEsperado
  if (transferenciaCompleta) {
    estado.streamEscritura.end()
    transferenciasActivas.delete(conexion)
  }
  return transferenciaCompleta
}

export function cancelarRecepcion(conexion: WebSocket) {
  const estado = transferenciasActivas.get(conexion)
  if (estado) {
    estado.streamEscritura.end()
    transferenciasActivas.delete(conexion)
  }
}