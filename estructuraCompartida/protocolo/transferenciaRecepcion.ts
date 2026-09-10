// Guarda el progreso de cada transferencia entrante, una entrada por conexión activa.
import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import type { WebSocket } from 'ws'
import type { DescripcionArchivos } from '../tipos/DescripcionArchivos'

interface EstadoTransferencia {
  streamEscritura: fs.WriteStream
  tamañoEsperado: number
  bytesRecibidos: number
  nombreArchivo: string
  nombreRemitente: string
}

const transferenciasActivas = new Map<WebSocket, EstadoTransferencia>()

export function iniciarRecepcion(conexion: WebSocket, descripcion: DescripcionArchivos) {
  const rutaDestino = path.join(app.getPath('downloads'), descripcion.nombre)

  transferenciasActivas.set(conexion, {
    streamEscritura: fs.createWriteStream(rutaDestino),
    tamañoEsperado: descripcion.tamaño,
    bytesRecibidos: 0,
    nombreArchivo: descripcion.nombre,
    nombreRemitente: descripcion.remitente
  })

  console.log(`Recibiendo "${descripcion.nombre}" de "${descripcion.remitente}"...`)
}

export function recibirChunk(conexion: WebSocket, chunk: Buffer): boolean {
  const estado = transferenciasActivas.get(conexion)
  if (!estado) return false

  estado.streamEscritura.write(chunk)
  estado.bytesRecibidos += chunk.length

  const transferenciaCompleta = estado.bytesRecibidos >= estado.tamañoEsperado
  if (transferenciaCompleta) {
    estado.streamEscritura.end()
    console.log(`Archivo "${estado.nombreArchivo}" de "${estado.nombreRemitente}" completado.`)
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