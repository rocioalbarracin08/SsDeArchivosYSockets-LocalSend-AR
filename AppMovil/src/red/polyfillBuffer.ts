// React Native no conoce la clase Buffer de Node por defecto, pero tanto
// react-native-tcp-socket como nuestro motor de WebSocket la necesitan.
// Este archivo se importa UNA sola vez, antes que cualquier otra cosa,
// para que "exista" Buffer en toda la app.
import { Buffer } from 'buffer'

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer
}