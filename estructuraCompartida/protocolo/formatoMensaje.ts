import type { DescripcionArchivos } from '../tipos/DescripcionArchivos'

// Arma el JSON de metadatos, listo para mandar por el WebSocket.
export function crearMensajeMetadatos(metadatos: DescripcionArchivos): string {
  return JSON.stringify(metadatos)
}

// Interpreta un mensaje de texto entrante y lo devuelve tipado.
// (Acá centralizamos el "parseo", si el formato cambia el día de mañana,
// se toca en un solo lugar y no en cada archivo que lo use.)
export function interpretarMensajeMetadatos(mensajeTexto: string): DescripcionArchivos {
  return JSON.parse(mensajeTexto) as DescripcionArchivos
}

// Respuesta de aceptado/rechazado, mismo criterio.
export function crearMensajeRespuesta(aceptado: boolean): string {
  return JSON.stringify({ tipo: 'respuesta', aceptado })
}