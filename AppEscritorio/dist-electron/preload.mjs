"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  buscarDispositivos: () => electron.ipcRenderer.send("buscar-servicios"),
  onDispositivoEncontrado: (callback) => {
    electron.ipcRenderer.on("servicio-encontrado", (_event, data) => callback(data));
  },
  enviarArchivo: (rutaArchivo, ipDestino) => electron.ipcRenderer.send("enviar-archivo", { rutaArchivo, ipDestino }),
  // NUEVO: convierte el objeto File del input en una ruta real de disco.
  obtenerRutaDeArchivo: (archivo) => electron.webUtils.getPathForFile(archivo)
});
