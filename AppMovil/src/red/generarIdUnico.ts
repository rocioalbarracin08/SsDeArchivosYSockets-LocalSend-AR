// Versión mobile de la utilidad de estructuraCompartida — ese archivo usa
// node:crypto, que no existe en el celu. Expo trae su propio generador,
// pero el resultado (un id único) es exactamente el mismo concepto.
import * as Crypto from 'expo-crypto'

export function generarIdUnico(): string {
  return Crypto.randomUUID()
}