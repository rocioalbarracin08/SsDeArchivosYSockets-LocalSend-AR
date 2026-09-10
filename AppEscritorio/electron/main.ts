import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { Bonjour } from 'bonjour-service'

import { PUERTO_TRANSFERENCIA, TIPO_SERVICIO_BONJOUR, RUTA_WEBSOCKET } from '../../estructuraCompartida/protocolo/constantes'
import { interpretarMensajeMetadatos, crearMensajeRespuesta } from '../../estructuraCompartida/protocolo/formatoMensaje'
import { enviarArchivoAPeer } from '../../estructuraCompartida/protocolo/clienteEnvio'
import { iniciarRecepcion, recibirChunk, cancelarRecepcion } from '../../estructuraCompartida/protocolo/transferenciaRecepcion'
import { generarIdUnico } from '../../estructuraCompartida/utilidades/generarIdUnico'
import { generarNombreDispositivo } from '../../estructuraCompartida/utilidades/generarNombreDispositivo'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const idPropio = generarIdUnico()
const nombreDispositivo = generarNombreDispositivo()

let ventanaPrincipal: BrowserWindow | null = null
let servicioPublicado: ReturnType<Bonjour['publish']> | null = null
const bonjour = new Bonjour()

// Guardamos acá todo lo que ya descubrimos, para poder reenviarlo al Renderer
// cuando pida "buscar" de nuevo, sin tener que crear un buscador nuevo cada vez.
interface DispositivoEncontrado {
  name: string
  addresses: string[]
  port: number
}
const dispositivosConocidos = new Map<string, DispositivoEncontrado>()

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

// Servidor de transferencia: ahora con "ws" puro en vez de Elysia,
// para tener control directo y confiable sobre datos de texto vs binarios.
function iniciarServidorTransferencia() {
  const servidorHttp = createServer()
  const servidorWs = new WebSocketServer({ server: servidorHttp, path: RUTA_WEBSOCKET })

  servidorWs.on('connection', (conexion) => {
    console.log('Peer conectado.')

    conexion.on('message', (datos, esBinario) => {
      if (!esBinario) {
        // Mensaje de texto: son los metadatos del archivo.
        const descripcion = interpretarMensajeMetadatos(datos.toString())
        iniciarRecepcion(conexion, descripcion)
        conexion.send(crearMensajeRespuesta(true))
        return
      }
      // Mensaje binario: es un chunk del archivo. "ws" siempre entrega
      // datos binarios como Buffer real, sin ambigüedad.
      recibirChunk(conexion, datos as Buffer)
    })

    conexion.on('close', () => {
      cancelarRecepcion(conexion)
    })
  })

  servidorHttp.listen(PUERTO_TRANSFERENCIA)
  console.log(`Servidor de transferencia escuchando en el puerto ${PUERTO_TRANSFERENCIA}`)
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
  // .stop() manda el "aviso de despedida" a la red, así los demás
  // saben que ya no estamos disponibles y nos sacan de su lista.
  servicioPublicado?.stop(() => console.log('Dejamos de anunciarnos en la red.'))
  servicioPublicado = null
}

function publicarYBuscarDispositivos() {
  activarVisibilidad()

  // Un solo buscador, creado una vez, escuchando durante toda la vida de la app.
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

  // NUEVO: cuando un dispositivo se apaga o deja de anunciarse, lo sacamos
  // de nuestra lista y avisamos al Renderer para que también lo saque.
  buscador.on('down', (servicioPerdido) => {
    dispositivosConocidos.delete(servicioPerdido.name)
    ventanaPrincipal?.webContents.send('servicio-perdido', { name: servicioPerdido.name })
  })

  ipcMain.on('buscar-servicios', () => {
    // Reenviamos todo lo que ya sabemos hasta ahora (el buscador nunca se detuvo).
    dispositivosConocidos.forEach((dispositivo) => {
      ventanaPrincipal?.webContents.send('servicio-encontrado', dispositivo)
    })
  })

  ipcMain.on('cambiar-visibilidad', (_evento, visible: boolean) => {
    if (visible) activarVisibilidad()
    else desactivarVisibilidad()
  })
}

ipcMain.on('enviar-archivo', (_evento, datos: { rutaArchivo: string; ipDestino: string; puertoDestino: number }) => {
  // Le pasamos nuestro propio nombre de dispositivo, así el receptor sabe quién le mandó esto.
  enviarArchivoAPeer(datos.rutaArchivo, datos.ipDestino, datos.puertoDestino, nombreDispositivo)
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