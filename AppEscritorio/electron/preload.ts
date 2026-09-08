import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('api', {
  buscarDispositivos: () => ipcRenderer.send('buscar-servicios'),

  onDispositivoEncontrado: (callback: (data: any) => void) => {
    ipcRenderer.on('servicio-encontrado', (_event, data) => callback(data))
  },

  enviarArchivo: (rutaArchivo: string, ipDestino: string, puertoDestino: number) =>
    ipcRenderer.send('enviar-archivo', { rutaArchivo, ipDestino, puertoDestino }),

  obtenerRutaDeArchivo: (archivo: File) => webUtils.getPathForFile(archivo),

  cambiarVisibilidad: (visible: boolean) => ipcRenderer.send('cambiar-visibilidad', visible)
})