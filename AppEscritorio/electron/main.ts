import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { Bonjour } from 'bonjour-service'
import { Elysia } from 'elysia'
import { node } from '@elysiajs/node'

import { PUERTO_TRANSFERENCIA, TIPO_SERVICIO_BONJOUR, RUTA_WEBSOCKET } from '../../estructuraCompartida/protocolo/constantes'
import { interpretarMensajeMetadatos, crearMensajeRespuesta } from '../../estructuraCompartida/protocolo/formatoMensaje'
import { enviarArchivoAPeer } from '../../estructuraCompartida/protocolo/clienteEnvio'
import { generarIdUnico } from '../../estructuraCompartida/utilidades/generarIdUnico'
import { generarNombreDispositivo } from '../../estructuraCompartida/utilidades/generarNombreDispositivo'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Identidad de esta instancia: se generan una sola vez al arrancar la app.
const idPropio = generarIdUnico()
const nombreDispositivo = generarNombreDispositivo()

let ventanaPrincipal: BrowserWindow | null = null
let servicioPublicado: ReturnType<Bonjour['publish']> | null = null
const bonjour = new Bonjour()

interface EstadoTransferencia {
  streamEscritura: fs.WriteStream
  tamañoEsperado: number
  bytesRecibidos: number
  nombreArchivo: string
}
const transferenciasActivas = new Map<string, EstadoTransferencia>()

function crearVentana() {
  ventanaPrincipal = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  ventanaPrincipal.loadURL(process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173')
}

function iniciarServidorTransferencia() {
  return new Elysia({ adapter: node() })
    .ws(RUTA_WEBSOCKET, {
      open(conexion) {
        console.log('Peer conectado:', conexion.id)
      },
      message(conexion, mensaje) {
        // Si es texto, son los metadatos del archivo (JSON).
        if (typeof mensaje === 'string') {
          const descripcion = interpretarMensajeMetadatos(mensaje)
          const rutaDestino = path.join(app.getPath('downloads'), descripcion.nombre)

          transferenciasActivas.set(conexion.id, {
            streamEscritura: fs.createWriteStream(rutaDestino),
            tamañoEsperado: descripcion.tamaño,
            bytesRecibidos: 0,
            nombreArchivo: descripcion.nombre
          })

          // Auto-acepta por ahora; el diálogo real de confirmación va después.
          conexion.send(crearMensajeRespuesta(true))
          return
        }

        // Si no es texto, es un chunk binario del archivo.
        const estado = transferenciasActivas.get(conexion.id)
        if (!estado) return

        estado.streamEscritura.write(mensaje as Buffer)
        estado.bytesRecibidos += (mensaje as Buffer).length

        if (estado.bytesRecibidos >= estado.tamañoEsperado) {
          estado.streamEscritura.end()
          console.log(`Archivo "${estado.nombreArchivo}" completado.`)
          transferenciasActivas.delete(conexion.id)
        }
      },
      close(conexion) {
        const estado = transferenciasActivas.get(conexion.id)
        if (estado) {
          estado.streamEscritura.end()
          transferenciasActivas.delete(conexion.id)
        }
      }
    })
    .listen(PUERTO_TRANSFERENCIA)
}

function activarVisibilidad() {
  servicioPublicado = bonjour.publish({
    name: nombreDispositivo,
    type: TIPO_SERVICIO_BONJOUR,
    port: PUERTO_TRANSFERENCIA,
    txt: { version: '1.0.0', id: idPropio }
  })

  servicioPublicado.on('up', () => {
    console.log(`Anunciado como "${nombreDispositivo}" en la red.`)
  })

  servicioPublicado.on('error', (error: Error) => {
    console.warn('Aviso Bonjour:', error.message)
  })
}

function desactivarVisibilidad() {
  servicioPublicado?.stop(() => console.log('Dejamos de anunciarnos en la red.'))
  servicioPublicado = null
}

function publicarYBuscarDispositivos() {
  activarVisibilidad()

  ipcMain.on('buscar-servicios', () => {
    const buscador = bonjour.find({ type: TIPO_SERVICIO_BONJOUR })

    buscador.on('up', (servicioEncontrado) => {
      // Nos ignoramos a nosotros mismos comparando el id propio.
      if (servicioEncontrado.txt?.id === idPropio) return

      ventanaPrincipal?.webContents.send('servicio-encontrado', {
        name: servicioEncontrado.name,
        addresses: servicioEncontrado.addresses,
        port: servicioEncontrado.port
      })
    })
  })

  ipcMain.on('cambiar-visibilidad', (_evento, visible: boolean) => {
    if (visible) activarVisibilidad()
    else desactivarVisibilidad()
  })
}

ipcMain.on('enviar-archivo', (_evento, datos: { rutaArchivo: string; ipDestino: string; puertoDestino: number }) => {
  enviarArchivoAPeer(datos.rutaArchivo, datos.ipDestino, datos.puertoDestino)
})

if (process.platform === 'linux') {
  app.disableHardwareAcceleration()
}

app.whenReady().then(() => {
  crearVentana()
  iniciarServidorTransferencia()
  publicarYBuscarDispositivos()
})

app.on('window-all-closed', () => {
  bonjour.destroy()
  if (process.platform !== 'darwin') app.quit()
})