/*Antes generábamos un nombre/id nuevo en CADA arranque de la app — eso hacía que, si el proceso viejo moría sin avisar (por ejemplo al reinstalar durante desarrollo), quedaran "fantasmas" con nombres distintos cada vez. Ahora: la primera vez que la app corre, generamos y GUARDAMOS la identidad en un archivo. Las próximas veces, la leemos de ahí — siempre el mismo nombre, para siempre (hasta que se desinstale la app).*/
import { File, Paths } from 'expo-file-system'
import { generarIdUnico } from './generarIdUnico'
import { generarNombreDispositivo } from '../../../estructuraCompartida/utilidades/generarNombreDispositivo'

interface IdentidadGuardada {
  id: string
  nombre: string
}

const archivoIdentidad = new File(Paths.document, 'identidad-dispositivo.json')

function cargarOCrearIdentidad(): IdentidadGuardada {
  if (archivoIdentidad.exists) {
    try {
      return JSON.parse(archivoIdentidad.textSync()) as IdentidadGuardada
    } catch {
      // Si el archivo está corrupto por algún motivo, seguimos como si no existiera.
    }
  }

  const identidadNueva: IdentidadGuardada = {
    id: generarIdUnico(),
    nombre: generarNombreDispositivo()
  }
  archivoIdentidad.create()
  archivoIdentidad.write(JSON.stringify(identidadNueva))
  return identidadNueva
}

const identidad = cargarOCrearIdentidad()

export const idPropio = identidad.id
export const nombreDispositivo = identidad.nombre