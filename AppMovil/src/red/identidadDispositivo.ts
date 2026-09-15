// Genera el nombre y el id de ESTE dispositivo, una sola vez por arranque de
// la app (igual que hace main.ts en desktop). Cualquier otro archivo que
// necesite "quién soy yo" importa estas dos constantes.
import { generarIdUnico } from './generarIdUnico'
import { generarNombreDispositivo } from '../../../estructuraCompartida/utilidades/generarNombreDispositivo'

export const idPropio = generarIdUnico()
export const nombreDispositivo = generarNombreDispositivo()