import { app, Notification, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { Bonjour } from 'bonjour-service'

import { PUERTO_TRANSFERENCIA, TIPO_SERVICIO_BONJOUR, RUTA_WEBSOCKET } from '../../estructuraCompartida/protocolo/constantes'
import { interpretarMensajeMetadatos, crearMensajeRespuesta } from '../../estructuraCompartida/protocolo/formatoMensaje'
import { enviarArchivoAPeer } from '../../estructuraCompartida/protocolo/clienteEnvio'
import { iniciarRecepcion, recibirChunk, cancelarRecepcion } from '../../estructuraCompartida/protocolo/transferenciaRecepcion'
import { registrarSolicitud, tomarSolicitud } from '../../estructuraCompartida/protocolo/solicitudesPendientes'
import { generarIdUnico } from '../../estructuraCompartida/utilidades/generarIdUnico'
import { generarNombreDispositivo } from '../../estructuraCompartida/utilidades/generarNombreDispositivo'
import { elegirDireccionIP } from '../../estructuraCompartida/utilidades/elegirDireccionIP'


const __dirname = path.dirname(fileURLToPath(import.meta.url))

const idPropio = generarIdUnico()
const nombreDispositivo = generarNombreDispositivo()

let ventanaPrincipal: BrowserWindow | null = null
let servicioPublicado: ReturnType<Bonjour['publish']> | null = null
const bonjour = new Bonjour()

interface DispositivoEncontrado {
  name: string
  addresses: string[]
  port: number
}
const dispositivosConocidos = new Map<string, DispositivoEncontrado>()

// NUEVO: notificación nativa del sistema operativo, para cuando la ventana
// no está al frente. Al hacer click, trae la ventana de vuelta y la enfoca.
function mostrarNotificacionNativa() {
  const notificacion = new Notification({
    title: 'LocalSend',
    body: 'Te llegó una solicitud en la AppWeb, no olvides revisarla...',
    icon: path.join(__dirname, '../public/icono-notificacion.png')
  })

  notificacion.on('click', () => {
    if (ventanaPrincipal) {
      if (ventanaPrincipal.isMinimized()) ventanaPrincipal.restore()
      ventanaPrincipal.focus()
    }
  })

  notificacion.show()
}

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
  const servidorHttp = createServer()
  const servidorWs = new WebSocketServer({ server: servidorHttp, path: RUTA_WEBSOCKET })

  servidorWs.on('connection', (conexion) => {
    conexion.on('message', (datos, esBinario) => {
    if (!esBinario) {
      const descripcion = interpretarMensajeMetadatos(datos.toString())
      const transferId = generarIdUnico()

      registrarSolicitud(transferId, conexion, descripcion)
      ventanaPrincipal?.webContents.send('solicitud-transferencia', { transferId, descripcion })

      // NUEVO: si la ventana no está al frente, avisamos con una notificación nativa.
      if (ventanaPrincipal && !ventanaPrincipal.isFocused()) {
        const notificacion = new Notification({
          title: 'LocalSend',
          body: 'Te llegó una solicitud en la AppWeb, no olvides revisarla...'
        })

        notificacion.on('click', () => {
          ventanaPrincipal?.show()
          ventanaPrincipal?.focus()
        })

        notificacion.show()
      }
      return
    }
      // Chunk binario: solo se procesa si ya existe una recepción iniciada
      // (o sea, si el usuario ya aceptó antes).
      recibirChunk(conexion, datos as Buffer)
    })

    conexion.on('close', () => {
      cancelarRecepcion(conexion)
    })
  })

  servidorHttp.listen(PUERTO_TRANSFERENCIA)
  console.log(`Servidor de transferencia escuchando en el puerto ${PUERTO_TRANSFERENCIA}`)
}

// NUEVO: el usuario ya decidió Aceptar o Rechazar desde la interfaz.
function manejarRespuestaDeUsuario(transferId: string, aceptado: boolean) {
  const solicitud = tomarSolicitud(transferId)
  if (!solicitud) return

  solicitud.conexion.send(crearMensajeRespuesta(aceptado))

  if (aceptado) {
    iniciarRecepcion(solicitud.conexion, solicitud.descripcion, (bytesRecibidos, tamañoEsperado) => {
      ventanaPrincipal?.webContents.send('progreso-transferencia', {
        transferId,
        nombreArchivo: solicitud.descripcion.nombre,
        bytesRecibidos,
        tamañoEsperado
      })
    })
  }
}

function activarVisibilidad() {
  servicioPublicado = bonjour.publish({
    name: nombreDispositivo,
    type: TIPO_SERVICIO_BONJOUR,
    port: PUERTO_TRANSFERENCIA,
    txt: { version: '1.0.0', id: idPropio }
  })
  servicioPublicado.on('up', () => console.log(`Anunciado como "${nombreDispositivo}" en la red.`))
  servicioPublicado.on('error', (error: Error) => console.warn('Aviso Bonjour:', error.message))
}

function desactivarVisibilidad() {
  servicioPublicado?.stop(() => console.log('Dejamos de anunciarnos en la red.'))
  servicioPublicado = null
}

function publicarYBuscarDispositivos() {
  activarVisibilidad()

  const buscador = bonjour.find({ type: TIPO_SERVICIO_BONJOUR })

  buscador.on('up', (servicioEncontrado) => {
    if (servicioEncontrado.txt?.id === idPropio) return

    const dispositivo: DispositivoEncontrado = {
      name: servicioEncontrado.name,
      addresses: servicioEncontrado.addresses ?? [],
      port: servicioEncontrado.port
    }
    dispositivosConocidos.set(dispositivo.name, dispositivo)
    ventanaPrincipal?.webContents.send('servicio-encontrado', dispositivo)
  })

  buscador.on('down', (servicioPerdido) => {
    dispositivosConocidos.delete(servicioPerdido.name)
    ventanaPrincipal?.webContents.send('servicio-perdido', { name: servicioPerdido.name })
  })

  ipcMain.on('buscar-servicios', () => {
    dispositivosConocidos.forEach((dispositivo) => {
      ventanaPrincipal?.webContents.send('servicio-encontrado', dispositivo)
    })
  })

  ipcMain.on('cambiar-visibilidad', (_evento, visible: boolean) => {
    if (visible) activarVisibilidad()
    else desactivarVisibilidad()
  })
}

ipcMain.on('enviar-archivo', (_evento, datos: { rutaArchivo: string; direcciones: string[]; puertoDestino: number }) => {
  const ipElegida = elegirDireccionIP(datos.direcciones)
  enviarArchivoAPeer(datos.rutaArchivo, ipElegida, datos.puertoDestino, nombreDispositivo)
})

// NUEVO: escucha la decisión del usuario desde el diálogo de React.
ipcMain.on('respuesta-transferencia', (_evento, datos: { transferId: string; aceptado: boolean }) => {
  manejarRespuestaDeUsuario(datos.transferId, datos.aceptado)
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
// Aseguramos el aviso de despedida de Bonjour incluso si el proceso se corta de forma abrupta (Ctrl+C, crash de Vite, etc.), no solo cuando se cierra la ventana normalmente.
function despedirseYSalir() {
  bonjour.destroy()
  process.exit(0)
}
process.on('SIGINT', despedirseYSalir)
process.on('SIGTERM', despedirseYSalir)