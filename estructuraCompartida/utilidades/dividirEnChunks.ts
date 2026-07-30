// Lee un archivo grande de a pedacitos (chunks), sin cargarlo entero en RAM.
// Devuelve un "generador" (async generator): en vez de darte todos los
// chunks juntos en un array, te los va entregando de a uno cuando se los pedís.
import fs from 'node:fs'

const TAMAÑO_CHUNK = 64 * 1024 // 64 KB por pedacito

export async function* dividirEnChunks(rutaArchivo: string) {
  const stream = fs.createReadStream(rutaArchivo, { highWaterMark: TAMAÑO_CHUNK })

  for await (const pedazo of stream) {
    yield pedazo as Buffer // entrega este chunk y "pausa" acá hasta que pidan el siguiente
  }
}