// AppEscritorio/prueba-conexion.mjs
import WebSocket from 'ws'
const socket = new WebSocket('ws://192.168.0.38:53317') // ← tu IP real acá
socket.on('open', () => {
  console.log('¡Conectado!')
  socket.send('hola celu')
})
socket.on('error', (error) => {
  console.log('Error al conectar:', error.message)
})