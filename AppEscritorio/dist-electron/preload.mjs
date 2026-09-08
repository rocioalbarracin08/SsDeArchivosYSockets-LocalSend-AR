"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  buscarDispositivos: () => electron.ipcRenderer.send("buscar-servicios"),
  onDispositivoEncontrado: (callback) => {
    electron.ipcRenderer.on("servicio-encontrado", (_event, data) => callback(data));
  },
  enviarArchivo: (rutaArchivo, ipDestino, puertoDestino) => electron.ipcRenderer.send("enviar-archivo", { rutaArchivo, ipDestino, puertoDestino }),
  obtenerRutaDeArchivo: (archivo) => electron.webUtils.getPathForFile(archivo),
  cambiarVisibilidad: (visible) => electron.ipcRenderer.send("cambiar-visibilidad", visible)
});
