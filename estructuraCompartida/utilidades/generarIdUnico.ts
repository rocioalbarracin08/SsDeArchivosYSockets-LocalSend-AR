import { randomUUID } from 'node:crypto'

// Un id único por cada vez que arranca la app — sirve para que la app
// pueda reconocer "este servicio que encontré soy yo mismo" y filtrarlo.
export function generarIdUnico(): string {
  return randomUUID()
}