import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('api', {
  buscarDispositivos: () => ipcRenderer.send('buscar-servicios'),

  onDispositivoEncontrado: (callback: (data: any) => void) => {
    ipcRenderer.on('servicio-encontrado', (_event, data) => callback(data))
  },

  onDispositivoPerdido: (callback: (data: { name: string }) => void) => {
    ipcRenderer.on('servicio-perdido', (_event, data) => callback(data))
  },

  enviarArchivo: (rutaArchivo: string, ipDestino: string, puertoDestino: number) =>
    ipcRenderer.send('enviar-archivo', { rutaArchivo, ipDestino, puertoDestino }),

  obtenerRutaDeArchivo: (archivo: File) => webUtils.getPathForFile(archivo),

  cambiarVisibilidad: (visible: boolean) => ipcRenderer.send('cambiar-visibilidad', visible),

  // NUEVO: diálogo de aceptación
  onSolicitudTransferencia: (callback: (data: any) => void) => {
    ipcRenderer.on('solicitud-transferencia', (_event, data) => callback(data))
  },
  responderTransferencia: (transferId: string, aceptado: boolean) =>
    ipcRenderer.send('respuesta-transferencia', { transferId, aceptado }),

  // NUEVO: progreso en tiempo real
  onProgresoTransferencia: (callback: (data: any) => void) => {
    ipcRenderer.on('progreso-transferencia', (_event, data) => callback(data))
  }
})