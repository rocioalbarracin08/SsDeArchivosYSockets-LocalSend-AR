import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { Bonjour } from 'bonjour-service'
import { Elysia } from 'elysia'
import { node } from '@elysiajs/node'

import { PUERTO_TRANSFERENCIA, TIPO_SERVICIO_BONJOUR, RUTA_WEBSOCKET } from '../../estructuraCompartida/protocolo/constantes'
import { interpretarMensajeMetadatos, crearMensajeRespuesta } from '../../estructuraCompartida/protocolo/formatoMensaje'
import { generarIdUnico } from '../../estructuraCompartida/utilidades/generarIdUnico'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null
const bonjour = new Bonjour()

interface EstadoTransferencia {
  streamEscritura: fs.WriteStream
  tamañoEsperado: number
  bytesRecibidos: number
  nombreArchivo: string
}
const transferenciasActivas = new Map<string, EstadoTransferencia>()

function crearVentana() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173')
}

function iniciarServidorTransferencia() {
  return new Elysia({ adapter: node() })
    .ws(RUTA_WEBSOCKET, {
      open(ws) {
        console.log('Peer conectado:', ws.id)
      },
      message(ws, mensaje) {
        if (typeof mensaje === 'string') {
          const metadatos = interpretarMensajeMetadatos(mensaje)
          const rutaDestino = path.join(app.getPath('downloads'), metadatos.nombre)

          transferenciasActivas.set(ws.id, {
            streamEscritura: fs.createWriteStream(rutaDestino),
            tamañoEsperado: metadatos.tamaño,
            bytesRecibidos: 0,
            nombreArchivo: metadatos.nombre
          })

          ws.send(crearMensajeRespuesta(true))
          return
        }

        const estado = transferenciasActivas.get(ws.id)
        if (!estado) return

        estado.streamEscritura.write(mensaje as Buffer)
        estado.bytesRecibidos += (mensaje as Buffer).length

        if (estado.bytesRecibidos >= estado.tamañoEsperado) {
          estado.streamEscritura.end()
          transferenciasActivas.delete(ws.id)
        }
      },
      close(ws) {
        const estado = transferenciasActivas.get(ws.id)
        if (estado) {
          estado.streamEscritura.end()
          transferenciasActivas.delete(ws.id)
        }
      }
    })
    .listen(PUERTO_TRANSFERENCIA)
}


const MI_ID = generarIdUnico() // se genera una sola vez, al arrancar la app

function publicarYBuscarDispositivos() {
  const servicioPublicado = bonjour.publish({
    name: 'Mi PC - LocalSend',
    type: TIPO_SERVICIO_BONJOUR,
    port: PUERTO_TRANSFERENCIA,
    txt: { version: '1.0.0', id: MI_ID } // NUEVO: mandamos nuestro id en el anuncio
  })

  servicioPublicado.on('up', () => console.log('Anunciado en la red vía Bonjour.'))
  servicioPublicado.on('error', (err) => console.warn('Aviso Bonjour:', err.message))

  ipcMain.on('buscar-servicios', () => {
    const browser = bonjour.find({ type: TIPO_SERVICIO_BONJOUR })

    browser.on('up', (servicio) => {
      // NUEVO: si el id que viene en el anuncio es el mismo que el nuestro,
      // significa que nos encontramos a nosotros mismos — lo ignoramos.
      if (servicio.txt?.id === MI_ID) return

      mainWindow?.webContents.send('servicio-encontrado', {
        name: servicio.name,
        addresses: servicio.addresses,
        port: servicio.port
      })
    })
  })
}
app.disableHardwareAcceleration()

app.whenReady().then(() => {
  crearVentana()
  iniciarServidorTransferencia()
  publicarYBuscarDispositivos()
})

app.on('window-all-closed', () => {
  bonjour.destroy()
  if (process.platform !== 'darwin') app.quit()
})