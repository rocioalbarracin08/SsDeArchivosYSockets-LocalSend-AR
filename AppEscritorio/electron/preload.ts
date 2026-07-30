import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('api', {
  buscarDispositivos: () => ipcRenderer.send('buscar-servicios'),

  onDispositivoEncontrado: (callback: (data: any) => void) => {
    ipcRenderer.on('servicio-encontrado', (_event, data) => callback(data))
  },

  enviarArchivo: (rutaArchivo: string, ipDestino: string) =>
    ipcRenderer.send('enviar-archivo', { rutaArchivo, ipDestino }),

  // NUEVO: convierte el objeto File del input en una ruta real de disco.
  obtenerRutaDeArchivo: (archivo: File) => webUtils.getPathForFile(archivo)
})