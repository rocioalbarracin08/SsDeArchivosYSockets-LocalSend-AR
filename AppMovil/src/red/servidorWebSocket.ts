// ¿Qué hace este archivo? react-native-tcp-socket nos da una conexión CRUDA:
// solo sabe mandar y recibir bytes sueltos, sin ningún significado. El protocolo
// "WebSocket" (el mismo que ya usa la PC con la librería 'ws') define reglas
// sobre cómo empaquetar esos bytes en "mensajes" completos. Este archivo
// implementa esas reglas, para que servidorTransferencia.ts pueda simplemente
// escuchar "me llegó un mensaje de texto" o "me llegó uno binario", sin
// preocuparse de cómo vienen empaquetados por debajo.
//
// Tratalo como una caja negra — no debería hacer falta tocarlo para agregar
// funcionalidades nuevas a la app.

import TcpSocket from 'react-native-tcp-socket'
import SHA1 from 'crypto-js/sha1'
import Base64 from 'crypto-js/enc-base64'

// Constante fija que pide el estándar del protocolo (RFC 6455) — no es una
// decisión nuestra, nunca se toca.
const GUID_FIJO_DEL_PROTOCOLO_WEBSOCKET = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

const OPCODE_TEXTO = 0x1
const OPCODE_BINARIO = 0x2
const OPCODE_CIERRE = 0x8

export interface ConexionWebSocket {
  enviarTexto: (texto: string) => void
  enviarBinario: (datos: Buffer) => void
  cerrar: () => void
  alRecibirTexto: (callback: (texto: string) => void) => void
  alRecibirBinario: (callback: (datos: Buffer) => void) => void
  alCerrarse: (callback: () => void) => void
}

// ---------- Parte 1: el saludo inicial (handshake) ----------
// Antes de poder mandar mensajes, hay un único intercambio "estilo HTTP" donde
// el que se conecta manda una clave, y nosotros respondemos con un hash
// calculado a partir de esa clave. Es un paso fijo del estándar, una sola vez
// por conexión.

function extraerClaveDelPedidoHandshake(pedidoTexto: string): string | null {
  const coincidencia = pedidoTexto.match(/Sec-WebSocket-Key: (.+)/i)
  return coincidencia ? coincidencia[1].trim() : null
}

function calcularRespuestaHandshake(claveDelCliente: string): string {
  const hashCalculado = SHA1(claveDelCliente + GUID_FIJO_DEL_PROTOCOLO_WEBSOCKET)
  return hashCalculado.toString(Base64)
}

function armarRespuestaHttpDeAceptacion(claveDelCliente: string): string {
  const claveAceptada = calcularRespuestaHandshake(claveDelCliente)
  return (
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${claveAceptada}\r\n\r\n`
  )
}

// ---------- Parte 2: empaquetar y desempaquetar "frames" ----------
// Un mensaje viaja envuelto en un "frame": encabezado (tipo + largo del
// contenido) seguido del contenido en sí.

function armarFrameDeSalida(opcode: number, datos: Buffer): Buffer {
  const largoDatos = datos.length
  let encabezado: Buffer

  if (largoDatos < 126) {
    encabezado = Buffer.from([0x80 | opcode, largoDatos])
  } else if (largoDatos < 65536) {
    encabezado = Buffer.alloc(4)
    encabezado[0] = 0x80 | opcode
    encabezado[1] = 126
    encabezado.writeUInt16BE(largoDatos, 2)
  } else {
    encabezado = Buffer.alloc(10)
    encabezado[0] = 0x80 | opcode
    encabezado[1] = 127
    encabezado.writeUInt32BE(0, 2)
    encabezado.writeUInt32BE(largoDatos, 6)
  }

  // Del servidor hacia el cliente NO hay que enmascarar (el estándar solo
  // exige enmascarado en sentido cliente → servidor).
  return Buffer.concat([encabezado, datos])
}

// Intenta leer UN frame completo desde el principio del buffer acumulado.
// Devuelve null si todavía no llegaron suficientes bytes.
function intentarLeerUnFrame(buffer: Buffer): { opcode: number; payload: Buffer; bytesConsumidos: number } | null {
  if (buffer.length < 2) return null

  const opcode = buffer[0] & 0x0f
  const estaEnmascarado = (buffer[1] & 0x80) !== 0
  let largoPayload = buffer[1] & 0x7f
  let posicion = 2

  if (largoPayload === 126) {
    if (buffer.length < posicion + 2) return null
    largoPayload = buffer.readUInt16BE(posicion)
    posicion += 2
  } else if (largoPayload === 127) {
    if (buffer.length < posicion + 8) return null
    largoPayload = buffer.readUInt32BE(posicion + 4) // alcanza con los últimos 4 bytes para nuestros tamaños de archivo
    posicion += 8
  }

  let claveMascara: Buffer | null = null
  if (estaEnmascarado) {
    if (buffer.length < posicion + 4) return null
    claveMascara = buffer.subarray(posicion, posicion + 4)
    posicion += 4
  }

  if (buffer.length < posicion + largoPayload) return null

  let payload = buffer.subarray(posicion, posicion + largoPayload)

  // Los mensajes que llegan de un cliente SIEMPRE vienen enmascarados (regla
  // obligatoria del protocolo) — hay que desenmascarar con XOR cíclico de 4 bytes.
  if (claveMascara) {
    const payloadDesenmascarado = Buffer.alloc(largoPayload)
    for (let i = 0; i < largoPayload; i++) {
      payloadDesenmascarado[i] = payload[i] ^ claveMascara[i % 4]
    }
    payload = payloadDesenmascarado
  }

  return { opcode, payload, bytesConsumidos: posicion + largoPayload }
}

// ---------- Parte 3: envolver una conexión TCP cruda ----------

function envolverConexionComoWebSocket(socketCrudo: any): ConexionWebSocket {
  let bufferAcumulado = Buffer.alloc(0)
  let saludoTerminado = false
  let callbackTexto: ((texto: string) => void) | null = null
  let callbackBinario: ((datos: Buffer) => void) | null = null
  let callbackCierre: (() => void) | null = null

  socketCrudo.on('data', (datosCrudos: Buffer) => {
    if (!saludoTerminado) {
      const clave = extraerClaveDelPedidoHandshake(datosCrudos.toString('utf8'))
      if (clave) {
        socketCrudo.write(armarRespuestaHttpDeAceptacion(clave))
        saludoTerminado = true
      }
      return
    }

    bufferAcumulado = Buffer.concat([bufferAcumulado, datosCrudos])

    // Puede haber más de un frame junto, o uno incompleto — por eso el "while".
    while (true) {
      const resultado = intentarLeerUnFrame(bufferAcumulado)
      if (!resultado) break

      bufferAcumulado = bufferAcumulado.subarray(resultado.bytesConsumidos)

      if (resultado.opcode === OPCODE_TEXTO) callbackTexto?.(resultado.payload.toString('utf8'))
      else if (resultado.opcode === OPCODE_BINARIO) callbackBinario?.(resultado.payload)
      else if (resultado.opcode === OPCODE_CIERRE) callbackCierre?.()
    }
  })

  socketCrudo.on('close', () => callbackCierre?.())
  socketCrudo.on('error', () => callbackCierre?.())

  return {
    enviarTexto: (texto) => socketCrudo.write(armarFrameDeSalida(OPCODE_TEXTO, Buffer.from(texto, 'utf8'))),
    enviarBinario: (datos) => socketCrudo.write(armarFrameDeSalida(OPCODE_BINARIO, datos)),
    cerrar: () => socketCrudo.end(),
    alRecibirTexto: (callback) => { callbackTexto = callback },
    alRecibirBinario: (callback) => { callbackBinario = callback },
    alCerrarse: (callback) => { callbackCierre = callback }
  }
}

// ---------- Parte 4: la función que se usa desde afuera ----------

export function crearServidorWebSocket(puerto: number, alConectarseAlguien: (conexion: ConexionWebSocket) => void) {
  const servidor = TcpSocket.createServer((socketCrudo: any) => {
    alConectarseAlguien(envolverConexionComoWebSocket(socketCrudo))
  })
  servidor.listen({ port: puerto, host: '0.0.0.0' })
  return servidor
}