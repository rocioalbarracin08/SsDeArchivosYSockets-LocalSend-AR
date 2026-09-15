// Rol CLIENTE: manda un archivo a otro dispositivo. Usamos el WebSocket
// nativo de React Native para conectarnos — a diferencia del servidor, esto
// no necesita ningún motor hecho a mano.
import { File } from 'expo-file-system'
import { RUTA_WEBSOCKET } from '../../../estructuraCompartida/protocolo/constantes'
import { crearMensajeMetadatos } from '../../../estructuraCompartida/protocolo/formatoMensaje'
import type { DescripcionArchivos } from '../../../estructuraCompartida/tipos/DescripcionArchivos'
import type { ArchivoElegido } from '../hooks/useArchivosElegidos'

export type EstadoEnvio = 'esperando' | 'aceptado' | 'rechazado' | 'completado' | 'error'

const TAMAÑO_CHUNK = 64 * 1024
const TIEMPO_LIMITE_RESPUESTA_MS = 55000

export function enviarArchivoAPeer(
  archivo: ArchivoElegido,
  ipDestino: string,
  puertoDestino: number,
  nombreRemitente: string,
  onCambioEstado: (estado: EstadoEnvio) => void
) {
  const descripcion: DescripcionArchivos = {
    nombre: archivo.nombre,
    tamaño: archivo.tamaño,
    tipo: archivo.nombre.includes('.') ? '.' + archivo.nombre.split('.').pop() : '',
    remitente: nombreRemitente
  }

  const socket = new WebSocket(`ws://${ipDestino}:${puertoDestino}${RUTA_WEBSOCKET}`)

  const timeoutRespuesta = setTimeout(() => {
    onCambioEstado('error')
    socket.close()
  }, TIEMPO_LIMITE_RESPUESTA_MS)

  socket.onopen = () => {
    onCambioEstado('esperando')
    socket.send(crearMensajeMetadatos(descripcion))
  }

  socket.onmessage = (evento) => {
    clearTimeout(timeoutRespuesta)
    const respuesta = JSON.parse(evento.data as string)

    if (!(respuesta.tipo === 'respuesta' && respuesta.aceptado)) {
      onCambioEstado('rechazado')
      socket.close()
      return
    }

    onCambioEstado('aceptado')

    const archivoOrigen = new File(archivo.uri)
    const manejadorLectura = archivoOrigen.open()

    while (manejadorLectura.offset !== null && manejadorLectura.offset < manejadorLectura.size!) {
      const pedazo = manejadorLectura.readBytes(TAMAÑO_CHUNK)
      socket.send(pedazo.buffer)
    }
    manejadorLectura.close()

    socket.close()
    onCambioEstado('completado')
  }

  socket.onerror = () => {
    clearTimeout(timeoutRespuesta)
    onCambioEstado('error')
  }
}