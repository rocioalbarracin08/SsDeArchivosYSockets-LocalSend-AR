import Zeroconf from 'react-native-zeroconf'
import type { Dispositivo } from '../../../estructuraCompartida/tipos/Dispositivo'

const NOMBRE_TIPO_SERVICIO = 'localsend'
const PROTOCOLO_SERVICIO = 'tcp'
const DOMINIO_SERVICIO = 'local.'

const zeroconf = new Zeroconf()
let escuchasYaRegistradas = false

export function activarVisibilidad(nombreDispositivo: string, puerto: number, idPropio: string) {
  zeroconf.publishService(
    NOMBRE_TIPO_SERVICIO,
    PROTOCOLO_SERVICIO,
    DOMINIO_SERVICIO,
    nombreDispositivo,
    puerto,
    { id: idPropio }
  )
}

export function desactivarVisibilidad(nombreDispositivo: string) {
  zeroconf.unpublishService(nombreDispositivo)
}

// Se registra UNA sola vez (por eso el "if" de guarda) — separado de
// iniciarEscaneo para poder relanzar la búsqueda sin duplicar los callbacks.
export function registrarEscuchasDeDispositivos(
  idPropio: string,
  alEncontrarDispositivo: (dispositivo: Dispositivo) => void,
  alPerderDispositivo: (nombre: string) => void
) {
  if (escuchasYaRegistradas) return
  escuchasYaRegistradas = true

  zeroconf.on('resolved', (servicioEncontrado: any) => {
    if (servicioEncontrado.txt?.id === idPropio) return
    alEncontrarDispositivo({
      name: servicioEncontrado.name,
      addresses: servicioEncontrado.addresses ?? [],
      port: servicioEncontrado.port
    })
  })

  zeroconf.on('remove', (nombrePerdido: string) => alPerderDispositivo(nombrePerdido))
  zeroconf.on('error', (error: Error) => console.warn('Aviso de Zeroconf:', error.message))
}

export function iniciarEscaneo() {
  zeroconf.scan(NOMBRE_TIPO_SERVICIO, PROTOCOLO_SERVICIO, DOMINIO_SERVICIO)
}

export function detenerEscaneo() {
  zeroconf.stop()
}