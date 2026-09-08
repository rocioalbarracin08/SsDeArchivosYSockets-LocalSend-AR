import { contextBridge, ipcRenderer, webUtils } from "electron";
contextBridge.exposeInMainWorld("api", {
  buscarDispositivos: () => ipcRenderer.send("buscar-servicios"),
  onDispositivoEncontrado: (callback) => {
    ipcRenderer.on("servicio-encontrado", (_event, data) => callback(data));
  },
  enviarArchivo: (rutaArchivo, ipDestino, puertoDestino) => ipcRenderer.send("enviar-archivo", { rutaArchivo, ipDestino, puertoDestino }),
  obtenerRutaDeArchivo: (archivo) => webUtils.getPathForFile(archivo),
  cambiarVisibilidad: (visible) => ipcRenderer.send("cambiar-visibilidad", visible)
});
