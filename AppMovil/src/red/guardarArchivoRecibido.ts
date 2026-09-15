import { esArchivoMultimedia, guardarEnGaleria } from './guardarEnGaleria'
import { compartirOGuardarArchivo } from './compartirArchivo'

export async function guardarArchivoRecibido(uri: string, nombreArchivo: string) {
  if (esArchivoMultimedia(nombreArchivo)) {
    await guardarEnGaleria(uri)
  } else {
    await compartirOGuardarArchivo(uri)
  }
}
// Archivo orquestadoir que decide segun la extension donde guardar