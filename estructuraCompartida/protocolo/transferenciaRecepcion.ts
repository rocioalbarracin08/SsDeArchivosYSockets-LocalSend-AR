// Guarda el progreso de cada transferencia entrante, una entrada por conexión activa.
// Usamos el socket crudo como clave (no un id de texto), porque es único
// por naturaleza para cada conexión, sin depender de que el framework nos dé un id.
import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import type { DescripcionArchivos } from '../tipos/DescripcionArchivos'

interface EstadoTransferencia {
  streamEscritura: fs.WriteStream
  tamañoEsperado: number
  bytesRecibidos: number
  nombreArchivo: string
}

const transferenciasActivas = new Map<object, EstadoTransferencia>()

export function iniciarRecepcion(conexionCruda: object, descripcion: DescripcionArchivos) {
  const rutaDestino = path.join(app.getPath('downloads'), descripcion.nombre)

  transferenciasActivas.set(conexionCruda, {
    streamEscritura: fs.createWriteStream(rutaDestino),
    tamañoEsperado: descripcion.tamaño,
    bytesRecibidos: 0,
    nombreArchivo: descripcion.nombre
  })
}

// Convierte cualquier formato binario que llegue (Buffer, ArrayBuffer, Uint8Array)
// a un Buffer real de Node — así el archivo se escribe con los bytes correctos,
// sin importar en qué formato exacto nos lo haya entregado el WebSocket por dentro.
function normalizarAChunkBinario(mensaje: unknown): Buffer {
  if (Buffer.isBuffer(mensaje)) return mensaje
  return Buffer.from(mensaje as ArrayBuffer)
}

export function recibirChunk(conexionCruda: object, mensaje: unknown): boolean {
  const estado = transferenciasActivas.get(conexionCruda)
  if (!estado) return false

  const chunkBinario = normalizarAChunkBinario(mensaje)
  estado.streamEscritura.write(chunkBinario)
  estado.bytesRecibidos += chunkBinario.length

  const transferenciaCompleta = estado.bytesRecibidos >= estado.tamañoEsperado
  if (transferenciaCompleta) {
    estado.streamEscritura.end()
    console.log(`Archivo "${estado.nombreArchivo}" completado.`)
    transferenciasActivas.delete(conexionCruda)
  }
  return transferenciaCompleta
}

export function cancelarRecepcion(conexionCruda: object) {
  const estado = transferenciasActivas.get(conexionCruda)
  if (estado) {
    estado.streamEscritura.end()
    transferenciasActivas.delete(conexionCruda)
  }
}